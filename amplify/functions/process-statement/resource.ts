import { defineFunction } from "@aws-amplify/backend";

/**
 * Runs when a CSV lands in the statements bucket: parses it and upserts the
 * rows into the Transaction table. It lives in the `storage` resource group
 * because it is the bucket's upload trigger and also reads from the bucket,
 * which would otherwise create a circular dependency between stacks.
 */
export const processStatement = defineFunction({
  name: "process-statement",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: "storage",
  runtime: 22
});
