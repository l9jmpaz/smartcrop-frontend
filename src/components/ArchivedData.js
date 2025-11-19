import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { FileSpreadsheet, BarChart3, PieChart as PieIcon, Table } from "lucide-react";

export default function ArchivedData() {
  const [activeTab, setActiveTab] = useState("2023");

  // --------------------------
  // 📌 EXCEL DATA (You may replace these with parsed XLSX data later)
  // --------------------------
  const tanauan2023 = [
    { crop: "Rice", yield: 1200, farmers: 430 },
    { crop: "Corn", yield: 850, farmers: 310 },
    { crop: "Tomato", yield: 540, farmers: 190 },
    { crop: "Onion", yield: 330, farmers: 140 },
  ];

  const cropDamage = [
    { crop: "Rice", damaged: 320, cause: "Flood" },
    { crop: "Corn", damaged: 120, cause: "Pest" },
    { crop: "Banana", damaged: 90, cause: "Strong Winds" },
  ];

  const decemberReport = [
    { crop: "Rice", price: 42, supply: 1200 },
    { crop: "Corn", price: 28, supply: 900 },
    { crop: "Tomato", price: 68, supply: 400 },
  ];

  // Colors for Pie chart
  const COLORS = ["#2ecc71", "#3498db", "#f1c40f", "#e74c3c", "#9b59b6"];

  // --------------------------
  // 📌 RENDER TABLE
  // --------------------------
  const renderTable = (data) => (
    <div className="bg-white shadow rounded-lg p-4 mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            {Object.keys(data[0]).map((key, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold capitalize">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {Object.values(item).map((val, i2) => (
                <td key={i2} className="px-3 py-2">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // --------------------------
  // 📌 RENDER CHARTS PER TAB
  // --------------------------
  const renderCharts = () => {
    if (activeTab === "2023") {
      return (
        <>
          {/* Bar Chart */}
          <div className="w-full h-64 bg-white shadow rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-2">Total Yield per Crop</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tanauan2023}>
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="yield" fill="#2ecc71" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="w-full h-64 bg-white shadow rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-2">Farmers Distribution</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tanauan2023} dataKey="farmers" nameKey="crop" label>
                  {tanauan2023.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {renderTable(tanauan2023)}
        </>
      );
    }

    if (activeTab === "damage") {
      return (
        <>
          {/* Line Chart */}
          <div className="w-full h-64 bg-white shadow rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-2">Crop Damage (Affected Yields)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cropDamage}>
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="damaged" stroke="#e74c3c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {renderTable(cropDamage)}
        </>
      );
    }

    if (activeTab === "december") {
      return (
        <>
          {/* Bar Chart */}
          <div className="w-full h-64 bg-white shadow rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-2">Supply Levels</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decemberReport}>
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="supply" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {renderTable(decemberReport)}
        </>
      );
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileSpreadsheet size={26} /> Archived Agricultural Data
      </h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("2023")}
          className={`px-5 py-2 rounded-lg font-medium ${
            activeTab === "2023" ? "bg-green-600 text-white" : "bg-white shadow"
          }`}
        >
          Tanauan 2023 Data
        </button>

        <button
          onClick={() => setActiveTab("damage")}
          className={`px-5 py-2 rounded-lg font-medium ${
            activeTab === "damage" ? "bg-green-600 text-white" : "bg-white shadow"
          }`}
        >
          Crop Damage Report
        </button>

        <button
          onClick={() => setActiveTab("december")}
          className={`px-5 py-2 rounded-lg font-medium ${
            activeTab === "december" ? "bg-green-600 text-white" : "bg-white shadow"
          }`}
        >
          Records
        </button>
      </div>

      {/* Content */}
      {renderCharts()}
    </div>
  );
}

