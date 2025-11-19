// frontend/pages/Settings.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";
const userId = localStorage.getItem("userId");

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
  // LOAD USER
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
  // SAVE USERNAME ONLY
  // ========================================================
  const saveProfile = async () => {
    if (!profileData.username) {
      alert("Username cannot be empty.");
      return;
    }

    try {
      const res = await axios.put(`${baseUrl}/users/${userId}`, {
        username: profileData.username,
      });

      alert("Username updated!");
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
      alert("Both fields are required.");
      return;
    }

    try {
      await axios.put(`${baseUrl}/users/${userId}/password`, passwords);

      alert("Password updated!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error("Password update failed:", err);
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

      {/* =================== PROFILE CARD =================== */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6 space-y-5">

        <h3 className="text-xl font-semibold text-gray-700">
          Profile Information
        </h3>

        {/* USERNAME (editable) */}
        <div>
          <label className="text-sm font-medium text-gray-600">Username</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({ ...profileData, username: e.target.value })
            }
          />
        </div>

        {/* EMAIL (read-only) */}
        <div>
          <label className="text-sm font-medium text-gray-600">Email</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
            value={profileData.email}
            readOnly
          />
        </div>

        {/* PHONE (read-only) */}
        <div>
          <label className="text-sm font-medium text-gray-600">Phone</label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed">
            <span>+63</span>
            <input
              className="w-full bg-gray-100 ml-2"
              value={profileData.phone}
              readOnly
            />
          </div>
        </div>

        {/* BARANGAY (read-only) */}
        <div>
          <label className="text-sm font-medium text-gray-600">Barangay</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
            value={profileData.barangay}
            readOnly
          />
        </div>

        <button
          onClick={saveProfile}
          className="w-full bg-emerald-600 text-white py-2 mt-2 rounded-lg hover:bg-emerald-700 transition"
        >
          Save Username
        </button>
      </div>

      {/* =================== PASSWORD CARD =================== */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6 space-y-5">

        <h3 className="text-xl font-semibold text-gray-700">
          Change Password
        </h3>

        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Old Password"
          value={passwords.oldPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, oldPassword: e.target.value })
          }
        />

        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2"
          placeholder="New Password"
          value={passwords.newPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, newPassword: e.target.value })
          }
        />

        <button
          onClick={savePassword}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Update Password
        </button>
      </div>

    </section>
  );
}
