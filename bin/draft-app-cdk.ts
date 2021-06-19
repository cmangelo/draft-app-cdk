#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DraftAppCdkStack } from '../lib/draft-app-cdk-stack';

const app = new cdk.App();
new DraftAppCdkStack(app, 'DraftAppCdkStack');
