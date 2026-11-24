/**
 * Fetch macOS helpers for host arch, then build zip (+ dmg when available).
 * Run on macOS. Unsigned / ad-hoc — see README Gatekeeper notes.
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
const target = `darwin-${arch}`

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

if (process.platform !== 'darwin') {
  console.error('pack:mac нужно запускать на macOS')
  process.exit(1)
}

run('node', ['scripts/fetch-media-binaries.mjs', target])
run('npm', ['run', 'build'])
run('npx', ['electron-builder', '--mac', 'zip', 'dmg'])
