import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Search,
  User,
  Eye,
  CheckCircle2,
  MessageSquare,
  X,
  Send,
} from "lucide-react";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState("");

  // 🔥 NEW FILTERS
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [yearList, setYearList] = useState([]);

  // ============================================================
  // FETCH FEEDBACK
  // ============================================================
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/support`, {
        params: { status: filter, q: search },
      });

      if (res.data.success) {
        let data = res.data.data || [];

        // 🌟 AUTO DETECT YEARS
        const years = Array.from(
          new Set(data.map((f) => new Date(f.date).getFullYear()))
        ).sort((a, b) => b - a);
        setYearList(years);

        // USER SEARCH FILTER
        if (userFilter.trim()) {
          data = data.filter((f) =>
            f.userId?.username
              ?.toLowerCase()
              .includes(userFilter.toLowerCase())
          );
        }

        // MONTH FILTER
        if (month !== "all") {
          data = data.filter(
            (f) => new Date(f.date).getMonth() + 1 === Number(month)
          );
        }

        // YEAR FILTER
        if (year !== "all") {
          data = data.filter(
            (f) => new Date(f.date).getFullYear() === Number(year)
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

  // ============================================================
  // MARK AS RESOLVED
  // ============================================================
  const markResolved = async (id) => {
    try {
      await axios.put(`${baseUrl}/support/${id}`);
      fetchFeedback();
    } catch (err) {
      console.error("Resolve error:", err);
    }
  };

  // ============================================================
  // SEND ADMIN REPLY
  // ============================================================
  const sendReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    try {
      await axios.put(`${baseUrl}/support/${selectedFeedback._id}/reply`, {
        replyText,
      });

      setReplyText("");
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter, search, userFilter, month, year]);

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="p-6 bg-emerald-50/40 rounded-2xl shadow-sm relative">
      {/* FILTER TABS */}
      <div className="flex items-center gap-4 mb-6">
        {["all", "unread", "resolved"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
              filter === tab
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-emerald-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* SEARCH, USER, MONTH & YEAR FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {/* Search */}
        <div className="flex items-center bg-white rounded-full shadow-sm px-3 py-2">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search feedback..."
            className="flex-1 outline-none bg-transparent text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter by user */}
        <div className="flex items-center bg-white rounded-full shadow-sm px-3 py-2">
          <User className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Filter by user"
            className="flex-1 outline-none bg-transparent text-sm"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>

        {/* Month Filter */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-white rounded-full shadow-sm px-3 py-2 border text-sm"
        >
          <option value="all">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-white rounded-full shadow-sm px-3 py-2 border text-sm"
        >
          <option value="all">All Years</option>
          {yearList.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* FEEDBACK TABLE */}
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
            <p className="text-center text-gray-500 py-6">No feedback found.</p>
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
                        <span className="text-red-500 font-medium">Unread</span>
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
                        onClick={() => {
                          setSelectedFeedback(item);
                          setReplyText("");
                        }}
                      />

                      {item.status === "unread" && (
                        <CheckCircle2
                          size={18}
                          className="text-gray-600 hover:text-green-600 cursor-pointer transition"
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

      {/* ===================== MODAL ===================== */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setSelectedFeedback(null)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="text-emerald-600" />
              Feedback Message
            </h3>

            <p>
              <strong>User:</strong> {selectedFeedback.userId?.username}
            </p>
            <p>
              <strong>Barangay:</strong>{" "}
              {selectedFeedback.userId?.barangay || "N/A"}
            </p>

            <div className="mt-3 p-3 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
              {selectedFeedback.message}
            </div>

            {selectedFeedback.adminReply && (
              <div className="mt-4 p-3 bg-gray-50 border rounded-lg text-sm">
                <strong>Your Previous Reply:</strong>
                <p>{selectedFeedback.adminReply}</p>
              </div>
            )}

            {/* Reply Section */}
            <textarea
              placeholder="Type your reply..."
              className="w-full border p-2 rounded mt-4"
              rows="3"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />

            <button
              onClick={sendReply}
              className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Send size={18} /> Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
