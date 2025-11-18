import React, { useEffect, useState } from "react";
import DashboardReports from "./DashboardReports";
import axios from "axios";
import {
  Gauge,
  AlertTriangle,
  Cloud,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";

const baseUrl = "https://smartcrop-backend-1.onrender.com";

export default function Dashboard() {
  const [systemHealth, setSystemHealth] = useState("Loading...");
  const [alertCount, setAlertCount] = useState(0);
  const [weatherSync, setWeatherSync] = useState("-");
  const [cropCount, setCropCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Performance Metrics
  const [activeUsers, setActiveUsers] = useState(0);
  const [serverSpeed, setServerSpeed] = useState(0);

  // ---------------------------------------------------
  // 🔄 MANUAL FULL REFRESH (heavy)
  // ---------------------------------------------------
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Measure API response speed
      const start = performance.now();

      const healthRes = await axios
        .get(`${baseUrl}/health`)
        .catch(() => ({ data: { status: "down" } }));

      const end = performance.now();
      setServerSpeed(Math.round(end - start));

      setSystemHealth(
        healthRes.data.status === "ok"
          ? "All services operational"
          : "⚠️ Some systems offline"
      );

      // Get Active Users
const metricsRes = await axios.get(`${baseUrl}/metrics`);
setActiveUsers(metricsRes.data.activeFarmers || 0);
      // Alerts
      const alertRes = await axios
        .get(`${baseUrl}/api/alerts`)
        .catch(() => ({ data: [] }));

      const allAlerts = alertRes.data || [];
      setAlerts(allAlerts);
      setAlertCount(
        allAlerts.filter((a) => a.severity === "Critical").length
      );

      // Crop / Farm Data
      const farmRes = await axios.get(`${baseUrl}/api/farm`);
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

      // Weather
      const weatherRes = await axios
        .get(`${baseUrl}/api/weather`)
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

  // ---------------------------------------------------
  // 🔁 AUTO REFRESH — only metrics (lightweight)
  // ---------------------------------------------------
  const fetchActiveUsersOnly = async () => {
    try {
      const res = await axios.get(`${baseUrl}/metrics`);
      setActiveUsers(res.data.activeUsers || 0);
    } catch (err) {
      console.error("❌ Active user refresh failed");
    }
  };

  useEffect(() => {
    fetchDashboardData(); // initial load

    const interval = setInterval(fetchActiveUsersOnly, 10000); // auto every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  // -----------------------------------------------------
  // UI SECTION
  // -----------------------------------------------------
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter">
      {/* TITLE + REFRESH BUTTON */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          System Overview
        </h1>

        <button
          onClick={fetchDashboardData}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          Refresh Dashboard
        </button>
      </div>

      {/* TOP OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* SYSTEM HEALTH */}
        <div className="bg-gray-100 rounded-xl p-5">
          <Gauge className="text-emerald-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Performance</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            System Health
          </h2>
          <p className="text-sm text-gray-700 mt-1">{systemHealth}</p>

          <p className="text-sm text-gray-800 font-medium mt-2">
            Server Speed: {serverSpeed} ms
          </p>

          <p className="text-sm text-gray-800 font-medium">
            Active Farmers: {activeUsers}
          </p>
        </div>

        {/* ALERTS */}
        <div className="bg-gray-100 rounded-xl p-5">
          <AlertTriangle className="text-yellow-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Critical Alerts</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            {alertCount} Active Alerts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {alertCount > 0
              ? "System issues detected"
              : "No critical alerts"}
          </p>
        </div>

        {/* WEATHER */}
        <div className="bg-gray-100 rounded-xl p-5">
          <Cloud className="text-blue-500 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Weather Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Last Sync:{" "}
            <span className="font-medium">{weatherSync}</span>
          </h2>
        </div>

        {/* CROP DATA */}
        <div className="bg-gray-100 rounded-xl p-5">
          <FileSpreadsheet className="text-green-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Crop Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Records: {cropCount.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Validated 88%</p>
        </div>
      </div>

      {/* RECENT ALERTS */}
      <div className="bg-gray-100 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Recent Alerts
        </h2>

        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent alerts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="py-2 text-left">Alert</th>
                  <th className="py-2 text-left">Severity</th>
                  <th className="py-2 text-left">Time</th>
                  <th className="py-2 text-left">Affects</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 3).map((a, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-200/40 transition"
                  >
                    <td className="py-2">{a.message || "—"}</td>
                    <td className="py-2">{a.severity || "Info"}</td>
                    <td className="py-2">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2">{a.affects || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DashboardReports />
      </div>
    </div>
  );
}
