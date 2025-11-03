import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Notifications({ onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  // ✅ Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("${baseUrl}/api/notifications");
        setNotifications(res.data);

        // update unread count for sidebar red dot
        const unreadCount = res.data.filter((n) => !n.read).length;
        onUnreadCountChange(unreadCount);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [onUnreadCountChange]);

  // ✅ Filter logic for tabs
  const filtered = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "System") return n.type === "system";
    if (activeTab === "User") return n.type === "user";
    return true;
  });

  // ✅ Mark all unread as read when switching to "Unread" tab
  useEffect(() => {
    if (activeTab === "Unread") {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      onUnreadCountChange(0);
    }
  }, [activeTab, onUnreadCountChange]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Notification Center</h2>
      <p className="text-sm text-gray-600">
        View and manage all system notifications
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mt-4">
        {["All", "Unread", "System", "User"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === tab
                ? "bg-emerald-200 text-gray-900"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-[#eaf1f6] rounded-xl p-4 space-y-3 max-h-[360px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
            >
              <span className="text-lg">
                {n.type === "system" ? "⚙️" : "👤"}
              </span>
              <div>
                <p className="font-semibold">{n.title}</p>
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