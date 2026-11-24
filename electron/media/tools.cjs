const fs = require('fs')
const path = require('path')

function exists(filePath) {
  try {
    return Boolean(filePath) && fs.existsSync(filePath)
  } catch {
    return false
  }
}

function platformArchDir() {
  const platform = process.platform
  const arch = process.arch === 'ia32' ? 'x86' : process.arch
  return `${platform}-${arch}`
}

function toolFileName(base) {
  return process.platform === 'win32' ? `${base}.exe` : base
}

/**
 * Prefer packaged / vendored helpers under resources/bin.
 * PATH and common install paths are development fallbacks only.
 */
function bundledCandidates(base) {
  const fileName = toolFileName(base)
  const rel = path.join('bin', platformArchDir(), fileName)
  const list = []

  if (process.resourcesPath) {
    list.push(path.join(process.resourcesPath, rel))
    list.push(path.join(process.resourcesPath, 'bin', fileName))
  }

  // Dev / unpackaged: repo resources/bin/<platform-arch>/
  list.push(path.join(__dirname, '..', '..', 'resources', 'bin', platformArchDir(), fileName))
  list.push(path.join(__dirname, '..', '..', 'resources', 'bin', fileName))

  return list
}

function findOnPath(name) {
  const pathEnv = process.env.PATH || ''
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : ['']
  for (const dir of pathEnv.split(path.delimiter)) {
    for (const ext of exts) {
      const lower = path.join(dir, name + ext.toLowerCase())
      if (exists(lower)) return lower
      const asIs = path.join(dir, name + ext)
      if (exists(asIs)) return asIs
    }
  }
  return null
}

function findBundled(base) {
  for (const candidate of bundledCandidates(base)) {
    if (exists(candidate)) return candidate
  }
  return null
}

function findDevFallback(name, extraCandidates) {
  const fromPath = findOnPath(name)
  if (fromPath) return fromPath
  for (const c of extraCandidates) {
    if (exists(c)) return c
  }
  return null
}

function resolveTools() {
  const ffprobeBundled = findBundled('ffprobe')
  const mkvpropeditBundled = findBundled('mkvpropedit')

  const ffprobe = ffprobeBundled || findDevFallback('ffprobe', [
    'C:\\ffmpeg\\bin\\ffprobe.exe',
    path.join(process.env.ProgramFiles || '', 'ffmpeg', 'bin', 'ffprobe.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffprobe.exe'),
    '/usr/local/bin/ffprobe',
    '/opt/homebrew/bin/ffprobe',
  ])

  const mkvpropedit = mkvpropeditBundled || findDevFallback('mkvpropedit', [
    path.join(process.env.ProgramFiles || '', 'MKVToolNix', 'mkvpropedit.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'MKVToolNix', 'mkvpropedit.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'mkvpropedit.exe'),
    '/usr/local/bin/mkvpropedit',
    '/opt/homebrew/bin/mkvpropedit',
    '/Applications/MKVToolNix.app/Contents/MacOS/mkvpropedit',
  ])

  return {
    ffprobe,
    mkvpropedit,
    ffprobeBundled: Boolean(ffprobeBundled),
    mkvpropeditBundled: Boolean(mkvpropeditBundled),
    platformArch: platformArchDir(),
  }
}

function requireTools() {
  const tools = resolveTools()
  const missing = []
  if (!tools.ffprobe) missing.push('ffprobe')
  if (!tools.mkvpropedit) missing.push('mkvpropedit')
  if (missing.length) {
    const dir = path.join('resources', 'bin', tools.platformArch)
    throw new Error(
      `Не найдены вспомогательные программы: ${missing.join(', ')}. `
      + `Ожидаются в ${dir}/ (запустите npm run fetch-binaries) `
      + `или в поставке приложения. PATH используется только как запасной вариант для разработки.`,
    )
  }
  return tools
}

module.exports = {
  exists,
  platformArchDir,
  resolveTools,
  requireTools,
  bundledCandidates,
}
