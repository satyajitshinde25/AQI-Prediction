from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------
# App Initialization & CORS Setup (Frontend Ready)
# ---------------------------------------------------------
app = FastAPI(
    title="AQI Prediction API",
    description="Machine Learning & Deep Learning Ensemble API for Air Quality Index (AQI) Prediction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend connection (allows any local dev or production frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Load Saved Models & Preprocessing Objects
# ---------------------------------------------------------
MODEL_DIR = Path(__file__).resolve().parent / "saved_models"

try:
    lr_model = joblib.load(MODEL_DIR / "linear_regression.joblib")
    rf_model = joblib.load(MODEL_DIR / "random_forest.joblib")
    dt_model = joblib.load(MODEL_DIR / "decision_tree.joblib")
    svm_model = joblib.load(MODEL_DIR / "linear_svr.joblib")
    nn_model = joblib.load(MODEL_DIR / "neural_network_ensemble.joblib")

    feature_columns: List[str] = joblib.load(MODEL_DIR / "feature_columns.joblib")
    svr_scaler = joblib.load(MODEL_DIR / "svr_scaler.joblib")
    meta_scaler = joblib.load(MODEL_DIR / "meta_scaler.joblib")
except Exception as e:
    raise RuntimeError(f"Error loading model artifacts from '{MODEL_DIR}': {e}")

# Build supported cities and normalized lookup map
SUPPORTED_CITIES = [
    col.replace("City_", "") for col in feature_columns if col.startswith("City_")
]
CITY_LOOKUP: Dict[str, str] = {c.lower(): c for c in SUPPORTED_CITIES}
# Common aliases
CITY_LOOKUP["bangalore"] = "Bengaluru"


# ---------------------------------------------------------
# Helper Functions: AQI Categories & Advisories
# ---------------------------------------------------------
def get_aqi_bucket_info(aqi_val: float) -> Dict[str, Any]:
    """CPCB (Central Pollution Control Board) Standard AQI categories, color codes and advisories."""
    if aqi_val <= 50:
        return {
            "bucket": "Good",
            "color": "#16A34A",
            "advisory": "Minimal impact. Air quality is considered satisfactory, and air pollution poses little or no risk.",
            "severity_level": 1
        }
    elif aqi_val <= 100:
        return {
            "bucket": "Satisfactory",
            "color": "#65A30D",
            "advisory": "Minor breathing discomfort to sensitive people.",
            "severity_level": 2
        }
    elif aqi_val <= 200:
        return {
            "bucket": "Moderate",
            "color": "#D97706",
            "advisory": "Breathing discomfort to people with lungs, asthma and heart diseases.",
            "severity_level": 3
        }
    elif aqi_val <= 300:
        return {
            "bucket": "Poor",
            "color": "#EA580C",
            "advisory": "Breathing discomfort to most people on prolonged exposure.",
            "severity_level": 4
        }
    elif aqi_val <= 400:
        return {
            "bucket": "Very Poor",
            "color": "#DC2626",
            "advisory": "Respiratory illness on prolonged exposure. Pronounced effect on sensitive groups.",
            "severity_level": 5
        }
    else:
        return {
            "bucket": "Severe",
            "color": "#701A75",
            "advisory": "Affects healthy people and seriously impacts those with existing respiratory conditions.",
            "severity_level": 6
        }


# ---------------------------------------------------------
# Pydantic Request & Response Schemas
# ---------------------------------------------------------
class PredictionInput(BaseModel):
    city: str = Field(..., description="City name (e.g. Delhi, Mumbai, Bengaluru)", example="Delhi")
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format (defaults to current date)", example="2026-10-22")
    year: Optional[int] = Field(None, description="Year (auto-parsed if date provided)")
    month: Optional[int] = Field(None, ge=1, le=12, description="Month 1-12 (auto-parsed if date provided)")
    day: Optional[int] = Field(None, ge=1, le=31, description="Day 1-31 (auto-parsed if date provided)")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="Day of week: 0=Mon, 6=Sun (auto-parsed if date provided)")

    # Pollutant concentrations (defaults set to dataset medians)
    pm25: float = Field(default=49.24, alias="PM2.5", description="PM2.5 (ug/m3)")
    pm10: float = Field(default=100.14, alias="PM10", description="PM10 (ug/m3)")
    no: float = Field(default=9.95, alias="NO", description="NO (ug/m3)")
    no2: float = Field(default=21.85, alias="NO2", description="NO2 (ug/m3)")
    nox: float = Field(default=23.79, alias="NOx", description="NOx (ppb)")
    nh3: float = Field(default=17.06, alias="NH3", description="NH3 (ug/m3)")
    co: float = Field(default=0.92, alias="CO", description="CO (mg/m3)")
    so2: float = Field(default=9.25, alias="SO2", description="SO2 (ug/m3)")
    o3: float = Field(default=31.18, alias="O3", description="O3 (ug/m3)")
    benzene: float = Field(default=1.22, alias="Benzene", description="Benzene (ug/m3)")
    toluene: float = Field(default=3.37, alias="Toluene", description="Toluene (ug/m3)")

    # Historical AQI Lags (defaults set to dataset median)
    aqi_lag_1: float = Field(default=118.0, alias="AQI_lag_1", description="AQI 1 day prior")
    aqi_lag_2: float = Field(default=118.0, alias="AQI_lag_2", description="AQI 2 days prior")
    aqi_lag_3: float = Field(default=118.0, alias="AQI_lag_3", description="AQI 3 days prior")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "city": "Delhi",
                "date": "2026-10-22",
                "pm25": 85.5,
                "pm10": 160.0,
                "no": 22.0,
                "no2": 45.0,
                "nox": 50.0,
                "nh3": 25.0,
                "co": 1.5,
                "so2": 18.0,
                "o3": 38.0,
                "benzene": 3.0,
                "toluene": 9.5,
                "aqi_lag_1": 190.0,
                "aqi_lag_2": 185.0,
                "aqi_lag_3": 178.0
            }
        }
    }

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        """Allow frontend to send keys in alternative formats (e.g. pm2_5, aqi_lag1, etc.)."""
        if isinstance(data, dict):
            mapping = {
                "pm2_5": "pm25",
                "PM2_5": "pm25",
                "pm_25": "pm25",
                "pm_10": "pm10",
                "aqi_lag1": "aqi_lag_1",
                "aqi_lag2": "aqi_lag_2",
                "aqi_lag3": "aqi_lag_3",
                "dayofweek": "day_of_week",
                "dayOfWeek": "day_of_week"
            }
            normalized = {}
            for k, v in data.items():
                target_k = mapping.get(k, k)
                normalized[target_k] = v
            return normalized
        return data


