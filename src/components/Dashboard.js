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

  // Metrics
  const [activeFarmers, setActiveFarmers] = useState(0);
  const [serverSpeed, setServerSpeed] = useState(0);

  // =======================
  // 🟢 Oversupply Modal State
  // =======================
  const [oversupplyOpen, setOversupplyOpen] = useState(false);
  const [allCrops, setAllCrops] = useState([]);
  const [checkedCrops, setCheckedCrops] = useState([]);

  // Fetch crops for modal
  const loadCropsForOversupply = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/crops`);
      setAllCrops(res.data || []);

      const already = res.data.filter((c) => c.oversupply).map((c) => c.name);
      setCheckedCrops(already);
    } catch (err) {
      console.error("❌ Fetch crops failed", err);
    }
  };

  const toggleCrop = (cropName) => {
    setCheckedCrops((prev) =>
      prev.includes(cropName)
        ? prev.filter((c) => c !== cropName)
        : [...prev, cropName]
    );
  };

  const saveOversupply = async () => {
    try {
      await axios.put(`${baseUrl}/api/crops/oversupply`, {
        crops: checkedCrops,
      });

      alert("✔ Oversupply list updated!");
      setOversupplyOpen(false);
    } catch (err) {
      console.error("❌ Save failed", err);
      alert("Failed to update oversupply.");
    }
  };

  // =======================
  // Dashboard Data
  // =======================
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
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

      // Active Farmers
      const metricsRes = await axios.get(`${baseUrl}/metrics`);
      setActiveFarmers(metricsRes.data.activeFarmers || 0);

      // Alerts
      const alertRes = await axios
        .get(`${baseUrl}/api/alerts`)
        .catch(() => ({ data: [] }));

      const allAlerts = alertRes.data || [];
      setAlerts(allAlerts);
      setAlertCount(
        allAlerts.filter((a) => a.severity === "Critical").length
      );

      // Crop Count
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

      // Weather Sync
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

  const fetchActiveFarmersOnly = async () => {
    try {
      const res = await axios.get(`${baseUrl}/metrics`);
      setActiveFarmers(res.data.activeFarmers || 0);
    } catch {
      console.error("❌ Active user refresh failed");
    }
  };

  useEffect(() => {
    fetchDashboardData();
    setTimeout(function loop() {
      fetchActiveFarmersOnly();
      return setTimeout(loop, 10000);
    }, 10000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  // =======================
  // UI STARTS
  // =======================
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          System Overview
        </h1>

        <div className="flex gap-3">
          {/* 🔵 Edit Oversupply Button */}
          <button
            onClick={() => {
              loadCropsForOversupply();
              setOversupplyOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Edit Oversupply
          </button>

          {/* REFRESH */}
          <button
            onClick={fetchDashboardData}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        
        {/* CARD 1 */}
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
            Active Farmers: {activeFarmers}
          </p>
        </div>

        {/* CARD 2 */}
        <div className="bg-gray-100 rounded-xl p-5">
          <AlertTriangle className="text-yellow-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Critical Alerts</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            {alertCount} Active Alerts
          </h2>
        </div>

        {/* CARD 3 */}
        <div className="bg-gray-100 rounded-xl p-5">
          <Cloud className="text-blue-500 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Weather Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Last Sync: <span className="font-medium">{weatherSync}</span>
          </h2>
        </div>

        {/* CARD 4 */}
        <div className="bg-gray-100 rounded-xl p-5">
          <FileSpreadsheet className="text-green-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Crop Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Records: {cropCount.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ALERT TABLE */}
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

      {/* =======================
      MODAL: Oversupply Editor
      ======================= */}
      {oversupplyOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[480px] max-h-[500px] p-6 rounded-xl shadow-lg overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">
              Edit Oversupply Crops
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              Check crops that are currently oversupply.
            </p>

            <div className="space-y-2">
              {allCrops.map((crop) => (
                <label
                  key={crop._id}
                  className="flex items-center gap-3 border p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={checkedCrops.includes(crop.name)}
                    onChange={() => toggleCrop(crop.name)}
                  />
                  <span className="font-medium">{crop.name}</span>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setOversupplyOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveOversupply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
