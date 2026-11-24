const catalogs = {
  en: {
    selectFolderTitle: 'Select a folder with videos',
    busy: 'Another operation is already running. Please wait.',
    folderMissing: 'Folder not found',
    trackMissing: 'No track selected',
    scanStale: 'Scan results are outdated. Select the folder again.',
    trackNotFound: 'Selected track not found. Scan the folder again.',
    toolsMissing: (list, dir) =>
      `Helper tools not found: ${list}. Expected under ${dir}/ (run npm run fetch-binaries) or inside the app package. PATH is only a development fallback.`,
    noMkv: 'No MKV files found',
    mkvCount: (n) => `MKV files: ${n}`,
    noAudioInFile: 'no audio tracks',
    noAudioOverall: 'No audio tracks found',
    distinctTracks: (n) => `Distinct tracks (language+title): ${n}`,
    folder: (p) => `Folder: ${p}`,
    trackLine: (label) => `Track: ${label}`,
    warnMissing: (name, track) => `[WARN] ${name} — track “${track}” not found (no language+title match)`,
    warnMulti: (name, track, ordinal) =>
      `[WARN] ${name} — multiple matches for “${track}”, using a${ordinal}`,
    alreadyDefault: (name, ordinal, quoted) =>
      `[OK]   ${name} — already default: a${ordinal} “${quoted}”`,
    done: (name, ordinal, quoted) =>
      `[DONE] ${name} — default → a${ordinal} “${quoted}”`,
    fail: (name, msg) => `[FAIL] ${name} — ${msg}`,
    summary: (ok, warn, fail, total) =>
      `Summary: ok=${ok}  warn=${warn}  fail=${fail}  total=${total}`,
    untitled: 'untitled',
    noAudioListed: '         no audio tracks',
    audio: 'audio',
  },
  ru: {
    selectFolderTitle: 'Выберите папку с видео',
    busy: 'Уже выполняется другая операция. Дождитесь завершения.',
    folderMissing: 'Папка не найдена',
    trackMissing: 'Дорожка не выбрана',
    scanStale: 'Результаты сканирования устарели. Выберите папку ещё раз.',
    trackNotFound: 'Выбранная дорожка не найдена. Просканируйте папку ещё раз.',
    toolsMissing: (list, dir) =>
      `Не найдены вспомогательные программы: ${list}. Ожидаются в ${dir}/ (запустите npm run fetch-binaries) или в поставке приложения. PATH используется только как запасной вариант для разработки.`,
    noMkv: 'MKV-файлы не найдены',
    mkvCount: (n) => `MKV-файлов: ${n}`,
    noAudioInFile: 'нет аудиодорожек',
    noAudioOverall: 'Аудиодорожки не найдены',
    distinctTracks: (n) => `Найдено разных дорожек (язык+название): ${n}`,
    folder: (p) => `Папка: ${p}`,
    trackLine: (label) => `Дорожка: ${label}`,
    warnMissing: (name, track) => `[WARN] ${name} — дорожка «${track}» не найдена (нет пары язык+название)`,
    warnMulti: (name, track, ordinal) =>
      `[WARN] ${name} — несколько совпадений «${track}», берём a${ordinal}`,
    alreadyDefault: (name, ordinal, quoted) =>
      `[OK]   ${name} — уже default: a${ordinal} «${quoted}»`,
    done: (name, ordinal, quoted) =>
      `[DONE] ${name} — default → a${ordinal} «${quoted}»`,
    fail: (name, msg) => `[FAIL] ${name} — ${msg}`,
    summary: (ok, warn, fail, total) =>
      `Итого: ok=${ok}  warn=${warn}  fail=${fail}  всего=${total}`,
    untitled: 'без названия',
    noAudioListed: '         аудиодорожек нет',
    audio: 'аудио',
  },
}

function normalizeLocale(locale) {
  return locale === 'ru' ? 'ru' : 'en'
}

function t(locale, key, ...args) {
  const pack = catalogs[normalizeLocale(locale)] || catalogs.en
  const value = pack[key]
  if (typeof value === 'function') return value(...args)
  return value == null ? key : value
}

module.exports = { t, normalizeLocale, catalogs }
