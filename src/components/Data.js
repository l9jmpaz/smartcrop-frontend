import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  User,
  Leaf,
  RefreshCw,
  X,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);

  const [activeTab, setActiveTab] = useState("farmer");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmerFields, setSelectedFarmerFields] = useState([]);

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    email: "",
    barangay: "",
  });

  /* ============================================================
     FETCH FARMERS + FARMS
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
    } catch (err) {
      toast.error("Failed to fetch farmers.");
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
      toast.error("Update failed.");
    }
  };

  /* ============================================================
     ADD FARMER
  ============================================================ */
  const handleAddFarmer = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${baseUrl}/users`, newFarmer);
      setFarmers((prev) => [...prev, res.data.data]);

      toast.success("New farmer added!");
      setShowAddModal(false);

      setNewFarmer({
        username: "",
        phone: "",
        email: "",
        barangay: "",
      });
    } catch {
      toast.error("Failed to add farmer");
    }
  };

  /* ============================================================
     VIEW DETAILS MODAL
  ============================================================ */
  const openDetailsModal = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedFarmerFields(farmer.farms || []);
    setShowViewModal(true);
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  useEffect(() => {
    fetchFarmers();
    fetchWeatherRecords();
  }, [activeTab]);

  const filteredFarmers = farmers.filter(
    (f) =>
      (!f.role || f.role !== "admin") &&
      f.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================================================
     UI RENDER
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
          FARMERS TAB (UPDATED)
      ============================================================ */}
      {activeTab === "farmer" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Farmers Data</h2>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md"
            >
              <UserPlus size={18} /> Add Farmer
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              placeholder="Search farmer..."
              className="border p-2 rounded w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!loading ? (
            <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-emerald-100 sticky top-0">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFarmers.map((f) => (
                    <tr key={f._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{f.username}</td>
                      <td className="p-2">{f.phone || "—"}</td>
                      <td className="p-2">{f.email || "—"}</td>

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
          CROPS TAB 
      ============================================================ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Leaf className="text-green-600" size={20} /> Crop Records
            </h2>

            <button
              onClick={fetchFarmers}
              className="flex items-center gap-2 text-emerald-700"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-emerald-100 sticky top-0">
                <tr>
                  <th className="p-2">Farmer</th>
                  <th className="p-2">Field Name</th>
                  <th className="p-2">Crop</th>
                </tr>
              </thead>

              <tbody>
                {farmers.flatMap((f) =>
                  f.farms
                    ?.filter(
                      (farm) =>
                        farm.selectedCrop &&
                        farm.selectedCrop.trim() !== ""
                    )
                    .map((farm) => (
                      <tr key={farm._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{f.username}</td>
                        <td className="p-2">{farm.fieldName}</td>
                        <td className="p-2">{farm.selectedCrop}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    {/* ============================================================
    WEATHER TAB (OPENWEATHER API)
============================================================ */}
{activeTab === "weather" && (
  <div className="bg-white rounded-xl p-6 shadow">
    <h2 className="text-lg font-semibold mb-4">Weather Data</h2>

    <button
      onClick={fetchWeatherRecords}
      className="mb-4 bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
    >
      <RefreshCw size={16} /> Sync Weather Now
    </button>

    {weatherRecords.length > 0 ? (
      <>
        {/* Summary Cards */}
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

        {/* Weather Chart */}
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <LineChart
              data={weatherRecords.slice(0, 7).reverse()}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="temperature" stroke="#3b82f6" name="Temp (°C)" />
              <Line dataKey="humidity" stroke="#10b981" name="Humidity (%)" />
              <Line dataKey="rainfall" stroke="#f59e0b" name="Rainfall (mm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weather Table */}
        <div className="mt-6 overflow-y-auto max-h-[300px] border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Temperature</th>
                <th className="p-2">Humidity</th>
                <th className="p-2">Rainfall</th>
              </tr>
            </thead>
            <tbody>
              {weatherRecords.map((w) => (
                <tr key={w._id} className="border-b">
                  <td className="p-2">{new Date(w.date).toLocaleString()}</td>
                  <td className="p-2">{w.temperature?.toFixed(1)}°C</td>
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
          VIEW DETAILS MODAL 
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

            <h3 className="text-lg font-semibold mb-3">
              Farmer Details
            </h3>

            <p><strong>Name:</strong> {selectedFarmer.username}</p>
            <p><strong>Phone:</strong> {selectedFarmer.phone || "—"}</p>
            <p><strong>Email:</strong> {selectedFarmer.email || "—"}</p>
            <p><strong>Barangay:</strong> {selectedFarmer.barangay || "—"}</p>

            <h4 className="text-md font-semibold mt-4 mb-2">
              Active Fields:
            </h4>

            {selectedFarmerFields.length === 0 ? (
              <p className="text-gray-500">No active fields.</p>
            ) : (
              <ul className="space-y-2">
                {selectedFarmerFields.map((field) => (
                  <li
                    key={field._id}
                    className="border p-2 rounded bg-gray-50"
                  >
                    <p><strong>Field Name:</strong> {field.fieldName}</p>
                    <p><strong>Crop:</strong> {field.selectedCrop || "—"}</p>
                    <p><strong>Size:</strong> {field.fieldSize} ha</p>
                    <p><strong>Status:</strong> {field.archived ? "Completed" : "Active"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          ADD FARMER MODAL
      ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowAddModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Add New Farmer</h3>

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
