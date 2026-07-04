function Sidebar({ activePage, setActivePage }) {
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "history", label: "History" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="bg-[#F2E2CB] h-screen w-70 flex flex-col select-none justify-center">
      {/* App Branding Header */}
      <div className="p-6 bg-[#F2E2CB] flex justify-center items-center ">
        <img src="/src/assets/side_logo.png" alt="logo" className="h-25 w-25 mt-3" />
      </div>

      {/* Navigation Buttons */}
      {/* CHANGER: px-0 kiya taake active background left border se touch ho jaye */}
      <nav className="flex-1 px-0 py-4 flex flex-col gap-1.5  mr-5">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActivePage(link.id)}
            /* CHANGER: text-left, justify-start kiya aur left side par pl-10 padding di hai text ke liye */
            /* CHANGER: 'rounded-r-xl' wapas lagaya taake sirf right corners round hon jaise aapki image mein hai */
            className={`w-full text-center pl-10 pr-4 py-3 text-base transition-all duration-150 flex items-center gap-3 cursor-pointer justify-center font-unbounded font-normal rounded-r-xl
              ${activePage === link.id
                ? "bg-[#974E3F] text-white shadow-sm"
                : "text-[#5C2E24] hover:bg-[#e8d5bc]/50"}`}
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Meta */}
      <div className="p-4 border-t border-[#e8d5bc] bg-[#ebdcc4] text-center">
        <p className="text-[10px] font-mono text-amber-800/60">Final Year Project • VU</p>
      </div>
    </div>
  );
}

export default Sidebar;