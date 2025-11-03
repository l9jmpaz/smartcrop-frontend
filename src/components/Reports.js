import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch all reports data from real backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ 1. Fetch all farms with yields
      const farmRes = await axios.get(`${baseUrl}/farm`);
      const farms = farmRes.data.farms || [];

      // ✅ 2. Flatten crops and tasks for reports
      const allReports = farms.flatMap((farm) =>
        (farm.tasks || []).map((task) => ({
          _id: task._id,
          title: task.type,
          date: new Date(task.date).toLocaleDateString(),
          farm: farm.fieldName,
          status: task.completed ? "Completed" : "Pending",
          crop: task.crop,
          kilos: task.kilos || 0,
        }))
      );
      setReports(allReports);

      // ✅ 3. Extract crop reports only
      const cropReports = allReports.filter(
        (r) => r.title.toLowerCase().includes("harvest") && r.kilos > 0
      );
      setCrops(cropReports);

      // ✅ 4. Fetch weather data from AI endpoint
      const weatherRes = await axios.get(`${baseUrl}/ai/weather`);
      const weatherData = weatherRes.data?.data || [];
      setWeather(weatherData);

    } catch (err) {
      console.error("❌ Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-emerald-700">Reports Dashboard</h2>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {["overview", "crop", "weather"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab
                ? "bg-emerald-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === "overview" && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow p-4 rounded border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-600">Total Tasks</h3>
              <p className="text-xl font-bold text-green-600">{reports.length}</p>
            </div>

            <div className="bg-white shadow p-4 rounded border-l-4 border-yellow-500">
              <h3 className="font-semibold text-gray-600">Completed Harvests</h3>
              <p className="text-xl font-bold text-yellow-600">{crops.length}</p>
            </div>

            <div className="bg-white shadow p-4 rounded border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-600">Weather Reports</h3>
              <p className="text-xl font-bold text-blue-600">
                {weather.length || 0}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <h3 className="font-semibold mb-2 text-gray-700">Recent Farm Tasks</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Task</th>
                  <th className="border px-3 py-2 text-left">Crop</th>
                  <th className="border px-3 py-2 text-left">Farm</th>
                  <th className="border px-3 py-2 text-left">Date</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 8).map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{r.title}</td>
                    <td className="border px-3 py-2">{r.crop || "—"}</td>
                    <td className="border px-3 py-2">{r.farm}</td>
                    <td className="border px-3 py-2">{r.date}</td>
                    <td
                      className={`border px-3 py-2 ${
                        r.status === "Completed"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {r.status}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-4 text-gray-500"
                    >
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "crop" && (
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Crop Yield Reports</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Farm</th>
                  <th className="border px-3 py-2 text-left">Crop</th>
                  <th className="border px-3 py-2 text-left">Kilos</th>
                  <th className="border px-3 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{c.farm}</td>
                    <td className="border px-3 py-2">{c.crop}</td>
                    <td className="border px-3 py-2">{c.kilos}</td>
                    <td className="border px-3 py-2">{c.date}</td>
                  </tr>
                ))}
                {crops.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      No crop reports available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "weather" && (
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Weather Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Date</th>
                  <th className="border px-3 py-2 text-left">Temperature (°C)</th>
                  <th className="border px-3 py-2 text-left">Condition</th>
                </tr>
              </thead>
              <tbody>
                {weather.map((w, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">
                      {w.date || new Date().toLocaleDateString()}
                    </td>
                    <td className="border px-3 py-2">{w.temp ?? "--"}</td>
                    <td className="border px-3 py-2">
                      {w.condition || "Stable Weather"}
                    </td>
                  </tr>
                ))}
                {weather.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-500">
                      No weather data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}