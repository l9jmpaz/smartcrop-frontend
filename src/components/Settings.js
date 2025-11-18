import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Settings() {
  const userId = localStorage.getItem("userId");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // PROFILE form
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    barangay: "",
  });

  // PASSWORD form
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // Load User Data
  const loadUser = async () => {
    try {
      const res = await axios.get(`${baseUrl}/users/${userId}`);
      const u = res.data.data;

      setUser(u);

      setProfileData({
        username: u.username,
        email: u.email || "",
        phone: u.phone || "",
        barangay: u.barangay || "",
      });
    } catch (err) {
      console.error("Load user failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Save Profile
  const saveProfile = async () => {
    try {
      await axios.put(`${baseUrl}/users/${userId}`, profileData);
      alert("Profile updated!");
      loadUser();
    } catch {
      alert("Failed to update profile.");
    }
  };

  // Save Password
  const savePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert("Please fill both password fields.");
      return;
    }

    try {
      await axios.put(`${baseUrl}/users/${userId}/password`, passwords);
      alert("Password changed successfully!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      alert("Incorrect old password or update failed.");
    }
  };

  if (loading) return <p className="p-6">Loading settings...</p>;

  return (
    <section className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-emerald-700 mb-4">
        Admin Settings
      </h2>

      {/* ===========================
          PROFILE SETTINGS
      ========================== */}
      <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
        <h4 className="font-semibold text-gray-700 mb-2">Edit Profile</h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({ ...profileData, username: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <input
            type="email"
            placeholder="Email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({ ...profileData, phone: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <input
            type="text"
            placeholder="Barangay"
            value={profileData.barangay}
            onChange={(e) =>
              setProfileData({ ...profileData, barangay: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <button
            onClick={saveProfile}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg w-full"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* ===========================
          PASSWORD SETTINGS
      ========================== */}
      <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
        <h4 className="font-semibold text-gray-700 mb-2">Change Password</h4>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Old Password"
            value={passwords.oldPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, oldPassword: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <input
            type="password"
            placeholder="New Password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          <button
            onClick={savePassword}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
          >
            Update Password
          </button>
        </div>
      </div>
    </section>
  );
}
