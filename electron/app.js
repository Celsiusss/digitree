const { BrowserWindow, app } = require('electron');

const args = process.argv.slice(1);

const createWindow = () => {
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (args.includes('--dev')) {
    const debug = require('electron-debug');
    debug();

    window.loadURL('http://127.0.0.1:4200');
  } else {
    window.loadFile(__dirname + '/../dist/digitree/index.html');
  }
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
