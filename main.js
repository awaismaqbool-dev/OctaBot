// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Dono automation files ko import kar rahe hain
const { getTempEmail } = require('./src/automation/tempmail');
const { signupReddit } = require('./src/automation/reddit');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // React frontend ke sath data transfer asani se karne ke liye
    },
  });

  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
}

app.whenReady().then(createWindow);

// Test handler
ipcMain.handle('ping', async () => {
  return 'pong';
});

// Main Automation Bridge Handler
ipcMain.handle('start-full-automation', async (event, args) => {
  const showBrowser = args?.showBrowser ?? true; // Frontend toggle se control hoga

  try {
    // Step 1: Background API se email generate karein
    console.log("主 [Electron Main] Starting Step 1: Email Generation...");
    const emailSession = await getTempEmail();

    // Step 2: Playwright ko session pass karein jo signup aur verification sambhale ga
    console.log("主 [Electron Main] Starting Step 2: Reddit Browser Automation...");
    const result = await signupReddit(emailSession, showBrowser);

    return result; // Frontend ko status (Success/Fail) return karega
  } catch (err) {
    console.error("主 [Electron Main] Handler Error:", err.message);
    return { success: false, error: err.message };
  }
});