import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  User,
  Eye,
  CheckCircle2,
  MessageSquare,
  X,
} from "lucide-react";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null); // 🟢 For modal

  // ✅ Fetch feedback data
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/support`, {
        params: { status: filter, q: search },
      });
      if (res.data.success) {
        let data = res.data.data || [];
        if (userFilter.trim()) {
          data = data.filter((f) =>
            f.userId?.username
              ?.toLowerCase()
              .includes(userFilter.toLowerCase())
          );
        }
        setFeedback(data);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark as resolved
  const markResolved = async (id) => {
    try {
      await axios.put(`${baseUrl}/support/${id}`);
      fetchFeedback();
    } catch (err) {
      console.error("Error marking resolved:", err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter, search, userFilter]);

  return (
    <div className="p-6 bg-emerald-50/40 rounded-2xl shadow-sm relative">
      {/* ====== HEADER ====== */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Feedback Overview
      </h2>

      {/* ====== FILTER TABS ====== */}
      <div className="flex gap-3 mb-6">
        {["all", "unread", "resolved"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              filter === tab
                ? "bg-emerald-600 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-emerald-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ====== SEARCH & FILTER ====== */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search box */}
        <div className="flex items-center bg-white rounded-full shadow-sm px-3 py-2 flex-1 min-w-[220px]">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search feedback..."
            className="flex-1 outline-none bg-transparent text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* User filter */}
        <div className="flex items-center bg-white rounded-full shadow-sm px-3 py-2 flex-1 min-w-[220px]">
          <User className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Filter by user"
            className="flex-1 outline-none bg-transparent text-sm"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ====== FEEDBACK LIST ====== */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-700 mb-3">
          Recent Feedback
        </h3>

        <div className="relative max-h-[65vh] overflow-y-auto rounded-lg border border-gray-100">
          {loading ? (
            <p className="text-center text-gray-500 py-6">
              Loading feedback...
            </p>
          ) : feedback.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No feedback found.
            </p>
          ) : (
            <table className="w-full text-sm text-gray-700">
              <thead className="sticky top-0 bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="py-2 px-4">User</th>
                  <th className="py-2 px-4">Message</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Date</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <MessageSquare
                        size={16}
                        className={
                          item.status === "unread"
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      />
                      <span>{item.userId?.username || "Unknown"}</span>
                    </td>
                    <td className="py-3 px-4 truncate max-w-[200px]">
                      {item.message}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "unread" ? (
                        <span className="text-red-500 font-medium">
                          Unread
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center flex justify-center gap-3">
                      <Eye
                        size={18}
                        className="text-gray-600 hover:text-emerald-600 cursor-pointer transition"
                        title="View Message"
                        onClick={() => setSelectedFeedback(item)} // 🟢 open modal
                      />
                      {item.status === "unread" && (
                        <CheckCircle2
                          size={18}
                          className="text-gray-600 hover:text-green-600 cursor-pointer transition"
                          title="Mark as Resolved"
                          onClick={() => markResolved(item._id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====== MODAL ====== */}
      {selectedFeedback && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedFeedback(null)}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="text-emerald-600" /> Feedback Details
            </h3>

            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-medium">From:</span>{" "}
                {selectedFeedback.userId?.username || "Unknown"} (
                {selectedFeedback.userId?.barangay || "N/A"})
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {new Date(selectedFeedback.date).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {selectedFeedback.status === "unread" ? (
                  <span className="text-red-500 font-medium">Unread</span>
                ) : (
                  <span className="text-green-600 font-medium">Resolved</span>
                )}
              </p>
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm text-gray-800 border border-emerald-100">
                {selectedFeedback.message}
              </div>
            </div>

            {/* Modal footer */}
            {selectedFeedback.status === "unread" && (
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => {
                    markResolved(selectedFeedback._id);
                    setSelectedFeedback(null);
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition"
                >
                  <CheckCircle2 size={18} /> Mark as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}