import { useState } from "react";

function Dashboard() {
    const { ipcRenderer } = window.require('electron');
    const [logs, setLogs] = useState(["[OctaBot] System initialized. Ready for automation."]);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [hasCredentials, setHasCredentials] = useState(false);
    const [credentialEmail, setCredentialEmail] = useState(null);

    const addLog = (msg) => {
        setLogs(prev => [...prev, msg]);
    };

    const checkCredentialsStatus = async () => {
        try {
            const status = await ipcRenderer.invoke('get-credentials-status');
            setHasCredentials(status.hasCredentials);
            setCredentialEmail(status.email);
        } catch (e) { }
    };

    const handleRunAutomation = async () => {
        setLoading(true);
        addLog("[OctaBot] Triggering master automation handler...");
        addLog("[OctaBot] Phase 1: Generating temporary email configuration...");

        try {
            const result = await ipcRenderer.invoke('start-full-automation', { showBrowser: true });

            if (result.success) {
                addLog(`[Success] ${result.message}`);
                setHasCredentials(true);
                setCredentialEmail(result.email);
                addLog(`[System] Credentials stored in memory. You can now extract data.`);
            } else {
                addLog(`[Error] Automation halted: ${result.error}`);
            }
        } catch (error) {
            addLog(`[IPC Error] Communication broken: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExtractData = async () => {
        if (!hasCredentials) {
            addLog("[Error] No credentials available. Run signup automation first.");
            return;
        }

        setExtracting(true);
        addLog("[OctaBot] Starting data extraction pipeline...");
        addLog(`[OctaBot] Logging in with: ${credentialEmail}`);

        try {
            const result = await ipcRenderer.invoke('start-extraction', { showBrowser: true });

            if (result.success) {
                addLog(`[Success] Extracted ${result.dataCount} posts!`);
                addLog(`[System] File saved to: ${result.filePath}`);
                addLog(`[System] ─── Data Preview (First 5) ───`);
                result.data.slice(0, 5).forEach((post, i) => {
                    const title = post.title.length > 45 ? post.title.slice(0, 45) + '...' : post.title;
                    addLog(`  [${i + 1}] ${title} | ${post.subreddit} | ${post.upvotes} | ${post.comments}`);
                });
                addLog(`[System] ─── End Preview (${result.dataCount} total rows, 5 columns) ───`);
            } else {
                addLog(`[Error] Extraction failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`[IPC Error] Extraction error: ${error.message}`);
        } finally {
            setExtracting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="border-b border-[#e8d5bc] pb-4">
                <h1 className="text-3xl font-extrabold text-[#974E3F] tracking-tight">OctaBot Control Dashboard</h1>
                <p className="text-sm text-amber-700 mt-1">The System That Works For You — Web Automation Engine</p>
                <p className="text-xs text-amber-600/80 font-mono mt-1">Engine Core: Microsoft Playwright Browser Context</p>
            </div>

            <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${hasCredentials ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    <span className="text-xs font-bold text-amber-950">
                        {hasCredentials
                            ? `Account Ready: ${credentialEmail}`
                            : 'No Account — Run Signup First'}
                    </span>
                </div>
                <button
                    onClick={checkCredentialsStatus}
                    className="text-xs text-[#974E3F] underline font-bold cursor-pointer"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="font-bold text-amber-950 text-lg">Automation Pipeline</h3>
                    <p className="text-xs text-amber-800 mt-0.5">Step 1: Signup — creates Reddit account. Step 2: Extract Data — logs in and fetches posts.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleRunAutomation}
                        disabled={loading}
                        className="bg-[#974E3F] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#7a3e31] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-[#974E3F]/20 w-full sm:w-auto"
                    >
                        {loading ? "Signing Up..." : "Run Signup"}
                    </button>
                    <button
                        onClick={handleExtractData}
                        disabled={extracting || !hasCredentials}
                        className="bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#1b4d3d] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-[#2d6a4f]/20 w-full sm:w-auto"
                    >
                        {extracting ? "Extracting..." : "Extract Data"}
                    </button>
                </div>
            </div>

            <div className="w-full flex flex-col shadow-lg rounded-xl overflow-hidden border border-[#2e2e2e]">
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-[#3c3c3c]">
                    <span className="font-mono text-xs text-gray-400">live_process_terminal.log</span>
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] p-5 h-72 overflow-y-auto font-mono text-xs text-emerald-400 flex flex-col gap-1.5 selection:bg-emerald-800 selection:text-white">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-gray-600 select-none">[{i + 1}]</span>
                            <span className={
                                log.includes('[Error]') ? 'text-rose-400' :
                                log.includes('[Success]') ? 'text-cyan-400' :
                                log.includes('[System]') ? 'text-yellow-300' :
                                'text-emerald-400'
                            }>
                                {log}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
