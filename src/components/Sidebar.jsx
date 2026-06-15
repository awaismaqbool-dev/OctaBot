function Sidebar({ activePage, setActivePage }) {
  const links = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "history", label: "History Log", icon: "⏳" },
    { id: "settings", label: "Settings Config", icon: "⚙️" },
  ];

  return (
    <div className="bg-[#F2E2CB] h-screen w-56 flex flex-col border-r border-[#e8d5bc] shadow-sm select-none">
      {/* App Branding Header */}
      <div className="p-6 border-b border-[#e8d5bc] bg-[#ebdcc4]">
        <h2 className="text-xl font-black text-[#974E3F] tracking-wider flex items-center gap-2">
          <span>OCTABOT</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#974E3F] text-white font-mono">v1.0</span>
        </h2>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 p-4 flex flex-col gap-1.5">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActivePage(link.id)}
            className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer
              ${activePage === link.id
                ? "bg-[#974E3F] text-white shadow-sm"
                : "text-amber-950 hover:bg-[#e8d5bc] hover:text-amber-900"}`}
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Meta */}
      <div className="p-4 border-t border-[#e8d5bc] bg-[#ebdcc4] text-center">
        <p className="text-[10px] font-mono text-amber-800/60">Fianl Year Project • VU</p>
      </div>
    </div>
  );
}

export default Sidebar;