# AirSense — AQI Prediction System

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

**AirSense** is a machine-learning-powered web application that forecasts the next day's Air Quality Index (AQI) for 26 major Indian cities using atmospheric pollutant telemetry, historical time-series lags, and calendar components.

---

## 🏛️ System Architecture

The prediction engine utilizes a two-tier **Stacking Ensemble Regressor**:

```
Input Features (44 Columns)
│
├── 11 Atmospheric Pollutants (PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene)
├── 3 Historical AQI Lags (Lag 1, Lag 2, Lag 3)
├── 4 Temporal Calendar Parts (Year, Month, Day, DayOfWeek)
└── 26 Spatial City One-Hot Encodings
        │
        ▼
Level-0 Base Regressors
├── Linear Regression
├── Random Forest Regressor
├── Decision Tree Regressor
└── Linear SVR (StandardScaled)
        │
        ▼
Level-1 Meta-Learner (Meta-Scaled)
└── Neural Network Ensemble
        │
        ▼
Final Output: Predicted Next AQI (Continuous + CPCB Category & Health Advisory)
```

### Preliminary Test Evaluation
- **$R^2$ Score (Variance Explained):** `0.9021` (90.2%)
- **MAE (Mean Absolute Error):** `16.30` AQI points
- **RMSE (Root Mean Squared Error):** `25.30`

---

## 📁 Repository Structure

```
AQI-Prediction/
├── backend/
│   ├── saved_models/
│   │   ├── decision_tree.joblib
│   │   ├── feature_columns.joblib
│   │   ├── linear_regression.joblib
│   │   ├── linear_svr.joblib
│   │   ├── meta_scaler.joblib
│   │   ├── neural_network_ensemble.joblib
│   │   ├── random_forest.joblib
│   │   └── svr_scaler.joblib
│   ├── AQI_Prediction.ipynb              # Model training notebook
│   ├── AQI_Prediction_DataExploration.ipynb # EDA and cleaning
│   ├── aqi_test_predictions.csv         # Hold-out test predictions
│   ├── cleaned_city_day.csv             # Processed dataset
│   ├── main.py                          # FastAPI application & endpoints
│   └── requirements.txt                 # Backend Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AqiScaleBadge.jsx        # Category badge component
│   │   │   ├── AqiVisualScale.jsx       # Visual meter scale
│   │   │   └── Navbar.jsx               # Application top navigation
│   │   ├── pages/
│   │   │   └── PredictPage.jsx          # AQI prediction form & results
│   │   ├── services/
│   │   │   └── api.js                   # API integration client
│   │   ├── utils/
│   │   │   └── constants.js             # 26 cities, pollutants, CPCB scales
│   │   ├── App.jsx                      # Main app component
│   │   ├── index.css                    # Tailwind CSS directives
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: `>= 3.10`
- **Node.js**: `>= 18.0` & `npm`

---

### 2. Backend Setup (FastAPI)

1. Open a terminal and navigate to the repository root:
   ```bash
   # Create a virtual environment (optional but recommended)
   python -m venv .venv

   # Activate virtual environment
   # Windows:
   .\.venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate

   # Install dependencies
   pip install -r backend/requirements.txt
   ```

2. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The API will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### 3. Frontend Setup (React + Vite)

1. Open a separate terminal:
   ```bash
   cd frontend

   # Install Node dependencies
   npm install

   # Start Vite development server
   npm run dev
   ```

2. Open your browser at **`http://localhost:5173`**.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` | Predicts next AQI observation from 11 pollutants and 3 lags |
| `POST` | `/predict/batch` | High-throughput batch predictions |
| `GET` | `/cities` | Returns list of 26 supported Indian meteorological stations |
| `GET` | `/aqi-ranges` | CPCB official AQI classification ranges and colors |
| `GET` | `/sample-input` | Pre-configured sample payload for rapid testing |
| `GET` | `/model-info` | Metadata about model architectures and 44 input features |
| `GET` | `/health` | Liveness and health probe |
| `GET` | `/docs` | Interactive Swagger UI API documentation |

---

## 🎨 Theme & Environmental Standards
- **Color Scheme:** Dull white / light sage-tinted background with forest green accents and high-contrast typography.
- **Classification Standard:** Official CPCB (Central Pollution Control Board, India) AQI categories:
  - **Good:** 0 – 50
  - **Satisfactory:** 51 – 100
  - **Moderate:** 101 – 200
  - **Poor:** 201 – 300
  - **Very Poor:** 301 – 400
  - **Severe:** > 400

---

## 📜 License
Distributed under the MIT License.
