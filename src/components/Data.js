import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Leaf,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import toast, { Toaster } from "react-hot-toast";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);
  const [yieldRecords, setYieldRecords] = useState([]);

  const [activeTab, setActiveTab] = useState("farmer");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCropViewModal, setShowCropViewModal] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmerFields, setSelectedFarmerFields] = useState([]);
const [allCrops, setAllCrops] = useState([]);
  const [selectedCropField, setSelectedCropField] = useState(null);
const [cropFilter, setCropFilter] = useState("all");
const [cropFilterList, setCropFilterList] = useState([]);

 const [newFarmer, setNewFarmer] = useState({
  username: "",
  email: "",
  barangay: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

  /* ============================================================
     EXPORT CSV (PURE JAVASCRIPT)
  ============================================================ */
  const exportCSV = (filename, rows) => {
    if (!rows || rows.length === 0) return;

    let csv = "";
    const headers = Object.keys(rows[0]).join(",");
    csv += headers + "\n";

    rows.forEach((row) => {
      csv += Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, "'")}"`)
        .join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };
const fetchAllCrops = async () => {
  try {
    const res = await axios.get(`${baseUrl}/crops`);
    if (res.data) {
      setAllCrops(res.data.map((c) => c.name)); // extract crop names
    }
  } catch (err) {
    toast.error("Failed to load crop list");
  }
};
  /* ============================================================
     FETCH FARMERS + FIELDS + YIELDS
  ============================================================ */
  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const usersRes = await axios.get(`${baseUrl}/users`);
      const users = usersRes.data?.data || [];

      const farmsWithUsers = await Promise.all(
        users.map(async (user) => {
          try {
            const farmRes = await axios.get(`${baseUrl}/farm/${user._id}`);
            return { ...user, farms: farmRes.data?.farms || [] };
          } catch {
            return { ...user, farms: [] };
          }
        })
      );

      setFarmers(farmsWithUsers);
      // ----- CALCULATE YIELD TREND -----
farmsWithUsers.forEach((farmer) => {
  const completed = farmer.farms.filter((f) => f.archived);

  const harvests = completed
    .map((f) => {
      const h = f.tasks?.find((t) =>
        t.type?.toLowerCase().includes("harvest")
      );
      return h?.kilos || null;
    })
    .filter((kg) => kg !== null);

  if (harvests.length < 1) {
    farmer.yieldTrend = 0;
    farmer.yieldTrendLabel = "0.0%";
    return;
  }

  const last = harvests[harvests.length - 1];
  const prev = harvests[harvests.length - 2];
  const diff = ((last - prev) / prev) * 100;

  farmer.yieldTrend = diff;
  farmer.yieldTrendLabel = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
});

// ----- BUILD CROP FILTER LIST -----
const cList = [];
farmsWithUsers.forEach((farmer) => {
  farmer.farms.forEach((f) => {
    if (f.archived && f.selectedCrop && f.completedAt) {
      const d = new Date(f.completedAt);
      const label = `${d.toLocaleString("default", {
        month: "long",
      })} ${d.getFullYear()} - ${f.selectedCrop}`;
      cList.push({
        value: `${f.selectedCrop}_${d.getMonth() + 1}_${d.getFullYear()}`,
        label,
      });
    }
  });
});
setCropFilterList(cList);

    } catch {
      toast.error("Failed to load farmers.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     FETCH WEATHER
  ============================================================ */
  const fetchWeatherRecords = async () => {
    try {
      const res = await axios.get(`${baseUrl}/weather`);
      if (res.data.success) setWeatherRecords(res.data.data);
    } catch {
      toast.error("Failed to load weather data");
    }
  };

  /* ============================================================
     FETCH YIELD RECORDS
  ============================================================ */
  const fetchYieldRecords = async () => {
  try {
    const res = await axios.get(`${baseUrl}/farm/all/yields`);
    if (res.data.success) setYieldRecords(res.data.data);
  } catch {
    toast.error("Failed to load yield data");
  }
};


  /* ============================================================
     DELETE FARMER
  ============================================================ */
  const deleteFarmer = async (id) => {
    if (!window.confirm("Delete this farmer?")) return;
    try {
      await axios.delete(`${baseUrl}/users/${id}`);
      setFarmers((prev) => prev.filter((f) => f._id !== id));
      toast.success("Farmer deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ============================================================
     EDIT FARMER
  ============================================================ */
  const editFarmer = async (id, farmer) => {
    const username = prompt("Enter new name:", farmer.username);
    const barangay = prompt("Enter new barangay:", farmer.barangay);

    if (!username || !barangay) return;

    try {
      const res = await axios.put(`${baseUrl}/users/${id}`, {
        username,
        barangay,
      });

      setFarmers((prev) =>
        prev.map((f) => (f._id === id ? { ...f, ...res.data.data } : f))
      );
      toast.success("Updated successfully.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  /* ============================================================
     ADD FARMER
  ============================================================ */
  const handleAddFarmer = async (e) => {
  e.preventDefault();

  if (newFarmer.password !== newFarmer.confirmPassword) {
    toast.error("Passwords do not match!");
    return;
  }

  try {
    const res = await axios.post(`${baseUrl}/users`, {
      username: newFarmer.username,
      phone: newFarmer.phone,
      email: newFarmer.email,
      barangay: newFarmer.barangay,
      password: newFarmer.password
    });

    setFarmers((prev) => [...prev, res.data.data]);
    toast.success("New farmer registered!");

    setShowAddModal(false);

    // RESET
    setNewFarmer({
      username: "",
      phone: "+63",
      email: "",
      barangay: "",
      password: "",
      confirmPassword: "",
    });

  } catch {
    toast.error("Failed to add farmer.");
  }
};

  /* ============================================================
     FARMER VIEW DETAILS
  ============================================================ */
  const openDetailsModal = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedFarmerFields(farmer.farms || []);
    setShowViewModal(true);
  };

  /* ============================================================
     CROPS VIEW DETAILS
  ============================================================ */
  const openCropDetails = (farm, farmer) => {
    setSelectedCropField({ ...farm, farmer });
    setShowCropViewModal(true);
  };

  /* ============================================================
     LOAD ON TAB CHANGE
  ============================================================ */
  useEffect(() => {
    fetchFarmers();
    fetchWeatherRecords();
    fetchYieldRecords();
    fetchAllCrops();
  }, [activeTab]);

  /* ============================================================
     FILTER FARMERS
  ============================================================ */
 const filteredFarmers = farmers.filter((f) => {
  // 🚫 1. REMOVE ADMINS
  if (String(f.role || "").toLowerCase() === "admin") return false;

  // 🔍 2. SEARCH FILTER
  const matchSearch = f.username
    ?.toLowerCase()
    .includes(search.toLowerCase());
  
  if (!matchSearch) return false;

  // 🌾 3. CROP FILTER (unchanged)
  if (cropFilter === "all") return true;

  return f.farms.some((field) => {
    if (!field.archived || !field.completedAt) return false;

    const d = new Date(field.completedAt);
    const key = `${field.selectedCrop}_${d.getMonth() + 1}_${d.getFullYear()}`;

    return key === cropFilter;
  });
});

  /* ============================================================
     UI START
  ============================================================ */
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter relative">
      <Toaster position="top-right" />

      {/* Tabs */}
      <div className="flex space-x-6 mb-6">
        {["farmer", "crops", "weather"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-medium capitalize ${
              activeTab === tab
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-600 hover:text-emerald-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ============================================================
    FARMERS TAB (UPDATED: YIELD TREND + CROP FILTER)
============================================================ */}
{activeTab === "farmer" && (
  <div className="bg-white rounded-xl p-6 shadow">

    {/* TITLE + ACTIONS */}
    <div className="flex justify-between mb-4">
      <h2 className="text-lg font-semibold">Farmers Data</h2>

      <div className="flex gap-3">

        {/* EXPORT */}
        <button
          onClick={() =>
            exportCSV(
              "farmers.csv",
              filteredFarmers.map((f) => ({
                Name: f.username,
                Phone: f.phone || "—",
                Email: f.email || "—",
                Barangay: f.barangay || "—",
                YieldTrend: f.yieldTrendLabel || "0.0%",
              }))
            )
          }
          className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md"
        >
          Export
        </button>

        {/* ADD */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md"
        >
          <UserPlus size={18} /> Add Farmer
        </button>

      </div>
    </div>

    {/* SEARCH + CROP FILTER */}
    <div className="flex gap-4 mb-4">

      {/* SEARCH */}
      <input
        placeholder="Search farmer..."
        className="border p-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

    </div>

    {/* FARMERS LIST */}
    {!loading ? (
      <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-emerald-100 sticky top-0">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Email</th>
              <th className="p-2">Yield Trend</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredFarmers.map((f) => (
              <tr key={f._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{f.username}</td>
                <td className="p-2">{f.phone || "—"}</td>
                <td className="p-2">{f.email || "—"}</td>

                {/* YIELD TREND */}
                <td className="p-2">
                  <span
                    className={`font-semibold ${
                      f.yieldTrend > 0
                        ? "text-green-600"
                        : f.yieldTrend < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {f.yieldTrendLabel}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="p-2 text-right space-x-3">
                  <button
                    onClick={() => openDetailsModal(f)}
                    className="text-green-700"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => editFarmer(f._id, f)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => deleteFarmer(f._id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    ) : (
      <p className="text-center py-4">Loading...</p>
    )}

  </div>
)}
      {/* ============================================================
          CROPS TAB — WITH STATUS + VIEW DETAILS + EXPORT
      ============================================================ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            {/* Crop Filter */}
<div className="mb-4">
  <select
    value={cropFilter}
    onChange={(e) => setCropFilter(e.target.value)}
    className="border p-2 rounded"
  >
    <option value="all">All Crops</option>
    {allCrops.map((crop, index) => (
      <option key={index} value={crop}>
        {crop}
      </option>
    ))}
  </select>
</div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Leaf className="text-green-600" size={20} /> Crop Records
            </h2>

            <div className="flex gap-3">
              <button
               onClick={() => {
  const rows = farmers.flatMap((f) =>
    (f.farms || []).map((fm) => ({
      Farmer: f.username,
      Field: fm.fieldName || "—",
      Crop: fm.selectedCrop || "—",
      Status: fm.archived ? "Completed" : "Active",
      CompletedAt: fm.completedAt
        ? new Date(fm.completedAt).toLocaleDateString()
        : "—"
    }))
  );

  exportCSV("crops.csv", rows);
}}
                className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md"
              >
                Export
              </button>

              <button
                onClick={fetchFarmers}
                className="flex items-center gap-2 text-emerald-700"
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>

          <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-emerald-100 sticky top-0">
                <tr>
                  <th className="p-2">Farmer</th>
                  <th className="p-2">Field</th>
                  <th className="p-2">Crop</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {farmers.flatMap((f) =>
                  f.farms
                    ?.filter((fm) => {
  if (!fm.selectedCrop) return false;

  if (cropFilter === "all") return true;

  return fm.selectedCrop.toLowerCase() === cropFilter.toLowerCase();
})
                     .map((fm) => (
                      <tr key={fm._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{f.username}</td>
                        <td className="p-2">{fm.fieldName}</td>
                        <td className="p-2">{fm.selectedCrop}</td>
                        <td className="p-2">
                          {fm.archived ? (
                            <span className="text-red-600 font-medium">
                              Completed
                            </span>
                          ) : (
                            <span className="text-green-600 font-medium">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="p-2 text-right">
                          <button
                            onClick={() => openCropDetails(fm, f)}
                            className="text-blue-700"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          WEATHER TAB — WEATHER + YIELD COMPARISON INCLUDED
      ============================================================ */}
      {activeTab === "weather" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            Weather & Yield Comparison
          </h2>

          {weatherRecords.length > 0 ? (
            <>
              {/* Weather Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <h2 className="text-xl font-bold text-blue-700">
                    {weatherRecords[0].temperature?.toFixed(1)}°C
                  </h2>
                </div>

                <div className="bg-green-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Humidity</p>
                  <h2 className="text-xl font-bold text-green-700">
                    {weatherRecords[0].humidity?.toFixed(0)}%
                  </h2>
                </div>

                <div className="bg-yellow-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <h2 className="text-xl font-bold text-yellow-700">
                    {weatherRecords[0].rainfall?.toFixed(1)} mm
                  </h2>
                </div>
              </div>

              {/* WEATHER + YIELD GRAPH */}
              <div className="w-full bg-gray-50 p-4 rounded-xl mb-6">
                <h3 className="text-md font-semibold mb-3">
                  Temperature vs Yield Trend
                </h3>

                <div className="space-y-3">
                  {/* TEMP GRAPH */}
                  <div className="w-full h-48 border rounded-lg p-2 bg-white">
                    <h4 className="text-sm font-medium text-blue-700 mb-1">
                      Temperature (°C)
                    </h4>

                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weatherRecords.slice(0, 12).reverse()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line dataKey="temperature" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* YIELD GRAPH */}
                  <div className="w-full h-48 border rounded-lg p-2 bg-white">
                    <h4 className="text-sm font-medium text-green-700 mb-1">
                      Yield (kg)
                    </h4>

                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yieldRecords.slice(0, 12).reverse()}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey={(row) => new Date(row.date).toLocaleDateString()} />
  <YAxis />
  <Tooltip />
  <Line dataKey="yield" stroke="#10b981" />
</LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Weather Table */}
              <div className="mt-6">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Temp</th>
                      <th className="p-2">Humidity</th>
                      <th className="p-2">Rainfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weatherRecords.map((w) => (
                      <tr key={w._id} className="border-b">
                        <td className="p-2">
                          {new Date(w.date).toLocaleDateString()}
                        </td>
                        <td className="p-2">{w.temperature?.toFixed(1)}</td>
                        <td className="p-2">{w.humidity?.toFixed(0)}%</td>
                        <td className="p-2">{w.rainfall?.toFixed(1)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>No weather data available.</p>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW FARMER DETAILS MODAL
      ============================================================ */}
      {showViewModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowViewModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Farmer Details</h3>

            <p><strong>Name:</strong> {selectedFarmer.username}</p>
            <p><strong>Phone:</strong> {selectedFarmer.phone || "—"}</p>
            <p><strong>Email:</strong> {selectedFarmer.email || "—"}</p>
            <p><strong>Barangay:</strong> {selectedFarmer.barangay || "—"}</p>

            <h4 className="text-md font-semibold mt-4 mb-2">Fields:</h4>

            {selectedFarmerFields.length === 0 ? (
              <p className="text-gray-500">No fields.</p>
            ) : (
              <ul className="space-y-2">
                {selectedFarmerFields.map((f) => (
                  <li key={f._id} className="border p-2 rounded bg-gray-50">
                    <p><strong>Field:</strong> {f.fieldName}</p>
                    <p><strong>Crop:</strong> {f.selectedCrop || "—"}</p>
                    <p><strong>Size:</strong> {f.fieldSize} ha</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {f.archived ? "Completed" : "Active"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          CROP DETAILS MODAL — CLEAN VERSION
      ============================================================ */}
      {showCropViewModal && selectedCropField && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowCropViewModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Crop Details</h3>

            <p><strong>Farmer:</strong> {selectedCropField.farmer.username}</p>
            <p><strong>Field:</strong> {selectedCropField.fieldName}</p>
            <p><strong>Crop:</strong> {selectedCropField.selectedCrop}</p>
            <p><strong>Size:</strong> {selectedCropField.fieldSize} ha</p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedCropField.archived ? "Completed" : "Active"}
            </p>

            <h4 className="text-md font-semibold mt-4 mb-2">AI Recommended Crops:</h4>
            <ul className="list-disc ml-6">
              {selectedCropField.aiRecommendations?.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD FARMER MODAL
      ============================================================ */}
      {showAddModal && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
    <div className="bg-white p-5 rounded-2xl w-full max-w-sm shadow relative">

      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-gray-500"
        onClick={() => setShowAddModal(false)}
      >
        <X size={18} />
      </button>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-4 text-center">
        Register Farmer
      </h3>

      <form onSubmit={handleAddFarmer} className="space-y-4">

        {/* Full Name */}
        <div>
          <label className="block mb-1 font-medium text-sm">Full Name</label>
          <input
            required
            value={newFarmer.username}
            onChange={(e) =>
              setNewFarmer({ ...newFarmer, username: e.target.value })
            }
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Enter full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-medium text-sm">Email</label>
          <input
            type="email"
            value={newFarmer.email}
            onChange={(e) =>
              setNewFarmer({ ...newFarmer, email: e.target.value })
            }
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="example@gmail.com"
          />
        </div>

        {/* Barangay */}
        <div>
          <label className="block mb-1 font-medium text-sm">Barangay</label>
          <select
            required
            value={newFarmer.barangay}
            onChange={(e) =>
              setNewFarmer({ ...newFarmer, barangay: e.target.value })
            }
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Select Barangay</option>

            {/* --- Auto Fill Barangay List --- */}
            {[
              "Altura Bata","Altura Matanda","Altura South","Ambulong","Bagbag","Bagumbayan","Balele",
              "Banadero","Banjo East","Banjo West (Banjo Laurel)","Bilog-bilog","Boot","Cale","Darasa",
              "Gonzales","Hidalgo","Janopol","Janopol Oriental","Laurel","Luyos","Mabini","Malaking Pulo",
              "Maria Paz","Maugat","Montaña (Ik-ik)","Natatas","Pagaspas","Pantay Bata","Pantay Matanda",
              "Poblacion 1","Poblacion 2","Poblacion 3","Poblacion 4","Poblacion 5","Poblacion 6",
              "Poblacion 7","Sala","Sambat","San Jose","Santol","Santor","Sulpoc","Suplang","Talaga",
              "Tinurik","Trapiche","Wawa", "Ulango"
            ].map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1 font-medium text-sm">Phone Number</label>
          <div className="flex items-center border rounded-lg bg-gray-50 p-2.5">
            <span className="text-gray-600 pr-2 text-sm">+63</span>
            <input
              type="number"
              required
              value={newFarmer.phone}
              onChange={(e) =>
                setNewFarmer({ ...newFarmer, phone: e.target.value })
              }
              className="w-full bg-gray-50 outline-none text-sm"
              placeholder="9123456789"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 font-medium text-sm">Password</label>
          <input
            type="password"
            required
            value={newFarmer.password}
            onChange={(e) =>
              setNewFarmer({ ...newFarmer, password: e.target.value })
            }
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Enter password"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 font-medium text-sm">Confirm Password</label>
          <input
            type="password"
            required
            value={newFarmer.confirmPassword}
            onChange={(e) =>
              setNewFarmer({ ...newFarmer, confirmPassword: e.target.value })
            }
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Repeat password"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          Add Farmer
        </button>
      </form>
    </div>
  </div>
)}

    </div>
  );
}
