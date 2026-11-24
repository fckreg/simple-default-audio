export const LOCALES = ['en', 'ru']

export const messages = {
  en: {
    brand: 'Simple Default Audio',
    subtitle: 'Sets the selected track as default in MKV files — metadata only, no remux.',
    step1: 'Folder',
    step1Hint: 'Choose a folder with MKV files',
    step2: 'Track',
    step2Hint: 'Pick language + title identity',
    step3: 'Result',
    step3Hint: 'Apply and review the journal',
    folderPlaceholder: 'Not selected',
    choose: 'Browse…',
    trackPick: 'Select a track',
    trackNone: 'No tracks found',
    trackNeedFolder: 'Select a folder first',
    scanning: 'Scanning…',
    applying: 'Applying…',
    apply: 'Set as default track',
    journalEmpty: 'The journal will appear here after scan or apply.',
    language: 'Language',
  },
  ru: {
    brand: 'Simple Default Audio',
    subtitle: 'Ставит выбранную дорожку default в MKV без пересборки — только метаданные.',
    step1: 'Папка',
    step1Hint: 'Выберите папку с MKV-файлами',
    step2: 'Дорожка',
    step2Hint: 'Выберите пару язык + название',
    step3: 'Результат',
    step3Hint: 'Примените и смотрите журнал',
    folderPlaceholder: 'Не выбрана',
    choose: 'Выбрать…',
    trackPick: 'Выберите дорожку',
    trackNone: 'Дорожки не найдены',
    trackNeedFolder: 'Сначала выберите папку',
    scanning: 'Сканирование…',
    applying: 'Применение…',
    apply: 'Сделать дорожкой по умолчанию',
    journalEmpty: 'Журнал появится здесь после сканирования или применения.',
    language: 'Язык',
  },
}

export function t(locale, key) {
  const pack = messages[locale] || messages.en
  const parts = key.split('.')
  let cur = pack
  for (const p of parts) {
    if (cur == null) return key
    cur = cur[p]
  }
  return cur == null ? key : cur
}
