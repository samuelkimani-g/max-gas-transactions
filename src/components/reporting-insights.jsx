"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { forecastingEngine } from "../lib/forecasting-engine"
import { 
  BarChart3, FileText, TrendingUp, Users, Calendar, Download, 
  Filter, Target, 
  Mail, MessageSquare, Cloud, Zap, Settings, Brain, Shield, Rocket,
  TrendingDown, Activity, Gauge, Thermometer, Target as TargetIcon,
  Flame, Fuel, Zap as Lightning, AlertTriangle, Info, X, Search
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

export default function ReportingInsights() {
  const { transactions, customers, initializeSampleData } = useStore()
  const [selectedReport, setSelectedReport] = useState('custom')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState('all')
  const [forecastPeriods, setForecastPeriods] = useState(12)
  const [confidenceLevel, setConfidenceLevel] = useState(0.95)
  const [forecastData, setForecastData] = useState(null)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [viewMode, setViewMode] = useState('reports')

  // New filtering states
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [customerFilter, setCustomerFilter] = useState('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate comprehensive reporting data with filters
  const reportingData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Ensure data is safe
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeCustomers = Array.isArray(customers) ? customers : []

    // Apply comprehensive filters
    const getFilteredTransactions = (period) => {
      let filtered = safeTransactions.filter(t => {
        if (!t || !t.date) return false
        const date = new Date(t.date)
        if (isNaN(date.getTime())) return false
        
        // Date range filter
        if (dateRange.start && date < new Date(dateRange.start)) return false
        if (dateRange.end && date > new Date(dateRange.end)) return false
        
        // Customer filter
        if (customerFilter !== 'all' && t.customer_id !== parseInt(customerFilter)) return false
        
        // Transaction type filter
        if (transactionTypeFilter !== 'all') {
          const hasRefill = (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0) > 0
          const hasOutright = (t.outright_breakdown?.kg6 || 0) + (t.outright_breakdown?.kg13 || 0) + (t.outright_breakdown?.kg50 || 0) > 0
          const hasSwipe = (t.returns_breakdown?.swap_empty?.kg6 || 0) + (t.returns_breakdown?.swap_empty?.kg13 || 0) + (t.returns_breakdown?.swap_empty?.kg50 || 0) > 0
          
          switch (transactionTypeFilter) {
            case 'refill':
              if (!hasRefill) return false
              break
            case 'outright':
              if (!hasOutright) return false
              break
            case 'swipe':
              if (!hasSwipe) return false
              break
          }
        }
        
        // Amount range filter
        const total = calculateTransactionTotal(t)
        if (minAmount && total < parseFloat(minAmount)) return false
        if (maxAmount && total > parseFloat(maxAmount)) return false
        
        // Status filter
        if (statusFilter !== 'all') {
          const paid = t.amount_paid || 0
          const outstanding = total - paid
          
          switch (statusFilter) {
            case 'paid':
              if (outstanding > 0) return false
              break
            case 'outstanding':
              if (outstanding <= 0) return false
              break
            case 'partial':
              if (outstanding <= 0 || outstanding >= total) return false
              break
          }
        }
        
        // Search query filter
        if (searchQuery) {
          const customer = safeCustomers.find(c => c.id === t.customer_id)
          const customerName = customer ? customer.name.toLowerCase() : ''
          const transactionId = t.id.toString()
          const query = searchQuery.toLowerCase()
          
          if (!customerName.includes(query) && !transactionId.includes(query)) {
            return false
          }
        }
        
        let isInPeriod = false
        
        switch (period) {
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            isInPeriod = date >= weekAgo
            break
          case 'monthly':
            isInPeriod = date.getMonth() === currentMonth && date.getFullYear() === currentYear
            break
          case 'quarterly':
            const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1)
            const quarterEnd = new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0)
            isInPeriod = date >= quarterStart && date <= quarterEnd
            break
          case 'yearly':
            isInPeriod = date.getFullYear() === currentYear
            break
          case 'custom':
            // For custom period, we use the date range filter
            isInPeriod = true
            break
          default:
            isInPeriod = true
        }
        
        return isInPeriod
      })
      
      return filtered
    }

    // Get current period data
    const getCurrentPeriodData = (period) => {
      return getFilteredTransactions(period)
    }

    // Get previous period data for comparison
    const getPreviousPeriodData = (period) => {
      return safeTransactions.filter(t => {
        if (!t || !t.date) return false
        const date = new Date(t.date)
        if (isNaN(date.getTime())) return false
        
        // Apply same filters as current period
        if (customerFilter !== 'all' && t.customer_id !== parseInt(customerFilter)) return false
        if (transactionTypeFilter !== 'all') {
          const hasRefill = (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0) > 0
          const hasOutright = (t.outright_breakdown?.kg6 || 0) + (t.outright_breakdown?.kg13 || 0) + (t.outright_breakdown?.kg50 || 0) > 0
          const hasSwipe = (t.returns_breakdown?.swap_empty?.kg6 || 0) + (t.returns_breakdown?.swap_empty?.kg13 || 0) + (t.returns_breakdown?.swap_empty?.kg50 || 0) > 0
          
          switch (transactionTypeFilter) {
            case 'refill':
              if (!hasRefill) return false
              break
            case 'outright':
              if (!hasOutright) return false
              break
            case 'swipe':
              if (!hasSwipe) return false
              break
          }
        }
        
        const total = calculateTransactionTotal(t)
        if (minAmount && total < parseFloat(minAmount)) return false
        if (maxAmount && total > parseFloat(maxAmount)) return false
        
        if (statusFilter !== 'all') {
          const paid = t.amount_paid || 0
          const outstanding = total - paid
          
          switch (statusFilter) {
            case 'paid':
              if (outstanding > 0) return false
              break
            case 'outstanding':
              if (outstanding <= 0) return false
              break
            case 'partial':
              if (outstanding <= 0 || outstanding >= total) return false
              break
          }
        }
        
        if (searchQuery) {
          const customer = safeCustomers.find(c => c.id === t.customer_id)
          const customerName = customer ? customer.name.toLowerCase() : ''
          const transactionId = t.id.toString()
          const query = searchQuery.toLowerCase()
          
          if (!customerName.includes(query) && !transactionId.includes(query)) {
            return false
          }
        }
        
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

    const currentData = getCurrentPeriodData(selectedPeriod)
    const previousData = getPreviousPeriodData(selectedPeriod)

    // Calculate metrics for both periods
    const calculateMetrics = (data) => {
      const totalSales = data.reduce((total, t) => total + calculateTransactionTotal(t), 0)
      const totalPayments = data.reduce((total, t) => total + (t.amount_paid || 0), 0)
      const totalCylinders = data.reduce((total, t) => {
        // Use new structure
        const returns = (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0)
          + (t.returns_breakdown?.swap_empty?.kg6 || 0) + (t.returns_breakdown?.swap_empty?.kg13 || 0) + (t.returns_breakdown?.swap_empty?.kg50 || 0)
          + (t.returns_breakdown?.return_full?.kg6 || 0) + (t.returns_breakdown?.return_full?.kg13 || 0) + (t.returns_breakdown?.return_full?.kg50 || 0);
        const outright = (t.outright_breakdown?.kg6 || 0) + (t.outright_breakdown?.kg13 || 0) + (t.outright_breakdown?.kg50 || 0);
        return total + returns + outright;
      }, 0)
      return { totalSales, totalPayments, totalCylinders, transactionCount: data.length }
    }

    const currentMetrics = calculateMetrics(currentData)
    const previousMetrics = calculateMetrics(previousData)

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Sales forecasting (simple linear regression)
    const getSalesForecast = () => {
      const monthlyData = []
      for (let i = 11; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1)
        const monthTransactions = safeTransactions.filter(t => {
          if (!t || !t.date) return false
          const date = new Date(t.date)
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
        })
        const sales = monthTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
        monthlyData.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          sales
        })
      }
      return monthlyData
    }

    // Customer insights and buying patterns
    const getCustomerInsights = () => {
      const customerAnalysis = safeCustomers.map(customer => {
        if (!customer) return null
        
        const customerTransactions = safeTransactions.filter(t => t && t.customer_id === customer.id)
        const totalSales = customerTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
        const avgTransactionValue = customerTransactions.length > 0 ? totalSales / customerTransactions.length : 0
        
        // Analyze buying patterns
        // Cylinder size preference (new structure)
        const cylinderPreferences = {
          '6kg': customerTransactions.reduce((total, t) => total + (t.load_6kg || 0) + (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.outright_breakdown?.kg6 || 0), 0),
          '13kg': customerTransactions.reduce((total, t) => total + (t.load_13kg || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.outright_breakdown?.kg13 || 0), 0),
          '50kg': customerTransactions.reduce((total, t) => total + (t.load_50kg || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0) + (t.outright_breakdown?.kg50 || 0), 0)
        }
        
        const preferredSize = Object.entries(cylinderPreferences).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        
        // Service type preference (new structure)
        const servicePreferences = {
          'Loads': customerTransactions.reduce((total, t) => total + (t.load_6kg || 0) + (t.load_13kg || 0) + (t.load_50kg || 0), 0),
          'Refills': customerTransactions.reduce((total, t) => total + (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0), 0),
          'Outright': customerTransactions.reduce((total, t) => total + (t.outright_breakdown?.kg6 || 0) + (t.outright_breakdown?.kg13 || 0) + (t.outright_breakdown?.kg50 || 0), 0),
        }
        
        const preferredService = Object.entries(servicePreferences).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        
        return {
          id: customer.id,
          name: customer.name || 'Unknown',
          totalSales,
          avgTransactionValue,
          transactionCount: customerTransactions.length,
          preferredSize,
          preferredService,
          lastTransaction: customerTransactions.length > 0 ? 
            new Date(Math.max(...customerTransactions.map(t => new Date(t.date).getTime()))) : null
        }
      }).filter(Boolean)

      return customerAnalysis
    }

    return {
      currentMetrics,
      previousMetrics,
      growth: {
        sales: calculateGrowth(currentMetrics.totalSales, previousMetrics.totalSales),
        payments: calculateGrowth(currentMetrics.totalPayments, previousMetrics.totalPayments),
        cylinders: calculateGrowth(currentMetrics.totalCylinders, previousMetrics.totalCylinders),
        transactions: calculateGrowth(currentMetrics.transactionCount, previousMetrics.transactionCount)
      },
      salesForecast: getSalesForecast(),
      customerInsights: getCustomerInsights(),
      currentData,
      previousData,
      filteredCount: currentData.length,
      totalCount: safeTransactions.length
    }
  }, [transactions, customers, selectedPeriod, dateRange, customerFilter, transactionTypeFilter, statusFilter, minAmount, maxAmount, searchQuery])

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ start: '', end: '' })
    setCustomerFilter('all')
    setTransactionTypeFilter('all')
    setStatusFilter('all')
    setMinAmount('')
    setMaxAmount('')
    setSearchQuery('')
  }

  // Generate forecast when period changes
  useEffect(() => {
    const generateForecast = async () => {
      if (transactions.length === 0) return
      
      setIsLoadingForecast(true)
      try {
        const forecast = await forecastingEngine.forecast(
          transactions, 
          selectedPeriod, 
          forecastPeriods, 
          confidenceLevel
        )
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

  // Generate custom report
  const generateCustomReport = () => {
    const reportData = {
      period: selectedPeriod,
      customer: selectedCustomer,
      metrics: reportingData.currentMetrics,
      growth: reportingData.growth,
      timestamp: new Date().toISOString()
    }
    
    // Create downloadable report
    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(reportBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custom-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  return (
    <div className="space-y-6">
      {/* Initialize Sample Data if Empty */}
      {transactions.length === 0 && (customers || []).length === 0 && (
        <Card className="shadow-xl border-0 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Data Available</h3>
              <p className="text-yellow-700 mb-4">Add some sample data to test the reporting features</p>
              <Button 
                onClick={initializeSampleData}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Initialize Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Enhanced Report Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['reports', 'forecasting', 'risk-analysis', 'advanced-insights'].map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="capitalize"
            >
              {mode === 'reports' && <FileText className="w-4 h-4 mr-2" />}
              {mode === 'forecasting' && <Flame className="w-4 h-4 mr-2" />}
              {mode === 'risk-analysis' && <AlertTriangle className="w-4 h-4 mr-2" />}
              {mode === 'advanced-insights' && <Fuel className="w-4 h-4 mr-2" />}
              {mode.replace('-', ' ')}
            </Button>
          ))}
        </div>
        
        {viewMode === 'reports' && (
          <div className="flex gap-2">
            {['custom', 'comparative', 'insights'].map((type) => (
              <Button
                key={type}
                variant={selectedReport === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedReport(type)}
                className="capitalize"
              >
                {type === 'custom' && <FileText className="w-4 h-4 mr-1" />}
                {type === 'comparative' && <BarChart3 className="w-4 h-4 mr-1" />}
                {type === 'insights' && <Users className="w-4 h-4 mr-1" />}
                {type}
              </Button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px] bg-white border-2 border-orange-200 hover:border-orange-300 focus:border-orange-500 transition-all duration-200 shadow-sm font-medium hover:shadow-md transform hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <SelectValue placeholder="Select period" />
                {selectedPeriod !== 'all' && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-orange-200 shadow-lg rounded-lg overflow-hidden">
                <SelectItem value="weekly" className="hover:bg-orange-50 focus:bg-orange-100 cursor-pointer data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700">
                  <div className="flex items-center gap-2 py-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Weekly</span>
                  </div>
                </SelectItem>
                <SelectItem value="monthly" className="hover:bg-orange-50 focus:bg-orange-100 cursor-pointer data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700">
                  <div className="flex items-center gap-2 py-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Monthly</span>
                  </div>
                </SelectItem>
                <SelectItem value="quarterly" className="hover:bg-orange-50 focus:bg-orange-100 cursor-pointer data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700">
                  <div className="flex items-center gap-2 py-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Quarterly</span>
                  </div>
                </SelectItem>
                <SelectItem value="yearly" className="hover:bg-orange-50 focus:bg-orange-100 cursor-pointer data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700">
                  <div className="flex items-center gap-2 py-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Yearly</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom" className="hover:bg-orange-50 focus:bg-orange-100 cursor-pointer data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700">
                  <div className="flex items-center gap-2 py-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Custom Range</span>
                  </div>
                </SelectItem>
              </SelectContent>
          </Select>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {reportingData.filteredCount !== reportingData.totalCount && (
              <Badge variant="secondary" className="ml-1">
                {reportingData.filteredCount}/{reportingData.totalCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-white border-white hover:bg-white hover:text-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-start">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start Date"
                    className="text-sm"
                  />
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End Date"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Customer Filter */}
              <div className="space-y-2">
                <Label htmlFor="customer-filter">Customer</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {(customers || []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="transaction-type">Transaction Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="refill">Refills Only</SelectItem>
                    <SelectItem value="outright">Outright Sales</SelectItem>
                    <SelectItem value="swipe">Swipe Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Payment Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="amount-range">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="min-amount"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min Amount"
                    className="text-sm"
                  />
                  <Input
                    id="max-amount"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max Amount"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Search Filter */}
              <div className="space-y-2">
                <Label htmlFor="search-query">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="search-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Customer name or transaction ID"
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Showing {reportingData.filteredCount} of {reportingData.totalCount} transactions</strong>
                {(dateRange.start || dateRange.end || customerFilter !== 'all' || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount || searchQuery) && (
                  <div className="mt-2 text-xs">
                    Active filters: 
                    {dateRange.start && ` Date from ${dateRange.start}`}
                    {dateRange.end && ` to ${dateRange.end}`}
                    {customerFilter !== 'all' && ` Customer: ${safeCustomers.find(c => c.id.toString() === customerFilter)?.name}`}
                    {transactionTypeFilter !== 'all' && ` Type: ${transactionTypeFilter}`}
                    {statusFilter !== 'all' && ` Status: ${statusFilter}`}
                    {minAmount && ` Min: ${formatCurrency(parseFloat(minAmount))}`}
                    {maxAmount && ` Max: ${formatCurrency(parseFloat(maxAmount))}`}
                    {searchQuery && ` Search: "${searchQuery}"`}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced View Modes */}
      {viewMode === 'reports' && (
        <div className="space-y-6">
          {/* Custom Reports */}
          {selectedReport === 'custom' && (
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Gas Business Report Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-6">Comprehensive overview of your gas cylinder business performance with growth comparisons</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportingData.currentMetrics.totalSales)}</div>
                      <div className="text-sm text-blue-700">Gas Sales Revenue</div>
                      <div className={`text-xs ${reportingData.growth.sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportingData.growth.sales >= 0 ? '+' : ''}{reportingData.growth.sales.toFixed(1)}% vs previous
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(reportingData.currentMetrics.totalPayments)}</div>
                      <div className="text-sm text-green-700">Payments Collected</div>
                      <div className={`text-xs ${reportingData.growth.payments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportingData.growth.payments >= 0 ? '+' : ''}{reportingData.growth.payments.toFixed(1)}% vs previous
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{reportingData.currentMetrics.totalCylinders}</div>
                      <div className="text-sm text-purple-700">Cylinders Sold</div>
                      <div className={`text-xs ${reportingData.growth.cylinders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportingData.growth.cylinders >= 0 ? '+' : ''}{reportingData.growth.cylinders.toFixed(1)}% vs previous
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{reportingData.currentMetrics.transactionCount}</div>
                      <div className="text-sm text-orange-700">Customer Orders</div>
                      <div className={`text-xs ${reportingData.growth.transactions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportingData.growth.transactions >= 0 ? '+' : ''}{reportingData.growth.transactions.toFixed(1)}% vs previous
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={generateCustomReport} className="bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparative Analysis */}
          {selectedReport === 'comparative' && (
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Gas Business Performance Comparison: This {selectedPeriod} vs Previous {selectedPeriod}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-4">Side-by-side comparison showing growth or decline in key business metrics</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      {
                        metric: 'Gas Sales',
                        current: reportingData.currentMetrics.totalSales,
                        previous: reportingData.previousMetrics.totalSales,
                        growth: reportingData.growth.sales
                      },
                      {
                        metric: 'Payments',
                        current: reportingData.currentMetrics.totalPayments,
                        previous: reportingData.previousMetrics.totalPayments,
                        growth: reportingData.growth.payments
                      },
                      {
                        metric: 'Cylinders',
                        current: reportingData.currentMetrics.totalCylinders,
                        previous: reportingData.previousMetrics.totalCylinders,
                        growth: reportingData.growth.cylinders
                      },
                      {
                        metric: 'Orders',
                        current: reportingData.currentMetrics.transactionCount,
                        previous: reportingData.previousMetrics.transactionCount,
                        growth: reportingData.growth.transactions
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'current' ? 'Current' : 'Previous']} />
                      <Legend />
                      <Bar dataKey="current" fill="#10b981" name="Current" />
                      <Bar dataKey="previous" fill="#6b7280" name="Previous" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales Forecasting */}
          {selectedReport === 'forecasting' && (
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sales Forecasting & Demand Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportingData.salesForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">+12.5%</div>
                      <div className="text-sm text-purple-700">Predicted Growth</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">Q1 2024</div>
                      <div className="text-sm text-blue-700">Peak Season</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-green-700">Forecast Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Customer Insights */}
          {selectedReport === 'insights' && (
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gas Customer Insights & Buying Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-6">Analysis of customer preferences for gas cylinder sizes and service types</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Gas Cylinder Size Preferences
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">Distribution of customer preferences for different cylinder sizes</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '6kg', value: reportingData.customerInsights.filter(c => c.preferredSize === '6kg').length },
                              { name: '13kg', value: reportingData.customerInsights.filter(c => c.preferredSize === '13kg').length },
                              { name: '50kg', value: reportingData.customerInsights.filter(c => c.preferredSize === '50kg').length }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartColors.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Service Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Gas Service Type Preferences
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">Customer preference for refills, outright purchases, or swipe services</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { service: 'Loads', customers: reportingData.customerInsights.filter(c => c.preferredService === 'Loads').length },
                          { service: 'Refills', customers: reportingData.customerInsights.filter(c => c.preferredService === 'Refills').length },
                          { service: 'Outright', customers: reportingData.customerInsights.filter(c => c.preferredService === 'Outright').length },
                          { service: 'Swipes', customers: reportingData.customerInsights.filter(c => c.preferredService === 'Swipes').length }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="service" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="customers" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Customers */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Top Gas Customers by Sales
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Your highest-value customers with their preferred gas cylinder types</p>
                    <div className="space-y-2">
                      {reportingData.customerInsights
                        .sort((a, b) => b.totalSales - a.totalSales)
                        .slice(0, 5)
                        .map((customer, index) => (
                          <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold">{customer.name}</div>
                                <div className="text-sm text-gray-600">
                                  {customer.transactionCount} orders • Prefers {customer.preferredSize} {customer.preferredService}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(customer.totalSales)}</div>
                              <div className="text-sm text-gray-600">Avg: {formatCurrency(customer.avgTransactionValue)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


        </div>
      )}

      {/* Enhanced Forecasting Dashboard */}
      {viewMode === 'forecasting' && (
        <div className="space-y-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Gas Sales Forecasting & Demand Prediction
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
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Sales Forecast with Confidence Intervals
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Predicted gas cylinder sales with upper and lower confidence bounds</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={forecastData.forecast.map((value, index) => ({
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
                        <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Model Performance */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Model Performance Metrics
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Accuracy comparison of different forecasting algorithms</p>
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

      {/* Risk Analysis Dashboard */}
      {viewMode === 'risk-analysis' && (
        <div className="space-y-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Analysis & Volatility Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {forecastData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Risk Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Risk Metrics
                    </h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Value at Risk (95%)</span>
                          <span className="font-semibold">{formatCurrency(Math.abs(forecastData.riskMetrics.valueAtRisk * reportingData.currentMetrics.totalSales))}</span>
                        </div>
                        <p className="text-xs text-gray-600">Maximum potential loss with 95% confidence over a given time period</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Expected Shortfall</span>
                          <span className="font-semibold">{formatCurrency(Math.abs(forecastData.riskMetrics.expectedShortfall * reportingData.currentMetrics.totalSales))}</span>
                        </div>
                        <p className="text-xs text-gray-600">Average loss expected when VaR threshold is exceeded</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Max Drawdown</span>
                          <span className="font-semibold">{(forecastData.riskMetrics.maxDrawdown * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-gray-600">Largest peak-to-trough decline in sales performance</p>
                      </div>
                    </div>
                  </div>

                  {/* Volatility Analysis */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Volatility Analysis
                    </h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Historical Volatility</span>
                          <span className="font-semibold">{(forecastData.volatilityMetrics.historicalVolatility * 100).toFixed(2)}%</span>
                        </div>
                        <p className="text-xs text-gray-600">Standard deviation of past sales returns</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Implied Volatility</span>
                          <span className="font-semibold">{(forecastData.volatilityMetrics.impliedVolatility * 100).toFixed(2)}%</span>
                        </div>
                        <p className="text-xs text-gray-600">Market's expectation of future volatility</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Vol of Vol</span>
                          <span className="font-semibold">{(forecastData.volatilityMetrics.volatilityOfVolatility * 100).toFixed(2)}%</span>
                        </div>
                        <p className="text-xs text-gray-600">Volatility of volatility - measures stability of risk</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Distribution */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Customer Risk Distribution
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Low Risk', value: 60, fill: '#10b981' },
                              { name: 'Medium Risk', value: 30, fill: '#f59e0b' },
                              { name: 'High Risk', value: 10, fill: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 text-xs text-gray-600 text-center">
                        Distribution of customers by risk level based on payment history and transaction patterns
                      </div>
                    </div>
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

      {/* Advanced Insights Dashboard */}
      {viewMode === 'advanced-insights' && (
        <div className="space-y-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Advanced Gas Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Behavior Analysis */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Customer Gas Consumption Patterns
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Top customers by gas cylinder purchases and transaction frequency</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportingData.customerInsights.slice(0, 10).map(c => ({
                      name: c.name,
                      sales: c.totalSales,
                      transactions: c.transactionCount
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="sales" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sales Trend Analysis */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Monthly Gas Sales Trends
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Historical monthly gas cylinder sales showing seasonal patterns</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportingData.salesForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 