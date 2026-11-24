import { defineBackend } from '@aws-amplify/backend';
import { Stack, Tags } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { processStatement } from './functions/process-statement/resource';
import { resolveEnvironment, resourceName } from './naming';

const backend = defineBackend({
  auth,
  data,
  storage,
  processStatement,
});

const env = resolveEnvironment(backend.stack);
const { account, region } = Stack.of(backend.stack);

// Tag everything (including nested stacks) so resources can be filtered and
// costed by project and environment. DynamoDB tables pick these up too, via
// Amplify's table manager.
Tags.of(backend.stack).add('Project', 'PocketPulse');
Tags.of(backend.stack).add('Environment', env);

// Physical names. Renaming a Cognito user pool or S3 bucket replaces it, so
// treat these as fixed once an environment holds real data.
const { cfnUserPool, cfnIdentityPool } = backend.auth.resources.cfnResources;
cfnUserPool.userPoolName = resourceName(env, 'users');
// Identity pool names only allow letters, numbers, spaces and underscores.
cfnIdentityPool.identityPoolName = resourceName(env, 'identities').replace(/-/g, '_');

backend.data.resources.cfnResources.cfnGraphqlApi.name = resourceName(env, 'api');

// Bucket names are global across all AWS accounts, so include account and region.
backend.storage.resources.cfnResources.cfnBucket.bucketName = resourceName(
  env,
  `statements-${account}-${region}`
);

backend.processStatement.resources.cfnResources.cfnFunction.functionName =
  resourceName(env, 'process-statement');

// Let the statement processor write parsed rows straight to the Transaction table.
const transactionTable = backend.data.resources.tables['Transaction'];
transactionTable.grantWriteData(backend.processStatement.resources.lambda);
backend.processStatement.addEnvironment(
  'TRANSACTION_TABLE_NAME',
  transactionTable.tableName
);
