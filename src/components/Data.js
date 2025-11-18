import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  X,
  Leaf,
  RefreshCw,
  FileDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);

  const [activeTab, setActiveTab] = useState("farmer");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmerFields, setSelectedFarmerFields] = useState([]);
  const [selectedCropDetails, setSelectedCropDetails] = useState(null);

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    email: "",
    barangay: "",
  });

  /* ------------------------------------------------------------
      YIELD TREND — using kilos per month
  ------------------------------------------------------------ */
  const calculateYieldTrend = (farmer) => {
    if (!farmer?.farms) return "➡️";

    let harvests = [];

    farmer.farms.forEach((f) => {
      f.tasks
        ?.filter((t) => t.type === "Harvesting" && t.kilos > 0)
        .forEach((t) => {
          harvests.push({
            month: new Date(t.date).getMonth() + 1,
            year: new Date(t.date).getFullYear(),
            kilos: t.kilos,
          });
        });
    });

    if (harvests.length < 2) return "➡️";

    // group by month-year
    const grouped = {};
    harvests.forEach((h) => {
      const key = `${h.year}-${h.month}`;
      grouped[key] = (grouped[key] || 0) + h.kilos;
    });

    const monthly = Object.entries(grouped)
      .map(([k, v]) => ({ key: k, kilos: v }))
      .sort((a, b) => new Date(a.key) - new Date(b.key));

    if (monthly.length < 2) return "➡️";

    const prev = monthly[monthly.length - 2].kilos;
    const latest = monthly[monthly.length - 1].kilos;

    if (latest > prev) return "⬆️";
    if (latest < prev) return "⬇️";
    return "➡️";
  };

  /* ------------------------------------------------------------
      EXPORT CSV (Farmer & Crops)
  ------------------------------------------------------------ */
  const exportFarmersCSV = () => {
    const rows = farmers.map((f) => ({
      Name: f.username,
      Phone: f.phone || "",
      Email: f.email || "",
      Barangay: f.barangay || "",
      Farms: f.farms?.length || 0,
    }));

    const csv = Papa.unparse(rows);
    downloadFile(csv, "farmers.csv");
  };

  const exportCropsCSV = () => {
    let rows = [];

    farmers.forEach((farmer) => {
      farmer.farms?.forEach((farm) => {
        rows.push({
          Farmer: farmer.username,
          Field: farm.fieldName,
          Crop: farm.selectedCrop || "",
          Status: farm.archived ? "Completed" : "Active",
        });
      });
    });

    const csv = Papa.unparse(rows);
    downloadFile(csv, "crops.csv");
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  /* ------------------------------------------------------------
      FETCH FARMERS + FARMS
  ------------------------------------------------------------ */
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
    } catch {
      toast.error("Failed to fetch farmers.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
      FETCH WEATHER
  ------------------------------------------------------------ */
  const fetchWeatherRecords = async () => {
    try {
      const res = await axios.get(`${baseUrl}/weather`);
      if (res.data.success) setWeatherRecords(res.data.data);
    } catch {
      toast.error("Failed to load weather data");
    }
  };

  /* ------------------------------------------------------------
      INITIAL LOAD
  ------------------------------------------------------------ */
  useEffect(() => {
    fetchFarmers();
    fetchWeatherRecords();
  }, [activeTab]);

  const filteredFarmers = farmers.filter(
    (f) =>
      (!f.role || f.role !== "admin") &&
      f.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ------------------------------------------------------------
      OPEN FARMER DETAILS
  ------------------------------------------------------------ */
  const openDetailsModal = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedFarmerFields(farmer.farms || []);
    setShowViewModal(true);
  };

  /* ------------------------------------------------------------
      OPEN CROP DETAILS
  ------------------------------------------------------------ */
  const openCropDetails = (farm, farmerName) => {
    setSelectedCropDetails({ farm, farmerName });
    setShowCropModal(true);
  };

  /* ------------------------------------------------------------
      DELETE FARMER
  ------------------------------------------------------------ */
  const deleteFarmer = async (id) => {
    if (!window.confirm("Delete this farmer?")) return;

    try {
      await axios.delete(`${baseUrl}/users/${id}`);
      setFarmers((prev) => prev.filter((f) => f._id !== id));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ------------------------------------------------------------
      ADD FARMER
  ------------------------------------------------------------ */
  const handleAddFarmer = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${baseUrl}/users`, newFarmer);
      setFarmers((prev) => [...prev, res.data.data]);

      setShowAddModal(false);
      toast.success("Farmer added");

      setNewFarmer({ username: "", phone: "", email: "", barangay: "" });
    } catch {
      toast.error("Failed to add farmer");
    }
  };

  /* ------------------------------------------------------------
      UI START
  ------------------------------------------------------------ */
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

      {/* ------------------------------------------------------------
          FARMER TAB
      ------------------------------------------------------------ */}
      {activeTab === "farmer" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Farmers</h2>

            <div className="flex gap-3">
              <button
                onClick={exportFarmersCSV}
                className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md"
              >
                <FileDown size={16} /> Export
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md"
              >
                <UserPlus size={18} /> Add Farmer
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            placeholder="Search..."
            className="border p-2 rounded w-full mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
                      <td className="p-2 text-lg">
                        {calculateYieldTrend(f)}
                      </td>

                      <td className="p-2 text-right space-x-3">
                        <button
                          onClick={() => openDetailsModal(f)}
                          className="text-green-700"
                        >
                          View Details
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

      {/* ------------------------------------------------------------
          CROPS TAB
      ------------------------------------------------------------ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Leaf className="text-green-600" size={18} /> Crop Records
            </h2>

            <button
              onClick={exportCropsCSV}
              className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md"
            >
              <FileDown size={16} /> Export
            </button>
          </div>

          <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-emerald-100 sticky top-0">
                <tr>
                  <th className="p-2">Farmer</th>
                  <th className="p-2">Field Name</th>
                  <th className="p-2">Crop</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {farmers.flatMap((f) =>
                  f.farms?.map((farm) => (
                    <tr key={farm._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{f.username}</td>
                      <td className="p-2">{farm.fieldName}</td>
                      <td className="p-2">{farm.selectedCrop || "—"}</td>
                      <td className="p-2">
                        {farm.archived ? "Completed" : "Active"}
                      </td>

                      <td className="p-2 text-right">
                        <button
                          onClick={() =>
                            openCropDetails(farm, f.username)
                          }
                          className="text-green-700"
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

      {/* ------------------------------------------------------------
          WEATHER TAB
      ------------------------------------------------------------ */}
      {activeTab === "weather" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Weather Data</h2>

          {weatherRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-xl text-center">
                  <p>Temperature</p>
                  <h2 className="text-xl font-bold text-blue-700">
                    {weatherRecords[0].temperature.toFixed(1)}°C
                  </h2>
                </div>

                <div className="bg-green-100 p-4 rounded-xl text-center">
                  <p>Humidity</p>
                  <h2 className="text-xl font-bold text-green-700">
                    {weatherRecords[0].humidity.toFixed(0)}%
                  </h2>
                </div>

                <div className="bg-yellow-100 p-4 rounded-xl text-center">
                  <p>Rainfall</p>
                  <h2 className="text-xl font-bold text-yellow-700">
                    {weatherRecords[0].rainfall.toFixed(1)} mm
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={weatherRecords.slice(0, 7).reverse()}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="temperature" stroke="#3b82f6" />
                  <Line dataKey="humidity" stroke="#10b981" />
                  <Line dataKey="rainfall" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>

              {/* TABLE */}
              <table className="w-full mt-6 text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Temp</th>
                    <th className="p-2">Humidity</th>
                    <th className="p-2">Rain</th>
                  </tr>
                </thead>
                <tbody>
                  {weatherRecords.map((w) => (
                    <tr key={w._id} className="border-b">
                      <td className="p-2">
                        {new Date(w.date).toLocaleDateString()}
                      </td>
                      <td className="p-2">{w.temperature.toFixed(1)}</td>
                      <td className="p-2">{w.humidity.toFixed(0)}%</td>
                      <td className="p-2">{w.rainfall.toFixed(1)} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>No weather data available.</p>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------
          FARMER DETAILS MODAL
      ------------------------------------------------------------ */}
      {showViewModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-xl shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowViewModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Farmer Details</h3>

            <p><b>Name:</b> {selectedFarmer.username}</p>
            <p><b>Phone:</b> {selectedFarmer.phone || "—"}</p>
            <p><b>Email:</b> {selectedFarmer.email || "—"}</p>
            <p><b>Barangay:</b> {selectedFarmer.barangay}</p>

            <h4 className="font-semibold mt-4 mb-2">Active Fields</h4>
            {selectedFarmerFields.filter(f => !f.archived).length === 0
              ? <p className="text-gray-500">None</p>
              : (
                <ul className="space-y-2">
                  {selectedFarmerFields.filter(f => !f.archived).map(f => (
                    <li key={f._id} className="border p-2 rounded bg-gray-50">
                      <p><b>Field:</b> {f.fieldName}</p>
                      <p><b>Crop:</b> {f.selectedCrop}</p>
                    </li>
                  ))}
                </ul>
              )}

            <h4 className="font-semibold mt-4 mb-2">Completed Fields</h4>
            {selectedFarmerFields.filter(f => f.archived).length === 0
              ? <p className="text-gray-500">None</p>
              : (
                <ul className="space-y-2">
                  {selectedFarmerFields.filter(f => f.archived).map(f => (
                    <li key={f._id} className="border p-2 rounded bg-gray-50">
                      <p><b>Field:</b> {f.fieldName}</p>
                      <p><b>Crop:</b> {f.selectedCrop}</p>
                      <p><b>Harvest:</b> {new Date(f.completedAt).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          CROP DETAILS MODAL
      ------------------------------------------------------------ */}
      {showCropModal && selectedCropDetails && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowCropModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Field Details</h3>

            <p><b>Farmer:</b> {selectedCropDetails.farmerName}</p>
            <p><b>Field:</b> {selectedCropDetails.farm.fieldName}</p>
            <p><b>Crop:</b> {selectedCropDetails.farm.selectedCrop}</p>
            <p><b>Status:</b> {selectedCropDetails.farm.archived ? "Completed" : "Active"}</p>

            <h4 className="font-semibold mt-4 mb-2">Task History</h4>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {selectedCropDetails.farm.tasks?.map((t) => (
                <li key={t._id} className="border p-2 rounded">
                  <p><b>{t.type}</b></p>
                  <p>Date: {new Date(t.date).toLocaleDateString()}</p>
                  <p>Kilos: {t.kilos}</p>
                  <p>Status: {t.completed ? "Completed" : "Pending"}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          ADD FARMER MODAL
      ------------------------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowAddModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Add Farmer</h3>

            <form onSubmit={handleAddFarmer} className="space-y-3">
              <input
                className="w-full border p-2 rounded"
                placeholder="Full Name"
                required
                value={newFarmer.username}
                onChange={(e) =>
                  setNewFarmer({ ...newFarmer, username: e.target.value })
                }
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Phone"
                value={newFarmer.phone}
                onChange={(e) =>
                  setNewFarmer({ ...newFarmer, phone: e.target.value })
                }
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Email"
                value={newFarmer.email}
                onChange={(e) =>
                  setNewFarmer({ ...newFarmer, email: e.target.value })
                }
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Barangay"
                required
                value={newFarmer.barangay}
                onChange={(e) =>
                  setNewFarmer({ ...newFarmer, barangay: e.target.value })
                }
              />

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white p-2 rounded"
              >
                Save Farmer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
