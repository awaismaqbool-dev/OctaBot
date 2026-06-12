function History() {
    // Baad mein ye real data se aayega, abhi dummy data hai
    const runs = [
        { id: 1, time: "01:11 PM", status: "success" },
        { id: 2, time: "02:11 PM", status: "success" },
        { id: 3, time: "03:11 PM", status: "fail" },
        { id: 4, time: "03:45 PM", status: "success" },
        { id: 5, time: "04:11 PM", status: "success" },
        { id: 6, time: "05:11 PM", status: "fail" },
    ];

    return (
        <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-[#974E3F]">History</h2>
                <p className="text-xs text-amber-700">Record of all automation runs and extracted files</p>
            </div>

            {/* Runs List */}
            {runs.map((run) => (
                <div key={run.id} className="bg-[#F2E2CB] rounded-xl px-6 py-4 flex items-center justify-between">

                    <span className="text-sm font-medium text-amber-900">Extraction Result</span>
                    <span className="text-sm text-amber-700">{run.time}</span>

                    {/* Status Badge */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full
            ${run.status === "success" ? "bg-[#974E3F] text-white" : "bg-gray-400 text-white"}`}>
                        {run.status === "success" ? "Success" : "Fail"}
                    </span>

                    {/* View Button */}
                    <button
                        disabled={run.status === "fail"}
                        className={`text-sm px-4 py-1 rounded-lg border-2 font-semibold
              ${run.status === "success"
                                ? "border-[#974E3F] text-[#974E3F] hover:bg-[#f0ddd5] cursor-pointer"
                                : "border-gray-300 text-gray-300 cursor-not-allowed"}`}>
                        View Extracted File
                    </button>

                </div>
            ))}
        </div>
    );
}

export default History;