import { 
  AuthorizationType, 
  CognitoUserPoolsAuthorizer, 
  ConnectionType, 
  EndpointType, 
  Integration, 
  IntegrationType, 
  LogGroupLogDestination, 
  MethodLoggingLevel, 
  RestApi, 
  VpcLink
} from '@aws-cdk/aws-apigateway'
import { 
  ManagedPolicy, 
  Role, 
  ServicePrincipal 
} from '@aws-cdk/aws-iam'
import { Construct, Stack, Duration } from '@aws-cdk/core'
import { LogGroup } from '@aws-cdk/aws-logs'
import { UserPool } from '@aws-cdk/aws-cognito'
import { APP_PREFIX } from '../constants'
import { StackProps } from '../draft-app-cdk'

export interface RestApiStackProps extends StackProps {
  userPool: UserPool
  vpcLink: VpcLink
}

export class RestApiStack extends Stack {
  private cognitoAuthorizer: CognitoUserPoolsAuthorizer
  private vpcLink: VpcLink

  constructor(scope: Construct, id: string, props: RestApiStackProps) {
    super(scope, id)
    this.cognitoAuthorizer = this.createCognitoAuthorizer(props.userPool)
    this.vpcLink = props.vpcLink
    this.createCloudWatchRole()
    this.createApi()
  }

  private createApi() {
    const cwLogGroup = new LogGroup(
      this,
      `${APP_PREFIX}-DefaultStage-LogGroup`,
    )

    const restApi = new RestApi(this, `${APP_PREFIX}-RestApi`, {
      restApiName: `${APP_PREFIX}-RestApi`,
      deploy: true,
      deployOptions: {
        stageName: 'beta',
        accessLogDestination: new LogGroupLogDestination(cwLogGroup),
        loggingLevel: MethodLoggingLevel.INFO
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL]
      },
    })

    const api = restApi.root.addResource('api')

    const integ = new Integration({
      type: IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'GET',
      uri: `http://4wecp45b6g.execute-api.us-east-1.amazonaws.com/test`,
      options: {
        connectionType: ConnectionType.VPC_LINK,
        vpcLink: this.vpcLink,
        requestParameters: {
          'integration.request.header.User-Id': 'context.authorizer.claims.sub'
        }
      },
    })

    const test = api.addResource('test')
    test.addMethod('GET', integ, {
      authorizer: this.cognitoAuthorizer,
      authorizationType: AuthorizationType.COGNITO
    })
  }

  private createCognitoAuthorizer(userPool: UserPool) {
    return new CognitoUserPoolsAuthorizer(this, `${APP_PREFIX}-CognitoAuthorizer`, {
      cognitoUserPools: [userPool],
      resultsCacheTtl: Duration.minutes(15)
    })
  }

  private createCloudWatchRole() {
    return new Role(this, `${APP_PREFIX}-Role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          this,
          'ApiGateway-ManagedPolicy',
          'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
      ],
    })
  }

}