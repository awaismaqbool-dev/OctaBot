import { useState, useEffect } from "react";

function Dashboard() {
  const { ipcRenderer } = window.require("electron");
  const [logs, setLogs] = useState([
    "[OctaBot] Automation framework mapping initialized.",
  ]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState(null);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, msg]);
  };

  const checkCredentialsStatus = async () => {
    try {
      const status = await ipcRenderer.invoke("get-credentials-status");
      setHasCredentials(status.hasCredentials);
      setCredentialEmail(status.email);
    } catch (e) {}
  };

  const handleResetCredentials = async () => {
    try {
      await ipcRenderer.invoke("clear-credentials");
      setHasCredentials(false);
      setCredentialEmail(null);
      addLog("[System] Active session & credentials cleared.");
    } catch (e) {
      addLog(`[Error] Failed to clear session: ${e.message}`);
    }
  };

  useEffect(() => {
    checkCredentialsStatus();
  }, []);

  const handleRunAutomation = async () => {
    setLoading(true);
    addLog("[OctaBot] Initiating Zero-Touch Registration Sequence...");
    try {
      const result = await ipcRenderer.invoke("start-full-automation", {
        showBrowser: true,
      });
      if (result.success) {
        addLog(`[Success] ${result.message}`);
        setHasCredentials(true);
        setCredentialEmail(result.email);
      } else {
        addLog(`[Error] Execution halted: ${result.error}`);
      }
    } catch (error) {
      addLog(`[IPC Error] Thread failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractData = async () => {
    if (!hasCredentials) return;
    setExtracting(true);
    addLog("[OctaBot] Activating Structured Product Parser pipeline...");
    try {
      const result = await ipcRenderer.invoke("start-extraction", {
        showBrowser: true,
      });
      if (result.success) {
        addLog(
          `[Success] Extracted ${result.dataCount} unique items completely!`,
        );
        addLog(`[System] Local output written to path: ${result.filePath}`);
      } else {
        addLog(`[Error] Extraction failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`[IPC Error] Pipe failed: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center ">
        <img className="h-15 w-auto" src="/src/assets/logo.png" alt="logo" />
      </div>
      <h1 className="text-center text-2xl font-normal font-unbounded text-[#974E3F] pt-5">
        The System That Works For You
      </h1>
      <p className="text-center text-xs font-medium font-lora text-[#7d4e4e] pt-2">
        This aims to automate web interactions on Automation Exercise using
        Microsoft Playwright framework
      </p>

      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-3">
        <div className="border-b border-[#e8d5bc] pb-4"></div>
        <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${hasCredentials ? "bg-emerald-500" : "bg-amber-400"}`}
            ></span>
            <span className="text-sm font-bold text-[#974E3F] font-lora uppercase tracking-wide ">
              {hasCredentials
                ? `Account Active: ${credentialEmail}`
                : "Identity Status: Unregistered"}
            </span>
          </div>
          <button
            onClick={handleResetCredentials}
            className="text-xs text-[#974E3F] font-bold cursor-pointer px-7 py-2 border border-[#974E3F] rounded-xl hover:bg-[#974E3F] hover:text-white transition-all"
          >
            Reset
          </button>
        </div>

        <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-[#974E3F] text-lg font-unbounded mb-4">
              Automation Control Panel
            </h3>
            <p className="text-xs text-amber-800 mb-2">
              Step 1: Run Signup — Creates unique profile dynamically.
            </p>
            <p className="text-xs text-amber-800 ">
              Step 2: Extract Data — Authenticates and parses inventory data
              fields.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleRunAutomation}
              disabled={loading}
              className="bg-[#974E3F] text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[#7a3e31] disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? "Registering..." : "Run Signup"}
            </button>
            <button
              onClick={handleExtractData}
              disabled={extracting || !hasCredentials}
              className="bg-[#F6F3EE] text-[#b32424] px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[#974E3F] hover:text-white disabled:opacity-50 w-full sm:w-auto"
            >
              {extracting ? "Parsing Directory..." : "Extract Data"}
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col shadow-lg rounded-xl overflow-hidden border border-[#2e2e2e]">
          <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-[#3c3c3c]">
            <span className="font-mono text-xs text-gray-400">
              live_process_terminal.log
            </span>
          </div>
          <div className="bg-[#1a1a1a] p-5 h-72 overflow-y-auto font-mono text-xs text-emerald-400 flex flex-col gap-1.5">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-600">[{i + 1}]</span>
                <span
                  className={
                    log.includes("[Error]")
                      ? "text-rose-400"
                      : log.includes("[Success]")
                        ? "text-cyan-400"
                        : log.includes("[System]")
                          ? "text-yellow-300"
                          : "text-emerald-400"
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
