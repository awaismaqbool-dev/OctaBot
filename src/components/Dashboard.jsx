import { useState } from "react";

function Dashboard() {
    const { ipcRenderer } = window.require('electron');
    const [logs, setLogs] = useState(["[System] Waiting for action..."]);
    const [loading, setLoading] = useState(false);
    return (
        <div className="flex flex-col items-center gap-6">

            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-4xl font-bold text-[#974E3F]">🤖 octabot</h1>
                <p className="text-sm text-amber-700 mt-1">The System That Works For You</p>
                <p className="text-xs text-amber-600 mt-1">Automates web interactions on Reddit.com using Microsoft Playwright</p>
            </div>

            {/* Buttons */}
            <div className="bg-[#F2E2CB] rounded-xl px-10 py-6 flex gap-6">
                <button
                    onClick={async () => {
                        setLoading(true);
                        setLogs(prev => [...prev, "[System] Fetching temp email..."]);
                        const result = await ipcRenderer.invoke('get-temp-email');
                        if (result.success) {
                            setLogs(prev => [...prev, `[Success] Email: ${result.email}`]);
                        } else {
                            setLogs(prev => [...prev, `[Error] ${result.error}`]);
                        }
                        setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-[#974E3F] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a3e31] cursor-pointer disabled:opacity-50">
                    {loading ? "Running..." : "Run Automation"}
                </button>
                <button className="border-2 border-[#974E3F] text-[#974E3F] px-6 py-2 rounded-lg font-semibold hover:bg-[#f0ddd5] cursor-pointer">
                    Start Extraction
                </button>
            </div>

            {/* Terminal */}
            <div className="w-full bg-[#1e1e1e] rounded-xl p-4 min-h-48 font-mono text-sm text-green-400">
                <p className="text-gray-500 text-xs mb-2">// Console Output</p>
                {logs.map((log, i) => (
                    <p key={i}>{log}</p>
                ))}
            </div>

        </div>
    );
}

export default Dashboard;