// admin-frontend/src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Dashboard() {
  const [userCount, setUserCount] = useState(0);
  const [fieldCount, setFieldCount] = useState(0);
  const [harvestCount, setHarvestCount] = useState(0);
  const [lastWeatherSync, setLastWeatherSync] = useState("-");
  const [systemHealth, setSystemHealth] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ Get users
        const userRes = await axios.get(`${baseUrl}/users`);
        const users = userRes.data.data || [];
        setUserCount(users.length);

        // ✅ Get all fields (farms)
        const farmRes = await axios.get(`${baseUrl}/farm`);
        const farms = farmRes.data.farms || [];
        setFieldCount(farms.length);

        // ✅ Count all completed harvest tasks
        let harvests = 0;
        farms.forEach((farm) => {
          const tasks = farm.tasks || [];
          harvests += tasks.filter(
            (t) =>
              t.type?.toLowerCase().includes("harvest") &&
              t.completed === true &&
              (t.kilos || 0) > 0
          ).length;
        });
        setHarvestCount(harvests);

        // ✅ Weather last sync (optional, fallback to current time)
        const weatherRes = await axios
          .get(`${baseUrl}/ai/weather`)
          .catch(() => ({ data: {} }));
        setLastWeatherSync(
          weatherRes.data.lastSync || new Date().toLocaleString()
        );

        setSystemHealth("✅ All systems operational");
      } catch (err) {
        console.error("⚠️ Dashboard fetch error:", err);
        setSystemHealth("⚠️ Some data unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">
        SmartCrop Admin Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-green-500">
          <h2 className="text-gray-600 font-semibold">System Health</h2>
          <p
            className={`mt-2 font-medium ${
              systemHealth.includes("⚠️")
                ? "text-red-500"
                : "text-green-600 font-semibold"
            }`}
          >
            {systemHealth}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-indigo-500">
          <h2 className="text-gray-600 font-semibold">Registered Users</h2>
          <p className="mt-2 text-indigo-600 text-xl font-bold">
            {userCount}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-yellow-500">
          <h2 className="text-gray-600 font-semibold">Total Fields</h2>
          <p className="mt-2 text-yellow-600 text-xl font-bold">
            {fieldCount}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-green-700">
          <h2 className="text-gray-600 font-semibold">Harvest Records</h2>
          <p className="mt-2 text-green-700 text-xl font-bold">
            {harvestCount}
          </p>
        </div>
      </div>

      {/* Weather Section */}
      <div className="bg-white p-5 shadow rounded-lg border-l-4 border-blue-400">
        <h2 className="text-gray-600 font-semibold mb-2">Weather Data</h2>
        <p className="text-sm text-gray-700">
          Last Sync: <span className="font-medium">{lastWeatherSync}</span>
        </p>
      </div>
    </div>
  );
}