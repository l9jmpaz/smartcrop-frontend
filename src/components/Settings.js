// frontend/pages/Settings.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

export default function Settings() {
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    barangay: "",
  });

  // Modal states
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ===========================
  // LOAD USER
  // ===========================
  const loadUser = async () => {
    try {
      const res = await axios.get(`${baseUrl}/users/${userId}`);
      const u = res.data.data;

      setProfileData({
        username: u.username,
        email: u.email,
        phone: u.phone.startsWith("+63") ? u.phone.slice(3) : u.phone,
        barangay: u.barangay,
      });

    } catch (err) {
      console.error("Load user failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // ===========================
  // UPDATE USERNAME
  // ===========================
  const updateUsername = async () => {
    try {
      await axios.put(`${baseUrl}/users/${userId}`, {
        username: newUsername,
      });

      alert("Username updated!");
      setShowUsernameModal(false);
      loadUser();
    } catch (err) {
      alert("Failed to update username.");
      console.error(err);
    }
  };

  // ===========================
  // UPDATE PASSWORD
  // ===========================
  const updatePassword = async () => {
    try {
      await axios.post(`${baseUrl}/auth/change-password`, {
        phone: `+63${profileData.phone}`,
        newPassword,
      });

      alert("Password updated!");
      setNewPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      alert("Failed to update password.");
      console.error(err);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  return (
    <section className="p-6 max-w-lg mx-auto space-y-6">

      {/* MAIN CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-4">
        <h2 className="text-xl font-bold text-emerald-700">Admin Profile</h2>

        {/* USERNAME */}
        <div className="space-y-1">
          <label className="font-medium text-gray-600">Username</label>
          <input 
            className="w-full border px-3 py-2 rounded-lg bg-gray-100"
            value={profileData.username}
            disabled
          />
        </div>

        {/* EMAIL */}
        <div className="space-y-1">
          <label className="font-medium text-gray-600">Email</label>
          <input 
            className="w-full border px-3 py-2 rounded-lg bg-gray-100"
            value={profileData.email}
            disabled
          />
        </div>

        {/* PHONE */}
        <div className="space-y-1">
          <label className="font-medium text-gray-600">Phone</label>
          <input 
            className="w-full border px-3 py-2 rounded-lg bg-gray-100"
            value={`+63${profileData.phone}`}
            disabled
          />
        </div>

        {/* BARANGAY */}
        <div className="space-y-1">
          <label className="font-medium text-gray-600">Barangay</label>
          <input 
            className="w-full border px-3 py-2 rounded-lg bg-gray-100"
            value={profileData.barangay}
            disabled
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              setNewUsername(profileData.username);
              setShowUsernameModal(true);
            }}
            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold"
          >
            Change Username
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* ======================== USERNAME MODAL ======================== */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">

            <h3 className="text-lg font-bold mb-4">Change Username</h3>

            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowUsernameModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={updateUsername}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== PASSWORD MODAL ======================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

            <h3 className="text-lg font-bold mb-4">Change Password</h3>

            <input
              type="password"
              className="w-full border px-3 py-2 rounded-lg"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={updatePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
