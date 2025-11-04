import React, { useEffect, useState } from "react";
import axios from "axios";
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

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function DashboardReports() {
  const [cropYields, setCropYields] = useState([]);
  const [cropFrequency, setCropFrequency] = useState([]);
  const [yieldTrends, setYieldTrends] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🌾 Fetch farms & weather data
        const farmRes = await axios.get(`${baseUrl}/farm`);
        const weatherRes = await axios.get(`${baseUrl}/weather`);
        const farms = farmRes.data.farms || [];
        const weather = weatherRes.data.data || [];

        // 1️⃣ Crop Yield Summary
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

        // 2️⃣ Commonly Planted Crops
        const cropCount = {};
        farms.forEach((farm) => {
          if (farm.lastYearCrop)
            cropCount[farm.lastYearCrop] =
              (cropCount[farm.lastYearCrop] || 0) + 1;
        });
        const freqData = Object.entries(cropCount).map(([name, value]) => ({
          name,
          value,
        }));
        setCropFrequency(freqData);

        // 3️⃣ Yield Trends by Month
        const monthly = {};
        farms.forEach((farm) =>
          (farm.tasks || []).forEach((task) => {
            if (task.type?.toLowerCase().includes("harvest")) {
              const m = new Date(task.date).toLocaleString("default", {
                month: "short",
                year: "numeric",
              });
              monthly[m] = (monthly[m] || 0) + (task.kilos || 0);
            }
          })
        );
        const trendData = Object.entries(monthly).map(([month, yieldKg]) => ({
          month,
          yieldKg,
        }));
        setYieldTrends(trendData);

        // 4️⃣ Weather vs Yield Correlation
        const avgRain =
          weather.reduce((a, b) => a + (b.rainfall || 0), 0) /
          (weather.length || 1);
        const avgYield =
          yieldData.reduce((a, b) => a + b.kilos, 0) /
          (yieldData.length || 1);

        setWeatherData(weather);

        // 5️⃣ Smart Recommendation Logic
        if (avgRain > 100 && avgYield < 50)
          setRecommendation(
            "⚠️ High rainfall with low yield — consider better drainage or shorter-duration crops."
          );
        else if (avgYield > 200)
          setRecommendation("✅ Great performance — maintain current crop schedule.");
        else
          setRecommendation("📈 Normal conditions — monitor upcoming weather trends.");

      } catch (err) {
        console.error("❌ Error generating reports:", err);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  return (
    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-emerald-700 mb-4">
        📊 Descriptive & Analytical Reports
      </h2>

      {/* 1️⃣ Crop Yield Summary */}
      <div className="mb-10">
        <h3 className="font-semibold text-gray-700 mb-2">
          1.4.1 Crop Yield Summary
        </h3>
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

      {/* 2️⃣ Commonly Planted Crops */}
      <div className="mb-10">
        <h3 className="font-semibold text-gray-700 mb-2">
          1.4.2 Most Commonly Planted Crops
        </h3>
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
              {cropFrequency.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 3️⃣ Yield Trends Over Time */}
      <div className="mb-10">
        <h3 className="font-semibold text-gray-700 mb-2">
          1.4.3 Yield Trend Over Seasons
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yieldTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="yieldKg"
              stroke="#059669"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4️⃣ Weather vs Yield Comparison */}
      {weatherData.length > 0 && (
        <div className="mb-10">
          <h3 className="font-semibold text-gray-700 mb-2">
            1.4.6 Weather (Rainfall) vs Yield Relationship
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                label={{ value: "Date", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis yAxisId="left" label={{ value: "Rainfall (mm)", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Yield (kg)", angle: 90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                data={weatherData}
                dataKey="rainfall"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Rainfall (mm)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                data={yieldTrends}
                dataKey="yieldKg"
                stroke="#10b981"
                strokeWidth={2}
                name="Yield (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 5️⃣ Recommendation Section */}
      <div className="p-4 bg-white rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">
          1.4.7 Recommendations for Optimal Planting
        </h3>
        <p className="text-gray-600">{recommendation}</p>
      </div>
    </div>
  );
}