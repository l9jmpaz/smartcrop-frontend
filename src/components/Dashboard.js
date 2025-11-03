import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Dashboard() {
  const [systemHealth, setSystemHealth] = useState("Loading...");
  const [alertCount, setAlertCount] = useState(0);
  const [weatherSync, setWeatherSync] = useState("-");
  const [cropCount, setCropCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ System health check
        const healthRes = await axios
          .get(`${baseUrl}/health`)
          .catch(() => ({ data: { status: "down" } }));
        setSystemHealth(
          healthRes.data.status === "ok"
            ? "All services operational"
            : "⚠️ Some systems offline"
        );

        // ✅ Get alerts (Critical only)
        const alertRes = await axios
          .get(`${baseUrl}/alerts`)
          .catch(() => ({ data: [] }));
        const allAlerts = alertRes.data || [];
        setAlerts(allAlerts);
        setAlertCount(allAlerts.filter((a) => a.severity === "Critical").length);

        // ✅ Get crop records (harvest tasks)
        const farmRes = await axios.get(`${baseUrl}/farm`);
        const farms = farmRes.data.farms || [];
        let totalHarvests = 0;

        farms.forEach((farm) => {
          const harvests = (farm.tasks || []).filter(
            (t) =>
              t.type?.toLowerCase().includes("harvest") &&
              (t.kilos || 0) > 0
          );
          totalHarvests += harvests.length;
        });
        setCropCount(totalHarvests);

        // ✅ Weather sync info
        const weatherRes = await axios
          .get(`${baseUrl}/ai/weather`)
          .catch(() => ({ data: {} }));
        setWeatherSync(
          weatherRes.data.lastSync || new Date().toLocaleString()
        );
      } catch (err) {
        console.error("⚠️ Dashboard fetch error:", err);
        setSystemHealth("⚠️ Unable to fetch system data");
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
      {/* Title */}
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">
        System Overview
      </h1>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* 1️⃣ System Health */}
        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-emerald-500">
          <h2 className="text-gray-600 font-semibold">Performance</h2>
          <p className="mt-2 text-gray-800 font-medium">{systemHealth}</p>
        </div>

        {/* 2️⃣ Alerts */}
        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-red-500">
          <h2 className="text-gray-600 font-semibold">Critical Alerts</h2>
          <p className="mt-2 text-red-600 text-lg font-bold">
            {alertCount} Active Alerts
          </p>
          <p className="text-xs text-gray-500">
            {alertCount > 0
              ? "Check irrigation and sensor status"
              : "No critical alerts"}
          </p>
          <button className="mt-3 bg-emerald-600 text-white px-4 py-1 rounded hover:bg-emerald-700 transition">
            View Alerts
          </button>
        </div>

        {/* 3️⃣ Weather Data */}
        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-blue-400">
          <h2 className="text-gray-600 font-semibold">Weather Data</h2>
          <p className="mt-2 text-gray-800 text-sm">
            Last Sync:{" "}
            <span className="font-medium">{weatherSync}</span>
          </p>
        </div>

        {/* 4️⃣ Crop Data */}
        <div className="bg-white shadow rounded-lg p-5 border-l-4 border-yellow-500">
          <h2 className="text-gray-600 font-semibold">Crop Data</h2>
          <p className="mt-2 text-yellow-600 text-lg font-bold">
            Records: {cropCount}
          </p>
          <p className="text-xs text-gray-500">
            Validated harvest entries
          </p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white p-5 shadow rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Recent Alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-gray-500">No recent alerts.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Alert</th>
                <th className="p-2 text-left">Severity</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Affects</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 5).map((a, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-2">{a.message || "No message"}</td>
                  <td
                    className={`p-2 ${
                      a.severity === "Critical"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {a.severity || "Info"}
                  </td>
                  <td className="p-2">
                    {a.timestamp
                      ? new Date(a.timestamp).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="p-2">{a.affects || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
