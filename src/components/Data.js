import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  User,
  Leaf,
  Cloud,
  MapPin,
  Droplet,
  Thermometer,
  RefreshCw,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("farmer");
  const [showModal, setShowModal] = useState(false);

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    barangay: "",
    status: "Active",
  });

  // ✅ Fetch Farmers
  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const usersRes = await axios.get(`${baseUrl}/users`);
      const users = usersRes.data?.data || [];

      const farmsPromises = users.map(async (u) => {
        try {
          const farmRes = await axios.get(`${baseUrl}/farm/${u._id}`);
          const farms = farmRes.data?.farms || [];
          return { ...u, farms };
        } catch {
          return { ...u, farms: [] };
        }
      });

      const mergedData = await Promise.all(farmsPromises);
      setFarmers(mergedData);
    } catch (err) {
      toast.error("Failed to fetch farmers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Crops
  const fetchCrops = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/farm`);
      setCrops(res.data.farms || []);
    } catch (err) {
      toast.error("Failed to fetch crops data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Weather
  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/ai/weather`);
      setWeather(res.data || {});
    } catch (err) {
      toast.error("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Farmer
  const deleteFarmer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) return;
    try {
      await axios.delete(`${baseUrl}/users/${id}`);
      setFarmers((prev) => prev.filter((f) => f._id !== id));
      toast.success("Farmer deleted successfully");
    } catch (err) {
      toast.error("Error deleting farmer");
    }
  };

  // ✅ Edit Farmer
  const editFarmer = async (id, farmer) => {
    const username = prompt("Enter new name", farmer.username);
    const barangay = prompt("Enter new barangay", farmer.barangay);
    const status = prompt("Enter status (Active/Inactive)", farmer.status);
    if (!username || !barangay || !status) {
      toast.error("Edit cancelled or missing fields");
      return;
    }

    try {
      const res = await axios.put(`${baseUrl}/users/${id}`, {
        username,
        barangay,
        status,
      });
      setFarmers((prev) =>
        prev.map((f) => (f._id === id ? { ...f, ...res.data.data } : f))
      );
      toast.success("Farmer updated successfully");
    } catch (err) {
      toast.error("Failed to update farmer");
    }
  };

  // ✅ Add Farmer (with validation + toasts)
  const handleAddFarmer = async (e) => {
    e.preventDefault();
    const { username, phone, barangay } = newFarmer;

    // Validation
    if (!username.trim()) return toast.error("Name is required");
    if (!barangay.trim()) return toast.error("Barangay is required");
    if (phone && !/^[0-9]{10,13}$/.test(phone))
      return toast.error("Phone must be 10–13 digits");

    try {
      const res = await axios.post(`${baseUrl}/users, newFarmer`);
      setFarmers((prev) => [...prev, res.data.data]);
      toast.success("✅ Farmer added successfully!");
      setShowModal(false);
      setNewFarmer({ username: "", phone: "", barangay: "", status: "Active" });
    } catch (err) {
      toast.error("Failed to add farmer");
    }
  };

  useEffect(() => {
    if (activeTab === "farmer") fetchFarmers();
    if (activeTab === "crops") fetchCrops();
    if (activeTab === "weather") fetchWeather();
  }, [activeTab]);

  const filteredFarmers = farmers.filter((f) =>
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter relative">
      <Toaster position="top-right" reverseOrder={false} />

      {/* 🔝 Tabs */}
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

      {/* 🧑 Farmer Tab */}
      {activeTab === "farmer" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center bg-white rounded-full shadow-sm w-1/2 px-4 py-2 border border-gray-200">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none text-sm text-gray-700"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
            >
              <UserPlus size={18} /> Add Farmer
            </button>
          </div>

          <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Farmers Data
            </h2>

            {loading ? (
              <div className="text-center text-gray-500 py-10">
                Loading farmers...
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No farmers found
              </div>
            ) : (
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr className="text-left border-b border-gray-300">
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Phone</th>
                    <th className="py-2 font-medium">Barangay</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f) => (
                    <tr
                      key={f._id}
                      className="border-b border-gray-200 hover:bg-gray-100/60 transition"
                    >
                      <td className="py-2 flex items-center gap-3">
                        <User
                          className={`${
                            f.status === "Active"
                              ? "text-emerald-600"
                              : "text-gray-400"
                          }`}
                          size={20}
                        />
                        {f.username}
                      </td>
                      <td className="py-2">{f.phone || "—"}</td>
                      <td className="py-2">{f.barangay || "—"}</td>
                      <td className="py-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            f.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2 text-right space-x-3">
                        <button
                          onClick={() => editFarmer(f._id, f)}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteFarmer(f._id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

  {/* 🌾 Crops Tab */}
{activeTab === "crops" && (
  <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Leaf className="text-green-600" /> Crop Records
      </h2>
      <button
        onClick={fetchCrops}
        className="flex items-center gap-2 text-emerald-700 text-sm hover:text-emerald-900 transition"
      >
        <RefreshCw size={16} /> Refresh
      </button>
    </div>

    {loading ? (
      <p className="text-center text-gray-500 py-6">Loading crops...</p>
    ) : (
      <table className="w-full text-sm text-gray-700">
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th className="py-2">Farmer Name</th>
            <th className="py-2">Field Name</th>
            <th className="py-2">Crop</th>
          </tr>
        </thead>
        <tbody>
          {farmers
            // ✅ Only show farmers with valid farms
            .filter((f) => Array.isArray(f.farms) && f.farms.length > 0)
            // ✅ Map each valid farm
            .map((f) =>
              f.farms
                // ✅ Only include farms with valid field + crop
                .filter(
                  (farm) =>
                    farm.fieldName &&
                    farm.lastYearCrop &&
                    farm.lastYearCrop.toLowerCase() !== "none" &&
                    farm.lastYearCrop.toLowerCase() !== "n/a" &&
                    farm.lastYearCrop.trim() !== ""
                )
                .map((farm) => (
                  <tr
                    key={farm._id}
                    className="border-b border-gray-200 hover:bg-gray-100/60 transition"
                  >
                    <td className="py-2">{f.username}</td>
                    <td className="py-2">{farm.fieldName}</td>
                    <td className="py-2">{farm.lastYearCrop}</td>
                  </tr>
                ))
            )}
        </tbody>
      </table>
    )}

    {/* ✅ Show message if no valid farms exist */}
    {farmers.every(
      (f) =>
        !f.farms ||
        f.farms.length === 0 ||
        f.farms.every(
          (farm) =>
            !farm.lastYearCrop ||
            ["none", "n/a", ""].includes(farm.lastYearCrop?.toLowerCase())
        )
    ) && (
      <p className="text-center text-gray-500 py-6">
        No valid crop records found.
      </p>
    )}
  </div>
)}


      {/* ☁️ Weather Tab */}
      {activeTab === "weather" && (
        <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Cloud className="text-blue-500" /> Weather Data
            </h2>
            <button
              onClick={fetchWeather}
              className="flex items-center gap-2 text-emerald-700 text-sm hover:text-emerald-900 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading weather...</p>
          ) : !weather ? (
            <p className="text-center text-gray-500 py-6">No data found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                <Thermometer className="text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="font-semibold">{weather.temp || "—"} °C</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                <Droplet className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Humidity</p>
                  <p className="font-semibold">{weather.humidity || "—"}%</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                <MapPin className="text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{weather.location || "—"}</p>
                </div>
              </div>
              <div className="col-span-3 text-sm text-gray-500 mt-4">
                Last Sync:{" "}
                <span className="font-medium text-gray-700">
                  {weather.lastSync
                    ? new Date(weather.lastSync).toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✳️ Add Farmer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Add New Farmer
            </h2>

            <form onSubmit={handleAddFarmer} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={newFarmer.username}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={newFarmer.phone}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Barangay</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={newFarmer.barangay}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, barangay: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={newFarmer.status}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 rounded-md mt-3 hover:bg-emerald-700 transition"
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