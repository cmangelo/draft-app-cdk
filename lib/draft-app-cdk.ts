import * as cdk from '@aws-cdk/core'
import { APP_PREFIX } from './constants'
import { CognitoStack } from './stacks/cognito'
import { EcsStack } from './stacks/ecs'
import { PipelineStack } from './stacks/pipeline/pipeline'
import { RestApiStack } from './stacks/rest-apigw'
import { VpcStack } from './stacks/vpc'

export type StackProps = {
  region: string
  accountId: string
}

const personalAccount: StackProps = {
  region: 'us-east-1',
  accountId: '383989225973'
}

export class DraftAppCdk {
  constructor(app: cdk.Construct) {
    const cognito = new CognitoStack(app, `${APP_PREFIX}-CognitoStack`)
    const vpc = new VpcStack(app, `${APP_PREFIX}-VpcStack`)
    const ecs = new EcsStack(app, `${APP_PREFIX}-EcsStack`, {
      ...personalAccount,
      vpc: vpc.vpc
    })
    const restApi = new RestApiStack(app, `${APP_PREFIX}-RestApiStack`, {
      ...personalAccount,
      vpcLink: ecs.vpcLink,
      userPool: cognito.userPool,
    })

    const pipeline = new PipelineStack(app, `${APP_PREFIX}-PipelineStack`, {
      ...personalAccount,
      ecsService: ecs.ecsService
    })
  }
}
