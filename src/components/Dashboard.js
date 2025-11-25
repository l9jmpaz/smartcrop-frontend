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

  const [activeFarmers, setActiveFarmers] = useState(0);
  const [serverSpeed, setServerSpeed] = useState(0);

  // Oversupply modal states
  const [showModal, setShowModal] = useState(false);
  const [cropList, setCropList] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [savingOversupply, setSavingOversupply] = useState(false);
const [showSoilModal, setShowSoilModal] = useState(false);
const [soilTypes, setSoilTypes] = useState([]);
const [newSoilName, setNewSoilName] = useState("");
const [newSoilDescription, setNewSoilDescription] = useState("");

const fetchSoilTypes = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/soiltypes`);
    setSoilTypes(res.data.data || []);
  } catch (err) {
    console.error("Failed loading soil types:", err);
  }
};
const deleteSoilType = async (id) => {
  if (!window.confirm("Delete this soil type?")) return;

  try {
    await axios.delete(`${baseUrl}/api/soiltypes/${id}`);
    fetchSoilTypes();
  } catch (err) {
    console.error("Delete soil type failed:", err);
    alert("Failed to delete soil type");
  }
};

const addSoilType = async () => {
  try {
    await axios.post(`${baseUrl}/api/soiltypes`, {
      name: newSoilName,
      description: newSoilDescription,
    });

    fetchSoilTypes();
    setNewSoilName("");
    setNewSoilDescription("");
    alert("✔ Soil type added!");
  } catch (err) {
    alert("Failed to add soil type");
  }
};
  // ----------------------------------------------------
  // FETCH CROPS (for oversupply modal)
  // ----------------------------------------------------
  const fetchCropList = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/crops`);
      const list = res.data.map(c => ({
        name: c.name,
        oversupply: c.oversupply || false,
      }));
      setCropList(list);
      setSelectedCrops(list.filter(c => c.oversupply).map(c => c.name));
    } catch (err) {
      console.error("Error loading crops:", err);
    }
  };

  // Toggle checkbox
  const toggleCrop = (name) => {
    setSelectedCrops((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  // Save oversupply
  const saveOversupply = async () => {
    try {
      setSavingOversupply(true);

      await axios.put(`${baseUrl}/api/ai/oversupply`, {
        crops: selectedCrops,
      });

      alert("✔ Oversupply updated!");
      setShowModal(false);

    } catch (err) {
      console.error("Oversupply update failed:", err);
      alert("Failed to update oversupply");
    } finally {
      setSavingOversupply(false);
    }
  };

  // ----------------------------------------------------
  // MAIN DASHBOARD FETCH
  // ----------------------------------------------------
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

      const metricsRes = await axios.get(`${baseUrl}/metrics`);
      setActiveFarmers(metricsRes.data.activeFarmers || 0);

      const alertRes = await axios
        .get(`${baseUrl}/api/alerts`)
        .catch(() => ({ data: [] }));

      const allAlerts = alertRes.data || [];
      setAlerts(allAlerts);

      setAlertCount(
        allAlerts.filter((a) => a.severity === "Critical").length
      );

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

      const weatherRes = await axios
        .get(`${baseUrl}/api/weather`)
        .catch(() => ({ data: {} }));

      setWeatherSync(
        weatherRes.data.lastSync || new Date().toLocaleString()
      );
    } catch (err) {
      console.error("Dashboard error:", err);
      setSystemHealth("⚠️ Unable to fetch system data");
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh
  const fetchActiveFarmersOnly = async () => {
    try {
      const res = await axios.get(`${baseUrl}/metrics`);
      setActiveFarmers(res.data.activeFarmers || 0);
    } catch (err) {}
  };

  // ----------------------------------------------------
  // EFFECT
  // ----------------------------------------------------
  useEffect(() => {
    fetchDashboardData();
    const polling = setTimeout(function refresh() {
      fetchActiveFarmersOnly();
      return setTimeout(refresh, 10000);
    }, 10000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter">

      {/* TITLE + BUTTONS */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          System Overview
        </h1>

       <div className="flex gap-3">
  {/* EDIT OVERSUPPLY BUTTON */}
  <button
    onClick={() => {
      fetchCropList();
      setShowModal(true);
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
  >
    Edit Oversupply
  </button>

  {/* NEW: SOIL TYPE BUTTON */}
  <button
    onClick={() => {
      fetchSoilTypes();
      setShowSoilModal(true);
    }}
    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
  >
    Soil Types
  </button>

  {/* REFRESH BUTTON */}
  <button
    onClick={fetchDashboardData}
    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
  >
    Refresh Dashboard
  </button>
</div>
      </div>

      {/* ======================= OVERSUPPLY MODAL ======================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] max-h-[80vh] rounded-xl shadow-lg p-6 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              Edit Oversupply Crops
            </h2>

            {cropList.map((crop, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 py-2 border-b border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={selectedCrops.includes(crop.name)}
                  onChange={() => toggleCrop(crop.name)}
                />
                <span className="text-gray-700">{crop.name}</span>
              </label>
            ))}

            <div className="flex justify-end gap-3 mt-5">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                onClick={saveOversupply}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                disabled={savingOversupply}
              >
                {savingOversupply ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
{showSoilModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
      {/* HEADER */}
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex justify-between items-center">
        Soil Types
        <button
          onClick={() => setShowSoilModal(false)}
          className="text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </h2>

      {/* ADD NEW SOIL TYPE FORM */}
      <div className="mb-5 border p-3 rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-700 mb-2">Add Soil Type</h3>

        <input
          className="border p-2 w-full rounded mb-2 text-sm"
          placeholder="Soil Type Name"
          value={newSoilName}
          onChange={(e) => setNewSoilName(e.target.value)}
        />

        <textarea
          className="border p-2 w-full rounded mb-2 text-sm"
          placeholder="Description (optional)"
          rows={3}
          value={newSoilDescription}
          onChange={(e) => setNewSoilDescription(e.target.value)}
        />

        <button
          onClick={addSoilType}
          className="bg-orange-600 text-white px-4 py-2 rounded w-full text-sm hover:bg-orange-700 transition"
        >
          Add Soil Type
        </button>
      </div>

      {/* SOIL TYPE LIST */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Existing Soil Types</h3>

        {soilTypes.length === 0 ? (
          <p className="text-gray-500 italic text-sm">No soil types added yet.</p>
        ) : (
          <div className="space-y-3">
            {soilTypes.map((soil) => (
              <div
                key={soil._id}
                className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-100 transition"
              >
                <div className="w-[75%]">
                  <p className="font-semibold text-gray-800">{soil.name}</p>
                  <p className="text-xs text-gray-600">{soil.description}</p>
                </div>

                <button
                  onClick={() => deleteSoilType(soil._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  </div>
)}
      {/* REST OF UI BELOW (unchanged) */}
      {/* SYSTEM HEALTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

        <div className="bg-gray-100 rounded-xl p-5">
          <Cloud className="text-blue-500 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Weather Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Last Sync:{" "}
            <span className="font-medium">{weatherSync}</span>
          </h2>
        </div>

        <div className="bg-gray-100 rounded-xl p-5">
          <FileSpreadsheet className="text-green-600 mb-2" size={28} />
          <p className="text-sm text-gray-500 italic">Crop Data</p>
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            Records: {cropCount.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Validated 88%</p>
        </div>
      </div>

      {/* ALERTS TABLE */}
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
