import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Weather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/weather/Tanauan`)
      .then(res => setWeather(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Weather</h2>
      {weather ? (
        <div className="bg-white p-4 rounded shadow">
          <p>📍 {weather.name}</p>
          <p>🌡 {weather.main.temp} °C</p>
          <p>🌥 {weather.weather[0].description}</p>
        </div>
      ) : (
        <p>Loading weather...</p>
      )}
    </div>
  );
}