class BatchPredictionInput(BaseModel):
    records: List[PredictionInput] = Field(..., description="List of prediction inputs")


class ModelBreakdown(BaseModel):
    neural_network_ensemble: float
    random_forest: float
    linear_regression: float
    linear_svr: float
    decision_tree: float


class PredictionResponse(BaseModel):
    city: str
    target_date: str
    predicted_aqi: float
    aqi_bucket: str
    status_color: str
    health_advisory: str
    severity_level: int
    model_breakdown: ModelBreakdown
    input_features: Dict[str, Any]


# ---------------------------------------------------------
# Core Prediction Pipeline Logic
# ---------------------------------------------------------
def prepare_row(item: PredictionInput):
    # Normalize city
    raw_city = item.city.strip().lower()
    city = CITY_LOOKUP.get(raw_city)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"City '{item.city}' is not supported. Supported cities are: {SUPPORTED_CITIES}"
        )

    # Resolve date components
    if item.date:
        try:
            dt = datetime.strptime(item.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format for '{item.date}'. Expected YYYY-MM-DD."
            )
        year = dt.year
        month = dt.month
        day = dt.day
        day_of_week = dt.weekday()
    else:
        now = datetime.now()
        year = item.year if item.year is not None else now.year
        month = item.month if item.month is not None else now.month
        day = item.day if item.day is not None else now.day
        day_of_week = item.day_of_week if item.day_of_week is not None else now.weekday()

    # Build the 44-feature dictionary
    row = {col: 0.0 for col in feature_columns}
    row["PM2.5"] = float(item.pm25)
    row["PM10"] = float(item.pm10)
    row["NO"] = float(item.no)
    row["NO2"] = float(item.no2)
    row["NOx"] = float(item.nox)
    row["NH3"] = float(item.nh3)
    row["CO"] = float(item.co)
    row["SO2"] = float(item.so2)
    row["O3"] = float(item.o3)
    row["Benzene"] = float(item.benzene)
    row["Toluene"] = float(item.toluene)

    row["Year"] = int(year)
    row["Month"] = int(month)
    row["Day"] = int(day)
    row["DayOfWeek"] = int(day_of_week)

    row["AQI_lag_1"] = float(item.aqi_lag_1)
    row["AQI_lag_2"] = float(item.aqi_lag_2)
    row["AQI_lag_3"] = float(item.aqi_lag_3)

    city_col = f"City_{city}"
    if city_col in row:
        row[city_col] = 1.0

    date_str = f"{year:04d}-{month:02d}-{day:02d}"
    return row, city, date_str


