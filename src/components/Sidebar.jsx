function Sidebar({ activePage, setActivePage }) {
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "history", label: "History" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="flex">
      <div className="bg-[#F2E2CB] h-screen w-40 flex flex-col pt-6 gap-2">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActivePage(link.id)}
            className={`text-left px-4 py-2 font-semibold text-sm cursor-pointer
              ${activePage === link.id ? "bg-[#974E3F] text-white" : "text-amber-900 hover:bg-[#e8d5bc]"}`}
          >
            {link.label}
          </button>
        ))}
      </div>
      <div className="bg-[#974E3F] h-screen w-0.5"></div>
    </div>
  );
}

export default Sidebar;