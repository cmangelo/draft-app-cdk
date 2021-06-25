import { BuildEnvironmentVariableType, LinuxBuildImage, PipelineProject } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { CodeBuildAction, EcsDeployAction, GitHubSourceAction, GitHubTrigger } from '@aws-cdk/aws-codepipeline-actions'
import { Effect, IRole, PolicyStatement } from '@aws-cdk/aws-iam'
import { IBaseService } from '@aws-cdk/aws-ecs'
import { Construct, SecretValue, Stack } from '@aws-cdk/core'
import { APP_PREFIX } from '../../constants'
import { StackProps } from '../../draft-app-cdk'

export interface PipelineStackProps extends StackProps {
  ecsService: IBaseService
}

export class PipelineStack extends Stack {
  props: PipelineStackProps

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id)
    this.props = props
    this.createCodePipeline()
  }

  private createCodePipeline() {
    const project = new PipelineProject(this, `${APP_PREFIX}-PipelineProject`, {
      projectName: `${APP_PREFIX}-PipelineProject`,
      environment: {
        privileged: true,
        buildImage: LinuxBuildImage.STANDARD_4_0,
      }
    })
    this.addEcrStatementsToRole(project.role)

    const sourceOutput = new Artifact()
    const sourceAction = new GitHubSourceAction({
      actionName: `${APP_PREFIX}-SourceAction`,
      owner: 'cmangelo',
      repo: 'draft-app-api',
      oauthToken: SecretValue.secretsManager('github-token', { jsonField : 'my-github-token' }),
      output: sourceOutput,
      branch: 'main',
      trigger: GitHubTrigger.WEBHOOK
    })

    const buildAction = new CodeBuildAction({
      actionName: `${APP_PREFIX}-BuildAction`,
      project,
      input: sourceOutput,
      environmentVariables: {
        AWS_DEFAULT_REGION: {
          value: this.props.region
        },
        AWS_ACCOUNT_ID: {
          value: this.props.accountId
        },
        IMAGE_REPO_NAME: {
          value: `${APP_PREFIX}-ApiImageRepo`.toLowerCase()
        },
        IMAGE_TAG: {
          value: 'latest'
        },
        DOCKERHUB_USERNAME: {
          value: 'dockerhub-creds:username',
          type: BuildEnvironmentVariableType.SECRETS_MANAGER
        },
        DOCKERHUB_PASSWORD: {
          value: 'dockerhub-creds:password',
          type: BuildEnvironmentVariableType.SECRETS_MANAGER
        }
      },
    })

    const pipeline = new Pipeline(this, `${APP_PREFIX}-CodePipeline`, {
      pipelineName: `${APP_PREFIX}-CodePipeline`,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        }
      ]
    })
  }

  private addEcrStatementsToRole(role?: IRole) {
    role?.addToPrincipalPolicy(new PolicyStatement({
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:CompleteLayerUpload',
        'ecr:GetAuthorizationToken',
        'ecr:InitiateLayerUpload',
        'ecr:PutImage',
        'ecr:UploadLayerPart'
      ],
      effect: Effect.ALLOW,
      resources: ['*']
    }))
  }
}