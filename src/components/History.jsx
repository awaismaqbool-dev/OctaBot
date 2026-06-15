function History() {
    const runs = [
        { id: 1, time: "2026-06-15 01:11 PM", status: "success", target: "Reddit Account Generation" },
        { id: 2, time: "2026-06-15 02:11 PM", status: "success", target: "Reddit Account Generation" },
        { id: 3, time: "2026-06-15 03:11 PM", status: "fail", target: "Reddit Account Generation" },
        { id: 4, time: "2026-06-15 03:45 PM", status: "success", target: "Data Extraction Engine" },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="border-b border-[#e8d5bc] pb-4">
                <h2 className="text-3xl font-extrabold text-[#974E3F]">Automation Logs History</h2>
                <p className="text-sm text-amber-700 mt-1">Audit log database containing system metrics, timestamps, and target compliance states.</p>
            </div>

            {/* Runs Container */}
            <div className="flex flex-col gap-3">
                {runs.map((run) => (
                    <div key={run.id} className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-amber-950">{run.target}</span>
                            <span className="text-xs text-amber-700/80 font-mono">Timestamp: {run.time}</span>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            {/* Dynamic Status Badge */}
                            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-md tracking-wide uppercase
                                ${run.status === "success" ? "bg-emerald-700 text-emerald-50" : "bg-rose-700 text-rose-50"}`}>
                                {run.status}
                            </span>

                            {/* View File Action Button */}
                            <button
                                disabled={run.status === "fail"}
                                className={`text-xs px-4 py-2 rounded-lg border font-bold tracking-wide transition-all
                                ${run.status === "success"
                                        ? "border-[#974E3F] text-[#974E3F] bg-white/40 hover:bg-[#974E3F] hover:text-white cursor-pointer shadow-sm"
                                        : "border-amber-800/20 text-amber-900/40 bg-transparent cursor-not-allowed"}`}>
                                INSPECT EXPORT
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default History;