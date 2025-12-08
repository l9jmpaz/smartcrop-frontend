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

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function DashboardReports() {
  // raw data
  const [farmsRaw, setFarmsRaw] = useState([]);
  const [weatherRaw, setWeatherRaw] = useState([]);

  // datasets used for charts (filtered)
  const [cropYields, setCropYields] = useState([]);
  const [cropFrequency, setCropFrequency] = useState([]);
  const [yieldTrends, setYieldTrends] = useState([]);

  const [recommendation, setRecommendation] = useState("");
  const printRef = useRef();

  // filters
  const monthNames = [
    "All",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
// --- MERGE weatherRaw + alignedYieldForWeather into one series keyed by date ---
const mergedSeries = useMemo(() => {
  const map = new Map();

  const toISODate = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    // canonicalize to ISO date (yyyy-mm-dd)
    return d.toISOString().slice(0, 10);
  };

  // 1) add weather records (use their date as key)
  (weatherRaw || []).forEach((w) => {
    const key = toISODate(w.date);
    if (!key) return;
    const existing = map.get(key) || { date: key, rainfall: 0, yieldKg: 0 };
    existing.rainfall = (existing.rainfall || 0) + (Number(w.rainfall) || 0);
    map.set(key, existing);
  });

  // 2) add aligned yields (use their date if present) OR use yieldTrends month->first-of-month fallback
  (alignedYieldForWeather || []).forEach((y) => {
    // alignedYieldForWeather entries you build earlier have date + yieldKg
    const key = toISODate(y.date);
    if (!key) return;
    const existing = map.get(key) || { date: key, rainfall: 0, yieldKg: 0 };
    existing.yieldKg = (existing.yieldKg || 0) + (Number(y.yieldKg) || 0);
    map.set(key, existing);
  });

  // 3) as a safety: if yieldTrends entries have month strings like "Nov 2025", parse them and put yield on first of month
  (yieldTrends || []).forEach((t) => {
    // if t has an explicit date field prefer that
    if (t.date) {
      const key = toISODate(t.date);
      if (!key) return;
      const existing = map.get(key) || { date: key, rainfall: 0, yieldKg: 0 };
      existing.yieldKg = (existing.yieldKg || 0) + (Number(t.yieldKg) || 0);
      map.set(key, existing);
      return;
    }
    // try parse t.month (e.g. "Nov 2025") into first of month
    const parsed = new Date(t.month);
    if (!isNaN(parsed.getTime())) {
      const key = parsed.toISOString().slice(0, 10).replace(/-\d\d$/, "-01"); // keep yyyy-mm-01
      const existing = map.get(key) || { date: key, rainfall: 0, yieldKg: 0 };
      existing.yieldKg = (existing.yieldKg || 0) + (Number(t.yieldKg) || 0);
      map.set(key, existing);
    }
  });

  // convert to array and sort chronologically
  const arr = Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  return arr;
}, [weatherRaw, alignedYieldForWeather, yieldTrends]);
  // compute available years from raw farms tasks (for year dropdown)
  const availableYears = useMemo(() => {
    const years = new Set();
    farmsRaw.forEach((f) => {
      (f.tasks || []).forEach((t) => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) years.add(String(d.getFullYear()));
      });
    });
    return ["All", ...Array.from(years).sort()];
  }, [farmsRaw]);

  // fetch raw data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [farmRes, weatherRes] = await Promise.all([
          axios.get(`${baseUrl}/farm`),
          axios.get(`${baseUrl}/weather`),
        ]);

        const farms = farmRes.data?.farms || [];
        const weather = weatherRes.data?.data || [];

        setFarmsRaw(farms);
        setWeatherRaw(weather);
      } catch (err) {
        console.error("Error fetching dashboard reports data:", err);
      }
    };
    fetchAll();
  }, []);

  // Helper: does the task date pass the selected filters?
  const taskMatchesFilter = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (selectedYear !== "All" && String(d.getFullYear()) !== String(selectedYear))
      return false;
    if (selectedMonth !== "All") {
      const idx = monthNames.indexOf(selectedMonth) - 1; // Jan->0
      if (idx < 0) return false;
      if (d.getMonth() !== idx) return false;
    }
    return true;
  };

  // compute derived datasets when raw data or filters change
  useEffect(() => {
    // 1) Crop Yield Summary (harvests)
    const cropMap = {};
    farmsRaw.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("harvest")) {
          // include only if the task matches the month/year filter
          if (!taskMatchesFilter(task.date)) return;
          const cropName = task.crop || "Unknown";
          cropMap[cropName] = (cropMap[cropName] || 0) + (task.kilos || 0);
        }
      });
    });
    const yieldData = Object.entries(cropMap).map(([crop, kilos]) => ({
      crop,
      kilos,
    }));
    setCropYields(yieldData);

    // 2) Crop Frequency (plant tasks)
    const cropCount = {};
    farmsRaw.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("plant")) {
          if (!taskMatchesFilter(task.date)) return;
          const name = (task.crop || "Unknown Crop").trim();
          cropCount[name] = (cropCount[name] || 0) + 1;
        }
      });
    });
    const freqData = Object.entries(cropCount).map(([name, value]) => ({
      name,
      value,
    }));
    setCropFrequency(freqData);

    // 3) Yield Trends grouped by month-year
    const monthly = {};
    farmsRaw.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (task.type?.toLowerCase().includes("harvest") && task.date) {
          if (!taskMatchesFilter(task.date)) return;
          const d = new Date(task.date);
          if (isNaN(d.getTime())) return;
          const key = d.toLocaleString("default", { month: "short", year: "numeric" });
          monthly[key] = (monthly[key] || 0) + (task.kilos || 0);
        }
      });
    });
    const trendData = Object.entries(monthly)
      .map(([month, yieldKg]) => ({ month, yieldKg }))
      // optional sort by real date so trend chart is chronological:
      .sort((a, b) => {
        const da = new Date(a.month);
        const db = new Date(b.month);
        return da - db;
      });
    setYieldTrends(trendData);

    // 4) Recommendation (based on raw weather + derived yields)
    const avgRain =
      (weatherRaw.reduce((acc, w) => acc + (w.rainfall || 0), 0) / (weatherRaw.length || 1)) ||
      0;
    const avgYield = (yieldData.reduce((a, b) => a + b.kilos, 0) / (yieldData.length || 1)) || 0;
    if (avgRain > 100 && avgYield < 50)
      setRecommendation(
        "⚠️ High rainfall with low yield — consider better drainage or shorter-duration crops."
      );
    else if (avgYield > 200) setRecommendation("✅ Great performance — maintain current crop schedule.");
    else setRecommendation("📈 Normal conditions — monitor upcoming weather trends.");
  }, [farmsRaw, weatherRaw, selectedMonth, selectedYear]); // recompute when filters change

  // aligned yield for weather chart: create an array matching yield trends
  const alignedYieldForWeather = useMemo(() => {
    // attempt to use month-year keys to align with weather dates if possible.
    // For simplicity, return an array where each element corresponds to a yieldTrend item
    // with a synthetic date or existing weather date if available by index.
    return yieldTrends.map((item, idx) => {
      // If weatherRaw has a date at same index, use it; otherwise synth date
      let dateStr = `2025-${String(idx + 1).padStart(2, "0")}-01`;
      if (weatherRaw[idx] && weatherRaw[idx].date) dateStr = weatherRaw[idx].date;
      return { date: dateStr, yieldKg: item.yieldKg || 0 };
    });
  }, [yieldTrends, weatherRaw]);

  // total yield for filtered data (used on weather chart)
  const totalYieldForFiltered = useMemo(() => {
    return yieldTrends.reduce((a, b) => a + (b.yieldKg || 0), 0);
  }, [yieldTrends]);
