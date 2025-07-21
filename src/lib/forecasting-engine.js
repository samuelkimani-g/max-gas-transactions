// Advanced forecasting engine for gas cylinder demand prediction
// Browser-compatible implementation

// Time series forecasting using ARIMA-like algorithm
export class ForecastingEngine {
  constructor() {
    this.historicalData = []
    this.seasonalityPeriod = 7 // Weekly seasonality
    this.trendWindow = 30 // 30-day trend analysis
  }

  // Add historical transaction data
  addHistoricalData(transactions) {
    this.historicalData = transactions.map(t => ({
      date: new Date(t.date),
      demand: this.calculateDemand(t),
      revenue: t.total || 0
    })).sort((a, b) => a.date - b.date)
  }

  // Calculate demand from transaction
  calculateDemand(transaction) {
    const cylinders6kg = (transaction.maxGas6kgLoad || 0) * 6
    const cylinders13kg = (transaction.maxGas13kgLoad || 0) * 13
    const cylinders50kg = (transaction.maxGas50kgLoad || 0) * 50
    
    return cylinders6kg + cylinders13kg + cylinders50kg // Total kg of gas
  }

  // Generate demand forecast for next N days
  async generateForecast(days = 30) {
    if (this.historicalData.length < 14) {
      throw new Error('Insufficient historical data for forecasting (minimum 14 days required)')
    }

    try {
      // Use browser-compatible forecasting (no Python subprocess)
      const forecast = this.generateBrowserForecast(days)
      
      return {
        success: true,
        forecast,
        confidence: this.calculateConfidence(),
        metadata: {
          historicalDataPoints: this.historicalData.length,
          forecastDays: days,
          method: 'Browser ARIMA-like',
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Forecasting error:', error)
      return {
        success: false,
        error: error.message,
        forecast: this.generateSimpleForecast(days) // Fallback
      }
    }
  }

  // Browser-compatible forecasting algorithm
  generateBrowserForecast(days) {
    const dailyDemand = this.aggregateByDay()
    const trend = this.calculateTrend(dailyDemand)
    const seasonality = this.calculateSeasonality(dailyDemand)
    
    const forecast = []
    const lastDate = new Date(Math.max(...this.historicalData.map(d => d.date)))
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate)
      forecastDate.setDate(lastDate.getDate() + i)
      
      const dayOfWeek = forecastDate.getDay()
      const trendValue = trend.slope * i + trend.intercept
      const seasonalValue = seasonality[dayOfWeek] || 1
      
      const demandForecast = Math.max(0, trendValue * seasonalValue)
      const revenueForecast = demandForecast * this.getAveragePrice()
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        demandForecast: Math.round(demandForecast),
        revenueForecast: Math.round(revenueForecast * 100) / 100,
        confidence: Math.max(0.1, 0.9 - (i / days) * 0.4) // Decreasing confidence
      })
    }
    
    return forecast
  }

  // Aggregate data by day
  aggregateByDay() {
    const dailyData = {}
    
    this.historicalData.forEach(point => {
      const dateStr = point.date.toISOString().split('T')[0]
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { demand: 0, revenue: 0, count: 0 }
      }
      dailyData[dateStr].demand += point.demand
      dailyData[dateStr].revenue += point.revenue
      dailyData[dateStr].count += 1
    })
    
    return Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date),
      demand: data.demand,
      revenue: data.revenue
    })).sort((a, b) => a.date - b.date)
  }

  // Calculate linear trend
  calculateTrend(dailyData) {
    if (dailyData.length < 2) return { slope: 0, intercept: 0 }
    
    const n = dailyData.length
    const sumX = dailyData.reduce((sum, _, i) => sum + i, 0)
    const sumY = dailyData.reduce((sum, d) => sum + d.demand, 0)
    const sumXY = dailyData.reduce((sum, d, i) => sum + (i * d.demand), 0)
    const sumXX = dailyData.reduce((sum, _, i) => sum + (i * i), 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return { slope, intercept }
  }

  // Calculate seasonal patterns
  calculateSeasonality(dailyData) {
    const dayOfWeekDemand = Array(7).fill(0).map(() => [])
    
    dailyData.forEach(point => {
      const dayOfWeek = point.date.getDay()
      dayOfWeekDemand[dayOfWeek].push(point.demand)
    })
    
    const averageDemand = dailyData.reduce((sum, d) => sum + d.demand, 0) / dailyData.length
    
    return dayOfWeekDemand.map(demands => {
      if (demands.length === 0) return 1
      const avgForDay = demands.reduce((sum, d) => sum + d, 0) / demands.length
      return avgForDay / averageDemand
    })
  }

  // Get average price per kg
  getAveragePrice() {
    const totalRevenue = this.historicalData.reduce((sum, d) => sum + d.revenue, 0)
    const totalDemand = this.historicalData.reduce((sum, d) => sum + d.demand, 0)
    
    return totalDemand > 0 ? totalRevenue / totalDemand : 135 // Default price
  }

  // Calculate forecast confidence
  calculateConfidence() {
    const dataPoints = this.historicalData.length
    if (dataPoints < 14) return 0.3
    if (dataPoints < 30) return 0.6
    if (dataPoints < 90) return 0.8
    return 0.9
  }

  // Simple fallback forecast
  generateSimpleForecast(days) {
    const recentDays = Math.min(7, this.historicalData.length)
    const recentData = this.historicalData.slice(-recentDays)
    
    const avgDemand = recentData.reduce((sum, d) => sum + d.demand, 0) / recentData.length
    const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length
    
    const forecast = []
    const lastDate = new Date(Math.max(...this.historicalData.map(d => d.date)))
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate)
      forecastDate.setDate(lastDate.getDate() + i)
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        demandForecast: Math.round(avgDemand),
        revenueForecast: Math.round(avgRevenue * 100) / 100,
        confidence: 0.5
      })
    }
    
    return forecast
  }

  // Analyze demand patterns
  analyzeDemandPatterns() {
    const dailyData = this.aggregateByDay()
    const patterns = {
      weeklyPattern: this.calculateSeasonality(dailyData),
      trendAnalysis: this.calculateTrend(dailyData),
      volatility: this.calculateVolatility(dailyData),
      growthRate: this.calculateGrowthRate(dailyData)
    }
    
    return patterns
  }

  // Calculate demand volatility
  calculateVolatility(dailyData) {
    if (dailyData.length < 2) return 0
    
    const demands = dailyData.map(d => d.demand)
    const mean = demands.reduce((sum, d) => sum + d, 0) / demands.length
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / demands.length
    
    return Math.sqrt(variance)
  }

  // Calculate monthly growth rate
  calculateGrowthRate(dailyData) {
    if (dailyData.length < 60) return 0 // Need at least 2 months
    
    const firstMonth = dailyData.slice(0, 30)
    const lastMonth = dailyData.slice(-30)
    
    const firstMonthAvg = firstMonth.reduce((sum, d) => sum + d.demand, 0) / 30
    const lastMonthAvg = lastMonth.reduce((sum, d) => sum + d.demand, 0) / 30
    
    return ((lastMonthAvg - firstMonthAvg) / firstMonthAvg) * 100
  }
}

// Export singleton instance
export const forecastingEngine = new ForecastingEngine() 