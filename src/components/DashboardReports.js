import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const baseUrl = "[https://smartcrop-backend-1.onrender.com/api](https://smartcrop-backend-1.onrender.com/api)";

export default function DashboardReports() {
  // raw source data
  const [farms, setFarms] = useState([]); // <-- raw farms (used to recompute filtered data)
  const [weatherData, setWeatherData] = useState([]);

  // UI/derived datasets (for export/display)
  const [cropYields, setCropYields] = useState([]);
  const [cropFrequency, setCropFrequency] = useState([]);
  const [yieldTrends, setYieldTrends] = useState([]);

  const [recommendation, setRecommendation] = useState("");
  const printRef = useRef();

  // Filter controls
  const [selectedMonth, setSelectedMonth] = useState("All"); // "All" or "Jan", "Feb" ...
  const [selectedYear, setSelectedYear] = useState("All"); // "All" or "2025", etc.

  // helper to get unique years from tasks across farms
  const availableYears = useMemo(() => {
    const years = new Set();
    farms.forEach((f) => {
      (f.tasks || []).forEach((t) => {
        if (t.date) {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) years.add(String(d.getFullYear()));
        }
      });
    });
    return ["All", ...Array.from(years).sort()];
  }, [farms]);

  const monthNames = [
    "All","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  // Fetch raw data once
  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmRes = await axios.get(`${baseUrl}/farm`);
        const weatherRes = await axios.get(`${baseUrl}/weather`);
        const fetchedFarms = farmRes.data.farms || [];
        const weather = weatherRes.data.data || [];

        setFarms(fetchedFarms);
        setWeatherData(weather);

        // recommendation uses aggregated numbers; compute with raw data
        // we'll compute recommendation below (after derived compute)
      } catch (err) {
        console.error("❌ Error generating reports:", err);
      }
    };
    fetchData();
  }, []);

  // Compute derived datasets when farms / weather / filters change
  useEffect(() => {
    // filtering function for tasks by selectedMonth & selectedYear
    const taskMatchesFilter = (taskDateStr) => {
      if (!taskDateStr) return false;
      const d = new Date(taskDateStr);
      if (isNaN(d.getTime())) return false;
      if (selectedYear !== "All" && String(d.getFullYear()) !== String(selectedYear)) return false;
      if (selectedMonth !== "All") {
        const targetMonthIndex = monthNames.indexOf(selectedMonth) - 1; // Jan->0
        // monthNames indexes: All(0), Jan(1)...
        if (targetMonthIndex < 0) return false;
        if (d.getMonth() !== targetMonthIndex) return false;
      }
      return true;
    };

    // 1) Crop Yield Summary (kilos per crop) using filtered tasks (harvest)
    const cropMap = {};
    farms.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("harvest")) {
          if (taskMatchesFilter(task.date)) {
            const cropName = task.crop || "Unknown";
            cropMap[cropName] = (cropMap[cropName] || 0) + (task.kilos || 0);
          }
        }
      });
    });
    const yieldData = Object.entries(cropMap).map(([crop, kilos]) => ({
      crop,
      kilos,
    }));
    setCropYields(yieldData);

    // 2) Crop Frequency (plant count) using filtered tasks (plant)
    const cropCount = {};
    farms.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("plant")) {
          if (taskMatchesFilter(task.date)) {
            const cropName = (task.crop || "Unknown Crop").trim();
            cropCount[cropName] = (cropCount[cropName] || 0) + 1;
          }
        }
      });
    });
    const freqData = Object.entries(cropCount).map(([name, value]) => ({
      name,
      value,
    }));
    setCropFrequency(freqData);

    // 3) Yield Trends — aggregate by month-year (filtered)
    const monthly = {};
    farms.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("harvest") && task.date) {
          if (!taskMatchesFilter(task.date)) return;
          const d = new Date(task.date);
          if (!isNaN(d.getTime())) {
            const key = d.toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
            monthly[key] = (monthly[key] || 0) + (task.kilos || 0);
          }
        }
      });
    });
    const trendData = Object.entries(monthly).map(([month, yieldKg]) => ({
      month,
      yieldKg,
    }));
    // sort by year-month ascending (optional)
    trendData.sort((a, b) => {
      const pa = new Date(a.month);
      const pb = new Date(b.month);
      return pa - pb;
    });
    setYieldTrends(trendData);

    // 4) Recommendation: recompute simply using filtered values
    const avgRain =
      (weatherData.reduce((a, b) => a + (b.rainfall || 0), 0) /
        (weatherData.length || 1)) || 0;
    const avgYield =
      (yieldData.reduce((a, b) => a + b.kilos, 0) / (yieldData.length || 1)) || 0;
    if (avgRain > 100 && avgYield < 50)
      setRecommendation(
        "⚠️ High rainfall with low yield — consider better drainage or shorter-duration crops."
      );
    else if (avgYield > 200)
      setRecommendation("✅ Great performance — maintain current crop schedule.");
    else setRecommendation("📈 Normal conditions — monitor upcoming weather trends.");
  }, [farms, weatherData, selectedMonth, selectedYear]);

  // For the weather vs yield chart we build alignedYieldForWeather from filtered yieldTrends:
  const alignedYieldForWeather = useMemo(() => {
    // Keep original approach: try to pair weather entries by index to yield trend entries.
    // But we will show a "Total of Yield" for current filtered dataset (sum of yieldTrends).
    // If you want a different alignment rule, change here.
    return yieldTrends.map((item, index) => ({
      // fallback date formatting kept similar as your original:
      date: `2025-${String(index + 1).padStart(2, "0")}-01`,
      yieldKg: item.yieldKg,
    }));
  }, [yieldTrends]);

  // Total of filtered yields (used on weather vs yield display)
  const totalYieldForFiltered = useMemo(() => {
    return yieldTrends.reduce((a, b) => a + (b.yieldKg || 0), 0);
  }, [yieldTrends]);

  // Export to Excel uses current (filtered) datasets
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropYields), "Crop Yields");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropFrequency), "Common Crops");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yieldTrends), "Yield Trends");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(weatherData), "Weather Data");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `SmartCrop_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Print Only Graphs
  const handlePrintGraphs = () => {
    const win = window.open("", "", "width=1000,height=800");
    win.document.write(`
      <html>
        <head><title>SmartCrop Graph Reports</title></head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  // Predictive analytics (unchanged)
  const predictiveData = (() => {
    if (yieldTrends.length < 3) return [];
    const last3 = yieldTrends.slice(-3).map((x) => x.yieldKg);
    const avg = Math.round(last3.reduce((a, b) => a + b, 0) / 3);
    return [
      { month: "Next 1 Month", predicted: avg },
      { month: "Next 2 Months", predicted: Math.round(avg * 1.05) },
      { month: "Next 3 Months", predicted: Math.round(avg * 1.1) },
    ];
  })();

  return (
    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700">📊 Analytical Reports</h2>
        <div className="flex gap-3 items-center">
          {/* NEW: Month/Year filters (small, unobtrusive) */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            title="Filter by Month"
          >
            {monthNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            title="Filter by Year"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button onClick={handlePrintGraphs} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            🖨️ Print Graphs
          </button>
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">
            ⬇️ Export to Excel
          </button>
        </div>
      </div>

      {/* Charts */}
      <div ref={printRef}>
        {/* 1.4.1 Crop Yield */}
        <div className="chart-section mb-10">
          <h3 className="font-semibold text-gray-700 mb-2">1.4.1 Crop Yield Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cropYields}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="crop" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="kilos" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 1.4.2 Common Crops */}
        <div className="chart-section mb-10">
          <h3 className="font-semibold text-gray-700 mb-2">1.4.2 Most Commonly Planted Crops</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={cropFrequency} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {cropFrequency.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 1.4.3 Yield Trends */}
        <div className="chart-section mb-10">
          <h3 className="font-semibold text-gray-700 mb-2">1.4.3 Yield Trend Over Seasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yieldTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="yieldKg" stroke="#059669" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🔮 1.4.5 Predictive Analytics (NEW BLOCK) */}
        {predictiveData.length > 0 && (
          <div className="chart-section mb-10">
            <h3 className="font-semibold text-gray-700 mb-2">1.4.5 Predictive Analytics on Expected Yields</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="predicted" stroke="#eab308" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 1.4.6 Weather vs Yield */}
        {weatherData.length > 0 && (
          <div className="chart-section mb-10">
            <h3 className="font-semibold text-gray-700 mb-2">1.4.6 Weather (Rainfall) vs Yield Relationship</h3>

            {/* NEW small summary showing total yield for currently filtered dataset */}
            <div className="mb-2 text-sm text-gray-700">
              <strong>Yield in current filter:</strong> {totalYieldForFiltered.toLocaleString()} kg
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  data={weatherData}
                  dataKey="rainfall"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  data={alignedYieldForWeather}
                  dataKey="yieldKg"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
