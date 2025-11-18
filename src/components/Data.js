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
  BarChart2,
  Eye,
  FileDown,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

// ---------------------------
// 🔧 CSV EXPORT (PURE JS)
// ---------------------------
const exportToCSV = (filename, rows) => {
  if (!rows || rows.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(rows[0]).join(",");
  const data = rows
    .map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const csv = headers + "\n" + data;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);

  const [activeTab, setActiveTab] = useState("farmer");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmerFields, setSelectedFarmerFields] = useState([]);
  const [selectedCropField, setSelectedCropField] = useState(null);

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    email: "",
    barangay: "",
  });

  // ---------------------------
  // 📌 FETCH FARMERS + FARMS
  // ---------------------------
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

  // ---------------------------
  // 🌦 FETCH WEATHER
  // ---------------------------
  const fetchWeatherRecords = async () => {
    try {
      const res = await axios.get(`${baseUrl}/weather`);
      if (res.data.success) setWeatherRecords(res.data.data);
    } catch {
      toast.error("Failed to load weather data");
    }
  };

  // ---------------------------
  // ❌ DELETE FARMER
  // ---------------------------
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

  // ---------------------------
  // ✏ EDIT FARMER
  // ---------------------------
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
        prev.map((f) =>
          f._id === id ? { ...f, ...res.data.data } : f
        )
      );

      toast.success("Updated successfully.");
    } catch {
      toast.error("Update failed.");
    }
  };

  // ---------------------------
  // ➕ ADD NEW FARMER
  // ---------------------------
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

  // ---------------------------
  // 🔍 VIEW FARMER DETAILS
  // ---------------------------
  const openDetailsModal = (farmer) => {
    setSelectedFarmer(farmer);
    setSelectedFarmerFields(farmer.farms || []);
    setShowViewModal(true);
  };

  // ---------------------------
  // 🔍 VIEW CROP DETAILS
  // ---------------------------
  const openCropModal = (field, farmer) => {
    setSelectedCropField({
      ...field,
      farmerName: farmer.username,
      barangay: farmer.barangay,
    });
    setShowCropModal(true);
  };

  // ---------------------------
  // 📊 YIELD TREND (Increase/Decrease)
  // ---------------------------
  const calculateYieldTrend = (farmer) => {
    const completed = farmer.farms
      ?.filter((f) => f.archived)
      .map((f) => {
        const harvestTask = f.tasks?.find((t) => t.type === "Harvesting");
        return harvestTask?.kilos || 0;
      });

    if (!completed || completed.length < 2) return "Unknown";

    const latest = completed[completed.length - 1];
    const previous = completed[completed.length - 2];

    if (latest > previous) return "Increasing";
    if (latest < previous) return "Decreasing";
    return "Stable";
  };

  // ---------------------------
  // INITIAL LOAD
  // ---------------------------
  useEffect(() => {
    fetchFarmers();
    fetchWeatherRecords();
  }, [activeTab]);

  const filteredFarmers = farmers.filter(
    (f) =>
      (!f.role || f.role !== "admin") &&
      f.username.toLowerCase().includes(search.toLowerCase())
  );
