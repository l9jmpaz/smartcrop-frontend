import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DataTab from "./components/Data";
import Feedback from "./components/Feedback";
import Reports from "./components/Reports";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import AdminLogin from "./components/AdminLogin";
import ArchivedData from "./components/ArchivedData";


export default function App() {
  const [active, setActive] = useState("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Check login state on initial load
  useEffect(() => {
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) setLoggedIn(true);
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("token");
    setLoggedIn(false); // back to login
    setActive("dashboard");
  };

  // ✅ Show AdminLogin first if not logged in
  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  // ✅ Main Admin Dashboard Layout
  return (
  <div className="bg-gray-100 text-gray-800 min-h-screen">
    {/* Sidebar (fixed) */}
    <Sidebar
      active={active}
      setActive={setActive}
      onLogout={handleLogout}
      unreadCount={unreadCount}
    />

    {/* Main Section (shifted right) */}
    <main className="ml-64 flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex justify-center items-center shadow bg-white sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-black">Admin Dashboard</h1>
      </header>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {active === "dashboard" && <Dashboard />}
        {active === "data" && <DataTab />}
        {active === "feedback" && <Feedback />}
        {active === "reports" && <Reports />}
       {active === "archived" && <ArchivedData />}
        {active === "notifications" && (
          <Notifications onUnreadCountChange={setUnreadCount} />
        )}
        {active === "settings" && <Settings />}
      </div>
    </main>
  </div>
);

}
