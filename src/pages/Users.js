import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("${baseUrl}/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setUsers(res.data);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    await axios.put(
      `${baseUrl}/api/users/${id}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    fetchUsers();
  };

  return (
    <div className="users-page">
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "12px",
                    backgroundColor: user.status === "Active" ? "#d4edda" : "#f8d7da",
                    color: user.status === "Active" ? "green" : "red",
                    fontWeight: "bold"
                  }}
                >
                  {user.status}
                </span>
              </td>
              <td>
                <button onClick={() => toggleStatus(user._id, user.status)}>
                  Toggle
                </button>
                <button style={{ marginLeft: "8px" }}>Edit</button>
                <button style={{ marginLeft: "8px" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
