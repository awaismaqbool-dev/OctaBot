const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");

// Import automation modules
const { getTempEmail } = require("./src/automation/tempmail");
const { signupAutomationExercise } = require("./src/automation/signup");
const {
  loginAutomationExercise,
  extractProductData,
  saveToDesktop,
} = require("./src/automation/extraction");

let savedCredentials = null;
let activeSession = null;

// Real-time History path setup
const historyFilePath = path.join(
  app.getPath("userData"),
  "automation_history.json",
);
const configFilePath = path.join(app.getPath("userData"), "system_config.json");

// Helper function to clear history file (making it session-only)
function clearHistory() {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify([], null, 2), "utf8");
  } catch (e) {
    console.error("History clear error:", e);
  }
}

// Clear history on startup for a fresh session
clearHistory();

// Helper function to read history from local file
function getHistory() {
  try {
    if (fs.existsSync(historyFilePath)) {
      return JSON.parse(fs.readFileSync(historyFilePath, "utf8"));
    }
  } catch (e) {
    console.error("History read error:", e);
  }
  return [];
}

// Helper function to save history entry
function addHistoryEntry(target, status, detail) {
  try {
    const history = getHistory();
    const newEntry = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      target,
      status,
      detail,
    };
    history.unshift(newEntry); // Newest on top
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), "utf8");
  } catch (e) {
    console.error("History save error:", e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "public/fav_icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // React frontend ke sath data transfer asani se karne ke liye
    },
  });

  win.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "dist/index.html")}`,
  );
}

// App lifecycle listeners
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  // Clear history on app exit
  clearHistory();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC HANDLERS ---

// 1. Full Automation Handler Update
ipcMain.handle("start-full-automation", async (event, args) => {
  const showBrowser = args?.showBrowser ?? true;
  const proxyConfig = args?.proxy || null;

  try {
    console.log("[Main] Step 1: Automated Temp Mail Allocation...");
    const emailSession = await getTempEmail();

    const currentConfig = getSettings();
    console.log(
      `[Main] Step 2: Form Sign-up Automation Running (Speed: ${currentConfig.speed})...`,
    );
    const result = await signupAutomationExercise(
      emailSession,
      showBrowser,
      0,
      proxyConfig,
      currentConfig.speed,
    );

    if (result.success) {
      savedCredentials = { email: result.email, password: result.password };
      // Real-time Success Log entry
      addHistoryEntry(
        "Automation Exercise Signup",
        "success",
        "Profile registered successfully",
      );
    } else {
      // Real-time Failure Log entry if script responds with false
      addHistoryEntry(
        "Automation Exercise Signup",
        "fail",
        result.error || "Form submission failed",
      );
    }
    return result;
  } catch (err) {
    // Real-time Crash/Fail Log entry
    addHistoryEntry("Automation Exercise Signup", "fail", err.message);
    return { success: false, error: err.message };
  }
});

// 2. Data Extraction Handler Update
ipcMain.handle("start-extraction", async (event, args) => {
  if (!savedCredentials) {
    return { success: false, error: "No temporary profile active in memory." };
  }
  const showBrowser = args?.showBrowser ?? true;
  const proxyConfig = args?.proxy || null;

  let loginResult = null;
  try {
    const currentConfig = getSettings();
    loginResult = await loginAutomationExercise(
      savedCredentials.email,
      savedCredentials.password,
      showBrowser,
      proxyConfig,
      currentConfig.speed,
    );
    if (!loginResult.success) {
      addHistoryEntry(
        "Product Extraction Engine",
        "fail",
        loginResult.error || "Login Failed",
      );
      return loginResult;
    }
    activeSession = loginResult;

    const data = await extractProductData(
      loginResult.page,
      currentConfig.speed,
    );

    // Save with the configured output format
    const filePath = saveToDesktop(data, currentConfig.outputFormat);

    addHistoryEntry(
      "Product Extraction Engine",
      "success",
      `${data.length} products saved to Desktop`,
    );
    return { success: true, dataCount: data.length, filePath, data };
  } catch (err) {
    addHistoryEntry("Product Extraction Engine", "fail", err.message);
    return { success: false, error: err.message };
  } finally {
    if (loginResult && loginResult.browser) {
      try {
        await loginResult.browser.close();
      } catch (e) {
        console.error("Failed to close browser after extraction:", e);
      }
      activeSession = null;
    }
  }
});

// 3. React tab ko live history data bhejne ke liye
ipcMain.handle("get-automation-history", async () => {
  return getHistory();
});

// 4. Saved credentials status query karne ke liye
ipcMain.handle("get-credentials-status", async () => {
  return {
    hasCredentials: savedCredentials !== null,
    email: savedCredentials?.email || null,
  };
});

// 5. Active browser session close karne ke liye
ipcMain.handle("close-session", async () => {
  if (activeSession) {
    try {
      await activeSession.browser.close();
      activeSession = null;
      return { success: true, message: "Session closed" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, message: "No active session" };
});

// 6. Saved credentials clear karne ke liye
ipcMain.handle("clear-credentials", async () => {
  savedCredentials = null;
  activeSession = null;
  return { success: true };
});

// Helper to read configuration
function getSettings() {
  try {
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    }
  } catch (e) {}
  return { speed: "normal", domain: "web-library.net", outputFormat: ".txt" }; // Default values
}

// --- IPC HANDLERS FOR SETTINGS ---
ipcMain.handle("get-settings", async () => {
  return getSettings();
});

ipcMain.handle("save-settings", async (event, newConfig) => {
  try {
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(newConfig, null, 2),
      "utf8",
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
