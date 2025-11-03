import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Activities() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    axios.get(`${baseUrl}/api/activities`)
      .then(res => setActivities(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Activities</h2>
      <ul className="space-y-2">
        {activities.map(a => (
          <li key={a._id} className="bg-white p-3 rounded shadow">
            <p><b>{a.type}</b> - {new Date(a.date).toLocaleDateString()}</p>
            <p>{a.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