// total yield across ALL harvests (no filters)
  const totalYieldAll = useMemo(() => {
    let sum = 0;
    farmsRaw.forEach((farm) => {
      (farm.tasks || []).forEach((t) => {
        if (t.type?.toLowerCase().includes("harvest")) {
          sum += Number(t.kilos || 0);
        }
      });
    });
    return sum;
  }, [farmsRaw]);

  // percent of total harvested represented by the currently filtered yield
  const percentOfCropHarvested = useMemo(() => {
    if (!totalYieldAll || totalYieldAll === 0) return 0;
    return (totalYieldForFiltered / totalYieldAll) * 100;
  }, [totalYieldForFiltered, totalYieldAll]);
  // export current (filtered) datasets to excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropYields), "Crop Yields");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropFrequency), "Common Crops");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yieldTrends), "Yield Trends");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(weatherRaw), "Weather Data");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `SmartCrop_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // print graphs (same as original)
  const handlePrintGraphs = () => {
    const win = window.open("", "", "width=1000,height=800");
    win.document.write(<html><head><title>SmartCrop Graph Reports</title></head><body>${printRef.current?.innerHTML || ""}</body></html>);
    win.document.close();
    win.print();
    win.close();
  };

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  // predictive data (unchanged)
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
const WeatherTooltip = ({ active, payload, label, total }) => {
  if (!active || !payload || payload.length === 0) return null;

  const d = new Date(label);
  const prettyDate = isNaN(d) ? label : d.toLocaleDateString();

  const rainfall = payload.find(p => p.dataKey === "rainfall")?.value ?? 0;
  const yieldKg = payload.find(p => p.dataKey === "yieldKg")?.value ?? 0;

  // % of total yield for filtered data
  const pct = total > 0 ? (yieldKg / total) * 100 : 0;

  return (
    <div className="bg-white p-3 rounded shadow text-sm">
      <div className="font-semibold mb-1">{prettyDate}</div>

      <div>🌧️ Rainfall: <strong>{rainfall}</strong></div>

      <div className="mt-1">
        🌾 Yield: <strong>{yieldKg} kg</strong>
      </div>

      <div className="text-gray-600 text-xs mt-1">
        ({pct.toFixed(1)}% of total yield)
      </div>
    </div>
  );
};
  return (
    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700">📊 Analytical Reports</h2>
        <div className="flex gap-3 items-center">
          {/* Month & Year filters */}
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

        {/* Predictive */}
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

        {/* Weather vs Yield */}
       {mergedSeries.length > 0 && (
  <div className="chart-section mb-10">
    <h3 className="font-semibold text-gray-700 mb-2">
      1.4.6 Weather (Rainfall) vs Yield Relationship
    </h3>

    <div className="mb-2 text-sm text-gray-700">
      <strong>Yield in current filter:</strong> {totalYieldForFiltered.toLocaleString()} kg{" "}
      <span className="text-gray-600">
        ({percentOfCropHarvested.toFixed(1)}% of total harvested)
      </span>
    </div>

    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mergedSeries}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => {
            const dt = new Date(d);
            return isNaN(dt) ? d : dt.toLocaleDateString();
          }}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<WeatherTooltip total={totalYieldForFiltered} />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="rainfall"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="yieldKg"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}
      </div>
    </div>
  );
}
