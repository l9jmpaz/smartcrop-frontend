import React, { useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com"; // ✅ your live backend

export default function AdminLogin({ onLogin }) {
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

      if (res.data.success) {
        const user = res.data.user;

        // ✅ Allow only admin role
        if (user.role !== "admin") {
          setError("Access denied. Admins only.");
          setLoading(false);
          return;
        }

        // Save session
        localStorage.setItem("token", res.data.token || "");
        localStorage.setItem("adminUser", JSON.stringify(user));
        setLoading(false);

        if (onLogin) onLogin();
      } else {
        setError(res.data.message || "Invalid credentials.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-emerald-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="assets/images/smart_crop_logo.png"
            alt="Smart Crop Logo"
            className="w-20 h-20 mb-2"
          />
          <h1 className="text-2xl font-extrabold text-emerald-700">
            SMART CROP PLANNING
          </h1>
          <p className="text-gray-500 text-sm">Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}