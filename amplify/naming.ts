import type { Construct } from 'constructs';

/**
 * Naming convention for PocketPulse resources: `pocketpulse-{env}-{component}`.
 *
 * Sandbox and prod share one AWS account, so every physically named resource
 * carries the environment to avoid collisions and make the console readable.
 */
export const APP_NAME = 'pocketpulse';

export type Environment = 'sbx' | 'prod';

/** Branch that Amplify Hosting deploys as production. */
const PROD_BRANCH = 'main';

/**
 * Works out the environment from the CDK context Amplify sets on every deploy:
 * `amplify-backend-type` is `sandbox` or `branch`, and `amplify-backend-name`
 * is the branch name for branch deployments.
 */
export function resolveEnvironment(scope: Construct): Environment {
  const type = scope.node.tryGetContext('amplify-backend-type');
  if (type === 'sandbox') return 'sbx';

  const branch = scope.node.tryGetContext('amplify-backend-name');
  if (type === 'branch' && branch === PROD_BRANCH) return 'prod';

  // Only sbx and prod exist. Fail loudly rather than deploying a second branch
  // that would reuse prod's physical names in the same account.
  throw new Error(
    `Unsupported deployment (type: ${type}, branch: ${branch}). ` +
      `Only sandbox and the '${PROD_BRANCH}' branch are configured.`
  );
}

/** e.g. resourceName('sbx', 'process-statement') => 'pocketpulse-sbx-process-statement' */
export function resourceName(env: Environment, component: string): string {
  return `${APP_NAME}-${env}-${component}`;
}
