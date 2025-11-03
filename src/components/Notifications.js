import React, { useState, useEffect } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Notifications({ onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${baseUrl}/notifications`);
        setNotifications(res.data);

        const unreadCount = res.data.filter((n) => !n.read).length;
        onUnreadCountChange?.(unreadCount);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [onUnreadCountChange]);

  // ✅ Filtering
  const filtered = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "System") return n.type === "system";
    if (activeTab === "User") return n.type === "user";
    return true;
  });

  const iconMap = {
    system: "⚙️",
    user: "👤",
    default: "🔔",
  };

  return (
    <section className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-emerald-700">Notification Center</h2>
      <p className="text-sm text-gray-600">
        View and manage all system notifications
      </p>

      {/* Tabs */}
      <div className="flex space-x-3 bg-emerald-50 rounded-full p-2 w-fit">
        {["All", "Unread", "System", "User"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full font-medium transition-all ${
              activeTab === tab
                ? "bg-emerald-600 text-white shadow"
                : "bg-transparent text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-[#f2f7f9] rounded-2xl p-4 shadow-sm space-y-3 max-h-[70vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-lg">
                {iconMap[n.type] || iconMap.default}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}