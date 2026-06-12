import { useState } from "react";

function Settings() {
    const [speed, setSpeed] = useState("normal");
    const [domain, setDomain] = useState("1secmail.com");
    const [outputFormat, setOutputFormat] = useState(".txt");

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-[#974E3F]">Settings</h2>
                <p className="text-xs text-amber-700">Configure automation preferences and output settings</p>
            </div>

            <div className="bg-[#F2E2CB] rounded-xl p-6 flex flex-col gap-8">

                {/* Automation Speed */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-amber-900">Automation Speed (Delays):</p>
                        <p className="text-xs text-amber-700 mt-1">Reddit has strict bot detection so running at slow speed reduces the chance of being flagged as a bot.</p>
                    </div>
                    <div className="flex gap-2">
                        {["slow", "normal", "fast"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize cursor-pointer
                  ${speed === s
                                        ? "bg-[#974E3F] text-white"
                                        : "bg-white text-amber-900 hover:bg-[#f0ddd5]"}`}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-0.5 bg-[#e8d5bc]"></div>

                {/* Temp Mail Domain */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-amber-900">Temp-Mail Domain Selection:</p>
                        <p className="text-xs text-amber-700 mt-1">Reddit may block certain temp-mail domains, so switching to a different domain helps bypass email verification.</p>
                    </div>
                    <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="bg-white text-amber-900 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none outline-none">
                        <option value="1secmail.com">1secmail.com</option>
                        <option value="1secmail.org">1secmail.org</option>
                        <option value="1secmail.net">1secmail.net</option>
                    </select>
                </div>

                <div className="w-full h-0.5 bg-[#e8d5bc]"></div>

                {/* Output Format */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-amber-900">Output Path:</p>
                        <p className="text-xs text-amber-700 mt-1">Set file extension for extracted data output.</p>
                    </div>
                    <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="bg-white text-amber-900 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none outline-none">
                        <option value=".txt">.txt</option>
                        <option value=".csv">.csv</option>
                    </select>
                </div>

            </div>
        </div>
    );
}

export default Settings;