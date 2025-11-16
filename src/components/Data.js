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
  Cloud,
  MapPin,
  Droplet,
  Thermometer,
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
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherRecords, setWeatherRecords] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("farmer");
  const [showModal, setShowModal] = useState(false);

  // Oversupply Modal States
  const [showOversupplyModal, setShowOversupplyModal] = useState(false);
  const [oversupplyList, setOversupplyList] = useState([]);
  const [newCrop, setNewCrop] = useState("");

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    barangay: "",
    status: "Active",
  });

  /* ============================================================
     FETCH FARMERS
  ============================================================ */
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

  /* ============================================================
     FETCH CROPS
  ============================================================ */
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

  /* ============================================================
     FETCH WEATHER
  ============================================================ */
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

  /* ============================================================
     FETCH WEATHER RECORDS
  ============================================================ */
  const fetchWeatherRecords = async () => {
    try {
      const res = await axios.get(`${baseUrl}/weather`);
      if (res.data.success) {
        setWeatherRecords(res.data.data);
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  };

  /* ============================================================
     FETCH OVERSUPPLY CROPS
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
     SAVE OVERSUPPLY CROPS
  ============================================================ */
  const saveOversupply = async () => {
    try {
      const filtered = oversupplyList.filter((c) => c.trim() !== "");
      const res = await axios.put(`${baseUrl}/ai/oversupply`, {
        crops: filtered,
      });

      if (res.data.success) {
        toast.success("Oversupply list updated!");
        setShowOversupplyModal(false);
      } else {
        toast.error("Failed to update");
      }
    } catch (err) {
      toast.error("Server error updating oversupply list");
    }
  };

  /* ============================================================
     DELETE FARMER
  ============================================================ */
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

  /* ============================================================
     EDIT FARMER
  ============================================================ */
  const editFarmer = async (id, farmer) => {
    const username = prompt("Enter new name", farmer.username);
    const barangay = prompt("Enter new barangay", farmer.barangay);
    const status = prompt("Enter status (Active/Inactive)", farmer.status);

    if (!username || !barangay || !status)
      return toast.error("Edit cancelled");

    try {
      const res = await axios.put(`${baseUrl}/users/${id}`, {
        username,
        barangay,
        status,
      });

      setFarmers((prev) =>
        prev.map((f) => (f._id === id ? { ...f, ...res.data.data } : f))
      );

      toast.success("Farmer updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  /* ============================================================
     ADD FARMER
  ============================================================ */
  const handleAddFarmer = async (e) => {
    e.preventDefault();
    const { username, phone, barangay } = newFarmer;

    if (!username.trim()) return toast.error("Name is required");
    if (!barangay.trim()) return toast.error("Barangay is required");

    if (phone && !/^[0-9]{10,13}$/.test(phone))
      return toast.error("Phone must be 10–13 digits");

    try {
      const res = await axios.post(`${baseUrl}/users`, newFarmer);
      setFarmers((prev) => [...prev, res.data.data]);

      toast.success("Farmer added!");
      setShowModal(false);

      setNewFarmer({ username: "", phone: "", barangay: "", status: "Active" });
    } catch (err) {
      toast.error("Failed to add farmer");
    }
  };

  /* ============================================================
     LOAD INITIAL DATA
  ============================================================ */
  useEffect(() => {
    if (activeTab === "farmer") fetchFarmers();
    if (activeTab === "crops") fetchCrops();
    if (activeTab === "weather") fetchWeather();

    fetchWeatherRecords();
  }, [activeTab]);

  /* ============================================================
     FILTER FARMERS
  ============================================================ */
  const filteredFarmers = farmers.filter(
    (f) =>
      (!f.role || f.role.toLowerCase() !== "admin") &&
      f.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================================================
     RENDER UI
  ============================================================ */
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-inter relative">
      <Toaster position="top-right" />

      {/* TABS */}
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

      {/* ===========================
            FARMERS TAB
      ============================ */}
      {activeTab === "farmer" && (
        <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Farmers Data
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
            >
              <UserPlus size={18} /> Add Farmer
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-10">
              Loading farmers...
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No farmers found
            </div>
          ) : (
            <div className="relative max-h-[65vh] overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-gray-700">
                <thead className="sticky top-0 bg-emerald-100 shadow-sm">
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Barangay</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f) => (
                    <tr
                      key={f._id}
                      className="border-b hover:bg-gray-100 transition"
                    >
                      <td className="py-2 px-3 flex items-center gap-3">
                        <User size={20} className="text-emerald-600" />
                        {f.username}
                      </td>
                      <td className="py-2 px-3">{f.phone || "—"}</td>
                      <td className="py-2 px-3">{f.barangay || "—"}</td>
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-right space-x-3">
                        <button
                          onClick={() => editFarmer(f._id, f)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteFarmer(f._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===========================
            CROPS TAB
      ============================ */}
      {activeTab === "crops" && (
  <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Leaf className="text-green-600" /> Crop Records
      </h2>

      <div className="flex items-center gap-3">
        <button
          onClick={fetchFarmers} // 🔥 Refresh farmers to refresh crop list
          className="flex items-center gap-2 text-emerald-700 text-sm hover:text-emerald-900 transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>

        <button
          onClick={() => {
            fetchOversupply();
            setShowOversupplyModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
        >
          <Settings size={16} /> Edit Oversupply Crops
        </button>
      </div>
    </div>

    {loading ? (
      <p className="text-center text-gray-500 py-6">Loading crop data...</p>
    ) : (
      <div className="relative max-h-[65vh] overflow-y-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-gray-700">
          <thead className="sticky top-0 bg-emerald-100 shadow-sm">
            <tr className="text-left border-b">
              <th className="py-2 px-3">Farmer Name</th>
              <th className="py-2 px-3">Field Name</th>
              <th className="py-2 px-3">Crop</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((farmer) =>
              farmer.farms
                ?.filter((farm) => farm.fieldName)
                .map((farm) => (
                  <tr
                    key={farm._id}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <td className="py-2 px-3">{farmer.username}</td>
                    <td className="py-2 px-3">{farm.fieldName}</td>
                    <td className="py-2 px-3">
                      {farm.selectedCrop && farm.selectedCrop !== "none"
                        ? farm.selectedCrop
                        : "—"}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          farm.archived
                            ? "bg-gray-200 text-gray-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {farm.archived ? "Completed" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

      {/* ===========================
            WEATHER TAB
      ============================ */}
      {activeTab === "weather" && (
        <div className="bg-emerald-50/40 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Weather Data
          </h2>

          {weatherRecords.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-blue-400">
                  <h3 className="text-gray-600 text-sm font-medium">
                    Temperature
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {weatherRecords[0].temperature?.toFixed(1)}°C
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-emerald-500">
                  <h3 className="text-gray-600 text-sm font-medium">
                    Humidity
                  </h3>
                  <p className="text-2xl font-bold text-emerald-600">
                    {weatherRecords[0].humidity?.toFixed(0)}%
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-yellow-500">
                  <h3 className="text-gray-600 text-sm font-medium">
                    Rainfall
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {weatherRecords[0].rainfall?.toFixed(1)} mm
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <h3 className="text-gray-700 font-semibold mb-2">
                  7-Day Weather Trend
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={weatherRecords.slice(0, 7).reverse()}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString()
                      }
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#3b82f6"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#10b981"
                    />
                    <Line
                      type="monotone"
                      dataKey="rainfall"
                      stroke="#f59e0b"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Weather Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
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
                    {weatherRecords.map((record, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          {record.temperature?.toFixed(1)}
                        </td>
                        <td className="p-2">
                          {record.humidity?.toFixed(0)}
                        </td>
                        <td className="p-2">
                          {record.rainfall?.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No weather data found
            </p>
          )}
        </div>
      )}

      {/* ===============================
          OVERSUPPLY CROPS MODAL
      =============================== */}
      {showOversupplyModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
            {/* Close */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowOversupplyModal(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Oversupply Crops
            </h2>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg p-3 space-y-2">
              {oversupplyList.map((crop, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                >
                  <input
                    value={crop}
                    onChange={(e) => {
                      const updated = [...oversupplyList];
                      updated[index] = e.target.value;
                      setOversupplyList(updated);
                    }}
                    className="w-full bg-transparent outline-none"
                  />

                  <button
                    onClick={() =>
                      setOversupplyList(
                        oversupplyList.filter((_, i) => i !== index)
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new crop */}
            <div className="flex mt-4 gap-2">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                placeholder="Add new crop"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={() => {
                  if (!newCrop.trim()) return;
                  setOversupplyList([...oversupplyList, newCrop.trim()]);
                  setNewCrop("");
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Save button */}
            <button
              onClick={saveOversupply}
              className="w-full mt-5 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ===============================
          ADD FARMER MODAL
      =============================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg relative">
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
