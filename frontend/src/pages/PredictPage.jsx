import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import {
  SUPPORTED_CITIES,
  POLLUTANT_CONFIGS,
  DEFAULT_PREDICTION_FORM,
  getAqiCategory
} from '../utils/constants';
import { submitPrediction } from '../services/api';
import AqiScaleBadge from '../components/AqiScaleBadge';
import AqiVisualScale from '../components/AqiVisualScale';

export default function PredictPage() {
  const [formData, setFormData] = useState({ ...DEFAULT_PREDICTION_FORM });
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Filter supported cities based on user search query
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return SUPPORTED_CITIES;
    return SUPPORTED_CITIES.filter((c) =>
      c.toLowerCase().includes(citySearchQuery.toLowerCase())
    );
  }, [citySearchQuery]);

  // Derived date metadata
  const dateMeta = useMemo(() => {
    if (!formData.date) return { year: '-', month: '-', day: '-', dayOfWeek: '-' };
    const d = new Date(formData.date);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // In JS d.getDay(): 0=Sun, 1=Mon ... python df["DayOfWeek"]: 0=Mon, 6=Sun
    const pyDayOfWeek = (d.getDay() + 6) % 7;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      dayOfWeek: days[pyDayOfWeek],
      dayOfWeekIndex: pyDayOfWeek
    };
  }, [formData.date]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.city || !SUPPORTED_CITIES.includes(formData.city)) {
      errors.city = "Please select a supported Indian city.";
    }
    if (!formData.date) {
      errors.date = "Please select an observation date.";
    }

    // Check all 11 pollutants
    POLLUTANT_CONFIGS.forEach((p) => {
      const val = formData[p.key];
      if (val === '' || val === null || val === undefined) {
        errors[p.key] = `${p.label} value is required.`;
      } else if (isNaN(val) || Number(val) < 0) {
        errors[p.key] = `${p.label} must be a non-negative number.`;
      }
    });

    // Check 3 AQI lags
    ['aqi_lag_1', 'aqi_lag_2', 'aqi_lag_3'].forEach((lagKey, index) => {
      const val = formData[lagKey];
      if (val === '' || val === null || val === undefined) {
        errors[lagKey] = `Lag ${index + 1} is required by the model.`;
      } else if (isNaN(val) || Number(val) < 0) {
        errors[lagKey] = `Lag ${index + 1} must be a non-negative number.`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit prediction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const payload = {
      city: formData.city,
      date: formData.date,
      year: dateMeta.year,
      month: dateMeta.month,
      day: dateMeta.day,
      day_of_week: dateMeta.dayOfWeekIndex,
      pm25: Number(formData.pm25),
      pm10: Number(formData.pm10),
      no: Number(formData.no),
      no2: Number(formData.no2),
      nox: Number(formData.nox),
      nh3: Number(formData.nh3),
      co: Number(formData.co),
      so2: Number(formData.so2),
      o3: Number(formData.o3),
      benzene: Number(formData.benzene),
      toluene: Number(formData.toluene),
      aqi_lag_1: Number(formData.aqi_lag_1),
      aqi_lag_2: Number(formData.aqi_lag_2),
      aqi_lag_3: Number(formData.aqi_lag_3),
    };

    const res = await submitPrediction(payload);
    setIsLoading(false);

    if (res.success) {
      setPredictionResult(res.data);
      // Smoothly scroll down to result card
      setTimeout(() => {
        document.getElementById('prediction-results-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setApiError(res.error);
    }
  };

  // Populate sample values
  const handlePopulateSample = () => {
    setFormData({
      ...DEFAULT_PREDICTION_FORM,
      city: 'Delhi',
      date: new Date().toISOString().split('T')[0]
    });
    setValidationErrors({});
    setApiError(null);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      city: 'Delhi',
      date: new Date().toISOString().split('T')[0],
      pm25: '',
      pm10: '',
      no: '',
      no2: '',
      nox: '',
      nh3: '',
      co: '',
      so2: '',
      o3: '',
      benzene: '',
      toluene: '',
      aqi_lag_1: '',
      aqi_lag_2: '',
      aqi_lag_3: ''
    });
    setValidationErrors({});
    setPredictionResult(null);
    setApiError(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full py-2">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-airsense-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-airsense-emeraldLight text-airsense-primary border border-airsense-emerald/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Air Quality Index Predictor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-airsense-dark tracking-tight">
            Predict Next AQI
          </h1>
          <p className="text-sm text-airsense-muted mt-1">
            Input atmospheric pollutant levels and past AQI readings to generate the predicted next AQI observation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePopulateSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-airsense-border hover:bg-airsense-cardMuted text-airsense-charcoal shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-airsense-primary" />
            <span>Fill Sample Data</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-airsense-border hover:bg-airsense-cardMuted text-airsense-muted hover:text-airsense-dark shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Prediction Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Spatial & Temporal Context */}
        <div className="bg-white rounded-2xl border border-airsense-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-airsense-dark border-b border-airsense-border pb-3">
            <MapPin className="w-4 h-4 text-airsense-primary" />
            <span>1. City & Observation Date</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* City Dropdown with Search */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-airsense-charcoal mb-1.5">
                City <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-airsense-bg rounded-xl border transition-colors ${
                    validationErrors.city
                      ? 'border-red-400 bg-red-50/50'
                      : 'border-airsense-border hover:border-airsense-primary/50 focus:border-airsense-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-airsense-primary" />
                    <span className="font-semibold text-airsense-dark">{formData.city || "Select City"}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-airsense-muted" />
                </button>

                {/* Dropdown menu */}
                {cityDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-airsense-border rounded-xl shadow-elevated p-2 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-airsense-muted" />
                      <input
                        type="text"
                        placeholder="Search 26 supported cities..."
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-airsense-bg rounded-lg border border-airsense-border focus:outline-hidden focus:border-airsense-primary"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                          <div
                            key={city}
                            onClick={() => {
                              handleInputChange('city', city);
                              setCityDropdownOpen(false);
                              setCitySearchQuery('');
                            }}
                            className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                              formData.city === city
                                ? 'bg-airsense-primary text-white font-semibold'
                                : 'hover:bg-airsense-cardMuted text-airsense-charcoal'
                            }`}
                          >
                            <span>{city}</span>
                            {formData.city === city && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-airsense-muted text-center">
                          No matching supported city
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {validationErrors.city && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.city}
                </p>
              )}
              <p className="text-[11px] text-airsense-muted mt-1">
                Trained on 26 Indian meteorological stations.
              </p>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-airsense-charcoal mb-1.5">
                Observation Date <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-airsense-bg rounded-xl border text-airsense-dark font-medium focus:outline-hidden focus:border-airsense-primary ${
                    validationErrors.date ? 'border-red-400 bg-red-50/50' : 'border-airsense-border'
                  }`}
                />
              </div>

              {validationErrors.date && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.date}
                </p>
              )}

              {/* Derived Date Info Pill */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-airsense-muted">
                <span className="font-medium text-airsense-charcoal">Derived features:</span>
                <span className="bg-airsense-cardMuted px-2 py-0.5 rounded border border-airsense-border font-mono">
                  Year: {dateMeta.year}
                </span>
                <span className="bg-airsense-cardMuted px-2 py-0.5 rounded border border-airsense-border font-mono">
                  Month: {dateMeta.month}
                </span>
                <span className="bg-airsense-cardMuted px-2 py-0.5 rounded border border-airsense-border font-mono">
                  Day: {dateMeta.day}
                </span>
                <span className="bg-airsense-cardMuted px-2 py-0.5 rounded border border-airsense-border font-mono">
                  {dateMeta.dayOfWeek}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pollutant Concentrations (11 Features) */}
        <div className="bg-white rounded-2xl border border-airsense-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-airsense-border pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-airsense-dark">
              <Layers className="w-4 h-4 text-airsense-primary" />
              <span>2. Chemical & Particulate Pollutant Readings</span>
            </div>
            <span className="text-xs text-airsense-muted">
              Non-negative numeric readings required
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {POLLUTANT_CONFIGS.map((p) => {
              const hasError = !!validationErrors[p.key];
              return (
                <div
                  key={p.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    hasError
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-airsense-border bg-airsense-bg/40 focus-within:bg-white focus-within:border-airsense-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-airsense-dark flex items-center gap-1">
                      <span>{p.label}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono font-medium text-airsense-muted bg-white px-1.5 py-0.5 rounded border border-airsense-border">
                      {p.unit}
                    </span>
                  </div>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder={`e.g. ${p.typical}`}
                    value={formData[p.key]}
                    onChange={(e) => handleInputChange(p.key, e.target.value)}
                    className="w-full py-1.5 px-2 bg-transparent text-sm font-semibold text-airsense-charcoal focus:outline-hidden"
                  />

                  <div className="text-[10px] text-airsense-muted truncate mt-1" title={p.description}>
                    {p.description}
                  </div>

                  {hasError && (
                    <div className="text-[10px] text-red-600 mt-1 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>{validationErrors[p.key]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Historical AQI Lags (3 Features) */}
        <div className="bg-white rounded-2xl border border-airsense-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-airsense-dark border-b border-airsense-border pb-3">
            <Clock className="w-4 h-4 text-airsense-primary" />
            <span>3. Historical AQI Lag Values</span>
          </div>

          <div className="bg-airsense-cardMuted border border-airsense-border rounded-xl p-3 text-xs text-airsense-muted flex items-start gap-2.5">
            <Info className="w-4 h-4 text-airsense-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Time-Series Context:</strong> The model requires the three preceding consecutive AQI observations (Lag 1, Lag 2, and Lag 3) to capture persistent atmospheric trends.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lag 1 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                validationErrors.aqi_lag_1
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-airsense-border bg-airsense-bg/40 focus-within:bg-white focus-within:border-airsense-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-airsense-dark">
                  Previous AQI (Lag 1) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-airsense-muted">1 day prior</span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 190.0"
                value={formData.aqi_lag_1}
                onChange={(e) => handleInputChange('aqi_lag_1', e.target.value)}
                className="w-full py-1.5 px-2 bg-transparent text-sm font-semibold text-airsense-charcoal focus:outline-hidden"
              />
              <p className="text-[10px] text-airsense-muted mt-1">Most recent recorded day</p>
              {validationErrors.aqi_lag_1 && (
                <p className="text-[10px] text-red-600 mt-1">{validationErrors.aqi_lag_1}</p>
              )}
            </div>

            {/* Lag 2 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                validationErrors.aqi_lag_2
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-airsense-border bg-airsense-bg/40 focus-within:bg-white focus-within:border-airsense-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-airsense-dark">
                  AQI 2 Days Ago (Lag 2) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-airsense-muted">2 days prior</span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 185.0"
                value={formData.aqi_lag_2}
                onChange={(e) => handleInputChange('aqi_lag_2', e.target.value)}
                className="w-full py-1.5 px-2 bg-transparent text-sm font-semibold text-airsense-charcoal focus:outline-hidden"
              />
              <p className="text-[10px] text-airsense-muted mt-1">Two days preceding target</p>
              {validationErrors.aqi_lag_2 && (
                <p className="text-[10px] text-red-600 mt-1">{validationErrors.aqi_lag_2}</p>
              )}
            </div>

            {/* Lag 3 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                validationErrors.aqi_lag_3
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-airsense-border bg-airsense-bg/40 focus-within:bg-white focus-within:border-airsense-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-airsense-dark">
                  AQI 3 Days Ago (Lag 3) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-airsense-muted">3 days prior</span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 178.0"
                value={formData.aqi_lag_3}
                onChange={(e) => handleInputChange('aqi_lag_3', e.target.value)}
                className="w-full py-1.5 px-2 bg-transparent text-sm font-semibold text-airsense-charcoal focus:outline-hidden"
              />
              <p className="text-[10px] text-airsense-muted mt-1">Three days preceding target</p>
              {validationErrors.aqi_lag_3 && (
                <p className="text-[10px] text-red-600 mt-1">{validationErrors.aqi_lag_3}</p>
              )}
            </div>
          </div>
        </div>

        {/* Backend Error Warning */}
        {apiError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Backend Service Unavailable</div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">{apiError}</p>
              <p className="mt-1 text-[11px] text-amber-700">
                Backend URL: <code className="bg-white/80 px-1 py-0.5 rounded border font-mono">https://aqi-prediction-g6us.onrender.com</code> (Render free instances may take ~30 seconds to wake up if sleeping).
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-bold text-white bg-airsense-primary hover:bg-airsense-primaryHover shadow-card hover:shadow-elevated transition-all duration-200 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Computing Prediction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Predict Next AQI</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Anchor for automatic smooth scroll */}
      <div id="prediction-results-anchor" />

      {/* Section 4: Final Prediction Results Card (Only final prediction, no model breakdown, no neon yellow) */}
      {predictionResult && (
        <div className="bg-white rounded-2xl border-2 border-airsense-primary/30 p-6 sm:p-8 shadow-card space-y-6 animate-scaleUp">
          {/* Result Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-airsense-border">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-airsense-primary mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Final AQI Prediction</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-airsense-dark">
                Predicted Air Quality for {predictionResult.city}
              </h2>
              <p className="text-xs text-airsense-muted mt-0.5">
                Target date: <span className="font-semibold text-airsense-charcoal">{predictionResult.target_date}</span>
              </p>
            </div>

            <div className="self-start sm:self-auto">
              <AqiScaleBadge aqi={predictionResult.predicted_aqi} size="lg" />
            </div>
          </div>

          {/* Main Hero Prediction Numbers (Rendered in solid dark slate, never bright yellow) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Big AQI Number - Solid legible dark charcoal text */}
            <div className="bg-airsense-bg rounded-xl border border-airsense-border p-5 text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-airsense-muted">
                Estimated Next AQI
              </span>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-airsense-dark">
                {predictionResult.predicted_aqi}
              </div>
              <div className="pt-1">
                <AqiScaleBadge aqi={predictionResult.predicted_aqi} size="sm" />
              </div>
            </div>

            {/* Comparison with Historical Lag 1 */}
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-airsense-border bg-airsense-cardMuted">
                  <div className="text-[11px] text-airsense-muted font-medium">Previous Day (Lag 1)</div>
                  <div className="text-xl font-bold text-airsense-charcoal mt-0.5">
                    {formData.aqi_lag_1} AQI
                  </div>
                  <div className="text-[10px] text-airsense-muted mt-1">
                    Category: {getAqiCategory(formData.aqi_lag_1).category}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-airsense-border bg-airsense-cardMuted">
                  <div className="text-[11px] text-airsense-muted font-medium">Relative Shift</div>
                  {Number(formData.aqi_lag_1) > 0 ? (
                    (() => {
                      const prev = Number(formData.aqi_lag_1);
                      const pred = Number(predictionResult.predicted_aqi);
                      const diff = pred - prev;
                      const pct = ((diff / prev) * 100).toFixed(1);
                      const isUp = diff > 0;
                      return (
                        <>
                          <div className={`text-xl font-bold mt-0.5 flex items-center gap-1 ${isUp ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <span>{isUp ? `+${pct}%` : `${pct}%`}</span>
                          </div>
                          <div className="text-[10px] text-airsense-muted mt-1 font-medium">
                            {isUp ? 'Higher than previous observation' : 'Lower than previous observation'}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm font-semibold text-airsense-muted mt-1">
                      N/A (Lag 1 was zero)
                    </div>
                  )}
                </div>
              </div>

              {/* Health Advisory */}
              {predictionResult.health_advisory && (
                <div className="p-3.5 rounded-xl bg-airsense-bg border border-airsense-border text-xs text-airsense-charcoal leading-relaxed">
                  <span className="font-bold text-airsense-primary">CPCB Advisory: </span>
                  {predictionResult.health_advisory}
                </div>
              )}
            </div>
          </div>

          {/* Visual Scale Meter */}
          <div className="pt-2">
            <AqiVisualScale aqi={predictionResult.predicted_aqi} />
          </div>

          {/* Model Estimate Disclaimer & Reset Action */}
          <div className="pt-4 border-t border-airsense-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-airsense-muted">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-airsense-primary shrink-0" />
              <span>
                <strong>Note:</strong> Machine learning model estimate based on input features, not an official regulatory measurement.
              </span>
            </div>

            <button
              onClick={() => {
                setPredictionResult(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-airsense-primary hover:text-airsense-primaryHover shrink-0 cursor-pointer"
            >
              <span>Make Another Prediction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
