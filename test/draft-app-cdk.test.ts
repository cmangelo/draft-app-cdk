import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DraftAppCdk from '../lib/draft-app-cdk';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DraftAppCdk.DraftAppCdk(app);
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
