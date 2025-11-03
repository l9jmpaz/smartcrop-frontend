import React, { useState, useEffect } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com";

export default function Users() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Fetch all users from backend
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/users`);
      if (res.data.success) {
        setUsers(res.data.data || []);
      } else {
        console.warn("Unexpected response:", res.data);
      }
    } catch (err) {
      console.error("❌ Error fetching users:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🗑 Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${baseUrl}/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔍 Filter by username / phone / role
  const filteredUsers = users.filter((u) =>
    `${u.username || ""}${u.phone || ""}${u.role || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-emerald-700">
        User Management
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          Loading users...
        </div>
      ) : (
        <div className="bg-[#f5f9f7] rounded-xl p-6 shadow">
          {/* 🔍 Search bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 max-w-xl relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search by username, phone, or role"
                className="w-full border rounded-full px-4 py-2 text-sm bg-white pr-10 shadow-sm"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                🔍
              </button>
            </div>
          </div>

          {/* 🧾 Table */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 border-b">
                  <th className="py-2">Username</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Barangay</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        {u.username}
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>{u.role || "user"}</td>
                      <td>{u.barangay || "—"}</td>
                      <td>
                        <span
                          className={`${
                            u.status === "Active"
                              ? "text-green-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          {u.status || "Inactive"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="mr-2 text-blue-600 hover:underline"
                          onClick={() => alert(`Edit user: ${u.username}`)}
                        >
                          ✏️
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => handleDelete(u._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-4 text-gray-500 italic"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}