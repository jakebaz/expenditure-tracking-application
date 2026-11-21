import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 bucket for uploaded CSV statements, stored as csv/{account}/{file}.
 * Only members of the `household` Cognito group can access them.
 * @see https://docs.amplify.aws/react/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'expenditureDocuments',
  access: (allow) => ({
    'csv/*': [allow.groups(['household']).to(['read', 'write', 'delete'])],
  }),
});
