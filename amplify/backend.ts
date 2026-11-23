import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { processStatement } from './functions/process-statement/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  processStatement,
});

// Let the statement processor write parsed rows straight to the Transaction table.
const transactionTable = backend.data.resources.tables['Transaction'];
transactionTable.grantWriteData(backend.processStatement.resources.lambda);
backend.processStatement.addEnvironment(
  'TRANSACTION_TABLE_NAME',
  transactionTable.tableName
);
