process.env.ELECTRON_DEV = '1'
require('child_process').spawn(
  require('electron'),
  ['.'],
  { stdio: 'inherit', windowsHide: false },
).on('exit', (code) => process.exit(code ?? 0))
