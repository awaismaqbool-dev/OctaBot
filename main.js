const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getTempEmail } = require('./src/automation/tempmail');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
}

app.whenReady().then(createWindow);

ipcMain.handle('ping', async () => {
  return 'pong';
});

ipcMain.handle('get-temp-email', async (event) => {
  try {
    const { email } = await getTempEmail();
    return { success: true, email };
  } catch (err) {
    return { success: false, error: err.message };
  }
});