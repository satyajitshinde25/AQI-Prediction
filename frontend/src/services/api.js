/**
 * AirSense Backend API Service Module
 * Connected to live Render backend: https://aqi-prediction-g6us.onrender.com
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://aqi-prediction-g6us.onrender.com";

/**
 * Check if the FastAPI backend is running and healthy
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { online: false, status: response.status, data: null };
    }
    const data = await response.json();
    return { online: true, status: 200, data };
  } catch (error) {
    return {
      online: false,
      status: 0,
      error: error.message || "Backend server unreachable",
      data: null
    };
  }
}

/**
 * Fetch supported cities list from backend
 */
export async function getSupportedCities() {
  try {
    const response = await fetch(`${API_BASE_URL}/cities`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.cities || [];
  } catch (error) {
    console.warn("Could not fetch cities from backend, using client fallback", error);
    return null;
  }
}

/**
 * Fetch official AQI classification ranges
 */
export async function getAqiRanges() {
  try {
    const response = await fetch(`${API_BASE_URL}/aqi-ranges`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch aqi ranges from backend", error);
    return null;
  }
}

/**
 * Fetch model metadata from backend
 */
export async function getModelInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/model-info`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch model info from backend", error);
    return null;
  }
}

/**
 * Fetch a ready-to-use sample input payload
 */
export async function getSampleInput() {
  try {
    const response = await fetch(`${API_BASE_URL}/sample-input`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch sample input from backend", error);
    return null;
  }
}

/**
 * Submit prediction request to FastAPI
 * @param {Object} payload Form payload with city, date, 11 pollutants, and 3 lags
 */
export async function submitPrediction(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.detail || `Prediction failed with status code ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Connection error: Unable to connect to backend at ${API_BASE_URL}. Ensure your FastAPI server is running.`
    };
  }
}
