// Supported cities strictly trained and recognized by the ML model
export const SUPPORTED_CITIES = [
  "Ahmedabad",
  "Aizawl",
  "Amaravati",
  "Amritsar",
  "Bengaluru",
  "Bhopal",
  "Brajrajnagar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Ernakulam",
  "Gurugram",
  "Guwahati",
  "Hyderabad",
  "Jaipur",
  "Jorapokhar",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Mumbai",
  "Patna",
  "Shillong",
  "Talcher",
  "Thiruvananthapuram",
  "Visakhapatnam"
];

// CPCB (Central Pollution Control Board) AQI categories, ranges, and theme-tailored colors
export const AQI_CATEGORIES = [
  {
    category: "Good",
    range: "0 – 50",
    min: 0,
    max: 50,
    color: "#16A34A",       // Green
    bgLight: "#F0FDF4",
    border: "#BBF7D0",
    textDark: "#166534",
    description: "Minimal impact. Clean air posing little or no health risk.",
    severity: 1
  },
  {
    category: "Satisfactory",
    range: "51 – 100",
    min: 51,
    max: 100,
    color: "#65A30D",       // Lime Green
    bgLight: "#F7FEE7",
    border: "#D9F99D",
    textDark: "#3F6212",
    description: "Minor breathing discomfort to sensitive individuals on prolonged exposure.",
    severity: 2
  },
  {
    category: "Moderate",
    range: "101 – 200",
    min: 101,
    max: 200,
    color: "#B45309",       // Rich Amber / Warm Bronze (never neon yellow)
    bgLight: "#FEF3C7",
    border: "#FDE68A",
    textDark: "#78350F",
    description: "Breathing discomfort to people with asthma, lung, and heart diseases.",
    severity: 3
  },
  {
    category: "Poor",
    range: "201 – 300",
    min: 201,
    max: 300,
    color: "#EA580C",       // Orange
    bgLight: "#FFF7ED",
    border: "#FED7AA",
    textDark: "#9A3412",
    description: "Breathing discomfort to most people on prolonged outdoor exposure.",
    severity: 4
  },
  {
    category: "Very Poor",
    range: "301 – 400",
    min: 301,
    max: 400,
    color: "#DC2626",       // Red
    bgLight: "#FEF2F2",
    border: "#FECACA",
    textDark: "#991B1B",
    description: "Respiratory illness on prolonged exposure. Significant risk for sensitive groups.",
    severity: 5
  },
  {
    category: "Severe",
    range: "Above 400",
    min: 401,
    max: 500,
    color: "#881337",       // Deep Maroon/Purple
    bgLight: "#FFF1F2",
    border: "#FECDD3",
    textDark: "#4C0519",
    description: "Emergency condition. Affects healthy people and seriously impacts vulnerable individuals.",
    severity: 6
  }
];

export function getAqiCategory(aqi) {
  const val = Number(aqi) || 0;
  if (val <= 50) return AQI_CATEGORIES[0];
  if (val <= 100) return AQI_CATEGORIES[1];
  if (val <= 200) return AQI_CATEGORIES[2];
  if (val <= 300) return AQI_CATEGORIES[3];
  if (val <= 400) return AQI_CATEGORIES[4];
  return AQI_CATEGORIES[5];
}

// 11 Core Pollutants specification with standard units & scientific descriptions
export const POLLUTANT_CONFIGS = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", description: "Fine particulate matter ≤ 2.5 µm", typical: 49.2, standard: "60 µg/m³ (24h)" },
  { key: "pm10", label: "PM10", unit: "µg/m³", description: "Coarse inhalable particles ≤ 10 µm", typical: 100.1, standard: "100 µg/m³ (24h)" },
  { key: "no", label: "NO", unit: "µg/m³", description: "Nitric Oxide from combustion", typical: 10.0, standard: "N/A" },
  { key: "no2", label: "NO2", unit: "µg/m³", description: "Nitrogen Dioxide trace pollutant", typical: 21.8, standard: "80 µg/m³ (24h)" },
  { key: "nox", label: "NOx", unit: "ppb", description: "Total reactive atmospheric nitrogen oxides", typical: 23.8, standard: "N/A" },
  { key: "nh3", label: "NH3", unit: "µg/m³", description: "Ammonia from agriculture & emissions", typical: 17.1, standard: "400 µg/m³ (24h)" },
  { key: "co", label: "CO", unit: "mg/m³", description: "Carbon Monoxide from incomplete combustion", typical: 0.92, standard: "4 mg/m³ (8h)" },
  { key: "so2", label: "SO2", unit: "µg/m³", description: "Sulphur Dioxide industrial emissions", typical: 9.3, standard: "80 µg/m³ (24h)" },
  { key: "o3", label: "O3", unit: "µg/m³", description: "Ground-level photochemical ozone", typical: 31.2, standard: "100 µg/m³ (8h)" },
  { key: "benzene", label: "Benzene", unit: "µg/m³", description: "Volatile organic compound (VOC)", typical: 1.2, standard: "5 µg/m³ (Annual)" },
  { key: "toluene", label: "Toluene", unit: "µg/m³", description: "Hydrocarbon solvent trace compound", typical: 3.4, standard: "N/A" },
];

export const DEFAULT_PREDICTION_FORM = {
  city: "Delhi",
  date: new Date().toISOString().split("T")[0],
  pm25: 85.5,
  pm10: 160.0,
  no: 22.0,
  no2: 45.0,
  nox: 50.0,
  nh3: 25.0,
  co: 1.5,
  so2: 18.0,
  o3: 38.0,
  benzene: 3.0,
  toluene: 9.5,
  aqi_lag_1: 190.0,
  aqi_lag_2: 185.0,
  aqi_lag_3: 178.0
};
