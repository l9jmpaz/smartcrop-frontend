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

  // PREFERENCES
  const [preferences, setPreferences] = useState({
    notifications: true,
    theme: "light",
    language: "English",
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

      setPreferences({
        notifications: u.preferences?.notifications ?? true,
        theme: u.preferences?.theme ?? "light",
        language: u.preferences?.language ?? "English",
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

  // Save Preferences
  const savePreferences = async () => {
    try {
      await axios.put(`${baseUrl}/users/${userId}/preferences`, preferences);
      alert("Preferences updated!");
    } catch {
      alert("Failed to update preferences.");
    }
  };

  if (loading) return <p className="p-6">Loading settings...</p>;

  return (
    <section className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-emerald-700 mb-4">
        Settings
      </h2>

      {/* ===========================
          GENERAL SETTINGS
       =========================== */}
      <div>
        <h3 className="text-lg font-semibold mb-2">General Settings</h3>

        {/* PROFILE */}
        <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
          <h4 className="font-semibold text-gray-700 mb-2">Profile</h4>
          <p className="text-sm text-gray-500 mb-3">Update your name, contact, and details.</p>

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
              placeholder="Phone"
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

        {/* PASSWORD */}
        <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
          <h4 className="font-semibold text-gray-700 mb-2">Password</h4>
          <p className="text-sm text-gray-500 mb-3">Change your account password.</p>

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
              Change Password
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
          <h4 className="font-semibold text-gray-700 mb-2">Notifications</h4>
          <p className="text-sm text-gray-500 mb-3">
            Manage notification preferences.
          </p>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) =>
                setPreferences({ ...preferences, notifications: e.target.checked })
              }
              className="scale-125"
            />
            Enable Notifications
          </label>

          <button
            onClick={savePreferences}
            className="bg-emerald-600 text-white px-4 py-2 mt-3 rounded-lg w-full"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* ===========================
          SYSTEM PREFERENCES
       =========================== */}
      <h3 className="text-lg font-semibold">System Preferences</h3>

      {/* THEME */}
      <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
        <h4 className="font-semibold text-gray-700 mb-2">Theme</h4>
        <p className="text-sm text-gray-500 mb-3">
          Switch between light and dark mode.
        </p>
        <select
          value={preferences.theme}
          onChange={(e) =>
            setPreferences({ ...preferences, theme: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>

      {/* LANGUAGE */}
      <div className="bg-[#e9f5f6] p-4 rounded-2xl mb-3">
        <h4 className="font-semibold text-gray-700 mb-2">Language</h4>
        <p className="text-sm text-gray-500 mb-3">
          Select your preferred language.
        </p>

        <select
          value={preferences.language}
          onChange={(e) =>
            setPreferences({ ...preferences, language: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2"
        >
          <option>English</option>
          <option>Filipino</option>
        </select>

        <button
          onClick={savePreferences}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg w-full mt-3"
        >
          Save Language
        </button>
      </div>
    </section>
  );
}
