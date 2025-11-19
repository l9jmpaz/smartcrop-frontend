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
  ResponsiveContainer,
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

  // ORIGINAL CROP FILTER (unchanged)
  const [cropFilter, setCropFilter] = useState("all");

  // ⭐ NEW FILTER TYPE: NORMAL, MONTHLY COMMON, YEARLY COMMON
  const [commonFilter, setCommonFilter] = useState("all");

  // ============================================================
  // FETCH ALL CROPS
  // ============================================================
  const fetchAllCrops = async () => {
    try {
      const res = await axios.get(`${baseUrl}/crops`);
      if (res.data) {
        setAllCrops(res.data.map((c) => c.name));
      }
    } catch (err) {
      toast.error("Failed to load crop list");
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getFarmMonth = (farm) => {
    const d =
      farm.completedAt
        ? new Date(farm.completedAt)
        : farm.updatedAt
        ? new Date(farm.updatedAt)
        : new Date(farm.createdAt);

    return d.getMonth() + 1; // 1–12
  };

  const getFarmYear = (farm) => {
    const d =
      farm.completedAt
        ? new Date(farm.completedAt)
        : farm.updatedAt
        ? new Date(farm.updatedAt)
        : new Date(farm.createdAt);

    return d.getFullYear();
  };

  // ============================================================
  // FIND MONTHLY COMMON CROP
  // ============================================================
  const getMonthlyCommonCrop = (farmsWithUsers) => {
    const counts = {};

    farmsWithUsers.forEach((f) => {
      f.farms.forEach((fm) => {
        const month = getFarmMonth(fm);
        if (!counts[month]) counts[month] = {};

        if (fm.selectedCrop) {
          counts[month][fm.selectedCrop] =
            (counts[month][fm.selectedCrop] || 0) + 1;
        }
      });
    });

    // Find the latest month with data
    const months = Object.keys(counts).map(Number);
    if (months.length === 0) return null;

    const latestMonth = Math.max(...months);

    const cropCounts = counts[latestMonth];
    const entries = Object.entries(cropCounts);

    if (entries.length === 0) return null;

    // Highest crop for that month
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  // ============================================================
  // FIND YEARLY COMMON CROP
  // ============================================================
  const getYearlyCommonCrop = (farmsWithUsers) => {
    const counts = {};

    farmsWithUsers.forEach((f) => {
      f.farms.forEach((fm) => {
        if (fm.selectedCrop) {
          counts[fm.selectedCrop] = (counts[fm.selectedCrop] || 0) + 1;
        }
      });
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  // ============================================================
  // FETCH FARMERS + FIELDS
  // ============================================================
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

      // ============================================================
      // NEW — APPLY COMMON CROP FILTER LOGIC
      // ============================================================
      if (commonFilter === "monthly") {
        const crop = getMonthlyCommonCrop(farmsWithUsers);
        setCropFilter(crop || "none");
      } else if (commonFilter === "yearly") {
        const crop = getYearlyCommonCrop(farmsWithUsers);
        setCropFilter(crop || "none");
      }

    } catch (err) {
      toast.error("Failed to load farmers.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD ON TAB CHANGE
  // ============================================================
  useEffect(() => {
    fetchFarmers();
    fetchWeatherRecords();
    fetchYieldRecords();
    fetchAllCrops();
  }, [activeTab, commonFilter]);
  /* ============================================================
      FILTER FARMERS (unchanged)
  ============================================================ */
  const filteredFarmers = farmers.filter((f) => {
    if ((f.role || "").toLowerCase() === "admin") return false;

    const matchSearch = f.username
      ?.toLowerCase()
      .includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (cropFilter === "all" || cropFilter === "none") return true;

    return f.farms.some((field) => {
      if (!field.selectedCrop) return false;
      return field.selectedCrop.toLowerCase() === cropFilter.toLowerCase();
    });
  });

  /* ============================================================
      UI START
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

      {/* ============================================================
          CROPS TAB — UPDATED WITH COMMON CROP FILTER
      ============================================================ */}
      {activeTab === "crops" && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">

            {/* ⭐ NEW COMMON CROP FILTER */}
            <div className="flex gap-3">
              <select
                value={commonFilter}
                onChange={(e) => setCommonFilter(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="all">All</option>
                <option value="monthly">Monthly Common Crop</option>
                <option value="yearly">Yearly Common Crop</option>
              </select>

              {/* ORIGINAL CROP LIST FILTER */}
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
                        : "—",
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

          {/* TABLE */}
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
                {farmers.flatMap((f) => {
                  const fieldsWithCrop = (f.farms || []).filter(
                    (fm) => fm.selectedCrop
                  );
                  if (fieldsWithCrop.length === 0) return [];

                  const filteredFields = fieldsWithCrop.filter((fm) => {
                    if (cropFilter === "all" || cropFilter === "none")
                      return true;

                    return (
                      fm.selectedCrop.toLowerCase() ===
                      cropFilter.toLowerCase()
                    );
                  });

                  return filteredFields.map((fm) => (
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
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* (The rest of your file — weather tab, farmer tab, modals — unchanged) */}
    </div>
  );
}