def execute_pipeline(df_input: pd.DataFrame) -> List[Dict[str, Any]]:
    """Runs all base models, scales Linear SVR, stacks predictions, scales meta features, and predicts using the Neural Network ensemble."""
    # Ensure correct column ordering
    df_ordered = df_input[feature_columns]

    # Base model predictions
    y_l = lr_model.predict(df_ordered)
    y_r = rf_model.predict(df_ordered)
    y_d = dt_model.predict(df_ordered)

    # Linear SVR with its dedicated scaler
    X_svr_scaled = svr_scaler.transform(df_ordered)
    y_s = svm_model.predict(X_svr_scaled)

    # Stacking meta features: [LinearRegression, RandomForest, DecisionTree, LinearSVR]
    X_meta = np.column_stack([
        np.asarray(y_l).ravel(),
        np.asarray(y_r).ravel(),
        np.asarray(y_d).ravel(),
        np.asarray(y_s).ravel(),
    ])

    # Meta scaler transformation & final ensemble prediction
    X_meta_scaled = meta_scaler.transform(X_meta)
    y_nn = nn_model.predict(X_meta_scaled)

    results = []
    for i in range(len(y_nn)):
        val_nn = max(0.0, round(float(y_nn[i]), 2))
        val_rf = max(0.0, round(float(y_r[i]), 2))
        val_lr = max(0.0, round(float(y_l[i]), 2))
        val_svr = max(0.0, round(float(y_s[i]), 2))
        val_dt = max(0.0, round(float(y_d[i]), 2))

        bucket_info = get_aqi_bucket_info(val_nn)

        results.append({
            "predicted_aqi": val_nn,
            "aqi_bucket": bucket_info["bucket"],
            "status_color": bucket_info["color"],
            "health_advisory": bucket_info["advisory"],
            "severity_level": bucket_info["severity_level"],
            "model_breakdown": {
                "neural_network_ensemble": val_nn,
                "random_forest": val_rf,
                "linear_regression": val_lr,
                "linear_svr": val_svr,
                "decision_tree": val_dt
            }
        })
    return results


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/", tags=["Info"])
def root():
    """Root endpoint: Overview and documentation links."""
    return {
        "title": "AQI Prediction API",
        "description": "Functional endpoint for predicting Air Quality Index (AQI) with Deep Learning Ensemble",
        "status": "healthy",
        "version": "1.0.0",
        "docs_url": "/docs",
        "supported_cities_count": len(SUPPORTED_CITIES),
        "endpoints": {
            "GET /health": "Health check",
            "GET /cities": "List of supported Indian cities",
            "GET /model-info": "Loaded models and feature metadata",
            "GET /aqi-ranges": "CPCB AQI classification buckets, ranges and colors",
            "GET /sample-input": "Ready-to-use sample payload for testing / frontend auto-fill",
            "POST /predict": "Predict AQI for a single input record",
            "POST /predict/batch": "Predict AQI for multiple records in a single request"
        }
    }


@app.get("/health", tags=["Info"])
def health():
    """Health check endpoint for frontend status checks and monitoring."""
    return {
        "status": "ok",
        "models_loaded": True,
        "supported_cities": len(SUPPORTED_CITIES),
        "feature_count": len(feature_columns)
    }


@app.get("/cities", tags=["Metadata"])
def get_cities():
    """Returns the complete list of 26 supported Indian cities for frontend dropdowns."""
    return {
        "count": len(SUPPORTED_CITIES),
        "cities": sorted(SUPPORTED_CITIES)
    }


@app.get("/aqi-ranges", tags=["Metadata"])
def get_aqi_ranges():
    """Returns official CPCB AQI categories, ranges, colors, and health impacts for UI rendering."""
    return {
        "standard": "CPCB India",
        "ranges": [
            {"range": "0 - 50", "category": "Good", "color": "#00E400", "severity": 1, "description": "Minimal impact"},
            {"range": "51 - 100", "category": "Satisfactory", "color": "#92D050", "severity": 2, "description": "Minor breathing discomfort to sensitive people"},
            {"range": "101 - 200", "category": "Moderate", "color": "#FFFF00", "severity": 3, "description": "Breathing discomfort to people with lungs, asthma and heart diseases"},
            {"range": "201 - 300", "category": "Poor", "color": "#FF7E00", "severity": 4, "description": "Breathing discomfort to most people on prolonged exposure"},
            {"range": "301 - 400", "category": "Very Poor", "color": "#FF0000", "severity": 5, "description": "Respiratory illness on prolonged exposure"},
            {"range": "401+", "category": "Severe", "color": "#7E0023", "severity": 6, "description": "Affects healthy people and seriously impacts those with existing diseases"}
        ]
    }


