import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [reports, setReports] = useState([]);
  const [yieldTrend, setYieldTrend] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ============================
      // FETCH ALL FARMS
      // ============================
      const farmRes = await axios.get(`${baseUrl}/farm`);
      const farms = farmRes.data.farms || [];

      // ============================
      // EXTRACT ALL TASK REPORTS
      // ============================
      const allReports = farms.flatMap((farm) => {
        if (!farm || !farm.tasks) return [];

        const farmerName =
          farm.userId && typeof farm.userId === "object"
            ? farm.userId.username || "Unknown"
            : "Unknown";

        return farm.tasks.map((task) => ({
          _id: task._id,
          farmer: farmerName,
          fieldName: farm.fieldName || "—",
          crop: farm.selectedCrop || "—",
          kilos: Number(task.kilos) || 0,
          date: new Date(task.date || farm.completedAt || Date.now()),
          completed: !!task.completed,
          isHarvest:
            task.type?.toLowerCase().includes("harvest") ||
            task.type?.toLowerCase().includes("harvesting"),
        }));
      });

      setReports(allReports);

      // ============================
      // FILTER ONLY COMPLETED HARVESTS (Crop Tab)
      // ============================
      const cropReports = allReports.filter(
        (r) => r.isHarvest && r.completed && r.kilos > 0
      );

      setCrops(cropReports);

      // ============================
      // FETCH GLOBAL YIELD TREND
      // ============================
      const yieldRes = await axios.get(`${baseUrl}/farm/all/yields`);
      const yieldData = yieldRes.data.data || [];

      if (yieldData.length >= 2) {
          const last = yieldData[yieldData.length - 1].kilos;
          const prev = yieldData[yieldData.length - 2].kilos;

          const trend = prev > 0 ? ((last - prev) / prev) * 100 : 0;
          setYieldTrend(trend.toFixed(1));
      } else {
          setYieldTrend(0);
      }

      // ============================
      // FETCH WEATHER
      // ============================
      const weatherRes = await axios.get(`${baseUrl}/weather`);
      setWeather(weatherRes.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReports = reports.filter((r) =>
    r.farmer.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCrops = crops.filter((c) =>
    c.farmer.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate Avg Rainfall
  const avgRainfall =
    weather.length > 0
      ? (
          weather.reduce((sum, w) => sum + (w.rainfall || 0), 0) /
          weather.length
        ).toFixed(1)
      : 0;

  // ================================
  // PRINT HANDLER
  // ================================
  const handlePrint = () => {
    const printContents = document.getElementById("print-area").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
      <div style="padding:20px; font-family:Arial">
        <h2 style="text-align:center; color:#047857;">SmartCrop Reports - ${activeTab.toUpperCase()}</h2>
        ${printContents}
      </div>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-700">Reports</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="border px-3 py-2 rounded-lg text-sm"
            placeholder="🔍 Search farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handlePrint}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            🖨 Print / Download
          </button>
        </div>
      </div>

      {/* TABS */}
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

      <div id="print-area">
        {/* ========================= OVERVIEW ========================= */}
        {activeTab === "overview" && (
          <div>
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-600">Completed Harvests</h3>
                <p className="text-3xl font-bold text-emerald-700 mt-1">
                  {filteredCrops.length}
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
              </div>

              <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-600">Avg. Rainfall</h3>
                <p className="text-3xl font-bold text-emerald-700 mt-1">
                  {avgRainfall} mm
                </p>
              </div>
            </div>

            {/* RECENT COMPLETED REPORTS */}
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Recent Completed Reports
            </h3>

            <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2">Date Completed</th>
                    <th className="py-2">Farmer</th>
                    <th className="py-2">Crop</th>
                    <th className="py-2">Kilos</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports
                    .filter((r) => r.isHarvest && r.completed && r.kilos > 0)
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 10)
                    .map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          {r.date.toLocaleDateString()}
                        </td>
                        <td className="py-2">{r.farmer}</td>
                        <td className="py-2">{r.crop}</td>
                        <td className="py-2">{r.kilos}</td>
                        <td className="py-2 text-green-600 font-medium">
                          Completed
                        </td>
                      </tr>
                    ))}

                  {filteredReports.filter(
                    (r) => r.isHarvest && r.completed && r.kilos > 0
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-4 text-gray-500"
                      >
                        No completed reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================= CROP TAB ========================= */}
        {activeTab === "crop" && (
          <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Crop Yield Data
            </h3>

            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 text-left">Farmer</th>
                  <th className="py-2 text-left">Crop</th>
                  <th className="py-2 text-left">Kilos (kg)</th>
                  <th className="py-2 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredCrops.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{c.farmer}</td>
                    <td className="py-2">{c.crop}</td>
                    <td className="py-2">{c.kilos}</td>
                    <td className="py-2">
                      {c.date.toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {filteredCrops.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-4 text-gray-500"
                    >
                      No crop data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================= WEATHER TAB ========================= */}
        {activeTab === "weather" && (
          <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Weather Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded-xl shadow">
                <h4 className="font-medium text-gray-600">
                  Average Rainfall
                </h4>
                <p className="text-3xl font-bold text-emerald-700 mt-2">
                  {avgRainfall} mm
                </p>
              </div>
            </div>

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
                  <tr
                    key={w._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{w.temperature ?? "--"}</td>
                    <td className="py-2">{w.rainfall ?? "--"}</td>
                  </tr>
                ))}

                {weather.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center py-4 text-gray-500"
                    >
                      No weather data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
