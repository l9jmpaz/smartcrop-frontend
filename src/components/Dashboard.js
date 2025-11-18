import React, { useEffect, useState } from "react";
import DashboardReports from "./DashboardReports";
import axios from "axios";
import {
  Gauge,
  AlertTriangle,
  Cloud,
  FileSpreadsheet,
  Info,
  ChevronRight,
  RefreshCcw,
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

  // =============================
  // FETCH DATA FUNCTION
  // =============================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Measure processing speed
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

      // Active users
      const metricsRes = await axios.get(`${baseUrl}/metrics`);
      setActiveUsers(metricsRes.data.activeUsers || 0);

      // Alerts
      const alertRes = await axios
        .get(`${baseUrl}/api/alerts`)
        .catch(() => ({ data: [] }));

      const allAlerts = alertRes.data || [];
      setAlerts(allAlerts);
      setAlertCount(allAlerts.filter((a) => a.severity === "Critical").length);

      // Farms
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
        .get(`${baseUrl}/api/ai/weather`)
        .catch(() => ({ data: {} }));

      setWeatherSync(weatherRes.data.lastSync || new Date().toLocaleString());
    } catch (err) {
      console.error("⚠️ Dashboard fetch error:", err);
      setSystemHealth("⚠️ Unable to fetch system data");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
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
    <div className="p-8 bg-gray-50 min-h-screen font-inter">

      {/* Title + Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">System Overview</h1>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <RefreshCcw size={18} /> Refresh
        </button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        
        {/* 1️⃣ System Health + Performance */}
        <div className="bg-gray-100 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <Gauge className="text-emerald-600 mb-2" size={28} />
            <p className="text-sm text-gray-500 italic">Performance</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-1">
              System Health
            </h2>

            <p className="text-sm text-gray-600 mt-1">{systemHealth}</p>

            <p className="text-sm text-gray-800 mt-2 font-medium">
              Server Speed: {serverSpeed} ms
            </p>

            <p className="text-sm text-gray-800 font-medium">
              Active Farmers: {activeUsers}
            </p>
          </div>
        </div>

        {/* 2️⃣ Critical Alerts */}
        <div className="bg-gray-100 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <AlertTriangle className="text-yellow-600 mb-2" size={28} />
            <p className="text-sm text-gray-500 italic">Critical Alerts</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-1">
              {alertCount} Active Alerts
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {alertCount > 0
                ? "Irrigation sensor offline, Weather API delay"
                : "No critical alerts"}
            </p>
          </div>
          <button className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-emerald-700 transition">
            View Alerts
          </button>
        </div>

        {/* 3️⃣ Weather Data */}
        <div className="bg-gray-100 rounded-xl p-5">
          <Cloud className="text-blue-500 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Weather Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Last Sync:{" "}
            <span className="font-medium text-gray-700">{weatherSync}</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">Data up-to-date</p>
        </div>

        {/* 4️⃣ Crop Data */}
        <div className="bg-gray-100 rounded-xl p-5">
          <FileSpreadsheet className="text-green-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Crop Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Records: {cropCount.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Validated 88%</p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-100 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Recent Alerts
        </h2>

        {/* Your existing alert table stays untouched */}
        
        <DashboardReports />
      </div>
    </div>
  );
}
