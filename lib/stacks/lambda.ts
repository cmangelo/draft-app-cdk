import { Construct, Stack } from '@aws-cdk/core'
import { Function, Code, Runtime } from '@aws-cdk/aws-lambda'
import { Table } from '@aws-cdk/aws-dynamodb'
import { Bucket, EventType } from '@aws-cdk/aws-s3'
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam'
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications'
import { APP_PREFIX } from '../constants'
import * as path from 'path'

type LambdaProps = {
  draftsTable: Table
  bucket: Bucket
}

export class LambdaStack extends Stack {
  tierProcessorLambda: Function

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id)
    this.tierProcessorLambda = this.createTierProcessorLambda()
    this.grantPermissions(props.draftsTable, props.bucket)
  }

  private createTierProcessorLambda() {
    return new Function(this, `${APP_PREFIX}-TierProcessorLambda`, {
      code: Code.fromAsset(path.join(__dirname, '../../lambda')),
      runtime: Runtime.NODEJS_12_X,
      handler: 'processTierRanks.handler',
      functionName: `${APP_PREFIX}-TierProcessorLambda`
    })
  }

  private grantPermissions(table: Table, bucket: Bucket) {
    table.grantReadWriteData(this.tierProcessorLambda)

    bucket.grantReadWrite(this.tierProcessorLambda)
    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(this.tierProcessorLambda))

    this.tierProcessorLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:GetBucketNotification', 's3:PutBucketNotification'],
        effect: Effect.ALLOW,
        resources: [ bucket.bucketArn ]
      })
    );
  }
}