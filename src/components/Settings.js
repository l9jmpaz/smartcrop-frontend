import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

// 48 Barangays — Clean & Sorted
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

  // Load User
  const loadUser = async () => {
    try {
      const res = await axios.get(`${baseUrl}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("USER LOADED:", res.data);

      const u = res.data.user || res.data.data || res.data;

      setProfileData({
        username: u.username || "",
        email: u.email || "",
        phone: u.phone?.replace("+63", "") || "",
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

  // Save Profile
  const saveProfile = async () => {
    if (!profileData.username || !profileData.email || !profileData.phone || !profileData.barangay) {
      alert("All fields are required.");
      return;
    }
    if (profileData.phone.length !== 10) {
      alert("Phone must be 10 digits.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/user/${userId}`,
        {
          username: profileData.username,
          email: profileData.email,
          phone: +63`${profileData.phone}`,
          barangay: profileData.barangay,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Profile updated successfully!");
      loadUser();
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  // Change Password
  const savePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert("Both password fields are required.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/user/${userId}/password`,
        passwords,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Password updated!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      alert("Incorrect old password.");
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading settings...</p>;

  return (
    <section className="p-6 max-w-lg mx-auto space-y-6">

      <h2 className="text-2xl font-bold text-emerald-700">Admin Settings</h2>

      {/* PROFILE */}
      <div className="bg-white border border-emerald-200 p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Edit Profile</h3>

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
          placeholder="Email Address"
          value={profileData.email}
          onChange={(e) =>
            setProfileData({ ...profileData, email: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2"
        />

        {/* PHONE +63 */}
        <div className="flex border rounded-lg px-3 py-2 gap-2 items-center">
          <span className="text-gray-600 text-sm font-medium">+63</span>
          <input
            type="number"
            placeholder="9123456789"
            maxLength={10}
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                phone: e.target.value.slice(0, 10),
              })
            }
            className="w-full outline-none"
          />
        </div>

        {/* BARANGAY DROPDOWN */}
        <select
          value={profileData.barangay}
          onChange={(e) =>
            setProfileData({ ...profileData, barangay: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Select Barangay</option>
          {barangays.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        <button
          onClick={saveProfile}
          className="bg-emerald-600 w-full text-white py-2 rounded-lg hover:bg-emerald-700"
        >
          Save Profile
        </button>
      </div>

      {/* PASSWORD */}
      <div className="bg-white border border-emerald-200 p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Change Password</h3>

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
          className="bg-blue-600 w-full text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Update Password
        </button>
      </div>
    </section>
  );
}
