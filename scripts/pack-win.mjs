/**
 * Fetch Windows helpers, then build portable SimpleDefaultAudio.exe
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('node', ['scripts/fetch-media-binaries.mjs', 'win32-x64'])
run('npm', ['run', 'build'])
run('npx', ['electron-builder', '--win', 'portable', '--publish', 'never'])