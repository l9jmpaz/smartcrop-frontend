import React, { useEffect, useState } from "react";
import { Table, Loader } from "lucide-react";
import * as XLSX from "xlsx";

export default function ArchivedData() {
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    loadArchivedFiles();
  }, []);

  const loadArchivedFiles = async () => {
    try {
      const filenames = [
        "Tanauan-City-Update-Crop-Damage-Report-as-of-10272024-9AM.xlsx",
        "Crop-Statistics-Final-Tanauan-2023.xlsx",
        "December.xlsx"
      ];

      const loadedSheets = [];

      for (let file of filenames) {
        const response = await fetch(`/archived/${file}`);
        const buffer = await response.arrayBuffer();
        const wb = XLSX.read(buffer);

        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);

        loadedSheets.push({ file, data: json });
      }

      setSheets(loadedSheets);
      setLoading(false);
    } catch (err) {
      console.error("Error loading files:", err);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10 text-gray-500">
        <Loader className="animate-spin" /> Loading Archived Data...
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📦 Archived Data</h1>

      {sheets.map((sheet, idx) => (
        <div key={idx} className="mb-8 bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
            <Table /> {sheet.file}
          </h2>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-green-100">
                  {Object.keys(sheet.data[0] || {}).map((k) => (
                    <th key={k} className="px-3 py-2 text-left font-semibold">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2">
                        {v?.toString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}