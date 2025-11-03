import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [reports, setReports] = useState([]);
  const [yieldTrend, setYieldTrend] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ Fetch all farms and yields
      const farmRes = await axios.get(`${baseUrl}/farm`);
      const farms = farmRes.data.farms || [];

      const allReports = farms.flatMap((farm) =>
  (farm.tasks || []).map((task) => {
    // 🧠 safely parse date
    const parsedDate = new Date(task.date || task.createdAt || Date.now());
    return {
      _id: task._id,
      farmer:
  farm && farm.userId
    ? typeof farm.userId === "object"
      ? farm.userId.username || "Unknown"
      : "Unknown"
    : "Unknown",
     barangay:
  farm && farm.userId
    ? typeof farm.userId === "object"
      ? farm.userId.barangay || "—"
      : "—"
    : "—",
      title: task.type || "Task",
      crop: task.crop || "—",
      kilos: Number(task.kilos) || 0,
      date: parsedDate,
      completed: !!task.completed,
    };
  })
);


      setReports(allReports);

      // ✅ Completed harvests only
      const cropReports = allReports.filter(
        (r) =>
          r.title.toLowerCase().includes("harvest") &&
          r.kilos > 0 &&
          r.completed
      );
      setCrops(cropReports);

      // ✅ Calculate yield trend (current vs previous month)
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const thisYear = now.getFullYear();
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const thisMonthYield = cropReports
        .filter(
          (r) =>
            r.date.getMonth() === thisMonth && r.date.getFullYear() === thisYear
        )
        .reduce((sum, r) => sum + r.kilos, 0);

      const lastMonthYield = cropReports
        .filter(
          (r) =>
            r.date.getMonth() === lastMonth &&
            r.date.getFullYear() === lastMonthYear
        )
        .reduce((sum, r) => sum + r.kilos, 0);

      let trend = 0;
      if (lastMonthYield > 0) {
        trend = ((thisMonthYield - lastMonthYield) / lastMonthYield) * 100;
      }

      setYieldTrend(trend.toFixed(1));

      // ✅ Fetch weather records for avg rainfall
      const weatherRes = await axios.get(`${baseUrl}/weather`);
      const records = weatherRes.data.data || [];
      setWeather(records);
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
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading reports...
      </div>
    );
  }

  // ✅ Compute average rainfall
  const avgRainfall =
    weather.length > 0
      ? (
          weather.reduce((sum, w) => sum + (w.rainfall || 0), 0) / weather.length
        ).toFixed(1)
      : 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-emerald-700 mb-6">Reports</h2>

      {/* Tabs (Uniform with Data.js) */}
      <div className="flex space-x-4 mb-6 bg-emerald-50 rounded-full p-2 w-fit">
        {["overview", "crop", "weather"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === tab
                ? "bg-emerald-600 text-white shadow"
                : "bg-transparent text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* 🧭 Overview */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-600">Crop</h3>
              <p className="text-3xl font-bold text-emerald-700 mt-1">
                {crops.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Farmers reporting this month
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-600">Yield Trend</h3>
              <p
                className={`text-3xl font-bold mt-1 ${
                  yieldTrend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {yieldTrend}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {yieldTrend >= 0 ? "Increase" : "Decrease"} vs last month
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-600">Avg. Rainfall</h3>
              <p className="text-3xl font-bold text-emerald-700 mt-1">
                {avgRainfall} mm
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This reporting period
              </p>
            </div>
          </div>

          {/* Recent Reports */}
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Recent Reports
          </h3>
          <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Report</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Farmer</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{r.title}</td>
                    <td className="py-2">
                      {r.date.toLocaleDateString()}
                    </td>
                    <td className="py-2">{r.farmer}</td>
                    <td
                      className={`py-2 font-medium ${
                        r.completed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {r.completed ? "Completed" : "Pending"}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌾 Crop Tab */}
      {activeTab === "crop" && (
        <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Crop Yield Data
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 text-left">Farmer</th>
                  <th className="py-2 text-left">Crop</th>
                  <th className="py-2 text-left">Kilos (kg)</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{c.farmer}</td>
                    <td className="py-2">{c.crop}</td>
                    <td className="py-2">{c.kilos}</td>
                  </tr>
                ))}
                {crops.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-500">
                      No crop data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌦 Weather Tab */}
      {activeTab === "weather" && (
        <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Weather Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <h4 className="font-medium text-gray-600">Average Rainfall</h4>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {avgRainfall} mm
              </p>
              <p className="text-sm text-gray-500">This reporting period</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Temperature (°C)</th>
                  <th className="py-2 text-left">Rainfall (mm)</th>
                </tr>
              </thead>
              <tbody>
                {weather.map((w) => (
                  <tr key={w._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{w.temperature ?? "--"}</td>
                    <td className="py-2">{w.rainfall ?? "--"}</td>
                  </tr>
                ))}
                {weather.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-500">
                      No weather data available.
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