@app.get("/sample-input", tags=["Metadata"])
def sample_input():
    """Provides a sample request payload that can be directly submitted to POST /predict."""
    return {
        "city": "Delhi",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "pm25": 85.5,
        "pm10": 160.0,
        "no": 22.0,
        "no2": 45.0,
        "nox": 50.0,
        "nh3": 25.0,
        "co": 1.5,
        "so2": 18.0,
        "o3": 38.0,
        "benzene": 3.0,
        "toluene": 9.5,
        "aqi_lag_1": 190.0,
        "aqi_lag_2": 185.0,
        "aqi_lag_3": 178.0
    }


@app.get("/model-info", tags=["Metadata"])
def model_info():
    """Detailed metadata about the trained models and stacking ensemble architecture."""
    return {
        "ensemble_type": "Neural Network Stacking Regressor",
        "meta_model": "MLPRegressor (Multi-Layer Perceptron: 64 -> 32 -> 16 -> 8 -> 4)",
        "base_models": [
            "LinearRegression",
            "RandomForestRegressor",
            "DecisionTreeRegressor",
            "LinearSVR"
        ],
        "scalers": {
            "svr_scaler": "StandardScaler (applied to all 44 input features for LinearSVR)",
            "meta_scaler": "StandardScaler (applied to 4 base model predictions before MLP)"
        },
        "total_feature_columns": len(feature_columns),
        "supported_cities": SUPPORTED_CITIES,
        "pollutants": [
            "PM2.5", "PM10", "NO", "NO2", "NOx",
            "NH3", "CO", "SO2", "O3", "Benzene", "Toluene"
        ],
        "lag_features": ["AQI_lag_1", "AQI_lag_2", "AQI_lag_3"],
        "date_features": ["Year", "Month", "Day", "DayOfWeek"]
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(payload: PredictionInput):
    """
    Predict next day's Air Quality Index (AQI) for a given city and pollutant parameters.

    Returns the ensemble AQI prediction, individual model predictions, CPCB bucket, color code, and health advisory.
    """
    row, city, date_str = prepare_row(payload)
    df_input = pd.DataFrame([row])

    prediction_results = execute_pipeline(df_input)
    res = prediction_results[0]

    return {
        "city": city,
        "target_date": date_str,
        "predicted_aqi": res["predicted_aqi"],
        "aqi_bucket": res["aqi_bucket"],
        "status_color": res["status_color"],
        "health_advisory": res["health_advisory"],
        "severity_level": res["severity_level"],
        "model_breakdown": res["model_breakdown"],
        "input_features": {
            "city": city,
            "date": date_str,
            "pm25": payload.pm25,
            "pm10": payload.pm10,
            "no": payload.no,
            "no2": payload.no2,
            "nox": payload.nox,
            "nh3": payload.nh3,
            "co": payload.co,
            "so2": payload.so2,
            "o3": payload.o3,
            "benzene": payload.benzene,
            "toluene": payload.toluene,
            "aqi_lag_1": payload.aqi_lag_1,
            "aqi_lag_2": payload.aqi_lag_2,
            "aqi_lag_3": payload.aqi_lag_3
        }
    }


@app.post("/predict/batch", tags=["Prediction"])
def predict_batch(payload: BatchPredictionInput):
    """
    Predict AQI for a batch of multiple records in a single optimized request.
    Ideal for historical replay, time series forecasting, or multi-city dashboards.
    """
    if not payload.records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'records' list cannot be empty."
        )

    rows = []
    metadata = []
    for item in payload.records:
        row, city, date_str = prepare_row(item)
        rows.append(row)
        metadata.append({"city": city, "target_date": date_str})

    df_batch = pd.DataFrame(rows)
    predictions = execute_pipeline(df_batch)

    response_items = []
    for meta, pred in zip(metadata, predictions):
        response_items.append({
            "city": meta["city"],
            "target_date": meta["target_date"],
            **pred
        })

    return {
        "total_records": len(response_items),
        "results": response_items
    }
