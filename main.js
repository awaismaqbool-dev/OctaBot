// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Dono automation files ko import kar rahe hain
const { getTempEmail } = require('./src/automation/tempmail');
const { signupReddit } = require('./src/automation/reddit');
const { loginReddit, extractRedditData, saveToDesktop } = require('./src/automation/extraction');

let savedCredentials = null;

let activeSession = null;

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
  const showBrowser = args?.showBrowser ?? true;

  try {
    console.log("[Main] Step 1: Email Generation...");
    const emailSession = await getTempEmail();

    console.log("[Main] Step 2: Reddit Signup Automation...");
    const result = await signupReddit(emailSession, showBrowser);

    if (result.success) {
      savedCredentials = {
        email: result.email,
        password: result.password
      };
      console.log(`[Main] Credentials saved in memory: ${result.email}`);
    }

    return result;
  } catch (err) {
    console.error("[Main] Handler Error:", err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-credentials-status', async () => {
  return {
    hasCredentials: savedCredentials !== null,
    email: savedCredentials?.email || null
  };
});

ipcMain.handle('start-extraction', async (event, args) => {
  if (!savedCredentials) {
    return { success: false, error: 'No saved credentials. Run signup automation first.' };
  }

  const showBrowser = args?.showBrowser ?? true;

  try {
    console.log("[Main] Starting data extraction...");
    console.log(`[Main] Logging in with: ${savedCredentials.email}`);

    const loginResult = await loginReddit(
      savedCredentials.email,
      savedCredentials.password,
      showBrowser
    );

    if (!loginResult.success) {
      return loginResult;
    }

    activeSession = loginResult;

    console.log("[Main] Extracting data from Reddit...");
    const data = await extractRedditData(loginResult.page);

    const filePath = saveToDesktop(data);

    console.log(`[Main] Extraction complete. ${data.length} posts -> ${filePath}`);

    return {
      success: true,
      dataCount: data.length,
      filePath,
      data
    };
  } catch (err) {
    console.error("[Main] Extraction error:", err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('close-session', async () => {
  if (activeSession) {
    try {
      await activeSession.browser.close();
      activeSession = null;
      return { success: true, message: 'Session closed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, message: 'No active session' };
});