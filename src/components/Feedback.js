import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  
  const fetchFeedback = async () => {
    try {
      const res = await axios.get(`${baseUrl}/support`, {
        params: { status: filter, q: search },
      });
      if (res.data.success) {
        setFeedback(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  const markResolved = async (id) => {
    try {
      await axios.put(`${baseUrl}/support/${id}`);
      fetchFeedback(); // refresh list
    } catch (err) {
      console.error("Error marking resolved:", err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter, search]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Help & Support Messages</h2>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        {["all", "unread", "resolved"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full ${
              filter === tab
                ? "bg-emerald-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center mb-4 space-x-2">
        <input
          type="text"
          placeholder="Search message..."
          className="border rounded-lg px-3 py-2 flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Message</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedback.map((item) => (
            <tr key={item._id} className="border-t hover:bg-gray-50">
              <td className="p-2">
                {item.userId?.username || "Unknown"} (
                {item.userId?.barangay || "N/A"})
              </td>
              <td className="p-2">{item.message}</td>
              <td className="p-2">
                {item.status === "unread" ? (
                  <span className="text-red-500 font-medium">Unread</span>
                ) : (
                  <span className="text-green-600 font-medium">Resolved</span>
                )}
              </td>
              <td className="p-2">
                {new Date(item.date).toLocaleDateString()}
              </td>
              <td className="p-2">
                {item.status === "unread" && (
                  <button
                    onClick={() => markResolved(item._id)}
                    className="text-emerald-600 hover:underline"
                  >
                    Mark as Resolved
                  </button>
                )}
              </td>
            </tr>
          ))}

          {feedback.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No feedback found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}