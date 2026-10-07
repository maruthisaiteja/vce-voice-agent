import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readExecutionProfile } from './execution-profile.mjs';

// Keep the managed installer, but never require Bash for a portable checkout.
const managed = readExecutionProfile() === 'managed-linux';
const result = managed
  ? spawnSync('bash', [fileURLToPath(new URL('./install-pnpm.sh', import.meta.url))], {stdio:'inherit'})
  : spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['install', '--frozen-lockfile'], {stdio:'inherit', shell:process.platform === 'win32'});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
