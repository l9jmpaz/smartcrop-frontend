import React, { useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${baseUrl}/api/auth/login`, {
        username,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      if (res.data.success) {
        // SAVE EVERYTHING NEEDED
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);          // ✅ IMPORTANT
        localStorage.setItem("adminUser", res.data.user.username);  // For UI
        localStorage.setItem("role", res.data.user.role || "admin"); // Optional

        onLogin();
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">

        <div className="flex flex-col items-center mb-6">
          <img
            src="/smart_crop_logo.png"
            alt="SmartCrop Logo"
            className="w-24 h-24 mb-3"
          />

          <h2 className="text-2xl font-bold text-emerald-700">
            SMART CROP PLANNING
          </h2>
          <p className="text-gray-500 text-sm mt-1">Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-emerald-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-emerald-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
