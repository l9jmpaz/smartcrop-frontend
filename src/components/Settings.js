// frontend/pages/Settings.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

// 🔒 Always use the correct ADMIN ID
const userId = "691d3e97445938f294966ccf";

export default function Settings() {
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    barangay: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // ========================================================
  // LOAD USER (always loads correct admin)
  // ========================================================
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

  // ========================================================
  // SAVE PROFILE (only username)
  // ========================================================
  const saveProfile = async () => {
    const payload = {
      username: profileData.username,
      email: profileData.email,
      phone: `+63${profileData.phone}`,
      barangay: profileData.barangay,
    };

    try {
      const res = await axios.put(`${baseUrl}/users/${userId}`, payload);
      alert("Profile updated!");
      loadUser();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update profile.");
    }
  };

  // ========================================================
  // CHANGE PASSWORD
  // ========================================================
  const savePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert("Both fields required.");
      return;
    }

    try {
      await axios.put(`${baseUrl}/users/${userId}/password`, passwords);
      alert("Password updated!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error("Password error:", err);
      alert("Incorrect old password.");
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  // ========================================================
  // UI
  // ========================================================
  return (
    <section className="p-6 max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-emerald-700 text-center">
        Admin Settings
      </h2>

      {/* PROFILE CARD */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-emerald-700">
          Profile Information
        </h3>

        {/* Username editable */}
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4"
          value={profileData.username}
          onChange={(e) =>
            setProfileData({ ...profileData, username: e.target.value })
          }
          placeholder="Full Name"
        />

        {/* Email readonly */}
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4 bg-gray-100"
          value={profileData.email}
          readOnly
        />

        {/* Phone readonly */}
        <label className="block text-sm font-medium mb-1">Phone</label>
        <div className="flex items-center border rounded-lg px-3 py-2 mb-4 bg-gray-100">
          <span className="text-gray-600 font-medium">+63</span>
          <input
            className="w-full ml-2 bg-gray-100 outline-none"
            value={profileData.phone}
            readOnly
          />
        </div>

        {/* Barangay readonly */}
        <label className="block text-sm font-medium mb-1">Barangay</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-6 bg-gray-100"
          value={profileData.barangay}
          readOnly
        />

        <button
          onClick={saveProfile}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium"
        >
          Save Profile
        </button>
      </div>

      {/* PASSWORD CARD */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-emerald-700">
          Change Password
        </h3>

        <label className="block text-sm font-medium mb-1">Old Password</label>
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          value={passwords.oldPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, oldPassword: e.target.value })
          }
        />

        <label className="block text-sm font-medium mb-1">New Password</label>
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2 mb-6"
          value={passwords.newPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, newPassword: e.target.value })
          }
        />

        <button
          onClick={savePassword}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium"
        >
          Update Password
        </button>
      </div>
    </section>
  );
}
