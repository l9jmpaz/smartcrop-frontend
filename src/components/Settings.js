import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Settings() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const barangays = [
    "Altura Bata", "Altura Matanda", "Altura South", "Ambulong", "Bagong Silang",
    "Balele", "Banjo East", "Banjo West", "Bilog-bilog", "Boot", "Cale",
    "Darasa", "Gonzales", "Hidalgo", "Janopol", "Janopol Oriental",
    "Laurel", "Luyos", "Mabini", "Malaking Pulo", "Maria Paz",
    "Pagaspas", "Pantay Bata", "Pantay Matanda", "Poblacion Barangay 1",
    "Poblacion Barangay 2", "Poblacion Barangay 3", "Poblacion Barangay 4",
    "Poblacion Barangay 5", "Poblacion Barangay 6", "Poblacion Barangay 7",
    "Poblacion Barangay 8", "Sala", "Sampaloc", "Sampalocan", "San Jose",
    "Santor", "Sapiran", "Sulpoc", "Talaga", "Tinurik", "Trapiche",
    "Ulango", "Wawa", "Santol", "Bungkalot"
  ];

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

  const loadUser = async () => {
    try {
      const res = await axios.get(`${baseUrl}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const u = res.data.data;
      setUser(u);

      setProfileData({
        username: u.username,
        email: u.email || "",
        phone: u.phone || "",
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

  // PHONE FORMAT VALIDATION: +63 + 10 digits
  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/\D/g, ""); // numbers only

    if (!cleaned.startsWith("63")) {
      cleaned = "63" + cleaned;
    }

    cleaned = cleaned.substring(0, 12); // limit +63 + 10 digits

    setProfileData({
      ...profileData,
      phone: "+" + cleaned,
    });
  };

  const saveProfile = async () => {
    try {
      await axios.put(`${baseUrl}/user/${userId}`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Profile updated!");
      loadUser();
    } catch (err) {
      alert("Failed to update profile.");
      console.error(err);
    }
  };

  const savePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert("Please fill both password fields.");
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/user/${userId}/password`,
        passwords,
        { headers: { Authorization: `Bearer ${token} `} }
      );

      alert("Password changed successfully!");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      alert("Incorrect old password or update failed.");
      console.error(err);
    }
  };

  if (loading) return <p className="p-6">Loading settings...</p>;

  return (
    <section className="p-6 space-y-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-emerald-700">
        Admin Settings
      </h2>

      {/* PROFILE */}
      <div className="bg-white p-4 rounded-xl shadow border border-emerald-100">
        <h4 className="font-semibold text-gray-700 mb-3">Edit Profile</h4>

        <div className="space-y-3 text-sm">

          <div>
            <label className="font-medium">Full Name</label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="font-medium">Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="font-medium">Phone Number</label>
            <input
              type="text"
              value={profileData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+63XXXXXXXXXX"
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="font-medium">Barangay</label>
            <select
              value={profileData.barangay}
              onChange={(e) =>
                setProfileData({ ...profileData, barangay: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-white"
            >
              <option value="">Select Barangay</option>
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={saveProfile}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg w-full hover:bg-emerald-700"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* PASSWORD */}
      <div className="bg-white p-4 rounded-xl shadow border border-emerald-100">
        <h4 className="font-semibold text-gray-700 mb-3">Change Password</h4>

        <div className="space-y-3 text-sm">
          <div>
            <label className="font-medium">Old Password</label>
            <input
              type="password"
              value={passwords.oldPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, oldPassword: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="font-medium">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <button
            onClick={savePassword}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
          >
            Update Password
          </button>
        </div>
      </div>
    </section>
  );
}
