import { useState } from "react";

function Settings() {
    const [speed, setSpeed] = useState("normal");
    const [domain, setDomain] = useState("qiott.com");
    const [outputFormat, setOutputFormat] = useState(".txt");

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="border-b border-[#e8d5bc] pb-4">
                <h2 className="text-3xl font-extrabold text-[#974E3F]">System Preferences</h2>
                <p className="text-sm text-amber-700 mt-1">Configure automation run-time velocity thresholds and network extraction protocols.</p>
            </div>

            <div className="bg-[#F2E2CB] border border-[#e8d5bc] rounded-xl p-6 flex flex-col gap-6 shadow-sm">

                {/* Delays Configuration */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#e8d5bc]">
                    <div className="max-w-xl">
                        <p className="font-bold text-amber-950">Automation Processing Speed</p>
                        <p className="text-xs text-amber-700 mt-0.5">Controls targeted script delays. Using higher latency buffers simulates human behavioral patterns to minimize account pattern flagging.</p>
                    </div>
                    <div className="flex gap-1.5 bg-[#e8d5bc] p-1 rounded-lg w-full md:w-auto">
                        {["slow", "normal", "fast"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all cursor-pointer flex-1 md:flex-none text-center
                                    ${speed === s
                                        ? "bg-[#974E3F] text-white shadow-sm"
                                        : "text-amber-950 hover:bg-[#ebdcc4]"}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Email Service Domains */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#e8d5bc]">
                    <div className="max-w-xl">
                        <p className="font-bold text-amber-950">Temporary Mail Gateway Mapping</p>
                        <p className="text-xs text-amber-700 mt-0.5">Rotates base MX records used during identity compilation. Bypasses domain blacklist policies enforced by Reddit registration portals.</p>
                    </div>
                    <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="bg-white text-amber-950 border border-[#e8d5bc] px-3 py-2 rounded-lg text-xs font-bold cursor-pointer outline-none w-full md:w-48 shadow-sm focus:border-[#974E3F]">
                        <option value="qiott.com">qiott.com (Recommended)</option>
                        <option value="kzccv.com">kzccv.com</option>
                        <option value="1secmail.com">1secmail.com</option>
                    </select>
                </div>

                {/* Output Extensions */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="max-w-xl">
                        <p className="font-bold text-amber-950">Data Serialization Format Extension</p>
                        <p className="text-xs text-amber-700 mt-0.5">Defines final file system extension layout structure used during string parsing write execution steps.</p>
                    </div>
                    <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="bg-white text-amber-950 border border-[#e8d5bc] px-3 py-2 rounded-lg text-xs font-bold cursor-pointer outline-none w-full md:w-48 shadow-sm focus:border-[#974E3F]">
                        <option value=".txt">Plain Text (.txt)</option>
                        <option value=".csv">Comma Separated Values (.csv)</option>
                    </select>
                </div>

            </div>
        </div>
    );
}

export default Settings;