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

  // Load user
  const loadUser = async () => {
    try {
      const res = await axios.get(`${baseUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const u = res.data.data;

      setProfileData({
        username: u.username || "",
        email: u.email || "",
        phone: u.phone?.startsWith("+63")
  ? u.phone.substring(3).slice(0, 10)
  : u.phone.slice(0, 10),
        barangay: u.barangay || "",
      });
    } catch (err) {
      console.error("Load user failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  // Save profile
  const saveProfile = async () => {
    if (
      !profileData.username ||
      !profileData.email ||
      !profileData.phone ||
      !profileData.barangay
    ) {
      alert("All fields are required.");
      return;
    }

    if (profileData.phone.length !== 10) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/users/${userId}`,
        {
          username: profileData.username,
          email: profileData.email,
          phone: `+63${profileData.phone.trim()}`,
          barangay: profileData.barangay,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Profile updated!");
      loadUser();
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  };

  // Change password
  const savePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert("Both password fields are required.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/users/${userId}/password`,
        passwords,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Password updated!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      alert("Incorrect old password.");
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  return (
    <section className="p-6 max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-emerald-700">Admin Settings</h2>

      {/* PROFILE */}
      <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Edit Profile</h3>

        <input
          type="text"
          value={profileData.username}
          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
          placeholder="Full Name"
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          type="email"
          value={profileData.email}
          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          placeholder="Email"
          className="w-full border rounded-lg px-3 py-2"
        />

        <div className="flex border rounded-lg px-3 py-2 gap-2 items-center">
          <span className="text-gray-600 text-sm font-medium">+63</span>
         <input
  type="number"
  value={profileData.phone}
  onChange={(e) =>
    setProfileData({
      ...profileData,
      phone: e.target.value.replace(/\D/g, "").slice(0, 10)
    })
  }
/>
        </div>

        <select
          value={profileData.barangay}
          onChange={(e) => setProfileData({ ...profileData, barangay: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Select Barangay</option>
          {barangays.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <button
          onClick={saveProfile}
          className="bg-emerald-600 text-white w-full py-2 rounded-lg hover:bg-emerald-700"
        >
          Save Profile
        </button>
      </div>

      {/* PASSWORD */}
      <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Change Password</h3>

        <input
          type="password"
          placeholder="Old Password"
          value={passwords.oldPassword}
          onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          type="password"
          placeholder="New Password"
          value={passwords.newPassword}
          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />

        <button
          onClick={savePassword}
          className="bg-blue-600 text-white w-full py-2 rounded-lg hover:bg-blue-700"
        >
          Update Password
        </button>
      </div>
    </section>
  );
}
