// frontend/pages/Settings.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

const barangays = [
  "Altura Bata","Altura Matanda","Altura South","Ambulong","Bagbag","Bagumbayan",
  "Balele","Banadero","Banjo East","Banjo West (Banjo Laurel)","Bilog-bilog","Boot",
  "Cale","Darasa","Gonzales","Hidalgo","Janopol","Janopol Oriental","Laurel","Luyos",
  "Mabini","Malaking Pulo","Maria Paz","Maugat","Montaña (Ik-ik)","Natatas","Pagaspas",
  "Pantay Bata","Pantay Matanda","Poblacion 1","Poblacion 2","Poblacion 3","Poblacion 4",
  "Poblacion 5","Poblacion 6","Poblacion 7","Sala","Sambat","San Jose","Santol","Santor",
  "Sulpoc","Suplang","Talaga","Tinurik","Trapiche","Ulango","Wawa"
].sort();

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

      // Clean phone: remove +63, or 63, or 0 at start
      let cleanedPhone = u.phone || "";
      cleanedPhone = cleanedPhone.replace(/^(\+63|63|0)/, "");

      setProfileData({
        username: u.username || "",
        email: u.email || "",
        phone: u.phone && u.phone.startsWith("+63") ? u.phone.slice(3) : u.phone,
        barangay: u.barangay || "",
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
  // SAVE PROFILE
  // ========================================================
  const saveProfile = async () => {
    if (!profileData.username || !profileData.email || !profileData.phone || !profileData.barangay) {
      alert("All fields are required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(profileData.phone)) {
      alert("Phone must be exactly 10 digits (e.g., 9123456789).");
      return;
    }

    try {
      await axios.put(
  `${baseUrl}/users/${userId}`,
  {
    username: profileData.username,
    email: profileData.email,
    phone: `+63${profileData.phone}`,
    barangay: profileData.barangay,
  },
  {
    headers: { "Content-Type": "application/json" }
  }
);

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
      alert("Both password fields are required.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/users/${userId}/password`,
        passwords
      );

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
      <h2 className="text-2xl font-bold text-emerald-700">Admin Settings</h2>

      {/* PROFILE */}
      <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow space-y-4">
        <h3 className="text-lg font-semibold">Edit Profile</h3>

        {/* USERNAME */}
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={profileData.username}
          onChange={(e) =>
            setProfileData({ ...profileData, username: e.target.value })
          }
          placeholder="Full Name"
        />

        {/* EMAIL */}
        <input
          type="email"
          className="w-full border rounded-lg px-3 py-2"
          value={profileData.email}
          onChange={(e) =>
            setProfileData({ ...profileData, email: e.target.value })
          }
          placeholder="Email"
        />

        {/* PHONE */}
        <div className="flex items-center border rounded-lg px-3 py-2 gap-2">
          <span className="text-gray-600 font-medium">+63</span>
          <input
            type="text"
            inputMode="numeric"
            className="w-full outline-none"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                phone: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            placeholder="9123456789"
          />
        </div>

        {/* BARANGAY */}
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={profileData.barangay}
          onChange={(e) =>
            setProfileData({ ...profileData, barangay: e.target.value })
          }
        >
          <option value="">Select Barangay</option>
          {barangays.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <button
          onClick={saveProfile}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg"
        >
          Save Profile
        </button>
      </div>

      {/* PASSWORD */}
      <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow space-y-4">
        <h3 className="text-lg font-semibold">Change Password</h3>

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
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          Update Password
        </button>
      </div>
    </section>
  );
}
