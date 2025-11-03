import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Notifications({ onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  // ✅ Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");
      setNotifications(res.data);

      // update unread count for sidebar dot 🔴
      const unreadCount = res.data.filter((n) => n.status === "unread").length;
      if (onUnreadCountChange) onUnreadCountChange(unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ Mark all unread as read when admin clicks "Unread"
  const markAllRead = async () => {
    try {
      const unread = notifications.filter((n) => n.status === "unread");
      await Promise.all(
        unread.map((n) =>
          axios.put(`http://localhost:5000/api/notifications/${n._id}/read`)
        )
      );
      fetchNotifications(); // refresh
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // ✅ Handle tab switch
  const handleTabChange = (tab) => {
    setFilter(tab);
    if (tab === "unread") {
      markAllRead();
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return n.status === "unread";
    return n.type === filter;
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-center">Recent Notifications</h2>

      {/* Tabs */}
      <div className="flex gap-4 justify-center">
        {["all", "unread", "system", "user"].map((f) => (
          <button
            key={f}
            onClick={() => handleTabChange(f)}
            className={`px-4 py-2 rounded-full ${
              filter === f ? "bg-emerald-600 text-white" : "bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-[#eaf1f6] rounded-xl p-6 shadow space-y-4">
        {filtered.map((n) => (
          <div
            key={n._id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
          >
            <span className="text-2xl">
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
        ))}

        {filtered.length === 0 && (
          <p className="text-gray-500 text-center">No notifications found.</p>
        )}
      </div>
    </section>
  );
}