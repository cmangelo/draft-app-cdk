import { Vpc } from '@aws-cdk/aws-ec2'
import { Construct, Stack } from '@aws-cdk/core'
import { APP_PREFIX } from '../constants'

export class VpcStack extends Stack {
  vpc: Vpc

  constructor(scope: Construct, id: string) {
    super(scope, id)
    this.vpc = this.createVpc()
  }

  private createVpc() {
    return new Vpc(this, `${APP_PREFIX}-Vpc`, {
      cidr: '10.0.0.0/16',
      maxAzs: 1
    })
  }
}