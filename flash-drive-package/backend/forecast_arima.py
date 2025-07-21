import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

try:
    import pmdarima as pm
    from pmdarima import auto_arima
except ImportError:
    # Fallback if pmdarima is not available
    print(json.dumps({"error": "pmdarima not available, using fallback"}))
    sys.exit(1)

def forecast_arima(data, periods, seasonal_period=12):
    """
    Perform ARIMA forecasting with automatic model selection
    """
    try:
        # Convert to numpy array and handle missing values
        data = np.array(data, dtype=float)
        data = data[~np.isnan(data)]  # Remove NaN values
        
        if len(data) < 24:
            # Not enough data for ARIMA, use simple fallback
            last_value = data[-1] if len(data) > 0 else 0
            forecast = [last_value] * periods
            return {
                "forecast": forecast,
                "confidence_lower": [max(0, v * 0.8) for v in forecast],
                "confidence_upper": [v * 1.2 for v in forecast],
                "model_info": "fallback_due_to_insufficient_data"
            }
        
        # Determine seasonal period based on data length
        if len(data) < seasonal_period * 2:
            seasonal_period = min(4, len(data) // 2)
        
        # Auto ARIMA with seasonal decomposition
        model = auto_arima(
            data,
            seasonal=True,
            m=seasonal_period,
            suppress_warnings=True,
            stepwise=True,
            error_action='ignore',
            trace=False,
            information_criterion='aic',
            max_p=3,
            max_q=3,
            max_P=2,
            max_Q=2,
            max_d=2,
            max_D=1
        )
        
        # Generate forecast with confidence intervals
        forecast, conf_int = model.predict(
            n_periods=periods,
            return_conf_int=True,
            alpha=0.05  # 95% confidence interval
        )
        
        # Ensure non-negative forecasts
        forecast = np.maximum(forecast, 0)
        conf_int = np.maximum(conf_int, 0)
        
        return {
            "forecast": forecast.tolist(),
            "confidence_lower": conf_int[:, 0].tolist(),
            "confidence_upper": conf_int[:, 1].tolist(),
            "model_info": str(model.summary()),
            "aic": model.aic(),
            "bic": model.bic()
        }
        
    except Exception as e:
        # Fallback to simple exponential smoothing
        print(f"ARIMA failed: {str(e)}", file=sys.stderr)
        alpha = 0.3
        smoothed = data[0] if len(data) > 0 else 0
        
        for i in range(1, len(data)):
            smoothed = alpha * data[i] + (1 - alpha) * smoothed
        
        forecast = [smoothed] * periods
        
        return {
            "forecast": forecast,
            "confidence_lower": [max(0, v * 0.8) for v in forecast],
            "confidence_upper": [v * 1.2 for v in forecast],
            "model_info": f"fallback_exponential_smoothing_alpha_{alpha}"
        }

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        data = input_data.get('data', [])
        periods = input_data.get('periods', 12)
        seasonal_period = input_data.get('seasonal_period', 12)
        
        # Perform forecasting
        result = forecast_arima(data, periods, seasonal_period)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "forecast": [0] * periods,
            "confidence_lower": [0] * periods,
            "confidence_upper": [0] * periods,
            "model_info": "error_fallback"
        }
        print(json.dumps(error_result)) 