return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter relative">
      <Toaster position="top-right" />

      {/* -------------------- TABS -------------------- */}
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
          FARMERS TAB
      ============================================================ */}
      {activeTab === "farmer" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Farmers Data</h2>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  exportToCSV(
                    "farmers.csv",
                    filteredFarmers.map((f) => ({
                      Name: f.username,
                      Phone: f.phone || "—",
                      Email: f.email || "—",
                      Barangay: f.barangay,
                      YieldTrend: calculateYieldTrend(f),
                    }))
                  )
                }
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
          <div className="mb-4">
            <input
              placeholder="Search farmer..."
              className="border p-2 rounded w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Farmer Table */}
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

                      <td
                        className={`p-2 font-medium ${
                          calculateYieldTrend(f) === "Increasing"
                            ? "text-green-600"
                            : calculateYieldTrend(f) === "Decreasing"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {calculateYieldTrend(f)}
                      </td>

                      <td className="p-2 text-right space-x-3">
                        <button
                          onClick={() => openDetailsModal(f)}
                          className="text-green-700"
                        >
                          View
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
          CROPS TAB — STATUS + VIEW DETAILS + EXPORT
      ============================================================ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Leaf className="text-green-600" size={20} /> Crop Records
            </h2>

            <div className="flex gap-3">
              {/* Export */}
              <button
                onClick={() =>
                  exportToCSV(
                    "crops.csv",
                    farmers.flatMap((farmer) =>
                      farmer.farms.map((farm) => ({
                        Farmer: farmer.username,
                        FieldName: farm.fieldName,
                        Crop: farm.selectedCrop || "",
                        Status: farm.archived ? "Completed" : "Active",
                      }))
                    )
                  )
                }
                className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md"
              >
                <FileDown size={16} /> Export
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
                  <th className="p-2">Field Name</th>
                  <th className="p-2">Crop</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {farmers.flatMap((f) =>
                  f.farms.map((farm) => (
                    <tr key={farm._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{f.username}</td>
                      <td className="p-2">{farm.fieldName}</td>
                      <td className="p-2">{farm.selectedCrop || "—"}</td>

                      <td
                        className={`p-2 font-medium ${
                          farm.archived
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {farm.archived ? "Completed" : "Active"}
                      </td>

                      <td className="p-2 text-right">
                        <button
                          onClick={() => openCropModal(farm, f)}
                          className="text-blue-600 flex items-center gap-1"
                        >
                          <Eye size={16} /> View
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
          WEATHER TAB — USING BACKEND WEATHER API
      ============================================================ */}
      {activeTab === "weather" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Weather Data</h2>

          {weatherRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <h2 className="text-xl font-bold text-blue-700">
                    {weatherRecords[0].temperature}°C
                  </h2>
                </div>

                <div className="bg-green-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Humidity</p>
                  <h2 className="text-xl font-bold text-green-700">
                    {weatherRecords[0].humidity}%
                  </h2>
                </div>

                <div className="bg-yellow-100 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <h2 className="text-xl font-bold text-yellow-700">
                    {weatherRecords[0].rainfall} mm
                  </h2>
                </div>
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
            <p><strong>Yield Trend:</strong> {calculateYieldTrend(selectedFarmer)}</p>

            <h4 className="text-md font-semibold mt-4 mb-2">Fields</h4>

            {selectedFarmerFields.length === 0 ? (
              <p className="text-gray-500">No fields found.</p>
            ) : (
              <ul className="space-y-2">
                {selectedFarmerFields.map((field) => (
                  <li key={field._id} className="border p-2 rounded bg-gray-50">
                    <p><strong>Field:</strong> {field.fieldName}</p>
                    <p><strong>Crop:</strong> {field.selectedCrop}</p>
                    <p><strong>Status:</strong> {field.archived ? "Completed" : "Active"}</p>
                    <p><strong>Size:</strong> {field.fieldSize} ha</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          CROP VIEW MODAL
      ============================================================ */}
      {showCropModal && selectedCropField && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowCropModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Crop Details</h3>

            <p><strong>Farmer:</strong> {selectedCropField.farmerName}</p>
            <p><strong>Barangay:</strong> {selectedCropField.barangay}</p>
            <p><strong>Field Name:</strong> {selectedCropField.fieldName}</p>
            <p><strong>Crop:</strong> {selectedCropField.selectedCrop}</p>
            <p><strong>Size:</strong> {selectedCropField.fieldSize} ha</p>
            <p><strong>Status:</strong> {selectedCropField.archived ? "Completed" : "Active"}</p>

            <h4 className="text-md font-semibold mt-4">Tasks:</h4>

            {selectedCropField.tasks?.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {selectedCropField.tasks.map((t) => (
                  <li key={t._id} className="border p-2 rounded bg-gray-50">
                    <p><strong>Type:</strong> {t.type}</p>
                    <p><strong>Date:</strong> {new Date(t.date).toLocaleDateString()}</p>
                    <p><strong>Completed:</strong> {t.completed ? "Yes" : "No"}</p>
                    {t.type === "Harvesting" && (
                      <p><strong>Yield:</strong> {t.kilos} kg</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tasks found.</p>
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
