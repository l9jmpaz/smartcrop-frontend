import React from "react";

const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "data", icon: "📁", label: "Data" },
  { id: "feedback", icon: "💬", label: "Feedback" },
  { id: "reports", icon: "📑", label: "Reports" },
  { id: "users", icon: "👥", label: "Users" },
];

export default function Sidebar({ active, setActive, onLogout, unreadCount }) {
  return (
    <aside className="w-64 h-screen bg-[#eaf1f6] text-gray-900 flex flex-col justify-between shadow-lg fixed left-0 top-0">
      {/* Header */}
      <div className="px-6 py-5 text-lg font-bold border-b border-gray-300 uppercase">
        Smart Crop Planning
      </div>

      {/* Navigation */}
      <nav className="flex flex-col py-4 text-sm flex-grow">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${
              active === item.id
                ? "bg-[#9fd8c4] text-gray-900 font-semibold border-l-4 border-emerald-600"
                : "hover:bg-[#9fd8c4] text-gray-700"
            }`}
          >
            <span className="text-lg">{item.icon}</span> {item.label}
          </button>
        ))}

        {/* ✅ Notifications */}
        <button
          onClick={() => setActive("notifications")}
          className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${
            active === "notifications"
              ? "bg-[#9fd8c4] text-gray-900 font-semibold border-l-4 border-emerald-600"
              : "hover:bg-[#9fd8c4] text-gray-700"
          }`}
        >
          <span className="text-lg">🔔</span> Notifications
          {unreadCount > 0 && (
            <span className="ml-auto w-2 h-2 bg-red-600 rounded-full"></span>
          )}
        </button>
      </nav>

      {/* Footer: System Admin + Logout */}
      <div className="px-5 py-4 border-t border-gray-300 bg-[#eaf1f6]">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">👤</span>
          <span className="font-medium">System Administrator</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}