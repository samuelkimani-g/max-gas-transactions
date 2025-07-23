"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { forecastingEngine } from "../lib/forecasting-engine"
import { 
  BarChart3, DollarSign, CreditCard, Package, TrendingUp, Users, Calendar,
  MapPin, Target, AlertTriangle, CheckCircle, Clock, Filter, Download,
  TrendingDown, Activity, Zap, Shield, Brain, Rocket, LineChart, PieChart,
  BarChart, ScatterChart as ScatterIcon, AreaChart, Gauge, Thermometer, Target as TargetIcon
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter as RechartsScatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

export default function EnhancedAnalyticsDashboard() {
  const { getFilteredTransactions, customers } = useStore()
  const transactions = getFilteredTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [forecastPeriods, setForecastPeriods] = useState(12)
  const [confidenceLevel, setConfidenceLevel] = useState(0.95)
  const [forecastData, setForecastData] = useState(null)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('sales')
  const [viewMode, setViewMode] = useState('overview')

  // Helper functions - defined before useMemo to avoid hoisting issues
  const calculateCustomerRiskScore = (transactions, outstanding, totalSales) => {
    if (transactions.length === 0) return 0
    
    const avgTransactionValue = totalSales / transactions.length
    const paymentRatio = totalSales > 0 ? (totalSales - outstanding) / totalSales : 1
    const transactionFrequency = transactions.length / 12 // per month average
    const daysSinceLastTransaction = transactions.length > 0 ? 
      (new Date() - new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))) / (1000 * 60 * 60 * 24) : 365
    
    // Weighted risk factors
    const riskFactors = {
      outstandingRatio: outstanding / totalSales * 0.4,
      paymentHistory: (1 - paymentRatio) * 0.3,
      transactionFrequency: Math.max(0, (1 - transactionFrequency / 10)) * 0.2,
      recency: Math.min(1, daysSinceLastTransaction / 365) * 0.1
    }
    
    return Object.values(riskFactors).reduce((sum, factor) => sum + factor, 0)
  }

  const calculateAdvancedKPIs = (filteredTransactions, allTransactions, period) => {
    const totalSales = filteredTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
    const totalPayments = filteredTransactions.reduce((total, t) => total + (t.paid || 0), 0)
    
    // Calculate growth rates
    const previousPeriodData = getPreviousPeriodData(allTransactions, period)
    const previousSales = previousPeriodData.reduce((total, t) => total + calculateTransactionTotal(t), 0)
    const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0
    
    // Calculate volatility
    const salesValues = getSalesValues(allTransactions, period)
    const volatility = calculateVolatility(salesValues)
    
    // Calculate Sharpe ratio
    const returns = calculateReturns(salesValues)
    const sharpeRatio = calculateSharpeRatio(returns)
    
    // Calculate customer lifetime value
    const customerLTV = calculateCustomerLTV(allTransactions)
    
    return {
      salesGrowth: isNaN(salesGrowth) ? '0.0' : salesGrowth.toFixed(1),
      customerSatisfaction: 94.5,
      paymentCollectionRate: totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : '0.0',
      averageTransactionValue: filteredTransactions.length > 0 ? (totalSales / filteredTransactions.length).toFixed(0) : '0',
      customerRetentionRate: 87.3,
      inventoryTurnover: 4.2,
      volatility: isNaN(volatility) ? '0.00' : (volatility * 100).toFixed(2),
      sharpeRatio: isNaN(sharpeRatio) ? '0.00' : sharpeRatio.toFixed(2),
      customerLTV: isNaN(customerLTV) ? '0' : customerLTV.toFixed(0),
      riskAdjustedReturn: isNaN(sharpeRatio) ? '0.00' : (sharpeRatio * totalSales / 1000).toFixed(2)
    }
  }

  const getPreviousPeriodData = (transactions, period) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    return transactions.filter(t => {
      if (!t || !t.date) return false
      const date = new Date(t.date)
      if (isNaN(date.getTime())) return false
      
      switch (period) {
        case 'weekly':
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return date >= twoWeeksAgo && date < weekAgo
        case 'monthly':
          const prevMonth = new Date(currentYear, currentMonth - 1, 1)
          return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear()
        case 'quarterly':
          const prevQuarterStart = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3, 1)
          const prevQuarterEnd = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3 + 3, 0)
          return date >= prevQuarterStart && date <= prevQuarterEnd
        case 'yearly':
          return date.getFullYear() === currentYear - 1
        default:
          return false
      }
    })
  }

  const getSalesValues = (transactions, period) => {
    const grouped = groupTransactionsByPeriod(transactions, period)
    return Object.values(grouped).map(group => 
      group.reduce((sum, t) => sum + calculateTransactionTotal(t), 0)
    )
  }

  const groupTransactionsByPeriod = (transactions, period) => {
    const grouped = {}
    transactions.forEach(t => {
      if (!t || !t.date) return
      const date = new Date(t.date)
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
      grouped[key].push(t)
    })
    return grouped
  }

  const calculateVolatility = (values) => {
    if (values.length < 2) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance) / mean
  }

  const calculateReturns = (values) => {
    const returns = []
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1])
    }
    return returns
  }

  const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
    if (returns.length === 0) return 0
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = calculateVolatility(returns)
    return volatility > 0 ? (mean - riskFreeRate) / volatility : 0
  }

  const calculateCustomerLTV = (transactions) => {
    const customerTotals = {}
    transactions.forEach(t => {
      if (!customerTotals[t.customerId]) customerTotals[t.customerId] = 0
      customerTotals[t.customerId] += calculateTransactionTotal(t)
    })
    const values = Object.values(customerTotals)
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }

  // Calculate comprehensive analytics data with performance optimizations
  const analyticsData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Ensure transactions and customers are arrays
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeCustomers = Array.isArray(customers) ? customers : []

    // Pre-aggregate data for performance optimization
    const salesByMonth = new Map()
    const salesByYear = new Map()
    const salesByWeek = new Map()
    const salesByQuarter = new Map()
    const customerSales = new Map()
    const transactionCounts = new Map()

    // Single pass through transactions to build aggregated data
    safeTransactions.forEach(t => {
      if (!t || !t.date) return
      
        const date = new Date(t.date)
      if (isNaN(date.getTime())) return
      
      const total = calculateTransactionTotal(t)
      const year = date.getFullYear()
      const month = date.getMonth()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      const quarter = Math.floor(month / 3) + 1
      const quarterKey = `${year}-Q${quarter}`
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
      
      // Aggregate by time periods
      salesByMonth.set(monthKey, (salesByMonth.get(monthKey) || 0) + total)
      salesByYear.set(year, (salesByYear.get(year) || 0) + total)
      salesByWeek.set(weekKey, (salesByWeek.get(weekKey) || 0) + total)
      salesByQuarter.set(quarterKey, (salesByQuarter.get(quarterKey) || 0) + total)
      
      // Aggregate by customer
      if (t.customerId) {
        customerSales.set(t.customerId, (customerSales.get(t.customerId) || 0) + total)
      }
      
      // Count transactions by period
      transactionCounts.set(monthKey, (transactionCounts.get(monthKey) || 0) + 1)
    })

    // Filter transactions by period using pre-aggregated data
    const getFilteredTransactions = (period) => {
      const filtered = safeTransactions.filter(t => {
        if (!t || !t.date) return false
        const date = new Date(t.date)
        if (isNaN(date.getTime())) return false
        
        switch (period) {
          case 'all':
            return true
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return date >= weekAgo
          case 'monthly':
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
          case 'quarterly':
            const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1)
            const quarterEnd = new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0)
            return date >= quarterStart && date <= quarterEnd
          case 'yearly':
            return date.getFullYear() === currentYear
          default:
            return true
        }
      })
      
      return filtered
    }

    const filteredTransactions = getFilteredTransactions(selectedPeriod)

    // Calculate total sales efficiently
    const totalSales = filteredTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
    const totalPayments = filteredTransactions.reduce((total, t) => total + (t.paid || 0), 0)
    const totalOutstanding = totalSales - totalPayments

    // Calculate previous period data for growth metrics
    const getPreviousPeriodData = (period) => {
      switch (period) {
        case 'weekly':
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= twoWeeksAgo && date < weekAgo
          })
        case 'monthly':
          const prevMonth = new Date(currentYear, currentMonth - 1, 1)
          return safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear()
          })
        case 'quarterly':
          const prevQuarterStart = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3, 1)
          const prevQuarterEnd = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3 + 3, 0)
          return safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= prevQuarterStart && date <= prevQuarterEnd
          })
        case 'yearly':
          return safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date.getFullYear() === currentYear - 1
          })
        default:
          return []
      }
    }

    const previousPeriodTransactions = getPreviousPeriodData(selectedPeriod)
    const previousPeriodSales = previousPeriodTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
    const salesGrowth = previousPeriodSales > 0 ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 : 0

    // Calculate dynamic KPIs
    const calculateDynamicKPIs = () => {
      const avgTransactionValue = filteredTransactions.length > 0 ? totalSales / filteredTransactions.length : 0
      const paymentCollectionRate = totalSales > 0 ? (totalPayments / totalSales) * 100 : 0
      
      // Calculate customer retention rate
      const uniqueCustomers = new Set(filteredTransactions.map(t => t.customerId).filter(Boolean))
      const totalUniqueCustomers = new Set(safeTransactions.map(t => t.customerId).filter(Boolean))
      const customerRetentionRate = totalUniqueCustomers.size > 0 ? (uniqueCustomers.size / totalUniqueCustomers.size) * 100 : 0
      
      // Calculate inventory turnover (simplified)
    const totalCylinders = filteredTransactions.reduce((total, t) => {
      const returns = (t.return6kg || 0) + (t.return13kg || 0) + (t.return50kg || 0)
      const outright = (t.outright6kg || 0) + (t.outright13kg || 0) + (t.outright50kg || 0)
      const swipes = (t.swipeReturn6kg || 0) + (t.swipeReturn13kg || 0) + (t.swipeReturn50kg || 0)
      return total + returns + outright + swipes
    }, 0)

      const inventoryTurnover = totalCylinders > 0 ? totalCylinders / 100 : 0 // Simplified calculation
      
      // Calculate volatility
      const salesValues = Array.from(salesByMonth.values())
      const volatility = calculateVolatility(salesValues)
      
      // Calculate Sharpe ratio
      const returns = calculateReturns(salesValues)
      const sharpeRatio = calculateSharpeRatio(returns)
      
      // Calculate customer lifetime value
      const customerLTV = Array.from(customerSales.values()).reduce((sum, sales) => sum + sales, 0) / customerSales.size || 0
      
      return {
        salesGrowth: isNaN(salesGrowth) ? 0 : salesGrowth.toFixed(1),
        customerSatisfaction: 94.5, // This would need customer feedback data
        paymentCollectionRate: isNaN(paymentCollectionRate) ? 0 : paymentCollectionRate.toFixed(1),
        averageTransactionValue: isNaN(avgTransactionValue) ? 0 : avgTransactionValue.toFixed(0),
        customerRetentionRate: isNaN(customerRetentionRate) ? 0 : customerRetentionRate.toFixed(1),
        inventoryTurnover: isNaN(inventoryTurnover) ? 0 : inventoryTurnover.toFixed(1),
        volatility: isNaN(volatility) ? 0 : (volatility * 100).toFixed(2),
        sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio.toFixed(2),
        customerLTV: isNaN(customerLTV) ? 0 : customerLTV.toFixed(0),
        riskAdjustedReturn: isNaN(sharpeRatio) ? 0 : (sharpeRatio * totalSales / 1000).toFixed(2)
      }
    }

    // Sales trends data using pre-aggregated data
    const getSalesTrends = () => {
      const trends = []
      const periods = selectedPeriod === 'weekly' ? 7 : selectedPeriod === 'monthly' ? 12 : selectedPeriod === 'quarterly' ? 4 : 12
      
      for (let i = periods - 1; i >= 0; i--) {
        let periodSales = 0
        let periodPayments = 0
        
        if (selectedPeriod === 'weekly') {
          const startDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
          const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
          const weekKey = startDate.toISOString().split('T')[0]
          periodSales = salesByWeek.get(weekKey) || 0
          
          // Calculate payments for this week
          const weekTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= startDate && date <= endDate
          })
          periodPayments = weekTransactions.reduce((sum, t) => sum + (t.paid || 0), 0)
        } else if (selectedPeriod === 'monthly') {
          const month = new Date(currentYear, currentMonth - i, 1)
          const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
          periodSales = salesByMonth.get(monthKey) || 0
          
          // Calculate payments for this month
          const monthTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
          })
          periodPayments = monthTransactions.reduce((sum, t) => sum + (t.paid || 0), 0)
        } else if (selectedPeriod === 'quarterly') {
          const quarter = Math.floor((currentMonth - i * 3) / 3)
          const year = currentYear - Math.floor(i / 4)
          const quarterKey = `${year}-Q${quarter + 1}`
          periodSales = salesByQuarter.get(quarterKey) || 0
          
          // Calculate payments for this quarter
          const quarterStart = new Date(year, quarter * 3, 1)
          const quarterEnd = new Date(year, quarter * 3 + 3, 0)
          const quarterTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= quarterStart && date <= quarterEnd
          })
          periodPayments = quarterTransactions.reduce((sum, t) => sum + (t.paid || 0), 0)
        }
        
        trends.push({
          period: selectedPeriod === 'weekly' ? `Week ${periods - i}` : 
                  selectedPeriod === 'monthly' ? `Month ${periods - i}` :
                  selectedPeriod === 'quarterly' ? `Q${periods - i}` : `Period ${periods - i}`,
          sales: periodSales,
          payments: periodPayments
        })
      }
      
      return trends
    }

    // Customer segments with risk analysis
    const customerSegments = safeCustomers.map(customer => {
      if (!customer) return null
      
      const customerTransactions = safeTransactions.filter(t => t && t.customerId === customer.id)
      const totalSales = customerSales.get(customer.id) || 0
      const outstanding = customerTransactions.reduce((sum, t) => {
        const total = calculateTransactionTotal(t)
        return sum + (total - (t.paid || 0))
      }, 0)
      
      const riskScore = calculateCustomerRiskScore(customerTransactions, outstanding, totalSales)
      const segment = riskScore < 0.3 ? 'Low Risk' : riskScore < 0.7 ? 'Medium Risk' : 'High Risk'
      
      return {
        id: customer.id,
        name: customer.name,
        totalSales,
        outstanding,
        riskScore,
        segment,
        transactionCount: customerTransactions.length
      }
    }).filter(Boolean)

    // Cylinder analytics by size - Updated for new transaction structure
    const cylinderAnalytics = [
      {
        size: '6kg',
        loads: filteredTransactions.reduce((sum, t) => sum + (t.load_6kg || 0), 0),
        returns: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = t.returns_breakdown?.max_empty?.kg6 || 0
          const swapEmpty = t.returns_breakdown?.swap_empty?.kg6 || 0
          const returnFull = t.returns_breakdown?.return_full?.kg6 || 0
          return sum + maxEmpty + swapEmpty + returnFull
        }, 0),
        swipes: filteredTransactions.reduce((sum, t) => sum + (t.returns_breakdown?.swap_empty?.kg6 || 0), 0),
        outright: filteredTransactions.reduce((sum, t) => sum + (t.outright_breakdown?.kg6 || 0), 0),
        sales: filteredTransactions.reduce((sum, t) => {
          // Max Empty: count * price * kg
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg6 || 0) * (t.returns_breakdown?.max_empty?.price6 || 135) * 6
          // Swap Empty: count * price * kg
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg6 || 0) * (t.returns_breakdown?.swap_empty?.price6 || 160) * 6
          // Outright: count * price
          const outright = (t.outright_breakdown?.kg6 || 0) * (t.outright_breakdown?.price6 || 2200)
          return sum + maxEmpty + swapEmpty + outright
        }, 0),
        payments: filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0),
        outstanding: 0, // Will be calculated
        totalKg: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg6 || 0) * 6
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg6 || 0) * 6
          return sum + maxEmpty + swapEmpty
        }, 0)
      },
      {
        size: '13kg',
        loads: filteredTransactions.reduce((sum, t) => sum + (t.load_13kg || 0), 0),
        returns: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = t.returns_breakdown?.max_empty?.kg13 || 0
          const swapEmpty = t.returns_breakdown?.swap_empty?.kg13 || 0
          const returnFull = t.returns_breakdown?.return_full?.kg13 || 0
          return sum + maxEmpty + swapEmpty + returnFull
        }, 0),
        swipes: filteredTransactions.reduce((sum, t) => sum + (t.returns_breakdown?.swap_empty?.kg13 || 0), 0),
        outright: filteredTransactions.reduce((sum, t) => sum + (t.outright_breakdown?.kg13 || 0), 0),
        sales: filteredTransactions.reduce((sum, t) => {
          // Max Empty: count * price * kg
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg13 || 0) * (t.returns_breakdown?.max_empty?.price13 || 135) * 13
          // Swap Empty: count * price * kg
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg13 || 0) * (t.returns_breakdown?.swap_empty?.price13 || 160) * 13
          // Outright: count * price
          const outright = (t.outright_breakdown?.kg13 || 0) * (t.outright_breakdown?.price13 || 4400)
          return sum + maxEmpty + swapEmpty + outright
        }, 0),
        payments: filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0),
        outstanding: 0, // Will be calculated
        totalKg: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg13 || 0) * 13
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg13 || 0) * 13
          return sum + maxEmpty + swapEmpty
        }, 0)
      },
      {
        size: '50kg',
        loads: filteredTransactions.reduce((sum, t) => sum + (t.load_50kg || 0), 0),
        returns: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = t.returns_breakdown?.max_empty?.kg50 || 0
          const swapEmpty = t.returns_breakdown?.swap_empty?.kg50 || 0
          const returnFull = t.returns_breakdown?.return_full?.kg50 || 0
          return sum + maxEmpty + swapEmpty + returnFull
        }, 0),
        swipes: filteredTransactions.reduce((sum, t) => sum + (t.returns_breakdown?.swap_empty?.kg50 || 0), 0),
        outright: filteredTransactions.reduce((sum, t) => sum + (t.outright_breakdown?.kg50 || 0), 0),
        sales: filteredTransactions.reduce((sum, t) => {
          // Max Empty: count * price * kg
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg50 || 0) * (t.returns_breakdown?.max_empty?.price50 || 135) * 50
          // Swap Empty: count * price * kg
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg50 || 0) * (t.returns_breakdown?.swap_empty?.price50 || 160) * 50
          // Outright: count * price
          const outright = (t.outright_breakdown?.kg50 || 0) * (t.outright_breakdown?.price50 || 8000)
          return sum + maxEmpty + swapEmpty + outright
        }, 0),
        payments: filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0),
        outstanding: 0, // Will be calculated
        totalKg: filteredTransactions.reduce((sum, t) => {
          const maxEmpty = (t.returns_breakdown?.max_empty?.kg50 || 0) * 50
          const swapEmpty = (t.returns_breakdown?.swap_empty?.kg50 || 0) * 50
          return sum + maxEmpty + swapEmpty
        }, 0)
      }
    ]

    // Calculate outstanding amounts for each cylinder type
    cylinderAnalytics.forEach(cylinder => {
      cylinder.outstanding = cylinder.sales - cylinder.payments
      cylinder.balance = cylinder.loads - cylinder.returns - cylinder.swipes - cylinder.outright
    })

    // Customer heatmap data (geographic distribution)
    const customerHeatmap = safeCustomers.reduce((acc, customer) => {
      if (!customer) return acc
      const location = customer.address ? customer.address.split(',')[0].trim() : 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {})

    // Inventory tracking - Updated for new transaction structure
    const inventoryData = {
      '6kg Loads': filteredTransactions.reduce((total, t) => total + (t.load_6kg || 0), 0),
      '13kg Loads': filteredTransactions.reduce((total, t) => total + (t.load_13kg || 0), 0),
      '50kg Loads': filteredTransactions.reduce((total, t) => total + (t.load_50kg || 0), 0),
      '6kg Refills': filteredTransactions.reduce((total, t) => {
        const maxEmpty = t.returns_breakdown?.max_empty?.kg6 || 0
        const swapEmpty = t.returns_breakdown?.swap_empty?.kg6 || 0
        return total + maxEmpty + swapEmpty
      }, 0),
      '13kg Refills': filteredTransactions.reduce((total, t) => {
        const maxEmpty = t.returns_breakdown?.max_empty?.kg13 || 0
        const swapEmpty = t.returns_breakdown?.swap_empty?.kg13 || 0
        return total + maxEmpty + swapEmpty
      }, 0),
      '50kg Refills': filteredTransactions.reduce((total, t) => {
        const maxEmpty = t.returns_breakdown?.max_empty?.kg50 || 0
        const swapEmpty = t.returns_breakdown?.swap_empty?.kg50 || 0
        return total + maxEmpty + swapEmpty
      }, 0),
      '6kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright_breakdown?.kg6 || 0), 0),
      '13kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright_breakdown?.kg13 || 0), 0),
      '50kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright_breakdown?.kg50 || 0), 0),
      '6kg Swipes': filteredTransactions.reduce((total, t) => total + (t.returns_breakdown?.swap_empty?.kg6 || 0), 0),
      '13kg Swipes': filteredTransactions.reduce((total, t) => total + (t.returns_breakdown?.swap_empty?.kg13 || 0), 0),
      '50kg Swipes': filteredTransactions.reduce((total, t) => total + (t.returns_breakdown?.swap_empty?.kg50 || 0), 0),
    }

    return {
      totalSales,
      totalPayments,
      totalOutstanding,
      kpis: calculateDynamicKPIs(),
      salesTrends: getSalesTrends(),
      customerSegments,
      cylinderAnalytics,
      customerHeatmap,
      inventoryData,
      filteredTransactions
    }
  }, [transactions, customers, selectedPeriod])

  // Generate forecast when period changes
  useEffect(() => {
    const generateForecast = async () => {
      if (transactions.length === 0) return
      
      setIsLoadingForecast(true)
      try {
        // Add historical data to the forecasting engine
        forecastingEngine.addHistoricalData(transactions)
        
        // Generate forecast
        const forecast = await forecastingEngine.generateForecast(forecastPeriods)
        setForecastData(forecast)
      } catch (error) {
        console.error('Forecast generation failed:', error)
      } finally {
        setIsLoadingForecast(false)
      }
    }

    generateForecast()
  }, [transactions, selectedPeriod, forecastPeriods, confidenceLevel])

  // Chart colors
  const chartColors = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899']

  // Handle chart click for drill-down
  const handleChartClick = (data, chartType) => {
    if (chartType === 'customer' && data.payload) {
      setSelectedMetric('customer-detail')
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Period Filter with Forecasting Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={forecastPeriods.toString()} onValueChange={(value) => setForecastPeriods(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Forecast" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 periods</SelectItem>
              <SelectItem value="12">12 periods</SelectItem>
              <SelectItem value="24">24 periods</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={confidenceLevel.toString()} onValueChange={(value) => setConfidenceLevel(parseFloat(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.90">90% CI</SelectItem>
              <SelectItem value="0.95">95% CI</SelectItem>
              <SelectItem value="0.99">99% CI</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        {['overview', 'forecasting', 'risk-analysis', 'customer-insights'].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="capitalize"
          >
            {mode === 'overview' && <BarChart3 className="w-4 h-4 mr-2" />}
            {mode === 'forecasting' && <TrendingUp className="w-4 h-4 mr-2" />}
            {mode === 'risk-analysis' && <Shield className="w-4 h-4 mr-2" />}
            {mode === 'customer-insights' && <Users className="w-4 h-4 mr-2" />}
            {mode.replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Enhanced Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Sales</CardTitle>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(analyticsData.totalSales)}</div>
            <p className="text-orange-100 mt-1">+{analyticsData.kpis.salesGrowth}% vs last period</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-green-500 to-green-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Collection Rate</CardTitle>
              <CreditCard className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.kpis.paymentCollectionRate}%</div>
            <p className="text-green-100 mt-1">Payment collection efficiency</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-red-500 to-red-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Risk Score</CardTitle>
              <Shield className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.kpis.volatility}%</div>
            <p className="text-red-100 mt-1">Portfolio volatility</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sharpe Ratio</CardTitle>
              <TargetIcon className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.kpis.sharpeRatio}</div>
            <p className="text-blue-100 mt-1">Risk-adjusted return</p>
          </CardContent>
        </Card>
      </div>

      {/* Cylinder Analytics by Size */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsData.cylinderAnalytics.map((data) => {
            // Calculate forecasts when forecastData is available
            const forecastRevenue = forecastData ? forecastData.forecast.reduce((sum, val) => sum + val, 0) * (data.sales / (analyticsData.totalSales || 1)) : 0
            const forecastKg = forecastData ? forecastData.forecast.reduce((sum, val) => sum + val, 0) * (data.totalKg / (analyticsData.filteredTransactions.length ? analyticsData.filteredTransactions.reduce((s, t) => s + ((t.return6kg||0)+(t.return13kg||0)+(t.return50kg||0)+(t.swipeReturn6kg||0)+(t.swipeReturn13kg||0)+(t.swipeReturn50kg||0)),0) : 1)) : 0
            
            return (
              <Card key={data.size} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
                  <CardTitle className="flex items-center gap-2">{data.size} Analytics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="font-semibold text-gray-700">Cylinders</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Loads: <span className="font-bold text-orange-600">{data.loads}</span></div>
                    <div>Returns: <span className="font-bold text-green-600">{data.returns}</span></div>
                    <div>Swipes: <span className="font-bold text-blue-600">{data.swipes}</span></div>
                    <div>Outright: <span className="font-bold text-purple-600">{data.outright}</span></div>
                    <div>Balance: <span className={`font-bold ${data.balance > 0 ? 'text-red-600' : data.balance < 0 ? 'text-green-600' : 'text-gray-500'}`}>{data.balance}</span></div>
                  </div>
                  <div className="font-semibold text-gray-700 mt-2">Money</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Sales: <span className="font-bold text-blue-700">{formatCurrency(data.sales)}</span></div>
                    <div>Payments: <span className="font-bold text-green-700">{formatCurrency(data.payments)}</span></div>
                    <div>Outstanding: <span className="font-bold text-red-700">{formatCurrency(data.outstanding)}</span></div>
                    <div>Forecasted Revenue: <span className="font-bold text-purple-700">{formatCurrency(forecastRevenue)}</span></div>
                  </div>
                  <div className="font-semibold text-gray-700 mt-2">Gas/Refill</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Kg: <span className="font-bold text-orange-700">{data.totalKg}</span></div>
                    <div>Forecasted Kg: <span className="font-bold text-purple-700">{Math.round(forecastKg)}</span></div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dynamic Content Based on View Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Sales Trends Chart with Forecasting */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sales Trends & Forecast ({selectedPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="payments" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  {forecastData && (
                    <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Geographic Distribution */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Customer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={Object.entries(analyticsData.customerHeatmap).map(([location, count]) => ({ location, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'forecasting' && (
        <div className="space-y-6">
          {/* Advanced Forecasting Dashboard */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Advanced Forecasting Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingForecast ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : forecastData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Forecast Chart */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Sales Forecast with Confidence Intervals</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsAreaChart data={forecastData.forecast.map((value, index) => ({
                        period: `Period ${index + 1}`,
                        forecast: value,
                        lower: forecastData.confidenceIntervals[index]?.lower || value * 0.9,
                        upper: forecastData.confidenceIntervals[index]?.upper || value * 1.1
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area type="monotone" dataKey="upper" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="lower" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                        <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} />
                      </RechartsAreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Model Performance */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Model Performance Metrics</h4>
                    <div className="space-y-3">
                      {Object.entries(forecastData.modelPerformance).map(([modelName, metrics]) => (
                        <div key={modelName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium capitalize">{modelName}</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Accuracy: {metrics.accuracy.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">MAPE: {metrics.mape.toFixed(2)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No forecast data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'risk-analysis' && (
        <div className="space-y-6">
          {/* Risk Analysis Dashboard */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Analysis & Volatility Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {forecastData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Risk Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Volatility</span>
                        <span className="font-semibold">{(forecastData.riskMetrics.volatility * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sharpe Ratio</span>
                        <span className="font-semibold">{forecastData.riskMetrics.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Drawdown</span>
                        <span className="font-semibold">{(forecastData.riskMetrics.maxDrawdown * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Volatility Analysis */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Volatility Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Historical Volatility</span>
                        <span className="font-semibold">{(forecastData.riskMetrics.volatility * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk-Adjusted Return</span>
                        <span className="font-semibold">{forecastData.riskMetrics.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Portfolio Risk</span>
                        <span className="font-semibold">{(forecastData.riskMetrics.maxDrawdown * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Risk Distribution */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Customer Risk Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Low Risk', value: analyticsData.customerSegments.filter(c => c.segment === 'Low Risk').length, fill: '#10b981' },
                            { name: 'Medium Risk', value: analyticsData.customerSegments.filter(c => c.segment === 'Medium Risk').length, fill: '#f59e0b' },
                            { name: 'High Risk', value: analyticsData.customerSegments.filter(c => c.segment === 'High Risk').length, fill: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No risk analysis data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'customer-insights' && (
        <div className="space-y-6">
          {/* Customer Insights Dashboard */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Behavior & Segmentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Lifetime Value Distribution */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Customer Lifetime Value Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={analyticsData.customerSegments.slice(0, 10).map(c => ({
                      name: c.name,
                      ltv: c.totalSales,
                      risk: c.riskScore
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="ltv" fill="#6366f1" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Customer Risk vs Value Scatter */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Risk vs Value Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="riskScore" name="Risk Score" />
                      <YAxis type="number" dataKey="totalSales" name="Total Sales" />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <RechartsScatter data={analyticsData.customerSegments} fill="#8b5cf6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Tracking & Payment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Tracking */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={Object.entries(analyticsData.inventoryData).map(([type, count]) => ({ type, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Analytics by Customer Segments */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Payment Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPieChart>
                <Pie
                  data={(() => {
                    // Sort by outstanding amount and group smaller values into "Others"
                    const sortedData = [...analyticsData.customerSegments]
                      .sort((a, b) => b.outstanding - a.outstanding)
                      .filter(item => item.outstanding > 0);
                    
                    if (sortedData.length <= 5) {
                      return sortedData;
                    }
                    
                    const top4 = sortedData.slice(0, 4);
                    const others = sortedData.slice(4);
                    const othersTotal = others.reduce((sum, item) => sum + item.outstanding, 0);
                    
                    return [
                      ...top4,
                      { name: 'Others', outstanding: othersTotal, segment: 'Others' }
                    ];
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="outstanding"
                >
                  {(() => {
                    const sortedData = [...analyticsData.customerSegments]
                      .sort((a, b) => b.outstanding - a.outstanding)
                      .filter(item => item.outstanding > 0);
                    
                    if (sortedData.length <= 5) {
                      return sortedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ));
                    }
                    
                    const top4 = sortedData.slice(0, 4);
                    const others = sortedData.slice(4);
                    const othersTotal = others.reduce((sum, item) => sum + item.outstanding, 0);
                    
                    return [
                      ...top4.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      )),
                      <Cell key="cell-others" fill="#94a3b8" />
                    ];
                  })()}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: '#374151', fontSize: '12px' }}>
                      {value}: {formatCurrency(entry.payload.outstanding)}
                    </span>
                  )}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 