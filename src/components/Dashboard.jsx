import { useState } from "react";

function Dashboard() {
    const { ipcRenderer } = window.require('electron');
    const [logs, setLogs] = useState(["[OctaBot] System initialized. Ready for automation."]);
    const [loading, setLoading] = useState(false);

    const handleRunAutomation = async () => {
        setLoading(true);
        setLogs(prev => [...prev, "[OctaBot] Triggering master automation handler..."]);
        setLogs(prev => [...prev, "[OctaBot] Phase 1: Generating temporary email configuration..."]);

        try {
            // Hum backend ka main IPC handle trigger kar rahe hain jo hum ne main.js mein likha tha
            const result = await ipcRenderer.invoke('start-full-automation', { showBrowser: true });

            if (result.success) {
                setLogs(prev => [
                    ...prev,
                    `[Success] ${result.message}`
                ]);
            } else {
                setLogs(prev => [...prev, `[Error] Automation halted: ${result.error}`]);
            }
        } catch (error) {
            setLogs(prev => [...prev, `[IPC Error] Communication broken: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="border-b border-[#e8d5bc] pb-4">
                <h1 className="text-3xl font-extrabold text-[#974E3F] tracking-tight">🤖 OctaBot Control Dashboard</h1>
                <p className="text-sm text-amber-700 mt-1">The System That Works For You — Web Automation Engine</p>
                <p className="text-xs text-amber-600/80 font-mono mt-1">Engine Core: Microsoft Playwright Browser Context</p>
            </div>

            {/* Action Panel */}
            <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="font-bold text-amber-950 text-lg">Account Creation Pipeline</h3>
                    <p className="text-xs text-amber-800 mt-0.5">Executes background API provisioning, browser injection, and captcha monitoring.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleRunAutomation}
                        disabled={loading}
                        className="bg-[#974E3F] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#7a3e31] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-[#974E3F]/20 w-full sm:w-auto">
                        {loading ? "Automation Running..." : "Run Automation"}
                    </button>
                    <button className="border-2 border-[#974E3F] text-[#974E3F] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#ebd9c0] active:scale-95 transition-all cursor-pointer w-full sm:w-auto">
                        View Schema
                    </button>
                </div>
            </div>

            {/* Real-Time Terminal Console */}
            <div className="w-full flex flex-col shadow-lg rounded-xl overflow-hidden border border-[#2e2e2e]">
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-[#3c3c3c]">
                    <span className="font-mono text-xs text-gray-400">⚡ live_process_terminal.log</span>
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] p-5 h-64 overflow-y-auto font-mono text-xs text-emerald-400 flex flex-col gap-1.5 selection:bg-emerald-800 selection:text-white">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-gray-600 select-none">[{i + 1}]</span>
                            <span className={log.includes('[Error]') ? 'text-rose-400' : log.includes('[Success]') ? 'text-cyan-400' : 'text-emerald-400'}>
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