import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Leaf,
  RefreshCw,
  X,
  BarChart2,
  Eye,
  Download,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Backend API
const baseUrl = "https://smartcrop-backend-1.onrender.com/api";

// CSV Export Helper
const exportCSV = (filename, rows) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]).join(",");
  const data = rows
    .map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const csvString = headers + "\n" + data;
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

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

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCropViewModal, setShowCropViewModal] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmerFields, setSelectedFarmerFields] = useState([]);
  const [selectedCropDetails, setSelectedCropDetails] = useState(null);

  const [newFarmer, setNewFarmer] = useState({
    username: "",
    phone: "",
    email: "",
    barangay: "",
  });

  /* ============================================================
     FETCH FARMERS + FIELDS + YIELD TRENDS
  ============================================================ */
  const fetchFarmers = async () => {
    try {
      setLoading(true);

      const usersRes = await axios.get(`${baseUrl}/users`);
      const users = usersRes.data?.data || [];

      const farmerData = await Promise.all(
        users
          .filter((u) => u.role !== "admin")
          .map(async (user) => {
            const farmRes = await axios.get(`${baseUrl}/farm/${user._id}`);
            const farms = farmRes.data?.farms || [];

            // ---- Compute YIELD TREND ----
            const harvests = farms.flatMap((f) =>
              (f.tasks || []).filter((t) =>
                t.type.toLowerCase().includes("harvest")
              )
            );

            let trend = "No Data";

            if (harvests.length >= 2) {
              const lastTwo = harvests
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 2);

              const diff = lastTwo[0].kilos - lastTwo[1].kilos;
              trend = diff > 0 ? "Increasing" : diff < 0 ? "Decreasing" : "Stable";
            }

            // ---- Most Common Crop This Year ----
            const crops = farms
              .filter((f) => f.selectedCrop)
              .map((f) => f.selectedCrop);

            const cropFreq = {};
            crops.forEach((c) => (cropFreq[c] = (cropFreq[c] || 0) + 1));

            const topCrop =
              Object.entries(cropFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ||
              "—";

            return {
              ...user,
              farms,
              yieldTrend: trend,
              topCrop,
            };
          })
      );

      setFarmers(farmerData);
    } catch (err) {
      toast.error("Failed to load farmers.");
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
      if (res.data.success) setWeatherRecords(res.data.data);
    } catch {
      toast.error("Failed to load weather.");
    }
  };

  /* ============================================================
     OPEN FARMER DETAILS MODAL
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

  /* ============================================================
     FILTER FARMERS
  ============================================================ */
  const filteredFarmers = farmers.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================================================
     RENDER FARMER TAB
  ============================================================ */
  const renderFarmerTab = () => (
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Farmers</h2>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md"
        >
          <UserPlus size={18} /> Add Farmer
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-between mb-4">
        <input
          placeholder="Search farmer..."
          className="border p-2 rounded w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() =>
            exportCSV(
              "farmers.csv",
              filteredFarmers.map((f) => ({
                name: f.username,
                phone: f.phone,
                email: f.email,
                most_common_crop: f.topCrop,
                yield_trend: f.yieldTrend,
              }))
            )
          }
          className="flex gap-2 items-center text-emerald-700 font-medium"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {!loading ? (
        <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-emerald-100 sticky top-0">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Email</th>
                <th className="p-2">Common Crop</th>
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
                  <td className="p-2">{f.topCrop}</td>
                  <td className="p-2">
                    {f.yieldTrend === "Increasing" && (
                      <span className="text-green-600 font-medium">↑ Increasing</span>
                    )}
                    {f.yieldTrend === "Decreasing" && (
                      <span className="text-red-600 font-medium">↓ Decreasing</span>
                    )}
                    {f.yieldTrend === "Stable" && (
                      <span className="text-yellow-600 font-medium">→ Stable</span>
                    )}
                    {f.yieldTrend === "No Data" && "—"}
                  </td>

                  <td className="p-2 text-right space-x-3">
                    <button
                      onClick={() => openDetailsModal(f)}
                      className="text-green-700 flex items-center gap-1"
                    >
                      <Eye size={16} /> View
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
  );

  /* ============================================================
     PART 1 END
  ============================================================ */
  /* ============================================================
     CROPS TAB — With Active/Completed + View Details + Export
  ============================================================ */
  const renderCropsTab = () => (
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Leaf className="text-green-600" size={20} /> Crop Records
        </h2>

        <div className="flex gap-4">
          {/* Export CSV */}
          <button
            onClick={() =>
              exportCSV(
                "crop_records.csv",
                farmers.flatMap((f) =>
                  f.farms
                    ?.filter((farm) => farm.selectedCrop)
                    .map((farm) => ({
                      farmer_name: f.username,
                      field_name: farm.fieldName,
                      crop: farm.selectedCrop,
                      size_ha: farm.fieldSize,
                      status: farm.archived ? "Completed" : "Active",
                      planted_date: farm.plantedDate
                        ? new Date(farm.plantedDate).toLocaleDateString()
                        : "—",
                      harvest_date: farm.harvestDate
                        ? new Date(farm.harvestDate).toLocaleDateString()
                        : "—",
                    }))
                )
              )
            }
            className="flex items-center gap-2 text-emerald-700 font-medium"
          >
            <Download size={16} /> Export CSV
          </button>

          {/* Refresh */}
          <button
            onClick={fetchFarmers}
            className="flex items-center gap-2 text-emerald-700"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* CROPS TABLE */}
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
              f.farms
                ?.filter((farm) => farm.selectedCrop)
                .map((farm) => (
                  <tr key={farm._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{f.username}</td>
                    <td className="p-2">{farm.fieldName}</td>
                    <td className="p-2">{farm.selectedCrop}</td>

                    {/* Status */}
                    <td className="p-2">
                      {farm.archived ? (
                        <span className="text-red-600 font-semibold">Completed</span>
                      ) : (
                        <span className="text-green-600 font-semibold">Active</span>
                      )}
                    </td>

                    {/* View Details */}
                    <td className="p-2 text-right">
                      <button
                        onClick={() => {
                          setSelectedCropDetails({
                            farmerName: f.username,
                            ...farm,
                          });
                          setShowCropViewModal(true);
                        }}
                        className="text-green-700 flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ============================================================
     WEATHER TAB — FIXED UI
     Weather already comes from backend (no API key needed)
  ============================================================ */
  const renderWeatherTab = () => (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-lg font-semibold mb-4">Weather Data</h2>

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

          {/* Weather Table */}
          <div className="mt-6">
            <table className="w-full text-sm border">
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
                    <td className="p-2">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
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
  );

  /* ============================================================
     PART 2 END
  ============================================================ */
// ============================================================
  // CSV EXPORT FUNCTION (USED IN FARMER + CROPS TAB)
  // ============================================================
  const exportCSV = (filename, data) => {
    const csvRows = [];

    const headers = Object.keys(data[0] || {});
    csvRows.push(headers.join(","));

    data.forEach((row) => {
      const values = headers.map((h) => `"${row[h] ?? ""}"`);
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
  };
  const cropDetailsModal = () =>
    showCropViewModal &&
    selectedCropDetails && (
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow relative">
          <button
            className="absolute top-3 right-3 text-gray-500"
            onClick={() => setShowCropViewModal(false)}
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold mb-3">Crop Details</h3>

          <p><strong>Farmer:</strong> {selectedCropDetails.farmerName}</p>
          <p><strong>Field Name:</strong> {selectedCropDetails.fieldName}</p>
          <p><strong>Crop:</strong> {selectedCropDetails.selectedCrop}</p>
          <p><strong>Size:</strong> {selectedCropDetails.fieldSize} ha</p>

          <p>
            <strong>Status:</strong>{" "}
            {selectedCropDetails.archived ? "Completed" : "Active"}
          </p>

          <p>
            <strong>Planted:</strong>{" "}
            {selectedCropDetails.plantedDate
              ? new Date(selectedCropDetails.plantedDate).toLocaleDateString()
              : "—"}
          </p>

          <p>
            <strong>Harvest:</strong>{" "}
            {selectedCropDetails.harvestDate
              ? new Date(selectedCropDetails.harvestDate).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
    );
    const farmerDetailsModal = () =>
    showViewModal &&
    selectedFarmer && (
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

          <h4 className="text-md font-semibold mt-4 mb-2">Active Fields:</h4>

          {selectedFarmerFields.length === 0 ? (
            <p className="text-gray-500">No active fields.</p>
          ) : (
            <ul className="space-y-2">
              {selectedFarmerFields.map((field) => (
                <li key={field._id} className="border p-2 rounded bg-gray-50">
                  <p><strong>Field Name:</strong> {field.fieldName}</p>
                  <p><strong>Crop:</strong> {field.selectedCrop}</p>
                  <p><strong>Size:</strong> {field.fieldSize} ha</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {field.archived ? "Completed" : "Active"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
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

      {/* Render Tabs */}
      {activeTab === "farmer" && renderFarmersTab()}
      {activeTab === "crops" && renderCropsTab()}
      {activeTab === "weather" && renderWeatherTab()}

      {/* Modals */}
      {farmerDetailsModal()}
      {cropDetailsModal()}
      {addFarmerModal()}
    </div>
  );
}
const renderCropsTab = () => (
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Crop Records
        </h2>

        <button
          onClick={() =>
            exportCSV(
              "crops.csv",
              farmers.flatMap((f) =>
                f.farms.map((farm) => ({
                  farmer: f.username,
                  field: farm.fieldName,
                  crop: farm.selectedCrop || "",
                  size: farm.fieldSize,
                  status: farm.archived ? "Completed" : "Active",
                }))
              )
            )
          }
          className="text-emerald-700 flex items-center gap-2"
        >
          Export CSV
        </button>
      </div>

      <div className="relative max-h-[65vh] overflow-y-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-emerald-100 sticky top-0">
            <tr>
              <th className="p-2">Farmer</th>
              <th className="p-2">Field</th>
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

                  <td className="p-2">
                    {farm.archived ? (
                      <span className="text-green-700 font-semibold">
                        Completed
                      </span>
                    ) : (
                      <span className="text-yellow-700 font-semibold">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="p-2 text-right">
                    <button
                      onClick={() => {
                        setSelectedCropDetails({
                          farmerName: f.username,
                          fieldName: farm.fieldName,
                          selectedCrop: farm.selectedCrop,
                          fieldSize: farm.fieldSize,
                          archived: farm.archived,
                          plantedDate: farm.plantedDate,
                          harvestDate: farm.harvestDate,
                        });
                        setShowCropViewModal(true);
                      }}
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
  );
