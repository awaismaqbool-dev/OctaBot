import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Settings from "./components/Setting";
import Sidebar from "./components/Sidebar";
import { useState } from "react";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="flex h-screen bg-[#F6F3EE] text-amber-900 overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 overflow-y-auto p-8">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "history" && <History />}
        {activePage === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default App;