import { Construct, Stack } from '@aws-cdk/core'
import { Bucket, EventType } from '@aws-cdk/aws-s3'
import { APP_PREFIX } from '../constants'
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda'
import * as path from 'path'
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications'
import { Table } from '@aws-cdk/aws-dynamodb'
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam'

export class s3Stack extends Stack {
  tiersBucket: Bucket

  constructor(scope: Construct, id: string, table: Table) {
    super(scope, id)
    this.tiersBucket = this.createTiersBucket(table)
  }

  private createTiersBucket(table: Table) {
    const bucket = new Bucket(this, `${APP_PREFIX}-TiersBucket`, {
      bucketName: `${APP_PREFIX}-TiersBucket`.toLowerCase(),
    })

    const lambda = new Function(this, `${APP_PREFIX}-TierProcessorLambda`, {
      code: Code.fromAsset(path.join(__dirname, '../../lambda')),
      runtime: Runtime.NODEJS_12_X,
      handler: 'processTierRanks.handler',
      functionName: `${APP_PREFIX}-TierProcessorLambda`
    })

    this.grantPermissions(lambda, table, bucket)

    return bucket
  }

  private grantPermissions(lambda: Function, table: Table, bucket: Bucket) {
    table.grantReadWriteData(lambda)

    bucket.grantReadWrite(lambda)
    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(lambda))

    lambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:GetBucketNotification', 's3:PutBucketNotification'],
        effect: Effect.ALLOW,
        resources: [ bucket.bucketArn ]
      })
    );
  }
}