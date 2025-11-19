import React, { useEffect, useState, useRef } from "react";
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
  const [cropYields, setCropYields] = useState([]);
  const [cropFrequency, setCropFrequency] = useState([]);
  const [yieldTrends, setYieldTrends] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [recommendation, setRecommendation] = useState("");

  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmRes = await axios.get(`${baseUrl}/farm`);
        const weatherRes = await axios.get(`${baseUrl}/weather`);

        const farms = farmRes.data.farms || [];
        const weather = weatherRes.data.data || [];

        /* ------------------------------------------------------------
            1) Crop Yield Summary
        ------------------------------------------------------------ */
        const cropMap = {};
        farms.forEach((farm) => {
          (farm.tasks || []).forEach((task) => {
            if (task.type?.toLowerCase().includes("harvest")) {
              cropMap[task.crop] = (cropMap[task.crop] || 0) + (task.kilos || 0);
            }
          });
        });

        const yieldData = Object.entries(cropMap).map(([crop, kilos]) => ({
          crop,
          kilos,
        }));
        setCropYields(yieldData);

        /* ------------------------------------------------------------
            2) Most Commonly Planted Crops
        ------------------------------------------------------------ */
        const cropCount = {};
        farms.forEach((farm) => {
          (farm.tasks || []).forEach((task) => {
            if (task.crop && task.type?.toLowerCase().includes("plant")) {
              const cropName = task.crop.trim() || "Unknown Crop";
              cropCount[cropName] = (cropCount[cropName] || 0) + 1;
            }
          });
        });

        setCropFrequency(
          Object.entries(cropCount).map(([name, value]) => ({
            name,
            value,
          }))
        );

        /* ------------------------------------------------------------
            3) Yield Trend by Month
        ------------------------------------------------------------ */
        const monthly = {};
        farms.forEach((farm) => {
          (farm.tasks || []).forEach((task) => {
            if (task.type?.toLowerCase().includes("harvest")) {
              const date = new Date(task.date);
              const key = date.toLocaleString("default", {
                month: "short",
                year: "numeric",
              });

              monthly[key] = (monthly[key] || 0) + (task.kilos || 0);
            }
          });
        });

        const yieldTrendList = Object.entries(monthly).map(([month, yieldKg]) => ({
          month,
          yieldKg,
        }));

        setYieldTrends(yieldTrendList);

        /* ------------------------------------------------------------
            4) Add Clean Dates to Weather Data  (FIXES undefined)
        ------------------------------------------------------------ */
        const weatherFixed = weather.map((w) => {
          const d = new Date(w.date || Date.now());
          return {
            ...w,
            date: d.toLocaleString("default", {
              month: "short",
              year: "numeric",
            }),
          };
        });

        setWeatherData(weatherFixed);

        /* ------------------------------------------------------------
            5) Recommendation
        ------------------------------------------------------------ */
        const avgRain =
          weatherFixed.reduce((a, b) => a + (b.rainfall || 0), 0) /
          (weatherFixed.length || 1);

        const avgYield =
          yieldData.reduce((a, b) => a + b.kilos, 0) /
          (yieldData.length || 1);

        if (avgRain > 100 && avgYield < 50)
          setRecommendation(
            "⚠️ High rainfall with low yield — consider better drainage or shorter-duration crops."
          );
        else if (avgYield > 200)
          setRecommendation("✅ Great performance — maintain your current crop schedule.");
        else
          setRecommendation("📈 Normal conditions — monitor upcoming weather.");
      } catch (err) {
        console.error("❌ Error generating reports:", err);
      }
    };

    fetchData();
  }, []);

  /* ------------------------------------------------------------
      Excel Export
  ------------------------------------------------------------ */
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropYields), "Crop Yields");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cropFrequency), "Common Crops");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yieldTrends), "Yield Trends");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(weatherData), "Weather Data");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `SmartCrop_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ------------------------------------------------------------
      Print Graphs Only
  ------------------------------------------------------------ */
  const handlePrintGraphs = () => {
    const win = window.open("", "", "width=1000,height=800");
    win.document.write(`
      <html><head><title>SmartCrop Graph Reports</title>
        <style> body { font-family: Arial; padding: 20px; } </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  /* ------------------------------------------------------------
      UI Rendering
  ------------------------------------------------------------ */
  return (
    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-700">
          📊 Analytical Reports
        </h2>
        <div className="flex gap-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={handlePrintGraphs}
          >
            🖨️ Print Graphs
          </button>
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
            onClick={handleExportExcel}
          >
            ⬇️ Export to Excel
          </button>
        </div>
      </div>

      <div ref={printRef}>
        {/* 1 — Crop Yield Summary */}
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

        {/* 2 — Common Crops */}
        <div className="chart-section mb-10">
          <h3 className="font-semibold text-gray-700 mb-2">1.4.2 Most Commonly Planted Crops</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cropFrequency}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {cropFrequency.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 3 — Yield Trend */}
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

        {/* 4 — Weather vs Yield (FIXED) */}
        {weatherData.length > 0 && (
          <div className="chart-section mb-10">
            <h3 className="font-semibold text-gray-700 mb-2">
              1.4.6 Weather (Rainfall) vs Yield Relationship
            </h3>
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
                  data={weatherData}
                  dataKey="rainfall"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  data={yieldTrends}
                  dataKey="yieldKg"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-white rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">
          1.4.7 Recommendations for Optimal Planting
        </h3>
        <p className="text-gray-600">{recommendation}</p>
      </div>
    </div>
  );
}
