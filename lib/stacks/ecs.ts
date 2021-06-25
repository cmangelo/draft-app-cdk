import { NetworkLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns'
import { Duration, Stack } from '@aws-cdk/core'
import { ContainerImage, FargatePlatformVersion, IBaseService } from '@aws-cdk/aws-ecs'
import { Construct } from 'constructs'
import { APP_PREFIX } from '../constants'
import { Repository } from '@aws-cdk/aws-ecr'
import { Peer, Port, Vpc } from '@aws-cdk/aws-ec2'
import { StackProps } from '../draft-app-cdk'
import { VpcLink } from '@aws-cdk/aws-apigateway'

export interface EcsStackProps extends StackProps {
  vpc: Vpc
}

export class EcsStack extends Stack {
  ecsService: IBaseService
  vpcLink: VpcLink

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id)
    this.createEcrRepo()
    this.createEcsService(props.vpc)
  }

  private createEcrRepo() {
    new Repository(this, `${APP_PREFIX}-ApiImageRepo`, {
      repositoryName: `${APP_PREFIX}-ApiImageRepo`.toLowerCase()
    })
  }

  private createEcsService(vpc: Vpc) {
    const fargateService = new NetworkLoadBalancedFargateService(this, `${APP_PREFIX}-NlbFargateService`, {
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(
          Repository.fromRepositoryName(this, `${APP_PREFIX}-NlbFargateServiceRepo`, `${APP_PREFIX}-ApiImageRepo`.toLowerCase())
        ),
        containerPort: 8080,
      },
      platformVersion: FargatePlatformVersion.LATEST,
      publicLoadBalancer: false,
      healthCheckGracePeriod: Duration.minutes(2),
      vpc
    })
    this.setupPorts(fargateService)


    this.vpcLink = new VpcLink(this, 'VpcLink', {
      targets: [fargateService.loadBalancer],
    });
  }

  private setupPorts(fargateService: NetworkLoadBalancedFargateService) {
    fargateService.service.connections.allowFrom(
      Peer.ipv4('10.0.0.0/16'),
      Port.tcp(8080)
    )

    fargateService.service.connections.allowFrom(
      Peer.ipv4('10.0.0.0/16'),
      Port.tcp(8443)
    )
  }
}