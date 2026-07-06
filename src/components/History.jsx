import { useState, useEffect } from "react";

function History() {
  const { ipcRenderer } = window.require("electron");
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hook to call local bridge handler on load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await ipcRenderer.invoke("get-automation-history");
        setRuns(historyData);
      } catch (e) {
        console.error("Failed to load live history logs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-[#e8d5bc] pb-4">
        <h2 className="text-3xl font-extrabold text-[#974E3F]">
          Automation Logs History
        </h2>
        <p className="text-sm text-amber-700 mt-1">
          Audit log database containing system metrics, timestamps, and target
          compliance states.
        </p>
      </div>

      {/* Loading State Check */}
      {loading ? (
        <p className="text-center text-sm font-mono text-amber-800">
          Reading storage system records...
        </p>
      ) : runs.length === 0 ? (
        <div className="bg-[#F2E2CB]/50 border border-dashed border-[#e8d5bc] rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-amber-900/60">
            No automation tasks executed yet. Go to Dashboard to start
            pipelines.
          </p>
        </div>
      ) : (
        /* Runs Container Layout */
        <div className="flex flex-col gap-3">
          {runs.map((run) => (
            <div
              key={run.id}
              className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-amber-950">
                  {run.target}
                </span>
                <span className="text-xs text-amber-700/80 font-mono">
                  Timestamp: {run.time}
                </span>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {run.detail && (
                  <span className="text-xs text-amber-700/60 font-mono hidden md:block">
                    {run.detail}
                  </span>
                )}
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-md tracking-wide uppercase
                                    ${run.status === "success" ? "bg-emerald-700 text-emerald-50" : "bg-rose-700 text-rose-50"}`}
                >
                  {run.status}
                </span>
                <button
                  disabled={run.status === "fail"}
                  className={`text-xs px-4 py-2 rounded-lg border font-bold tracking-wide transition-all
                                    ${
                                      run.status === "success"
                                        ? "border-[#974E3F] text-[#974E3F] bg-white/40 hover:bg-[#974E3F] hover:text-white cursor-pointer shadow-sm"
                                        : "border-amber-800/20 text-amber-900/40 bg-transparent cursor-not-allowed"
                                    }`}
                >
                  INSPECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
