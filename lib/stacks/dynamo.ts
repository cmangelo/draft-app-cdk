import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Construct, Stack } from '@aws-cdk/core';
import { APP_PREFIX } from '../constants';

export class DynamoStack extends Stack {
  draftsTable: Table

  constructor(scope: Construct, id: string) {
    super(scope, id)
    this.draftsTable = this.createDraftsTable()
  }

  private createDraftsTable() {
    return new Table(this, `${APP_PREFIX}-DraftsTable`, {
      partitionKey: {
        name: 'PK',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING
      },
      tableName: 'DraftsTable',
    })
  }
}