// admin-frontend/src/components/Data.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "https://smartcrop-backend-in5e.onrender.com/api";

export default function Data() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch farmers and their farm info
  const fetchFarmers = async () => {
    try {
      setLoading(true);

      // Get all users
      const usersRes = await axios.get(`${baseUrl}/users`);
      const users = usersRes.data?.data || [];

      // For each user, try to get their farm info
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
      console.error("❌ Error fetching farmers:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a farmer
  const deleteFarmer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) return;
    try {
      await axios.delete(`${baseUrl}/users/${id}`);
      setFarmers((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("❌ Error deleting farmer:", err);
      alert("Failed to delete farmer.");
    }
  };

  // ✅ Edit a farmer (basic name + barangay + status)
  const editFarmer = async (id, farmer) => {
    const username = prompt("Enter new username", farmer.username);
    const barangay = prompt("Enter new barangay", farmer.barangay);
    const status = prompt("Enter status (Active/Inactive)", farmer.status);

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
    } catch (err) {
      console.error("❌ Error editing farmer:", err);
      alert("Failed to update farmer.");
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filteredFarmers = farmers.filter((f) =>
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-emerald-700">Farmers Data</h2>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by farmer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-1/2"
        />
        <button
          onClick={fetchFarmers}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-10">Loading farmers...</div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Barangay</th>
              <th className="border px-4 py-2">Fields</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFarmers.map((f) => (
              <tr key={f._id} className="text-center hover:bg-gray-50">
                <td className="border px-4 py-2">{f.username}</td>
                <td className="border px-4 py-2">{f.phone || "-"}</td>
                <td className="border px-4 py-2">{f.barangay || "-"}</td>
                <td className="border px-4 py-2">
                  {f.farms.length > 0 ? (
                    <ul className="list-disc list-inside text-left">
                      {f.farms.map((farm) => (
                        <li key={farm._id}>
                          {farm.fieldName} ({farm.lastYearCrop || "N/A"})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">No fields</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      f.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {f.status || "N/A"}
                  </span>
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    className="text-blue-600"
                    onClick={() => editFarmer(f._id, f)}
                  >
                    ✏️
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => deleteFarmer(f._id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {filteredFarmers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No farmers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}