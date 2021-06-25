#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DraftAppCdk } from '../lib/draft-app-cdk';

const app = new cdk.App();
new DraftAppCdk(app);
