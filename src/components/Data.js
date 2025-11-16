import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  User,
  Leaf,
  RefreshCw,
  X,
  Settings,
  Plus,
  Trash,
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [weatherRecords, setWeatherRecords] = useState([]);
  const [oversupplyList, setOversupplyList] = useState([]);

  const [activeTab, setActiveTab] = useState("farmer");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showOversupplyModal, setShowOversupplyModal] = useState(false);

  const [newCrop, setNewCrop] = useState("");
  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    barangay: "",
    status: "Active",
  });

  /* ============================================================
     FETCH FARMERS + FARMS
  ============================================================ */
  const fetchFarmers = async () => {
    try {
      setLoading(true);

      const usersRes = await axios.get(`${baseUrl}/users`);
      const users = usersRes.data?.data || [];

      // Attach farm data for each farmer
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
     FETCH OVERSUPPLY
  ============================================================ */
  const fetchOversupply = async () => {
    try {
      const res = await axios.get(`${baseUrl}/ai/oversupply`);
      if (res.data.success) setOversupplyList(res.data.crops);
    } catch (err) {
      toast.error("Failed to load oversupply list");
    }
  };

  /* ============================================================
     SAVE OVERSUPPLY
  ============================================================ */
  const saveOversupply = async () => {
    try {
      const update = oversupplyList.filter((c) => c.trim() !== "");
      const res = await axios.put(`${baseUrl}/ai/oversupply`, {
        crops: update,
      });

      if (res.data.success) {
        toast.success("Oversupply list updated!");
        setShowOversupplyModal(false);
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Server error updating oversupply list");
    }
  };

  /* ============================================================
     FETCH WEATHER
  ============================================================ */
  const fetchWeatherRecords = async () => {
    try {
      const res = await axios.get(`${baseUrl}/weather`);
      if (res.data.success) setWeatherRecords(res.data.data);
    } catch (err) {
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
    const status = prompt("Status (Active/Inactive):", farmer.status);

    if (!username || !barangay || !status) return;

    try {
      const res = await axios.put(`${baseUrl}/users/${id}`, {
        username,
        barangay,
        status,
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

      setShowModal(false);
      setNewFarmer({ username: "", phone: "", barangay: "", status: "Active" });
    } catch {
      toast.error("Failed to add farmer");
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  useEffect(() => {
    fetchFarmers(); // always needed for all tabs
    fetchWeatherRecords();
  }, [activeTab]);

  /* ============================================================
     FILTER FARMERS
  ============================================================ */
  const filteredFarmers = farmers.filter(
    (f) =>
      (!f.role || f.role !== "admin") &&
      f.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================================================
     RENDER UI
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
          FARMERS TAB
      ============================================================ */}
      {activeTab === "farmer" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Farmers Data</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md"
            >
              <UserPlus size={18} /> Add Farmer
            </button>
          </div>

          {!loading ? (
            <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-emerald-100 sticky top-0">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Barangay</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFarmers.map((f) => (
                    <tr key={f._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{f.username}</td>
                      <td className="p-2">{f.phone || "—"}</td>
                      <td className="p-2">{f.barangay}</td>
                      <td className="p-2">{f.status}</td>

                      <td className="p-2 text-right space-x-3">
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
          CROPS TAB — FIXED (USES selectedCrop)
      ============================================================ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Leaf size={20} className="text-green-600" /> Crop Records
            </h2>

            <button
              onClick={() => setActiveTab("crops")}
              className="flex items-center gap-2 text-emerald-700"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {/* ACTUAL TABLE */}
          <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-emerald-100 sticky top-0">
                <tr>
                  <th className="p-2">Farmer Name</th>
                  <th className="p-2">Field Name</th>
                  <th className="p-2">Crop</th>
                </tr>
              </thead>

              <tbody>
                {farmers.flatMap((farmer) =>
                  farmer.farms
                    ?.filter(
                      (farm) =>
                        farm.selectedCrop &&
                        !["none", ""].includes(
                          String(farm.selectedCrop).toLowerCase()
                        )
                    )
                    .map((farm) => (
                      <tr key={farm._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{farmer.username}</td>
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
          WEATHER TAB
      ============================================================ */}
      {activeTab === "weather" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Weather Data</h2>

          {weatherRecords.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-xl text-center">
                  Temp: {weatherRecords[0].temperature}°C
                </div>
                <div className="bg-green-100 p-4 rounded-xl text-center">
                  Humidity: {weatherRecords[0].humidity}%
                </div>
                <div className="bg-yellow-100 p-4 rounded-xl text-center">
                  Rain: {weatherRecords[0].rainfall} mm
                </div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weatherRecords.slice(0, 7).reverse()}>
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
            </>
          ) : (
            <p>No weather data found.</p>
          )}
        </div>
      )}

      {/* ============================================================
          MODALS BELOW
      ============================================================ */}

      {/* Add Farmer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setShowModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-3">Add New Farmer</h3>

            <form onSubmit={handleAddFarmer} className="space-y-3">
              <input
                className="w-full border p-2 rounded"
                placeholder="Name"
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
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
