import React, { useState, useEffect } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com";

export default function Users() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    barangay: "",
    role: "User",
    status: "Active",
  });

  // 🟢 Fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/users`);
      if (res.data.success) setUsers(res.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching users:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ➕ Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseUrl}/api/auth/register`, formData);
      if (res.data.success) {
        alert("✅ User added successfully!");
        setShowAddModal(false);
        setFormData({
          username: "",
          email: "",
          phone: "",
          barangay: "",
          role: "User",
          status: "Active",
        });
        fetchUsers();
      } else {
        alert("⚠️ Failed to add user");
      }
    } catch (err) {
      console.error("❌ Error adding user:", err.message);
      alert("⚠️ Error adding user.");
    }
  };

  // ✏️ Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${baseUrl}/api/users/${selectedUser._id}`, formData);
      if (res.data.success) {
        alert("✅ User updated successfully!");
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert("⚠️ Failed to update user");
      }
    } catch (err) {
      console.error("❌ Error updating user:", err.message);
      alert("⚠️ Error updating user.");
    }
  };

  // 🗑 Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${baseUrl}/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
    }
  };

  // 🔍 Filter users
  const filteredUsers = users.filter((u) =>
    `${u.username || ""}${u.phone || ""}${u.role || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <section className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-700">User Management</h2>
        <button
          onClick={() => {
            setShowAddModal(true);
            setFormData({
              username: "",
              email: "",
              phone: "",
              barangay: "",
              role: "User",
              status: "Active",
            });
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          ➕ Add New User
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search by name or email"
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <span className="absolute right-4 top-2.5 text-gray-500">🔍</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#f2f7f9] rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">All Users</h3>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-500">
            Loading users...
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">User</th>
                  <th className="py-2">Email / Phone</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Barangay</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="border-b hover:bg-white transition-colors"
                    >
                      <td className="py-3 flex items-center gap-3 font-medium text-gray-800">
                        <span className="text-2xl">👤</span>
                        {u.username || "—"}
                      </td>
                      <td className="text-gray-600">
                        {u.email || u.phone || "—"}
                      </td>
                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            u.role?.toLowerCase() === "admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.role?.toUpperCase() || "USER"}
                        </span>
                      </td>
                      <td>{u.barangay || "—"}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            u.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {u.status || "Inactive"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="mr-2 text-gray-600 hover:text-blue-600"
                          onClick={() => {
                            setSelectedUser(u);
                            setFormData({
                              username: u.username,
                              email: u.email || "",
                              phone: u.phone || "",
                              barangay: u.barangay || "",
                              role: u.role || "User",
                              status: u.status || "Active",
                            });
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="text-gray-600 hover:text-red-600"
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
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ➕ Add Modal */}
      {showAddModal && (
        <Modal
          title="Add New User"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* ✏️ Edit Modal */}
      {showEditModal && selectedUser && (
        <Modal
          title={`Edit User - ${selectedUser.username}`}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditUser}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </section>
  );
}

// ✅ Reusable modal component
function Modal({ title, onClose, onSubmit, formData, setFormData }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Barangay"
            value={formData.barangay}
            onChange={(e) =>
              setFormData({ ...formData, barangay: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option>User</option>
            <option>Admin</option>
          </select>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}