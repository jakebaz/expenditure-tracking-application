import { defineStorage } from '@aws-amplify/backend';
import { processStatement } from '../functions/process-statement/resource';

/**
 * S3 bucket for uploaded CSV statements, stored as csv/{account}/{file}.
 * Only members of the `household` Cognito group can access them.
 * Each upload triggers the process-statement function, which reads the file.
 * @see https://docs.amplify.aws/react/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'statements',
  triggers: {
    onUpload: processStatement,
  },
  access: (allow) => ({
    'csv/*': [
      allow.groups(['household']).to(['read', 'write', 'delete']),
      allow.resource(processStatement).to(['read']),
    ],
  }),
});
