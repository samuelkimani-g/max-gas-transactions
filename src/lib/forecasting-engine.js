// Comprehensive Forecasting Engine
// Handles both small datasets (with safety checks) and large datasets (with advanced algorithms)

export class ForecastingEngine {
  constructor() {
    this.models = {
      // Simple models for small datasets
      simple: new SimpleForecastModel(),
      trend: new TrendForecastModel(),
      average: new AverageForecastModel(),
      
      // Advanced models for large datasets
      arima: new ARIMAModel(),
      exponential: new ExponentialSmoothingModel(),
      regression: new LinearRegressionModel(),
      seasonal: new SeasonalDecompositionModel(),
      monteCarlo: new MonteCarloSimulation(),
      volatility: new VolatilityModel(),
      neural: new NeuralNetworkModel()
    }
  }

  // Main forecasting method with intelligent model selection
  async forecast(data, period = 'monthly', forecastPeriods = 12, confidenceLevel = 0.95) {
    try {
      // Validate input data
      if (!data || data.length === 0) {
        return this.getDefaultForecast(forecastPeriods)
      }

    const processedData = this.preprocessData(data, period)
    
      // Determine dataset size and select appropriate models
      const dataSize = processedData.cleaned.length
      const isLargeDataset = dataSize >= 20 // Threshold for advanced models
      
      let forecasts = []
      let modelNames = []
      
      if (isLargeDataset) {
        // Use advanced models for large datasets
        console.log(`Using advanced forecasting models for ${dataSize} data points`)
        
        forecasts = await Promise.all([
      this.models.arima.forecast(processedData, forecastPeriods),
      this.models.exponential.forecast(processedData, forecastPeriods),
      this.models.regression.forecast(processedData, forecastPeriods),
          this.models.seasonal.forecast(processedData, forecastPeriods),
          this.models.neural.forecast(processedData, forecastPeriods)
        ])
        
        modelNames = ['ARIMA', 'Exponential', 'Regression', 'Seasonal', 'Neural']
      } else {
        // Use simple models for small datasets
        console.log(`Using simple forecasting models for ${dataSize} data points`)
        
        forecasts = await Promise.all([
          this.models.simple.forecast(processedData, forecastPeriods),
          this.models.trend.forecast(processedData, forecastPeriods),
          this.models.average.forecast(processedData, forecastPeriods)
        ])
        
        modelNames = ['Simple', 'Trend', 'Average']
      }

    // Ensemble the results with weighted averaging
      const ensembleForecast = this.ensembleForecasts(forecasts, processedData, modelNames)
      
      // Calculate confidence intervals
      const confidenceIntervals = isLargeDataset 
        ? await this.calculateAdvancedConfidenceIntervals(ensembleForecast, processedData, confidenceLevel)
        : this.calculateSimpleConfidenceIntervals(ensembleForecast, processedData, confidenceLevel)

      // Calculate performance metrics
      const modelPerformance = this.calculateModelPerformance(forecasts, processedData, modelNames)
      
      // Calculate risk metrics
      const riskMetrics = isLargeDataset
        ? this.calculateAdvancedRiskMetrics(ensembleForecast, processedData)
        : this.calculateSimpleRiskMetrics(ensembleForecast, processedData)

    return {
      forecast: ensembleForecast,
      confidenceIntervals,
        modelPerformance,
        riskMetrics,
        volatilityMetrics: this.models.volatility.calculateMetrics(processedData),
        dataSize,
        modelType: isLargeDataset ? 'advanced' : 'simple'
      }
    } catch (error) {
      console.error('Forecast generation failed:', error)
      return this.getDefaultForecast(forecastPeriods)
    }
  }

  // Get default forecast when data is insufficient
  getDefaultForecast(periods) {
    const defaultForecast = Array(periods).fill(0)
    const defaultIntervals = Array(periods).fill({ lower: 0, upper: 0, mean: 0 })
    
    return {
      forecast: defaultForecast,
      confidenceIntervals: defaultIntervals,
      modelPerformance: {
        simple: { accuracy: 0, mape: 0 },
        trend: { accuracy: 0, mape: 0 },
        average: { accuracy: 0, mape: 0 }
      },
      riskMetrics: {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        valueAtRisk: 0,
        expectedShortfall: 0
      },
      volatilityMetrics: {
        historicalVolatility: 0,
        impliedVolatility: 0,
        volatilityOfVolatility: 0
      },
      dataSize: 0,
      modelType: 'default'
    }
  }

