import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Gauge,
  AlertTriangle,
  Cloud,
  FileSpreadsheet,
  Info,
  ChevronRight,
} from "lucide-react";

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
        const healthRes = await axios.get(`${baseUrl}/health`).catch(() => ({ data: { status: "down" } }));
        setSystemHealth(
          healthRes.data.status === "ok"
            ? "All services operational"
            : "⚠️ Some systems offline"
        );

        const alertRes = await axios.get(`${baseUrl}/alerts`).catch(() => ({ data: [] }));
        const allAlerts = alertRes.data || [];
        setAlerts(allAlerts);
        setAlertCount(allAlerts.filter((a) => a.severity === "Critical").length);

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

        const weatherRes = await axios.get(`${baseUrl}/ai/weather`).catch(() => ({ data: {} }));
        setWeatherSync(weatherRes.data.lastSync || new Date().toLocaleString());
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
    <div className="p-8 bg-gray-50 min-h-screen font-inter">
      {/* Title */}
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        System Overview
      </h1>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* 1️⃣ System Health */}
        <div className="bg-gray-100 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <Gauge className="text-emerald-600 mb-2" size={28} />
            <p className="text-sm text-gray-500 italic">Performance</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-1">
              System Health
            </h2>
            <p className="text-sm text-gray-600 mt-1">{systemHealth}</p>
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
            Last Sync: <span className="font-medium text-gray-700">{weatherSync}</span>
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

        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent alerts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="py-2 text-left font-medium">Alert</th>
                  <th className="py-2 text-left font-medium">Severity</th>
                  <th className="py-2 text-left font-medium">Time</th>
                  <th className="py-2 text-left font-medium">Affects</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 3).map((a, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-200/40 transition"
                  >
                    <td className="py-2 flex items-center gap-2">
                      {a.severity === "Critical" ? (
                        <AlertTriangle size={16} className="text-red-600" />
                      ) : a.severity === "Warning" ? (
                        <Info size={16} className="text-yellow-500" />
                      ) : (
                        <Info size={16} className="text-gray-500" />
                      )}
                      {a.message || "—"}
                    </td>
                    <td className="py-2">
                      <span
                        className={`${
                          a.severity === "Critical"
                            ? "text-red-600"
                            : a.severity === "Warning"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        } font-medium`}
                      >
                        {a.severity || "Info"}
                      </span>
                    </td>
                    <td className="py-2">
                      {a.timestamp
                        ? new Date(a.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-2">{a.affects || "—"}</td>
                    <td className="py-2 text-right">
                      <ChevronRight size={16} className="text-gray-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}