  // Preprocess data with comprehensive error handling
  preprocessData(data, period) {
    try {
    const timeSeries = this.createTimeSeries(data, period)
    const cleaned = this.removeOutliers(timeSeries)
    const normalized = this.normalizeData(cleaned)
    
    return {
      original: timeSeries,
        cleaned: cleaned.length > 0 ? cleaned : timeSeries,
      normalized,
      period,
      statistics: this.calculateStatistics(timeSeries)
      }
    } catch (error) {
      console.error('Data preprocessing failed:', error)
      return {
        original: [],
        cleaned: [],
        normalized: [],
        period,
        statistics: { mean: 0, stdDev: 0, min: 0, max: 0, median: 0, skewness: 0, kurtosis: 0 }
      }
    }
  }

  // Create time series from transaction data
  createTimeSeries(data, period) {
    const grouped = this.groupByPeriod(data, period)
    return Object.entries(grouped).map(([date, transactions]) => ({
      date: new Date(date),
      value: transactions.reduce((sum, t) => sum + this.calculateTransactionValue(t), 0),
      volume: transactions.length,
      transactions
    })).sort((a, b) => a.date - b.date)
  }

  // Group transactions by time period
  groupByPeriod(data, period) {
    const grouped = {}
    
    data.forEach(transaction => {
      if (!transaction || !transaction.date) return
      
      const date = new Date(transaction.date)
      if (isNaN(date.getTime())) return
      
      let key
      
      switch (period) {
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-Q${quarter}`
          break
        case 'yearly':
          key = date.getFullYear().toString()
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(transaction)
    })
    
    return grouped
  }

  // Calculate transaction value
  calculateTransactionValue(transaction) {
    if (!transaction) return 0
    
    try {
    // MaxGas Refills - Price is per kg
    const refill6kg = (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135)
    const refill13kg = (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135)
    const refill50kg = (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)
    
    // MaxGas Outright Sales - Price is per cylinder
    const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
    const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
    const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)
    
    // Other Company Swipes - Price is per kg
    const swipe6kg = (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160)
    const swipe13kg = (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160)
    const swipe50kg = (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)
    
    return refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
    } catch (error) {
      console.error('Transaction value calculation failed:', error)
      return 0
    }
  }

  // Remove outliers with safety checks
  removeOutliers(data) {
    if (data.length < 4) return data
    
    try {
      const values = data.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      if (values.length === 0) return data
      
    const sorted = values.sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
      
      if (iqr === 0) return data
      
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    return data.filter(d => d.value >= lowerBound && d.value <= upperBound)
    } catch (error) {
      console.error('Outlier removal failed:', error)
      return data
    }
  }

  // Normalize data using z-score
  normalizeData(data) {
    try {
      const values = data.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      if (values.length === 0) return data
      
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
      
      if (stdDev === 0) return data
    
    return data.map(d => ({
      ...d,
      normalizedValue: (d.value - mean) / stdDev
    }))
    } catch (error) {
      console.error('Data normalization failed:', error)
      return data
    }
  }

  // Calculate comprehensive statistics
  calculateStatistics(data) {
    try {
      const values = data.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      if (values.length === 0) {
        return { mean: 0, stdDev: 0, min: 0, max: 0, median: 0, skewness: 0, kurtosis: 0 }
      }
      
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    return {
        mean: isNaN(mean) ? 0 : mean,
        stdDev: isNaN(stdDev) ? 0 : stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      median: this.calculateMedian(values),
      skewness: this.calculateSkewness(values, mean, stdDev),
      kurtosis: this.calculateKurtosis(values, mean, stdDev)
      }
    } catch (error) {
      console.error('Statistics calculation failed:', error)
      return { mean: 0, stdDev: 0, min: 0, max: 0, median: 0, skewness: 0, kurtosis: 0 }
    }
  }

  // Calculate median
  calculateMedian(values) {
    try {
    const sorted = values.sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    } catch (error) {
      return 0
    }
  }

  // Calculate skewness
  calculateSkewness(values, mean, stdDev) {
    try {
      if (stdDev === 0) return 0
    const n = values.length
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n
      return isNaN(skewness) ? 0 : skewness
    } catch (error) {
      return 0
    }
  }

  // Calculate kurtosis
  calculateKurtosis(values, mean, stdDev) {
    try {
      if (stdDev === 0) return 0
    const n = values.length
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3
      return isNaN(kurtosis) ? 0 : kurtosis
    } catch (error) {
      return 0
    }
  }

  // Ensemble forecasts with weighted averaging
  ensembleForecasts(forecasts, data, modelNames) {
    try {
      const periods = forecasts[0].length
      const weights = this.calculateModelWeights(forecasts, data, modelNames)
      const ensemble = []
      
      for (let i = 0; i < periods; i++) {
        let weightedSum = 0
        let totalWeight = 0
        
        forecasts.forEach((forecast, modelIndex) => {
          const value = forecast[i]
          const weight = weights[modelIndex]
          
          if (!isNaN(value) && isFinite(value) && weight > 0) {
            weightedSum += value * weight
            totalWeight += weight
          }
        })
        
        const average = totalWeight > 0 ? weightedSum / totalWeight : 0
        ensemble.push(Math.max(0, average))
      }
      
      return ensemble
    } catch (error) {
      console.error('Ensemble calculation failed:', error)
      return Array(12).fill(0)
    }
  }

  // Calculate model weights based on performance
  calculateModelWeights(forecasts, data, modelNames) {
    try {
      const actualValues = data.cleaned.map(d => d.value)
      if (actualValues.length === 0) {
        return modelNames.map(() => 1 / modelNames.length) // Equal weights
      }
      
      const errors = forecasts.map(forecast => {
        const minLength = Math.min(actualValues.length, forecast.length)
        const mse = actualValues.slice(0, minLength).reduce((sum, actual, i) => {
          return sum + Math.pow(actual - forecast[i], 2)
        }, 0) / minLength
        return mse
      })
      
      // Convert errors to weights (lower error = higher weight)
      const totalError = errors.reduce((sum, error) => sum + error, 0)
      if (totalError === 0) {
        return modelNames.map(() => 1 / modelNames.length)
      }
      
      const weights = errors.map(error => totalError / (error * modelNames.length))
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
      
      return weights.map(weight => weight / totalWeight)
    } catch (error) {
      console.error('Weight calculation failed:', error)
      return modelNames.map(() => 1 / modelNames.length)
    }
  }

  // Calculate model performance
  calculateModelPerformance(forecasts, data, modelNames) {
    try {
      const actualValues = data.cleaned.map(d => d.value)
      if (actualValues.length === 0) {
        return modelNames.reduce((acc, name) => {
          acc[name.toLowerCase()] = { accuracy: 0, mape: 0 }
          return acc
        }, {})
      }
      
      const performance = {}
      
      modelNames.forEach((name, index) => {
        const forecast = forecasts[index]
        const accuracy = this.calculateAccuracy(actualValues, forecast)
        const mape = this.calculateMAPE(actualValues, forecast)
        
        performance[name.toLowerCase()] = {
          accuracy: isNaN(accuracy) ? 0 : accuracy,
          mape: isNaN(mape) ? 0 : mape
        }
      })
      
      return performance
    } catch (error) {
      console.error('Performance calculation failed:', error)
      return modelNames.reduce((acc, name) => {
        acc[name.toLowerCase()] = { accuracy: 0, mape: 0 }
        return acc
      }, {})
    }
  }

  // Calculate simple confidence intervals
  calculateSimpleConfidenceIntervals(forecast, data, confidenceLevel) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      const stdDev = values.length > 1 ? this.calculateStatistics(data.cleaned).stdDev : 0
      const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.90 ? 1.645 : 2.576
      
      return forecast.map(value => ({
        lower: Math.max(0, value - zScore * stdDev),
        upper: value + zScore * stdDev,
        mean: value
      }))
    } catch (error) {
      console.error('Simple confidence interval calculation failed:', error)
      return forecast.map(value => ({ lower: value, upper: value, mean: value }))
    }
  }

  // Calculate advanced confidence intervals using Monte Carlo
  async calculateAdvancedConfidenceIntervals(forecast, data, confidenceLevel) {
    try {
      return await this.models.monteCarlo.calculateConfidenceIntervals(forecast, data, confidenceLevel)
    } catch (error) {
      console.error('Advanced confidence interval calculation failed:', error)
      return this.calculateSimpleConfidenceIntervals(forecast, data, confidenceLevel)
    }
  }

  // Calculate simple risk metrics
  calculateSimpleRiskMetrics(forecast, data) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      const volatility = values.length > 1 ? this.calculateVolatility(values) : 0
      const sharpeRatio = this.calculateSharpeRatio(values)
      const maxDrawdown = this.calculateMaxDrawdown(values)
      
      return {
        volatility: isNaN(volatility) ? 0 : volatility,
        sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
        maxDrawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown,
        valueAtRisk: 0,
        expectedShortfall: 0
      }
    } catch (error) {
      console.error('Simple risk metrics calculation failed:', error)
      return { volatility: 0, sharpeRatio: 0, maxDrawdown: 0, valueAtRisk: 0, expectedShortfall: 0 }
    }
  }

  // Calculate advanced risk metrics
  calculateAdvancedRiskMetrics(forecast, data) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      const returns = this.calculateReturns(values)
      
      if (returns.length === 0) {
        return this.calculateSimpleRiskMetrics(forecast, data)
      }
      
      // Calculate comprehensive risk metrics
      const volatility = this.calculateVolatility(values)
      const sharpeRatio = this.calculateSharpeRatio(values)
      const maxDrawdown = this.calculateMaxDrawdown(values)
      const valueAtRisk = this.calculateVaR(returns, 0.95)
      const expectedShortfall = this.calculateExpectedShortfall(returns, 0.95)
      const beta = this.calculateBeta(returns)
      const sortinoRatio = this.calculateSortinoRatio(returns)
      const calmarRatio = this.calculateCalmarRatio(values, maxDrawdown)
      const informationRatio = this.calculateInformationRatio(returns)
    
    return {
        volatility: isNaN(volatility) ? 0 : volatility,
        sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
        maxDrawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown,
        valueAtRisk: isNaN(valueAtRisk) ? 0 : valueAtRisk,
        expectedShortfall: isNaN(expectedShortfall) ? 0 : expectedShortfall,
        beta: isNaN(beta) ? 0 : beta,
        sortinoRatio: isNaN(sortinoRatio) ? 0 : sortinoRatio,
        calmarRatio: isNaN(calmarRatio) ? 0 : calmarRatio,
        informationRatio: isNaN(informationRatio) ? 0 : informationRatio,
        skewness: this.calculateSkewness(returns),
        kurtosis: this.calculateKurtosis(returns),
        var95: this.calculateVaR(returns, 0.95),
        var99: this.calculateVaR(returns, 0.99),
        cvar95: this.calculateExpectedShortfall(returns, 0.95),
        cvar99: this.calculateExpectedShortfall(returns, 0.99)
      }
    } catch (error) {
      console.error('Advanced risk metrics calculation failed:', error)
      return this.calculateSimpleRiskMetrics(forecast, data)
    }
  }

  // Calculate Sortino Ratio (risk-adjusted return using downside deviation)
  calculateSortinoRatio(returns, riskFreeRate = 0.02) {
    try {
      if (returns.length === 0) return 0
      
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const downsideReturns = returns.filter(r => r < mean)
      
      if (downsideReturns.length === 0) return 0
      
      const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / downsideReturns.length
      const downsideDeviation = Math.sqrt(downsideVariance)
      
      return downsideDeviation > 0 ? (mean - riskFreeRate) / downsideDeviation : 0
    } catch (error) {
      return 0
    }
  }

  // Calculate Calmar Ratio (return to max drawdown ratio)
  calculateCalmarRatio(values, maxDrawdown) {
    try {
      if (values.length < 2 || maxDrawdown === 0) return 0
      
      const returns = this.calculateReturns(values)
      if (returns.length === 0) return 0
      
      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const annualizedReturn = meanReturn * 12 // Assuming monthly data
      
      return maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0
    } catch (error) {
      return 0
    }
  }

  // Calculate Information Ratio (excess return to tracking error)
  calculateInformationRatio(returns, benchmarkReturns = null) {
    try {
      if (returns.length === 0) return 0
      
      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      
      if (benchmarkReturns && benchmarkReturns.length > 0) {
        const meanBenchmark = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length
        const excessReturns = returns.map((r, i) => r - (benchmarkReturns[i] || meanBenchmark))
        const trackingError = this.calculateVolatility(excessReturns)
        
        return trackingError > 0 ? (meanReturn - meanBenchmark) / trackingError : 0
      } else {
        // Use zero as benchmark
        const trackingError = this.calculateVolatility(returns)
        return trackingError > 0 ? meanReturn / trackingError : 0
      }
    } catch (error) {
      return 0
    }
  }

  // Calculate Beta (systematic risk)
  calculateBeta(returns, marketReturns = null) {
    try {
      if (returns.length === 0) return 0
      
      if (marketReturns && marketReturns.length > 0) {
        const covariance = this.calculateCovariance(returns, marketReturns)
        const marketVariance = this.calculateVariance(marketReturns)
        
        return marketVariance > 0 ? covariance / marketVariance : 1
      } else {
        // Assume beta of 1 if no market data
        return 1
      }
    } catch (error) {
      return 1
    }
  }

  // Calculate Skewness (distribution asymmetry)
  calculateSkewness(returns) {
    try {
      if (returns.length === 0) return 0
      
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
      const stdDev = Math.sqrt(variance)
      
      if (stdDev === 0) return 0
      
      const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / returns.length
      return isNaN(skewness) ? 0 : skewness
    } catch (error) {
      return 0
    }
  }

  // Calculate Kurtosis (distribution tail heaviness)
  calculateKurtosis(returns) {
    try {
      if (returns.length === 0) return 0
      
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
      const stdDev = Math.sqrt(variance)
      
      if (stdDev === 0) return 0
      
      const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / returns.length - 3
      return isNaN(kurtosis) ? 0 : kurtosis
    } catch (error) {
      return 0
    }
  }

  // Calculate Covariance
  calculateCovariance(x, y) {
    try {
      if (x.length !== y.length || x.length === 0) return 0
      
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length
      
      const covariance = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / x.length
      return isNaN(covariance) ? 0 : covariance
    } catch (error) {
      return 0
    }
  }

  // Calculate Variance
  calculateVariance(values) {
    try {
      if (values.length === 0) return 0
      
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      return isNaN(variance) ? 0 : variance
    } catch (error) {
      return 0
    }
  }

  // Helper methods
  calculateAccuracy(actual, predicted) {
    if (actual.length === 0 || predicted.length === 0) return 0
    
    try {
      const minLength = Math.min(actual.length, predicted.length)
      const errors = []
      
      for (let i = 0; i < minLength; i++) {
        if (actual[i] > 0) {
          errors.push(Math.abs(actual[i] - predicted[i]) / actual[i])
        }
      }
      
      return errors.length > 0 ? (1 - errors.reduce((sum, e) => sum + e, 0) / errors.length) * 100 : 0
    } catch (error) {
      return 0
    }
  }

  calculateMAPE(actual, predicted) {
    if (actual.length === 0 || predicted.length === 0) return 0
    
    try {
      const minLength = Math.min(actual.length, predicted.length)
      const errors = []
      
      for (let i = 0; i < minLength; i++) {
        if (actual[i] > 0) {
          errors.push(Math.abs(actual[i] - predicted[i]) / actual[i])
        }
      }
      
      return errors.length > 0 ? errors.reduce((sum, e) => sum + e, 0) / errors.length * 100 : 0
    } catch (error) {
      return 0
    }
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0
    
    try {
      const returns = []
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0) {
          returns.push((values[i] - values[i - 1]) / values[i - 1])
        }
      }
      
      if (returns.length === 0) return 0
      
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
    } catch (error) {
      return 0
    }
  }

  calculateReturns(values) {
    const returns = []
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1])
      }
    }
    return returns
  }

  calculateSharpeRatio(values, riskFreeRate = 0.02) {
    const volatility = this.calculateVolatility(values)
    if (volatility === 0) return 0
    
    try {
      const returns = this.calculateReturns(values)
      if (returns.length === 0) return 0
      
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    return (mean - riskFreeRate) / volatility
    } catch (error) {
      return 0
    }
  }

  calculateMaxDrawdown(values) {
    if (values.length === 0) return 0
    
    try {
    let peak = values[0]
      let maxDrawdown = 0
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i]
        } else {
      const drawdown = (peak - values[i]) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
        }
    }
    
    return maxDrawdown
    } catch (error) {
      return 0
    }
  }

  calculateVaR(returns, confidenceLevel) {
    try {
      if (returns.length === 0) return 0
      
      const sorted = returns.sort((a, b) => a - b)
      const index = Math.floor(returns.length * (1 - confidenceLevel))
      return sorted[index] || 0
    } catch (error) {
      return 0
    }
  }

  calculateExpectedShortfall(returns, confidenceLevel) {
    try {
      if (returns.length === 0) return 0
      
      const sorted = returns.sort((a, b) => a - b)
      const cutoffIndex = Math.floor(returns.length * (1 - confidenceLevel))
      const tailReturns = sorted.slice(0, cutoffIndex)
      
      return tailReturns.length > 0 ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length : 0
    } catch (error) {
      return 0
    }
  }
}

// Simple Forecast Model (last value)
class SimpleForecastModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      const lastValue = values.length > 0 ? values[values.length - 1] : 0
      
      return Array(periods).fill(Math.max(0, lastValue))
    } catch (error) {
      console.error('Simple forecast failed:', error)
      return Array(periods).fill(0)
    }
  }
}

// Trend Forecast Model (linear trend)
class TrendForecastModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length < 2) {
        return Array(periods).fill(values.length > 0 ? values[0] : 0)
      }
      
      const n = values.length
      const sumX = (n * (n - 1)) / 2
      const sumY = values.reduce((sum, val) => sum + val, 0)
      const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
      const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
      
      const denominator = n * sumX2 - sumX * sumX
      if (denominator === 0) {
        return Array(periods).fill(sumY / n)
      }
      
      const slope = (n * sumXY - sumX * sumY) / denominator
      const intercept = (sumY - slope * sumX) / n
      
      const forecast = []
      for (let i = 0; i < periods; i++) {
        const prediction = intercept + slope * (n + i)
        forecast.push(Math.max(0, prediction))
      }
      
      return forecast
    } catch (error) {
      console.error('Trend forecast failed:', error)
      return Array(periods).fill(0)
    }
  }
}

// Average Forecast Model (moving average)
class AverageForecastModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length === 0) {
        return Array(periods).fill(0)
      }
      
      const average = values.reduce((sum, val) => sum + val, 0) / values.length
      
      return Array(periods).fill(Math.max(0, average))
    } catch (error) {
      console.error('Average forecast failed:', error)
      return Array(periods).fill(0)
    }
  }
}

// ARIMA Model (AutoRegressive Integrated Moving Average) with Python integration
class ARIMAModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length < 24) {
        console.warn('ARIMA requires more data; falling back to simple model.')
        const lastValue = values.length > 0 ? values[values.length - 1] : 0
        return Array(periods).fill(Math.max(0, lastValue))
      }

      // Try to use Python ARIMA script
      try {
        const result = await this.callPythonARIMA(values, periods)
        return result.forecast.map(v => Math.max(0, v))
      } catch (pythonError) {
        console.warn('Python ARIMA failed, using JavaScript fallback:', pythonError)
        return this.fallbackARIMA(values, periods)
      }
    } catch (error) {
      console.error('ARIMA forecast failed:', error)
      return Array(periods).fill(0)
    }
  }

  async callPythonARIMA(values, periods) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process')
      const pythonProcess = spawn('python', ['backend/forecast_arima.py'])
      let forecastResult = ''
      let error = ''

      // Send data to Python script
      const inputData = {
        data: values,
        periods: periods,
        seasonal_period: 12
      }
      
      pythonProcess.stdin.write(JSON.stringify(inputData))
      pythonProcess.stdin.end()

      // Collect results
      pythonProcess.stdout.on('data', (data) => {
        forecastResult += data.toString()
      })

      // Collect errors
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString()
      })

      // Process results when the script finishes
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`ARIMA script exited with code ${code}: ${error}`)
          return reject(new Error('ARIMA forecast failed.'))
        }
        
        try {
          const result = JSON.parse(forecastResult)
          if (result.error) {
            console.warn('ARIMA Python script error:', result.error)
            return reject(new Error(result.error))
          }
          resolve(result)
        } catch (e) {
          console.error('Failed to parse ARIMA result:', e)
          reject(e)
        }
      })
    })
  }

  fallbackARIMA(values, periods) {
    // Enhanced JavaScript ARIMA fallback
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const trend = this.calculateTrend(values)
    const seasonality = this.extractSeasonality(values)
    
    const forecast = []
    for (let i = 0; i < periods; i++) {
      const trendComponent = trend * (values.length + i)
      const seasonalComponent = seasonality[i % seasonality.length] || 1
      const prediction = (mean + trendComponent) * seasonalComponent
      forecast.push(Math.max(0, prediction))
    }
    
    return forecast
  }

  calculateTrend(values) {
    try {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
    
      const denominator = n * sumX2 - sumX * sumX
      return denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
    } catch (error) {
      return 0
    }
  }

  extractSeasonality(values) {
    try {
      const period = Math.min(12, Math.floor(values.length / 2))
      if (period < 2) return [1]
      
      const pattern = []
      for (let i = 0; i < period; i++) {
        let sum = 0
        let count = 0
        
        for (let j = i; j < values.length; j += period) {
          sum += values[j]
          count++
        }
        
        pattern.push(count > 0 ? sum / count : 1)
      }
      
      return pattern
    } catch (error) {
      return [1]
    }
  }
}

// Exponential Smoothing Model
class ExponentialSmoothingModel {
  async forecast(data, periods, alpha = 0.3) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length === 0) {
        return Array(periods).fill(0)
      }
      
    let smoothed = values[0]
    
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed
    }
    
      return Array(periods).fill(Math.max(0, smoothed))
    } catch (error) {
      console.error('Exponential smoothing forecast failed:', error)
      return Array(periods).fill(0)
    }
  }
}

// Linear Regression Model
class LinearRegressionModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
    
      if (values.length < 2) {
        return Array(periods).fill(values.length > 0 ? values[0] : 0)
      }
      
      const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
    
      const denominator = n * sumX2 - sumX * sumX
      if (denominator === 0) {
        return Array(periods).fill(sumY / n)
      }
      
      const slope = (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n
    
    const forecast = []
    for (let i = 0; i < periods; i++) {
      const prediction = intercept + slope * (n + i)
      forecast.push(Math.max(0, prediction))
    }
    
    return forecast
    } catch (error) {
      console.error('Linear regression forecast failed:', error)
      return Array(periods).fill(0)
    }
  }
}

// Seasonal Decomposition Model
class SeasonalDecompositionModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length < 4) {
        return Array(periods).fill(values.length > 0 ? values[0] : 0)
      }
      
    const seasonalPattern = this.extractSeasonalPattern(values)
    const trend = this.calculateTrend(values)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    
    const forecast = []
    for (let i = 0; i < periods; i++) {
      const seasonalFactor = seasonalPattern[i % seasonalPattern.length] || 1
      const prediction = (mean + trend * (values.length + i)) * seasonalFactor
      forecast.push(Math.max(0, prediction))
    }
    
    return forecast
    } catch (error) {
      console.error('Seasonal decomposition forecast failed:', error)
      return Array(periods).fill(0)
    }
  }

  extractSeasonalPattern(values) {
    try {
    const period = Math.min(12, Math.floor(values.length / 2))
      if (period < 2) return [1]
    
      const pattern = []
    for (let i = 0; i < period; i++) {
      let sum = 0
      let count = 0
      
      for (let j = i; j < values.length; j += period) {
        sum += values[j]
        count++
      }
      
      pattern.push(count > 0 ? sum / count : 1)
    }
    
    return pattern
    } catch (error) {
      return [1]
    }
  }

  calculateTrend(values) {
    try {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
    
      const denominator = n * sumX2 - sumX * sumX
      return denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
    } catch (error) {
      return 0
    }
  }
}

// Neural Network Model (Enhanced LSTM-like implementation)
class NeuralNetworkModel {
  async forecast(data, periods) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
      
      if (values.length < 20) {
        console.warn('NN requires more data; falling back.')
        return Array(periods).fill(values.length > 0 ? values[0] : 0)
      }

      // Enhanced LSTM-like neural network implementation
      const sequenceLength = Math.min(12, Math.floor(values.length / 2))
      const { sequences, targets, min, max } = this.createSequences(values, sequenceLength)
      
      if (sequences.length === 0) {
        return Array(periods).fill(values[values.length - 1] || 0)
      }

      // Train the model
      const weights = this.trainModel(sequences, targets, sequenceLength)
      
      // Generate forecast
      const forecast = []
      let currentSequence = values.slice(-sequenceLength)
      
      for (let i = 0; i < periods; i++) {
        const normalizedSequence = currentSequence.map(v => (v - min) / (max - min))
        const prediction = this.predict(normalizedSequence, weights, sequenceLength)
        
        // Denormalize the prediction
        const denormalizedPrediction = prediction * (max - min) + min
        forecast.push(Math.max(0, denormalizedPrediction))
        
        // Update the sequence for the next prediction
        currentSequence.shift()
        currentSequence.push(denormalizedPrediction)
      }
      
      return forecast
    } catch (error) {
      console.error('Neural network forecast failed:', error)
      return Array(periods).fill(0)
    }
  }

  createSequences(values, sequenceLength) {
    const sequences = []
    const targets = []
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    if (max === min) {
      return { sequences: [], targets: [], min, max: min + 1 }
    }
    
    // Normalize
    const normalized = values.map(v => (v - min) / (max - min))
    
    for (let i = 0; i < normalized.length - sequenceLength; i++) {
      sequences.push(normalized.slice(i, i + sequenceLength))
      targets.push(normalized[i + sequenceLength])
    }
    
    return { sequences, targets, min, max }
  }

  trainModel(sequences, targets, sequenceLength) {
    // Initialize weights randomly
    const inputWeights = Array(sequenceLength).fill(0).map(() => Math.random() * 0.1 - 0.05)
    const hiddenWeights = Array(sequenceLength).fill(0).map(() => Math.random() * 0.1 - 0.05)
    const outputWeights = Array(sequenceLength).fill(0).map(() => Math.random() * 0.1 - 0.05)
    
    const learningRate = 0.01
    const epochs = 100
    
    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < sequences.length; i++) {
        const sequence = sequences[i]
        const target = targets[i]
        
        // Forward pass
        const hidden = sequence.map((input, j) => 
          this.sigmoid(input * inputWeights[j] + (j > 0 ? hidden[j-1] * hiddenWeights[j] : 0))
        )
        
        const output = this.sigmoid(hidden.reduce((sum, h, j) => sum + h * outputWeights[j], 0))
        
        // Backward pass (simplified gradient descent)
        const error = target - output
        const outputGradient = error * this.sigmoidDerivative(output)
        
        // Update weights
        for (let j = 0; j < sequenceLength; j++) {
          outputWeights[j] += learningRate * outputGradient * hidden[j]
          hiddenWeights[j] += learningRate * outputGradient * (j > 0 ? hidden[j-1] : 0)
          inputWeights[j] += learningRate * outputGradient * sequence[j]
        }
      }
    }
    
    return { inputWeights, hiddenWeights, outputWeights }
  }

  predict(sequence, weights, sequenceLength) {
    const { inputWeights, hiddenWeights, outputWeights } = weights
    
    // Forward pass
    const hidden = sequence.map((input, j) => 
      this.sigmoid(input * inputWeights[j] + (j > 0 ? hidden[j-1] * hiddenWeights[j] : 0))
    )
    
    const output = this.sigmoid(hidden.reduce((sum, h, j) => sum + h * outputWeights[j], 0))
    return output
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x))
  }

  sigmoidDerivative(x) {
    return x * (1 - x)
  }

  calculateTrend(values) {
    try {
      if (values.length < 2) return 0
      
      const n = values.length
      const sumX = (n * (n - 1)) / 2
      const sumY = values.reduce((sum, val) => sum + val, 0)
      const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
      const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
      
      const denominator = n * sumX2 - sumX * sumX
      return denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
    } catch (error) {
      return 0
    }
  }
}

// Monte Carlo Simulation for Confidence Intervals
class MonteCarloSimulation {
  async calculateConfidenceIntervals(forecast, data, confidenceLevel = 0.95) {
    try {
    const returns = this.calculateReturns(data.cleaned.map(d => d.value))
    const volatility = this.calculateVolatility(returns)
      const mean = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0
    
    const simulations = 10000
    const intervals = []
    
    for (let i = 0; i < forecast.length; i++) {
      const simulationResults = []
      
      for (let j = 0; j < simulations; j++) {
        const randomReturn = this.generateRandomNormal(mean, volatility)
        const simulatedValue = forecast[i] * (1 + randomReturn)
        simulationResults.push(Math.max(0, simulatedValue))
      }
      
      simulationResults.sort((a, b) => a - b)
      const lowerIndex = Math.floor(simulations * (1 - confidenceLevel) / 2)
      const upperIndex = Math.floor(simulations * (1 + confidenceLevel) / 2)
      
      intervals.push({
          lower: simulationResults[lowerIndex] || forecast[i],
          upper: simulationResults[upperIndex] || forecast[i],
        mean: simulationResults.reduce((sum, val) => sum + val, 0) / simulations
      })
    }
    
    return intervals
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error)
      return forecast.map(value => ({ lower: value, upper: value, mean: value }))
    }
  }

  calculateReturns(values) {
    const returns = []
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1])
      }
    }
    return returns
  }

  calculateVolatility(returns) {
    try {
      if (returns.length === 0) return 0
      
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
    } catch (error) {
      return 0
    }
  }

  generateRandomNormal(mean, stdDev) {
    try {
    // Box-Muller transform for normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + stdDev * z0
    } catch (error) {
      return mean
    }
  }
}

// Volatility Model for Risk Analysis
class VolatilityModel {
  calculateMetrics(data) {
    try {
      const values = data.cleaned.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
    const returns = this.calculateReturns(values)
    
    return {
      historicalVolatility: this.calculateHistoricalVolatility(returns),
      impliedVolatility: this.calculateImpliedVolatility(returns),
        volatilityOfVolatility: this.calculateVolatilityOfVolatility(returns)
      }
    } catch (error) {
      console.error('Volatility metrics calculation failed:', error)
      return {
        historicalVolatility: 0,
        impliedVolatility: 0,
        volatilityOfVolatility: 0
      }
    }
  }

  calculateReturns(values) {
    const returns = []
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1])
      }
    }
    return returns
  }

  calculateHistoricalVolatility(returns) {
    try {
      if (returns.length === 0) return 0
      
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
    } catch (error) {
      return 0
    }
  }

  calculateImpliedVolatility(returns) {
    try {
    // Simplified implied volatility calculation
    return this.calculateHistoricalVolatility(returns) * 1.1 // Assume 10% premium
    } catch (error) {
      return 0
    }
  }

  calculateVolatilityOfVolatility(returns) {
    try {
      if (returns.length < 10) return 0
      
    const volatilities = []
      const window = Math.min(10, Math.floor(returns.length / 2))
    
    for (let i = window; i < returns.length; i++) {
      const windowReturns = returns.slice(i - window, i)
      volatilities.push(this.calculateHistoricalVolatility(windowReturns))
    }
    
    return this.calculateHistoricalVolatility(volatilities)
    } catch (error) {
      return 0
    }
  }
}

// Create and export a singleton instance
export const forecastingEngine = new ForecastingEngine() 