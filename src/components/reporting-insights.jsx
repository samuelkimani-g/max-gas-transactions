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
  Flame, Fuel, Zap as Lightning, AlertTriangle, Info, X, Search, DollarSign, CreditCard
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

  // Filtering states
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [customerFilter, setCustomerFilter] = useState('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Helper function to calculate total payments for a transaction
  const calculateTotalPayments = (transaction) => {
    if (transaction.payments && Array.isArray(transaction.payments)) {
      return transaction.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    }
    return transaction.amount_paid || 0
  }

  // Helper function to check if transaction matches filters
  const transactionMatchesFilters = (transaction) => {
    if (!transaction || !transaction.date) return false
    
    const date = new Date(transaction.date)
    if (isNaN(date.getTime())) return false
    
    // Date range filter
    if (dateRange.start && date < new Date(dateRange.start)) return false
    if (dateRange.end && date > new Date(dateRange.end)) return false
    
    // Customer filter
    if (customerFilter !== 'all' && transaction.customerId !== parseInt(customerFilter)) return false
    
    // Transaction type filter
    if (transactionTypeFilter !== 'all') {
      const hasRefill = (transaction.returns_breakdown?.max_empty?.kg6 || 0) + 
                       (transaction.returns_breakdown?.max_empty?.kg13 || 0) + 
                       (transaction.returns_breakdown?.max_empty?.kg50 || 0) > 0
      const hasOutright = (transaction.outright_breakdown?.kg6 || 0) + 
                         (transaction.outright_breakdown?.kg13 || 0) + 
                         (transaction.outright_breakdown?.kg50 || 0) > 0
      const hasSwipe = (transaction.returns_breakdown?.swap_empty?.kg6 || 0) + 
                      (transaction.returns_breakdown?.swap_empty?.kg13 || 0) + 
                      (transaction.returns_breakdown?.swap_empty?.kg50 || 0) > 0
      
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
    const total = calculateTransactionTotal(transaction)
    if (minAmount && total < parseFloat(minAmount)) return false
    if (maxAmount && total > parseFloat(maxAmount)) return false
    
    // Status filter
    if (statusFilter !== 'all') {
      const paid = calculateTotalPayments(transaction)
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
      const safeCustomers = Array.isArray(customers) ? customers : []
      const customer = safeCustomers.find(c => c.id === transaction.customerId)
      const customerName = customer ? customer.name.toLowerCase() : ''
      const transactionId = transaction.id.toString()
      const query = searchQuery.toLowerCase()
      
      if (!customerName.includes(query) && !transactionId.includes(query)) {
        return false
      }
    }
    
    return true
  }

  // Calculate comprehensive reporting data with proper data handling
  const reportingData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Ensure data is safe and properly structured
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeCustomers = Array.isArray(customers) ? customers : []

    // Get current period data
    const getCurrentPeriodData = (period) => {
      return safeTransactions.filter(transaction => {
        if (!transactionMatchesFilters(transaction)) return false
        
        const date = new Date(transaction.date)
        
        switch (period) {
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
          case 'custom':
            return true // Use date range filter
          case 'all':
            return true
          default:
            return true
        }
      })
    }

    // Get previous period data for comparison
    const getPreviousPeriodData = (period) => {
      return safeTransactions.filter(transaction => {
        if (!transactionMatchesFilters(transaction)) return false
        
        const date = new Date(transaction.date)
        
        switch (period) {
          case 'weekly':
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return date >= twoWeeksAgo && date < weekAgo
          case 'monthly':
            const prevMonth = new Date(currentYear, currentMonth - 1, 1)
            const prevMonthEnd = new Date(currentYear, currentMonth, 0)
            return date >= prevMonth && date <= prevMonthEnd
          case 'quarterly':
            const prevQuarterStart = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3, 1)
            const prevQuarterEnd = new Date(currentYear, Math.floor((currentMonth - 3) / 3) * 3 + 3, 0)
            return date >= prevQuarterStart && date <= prevQuarterEnd
          case 'yearly':
            return date.getFullYear() === currentYear - 1
          case 'custom':
            if (dateRange.start && dateRange.end) {
              const currentStart = new Date(dateRange.start)
              const currentEnd = new Date(dateRange.end)
              const duration = currentEnd.getTime() - currentStart.getTime()
              const prevStart = new Date(currentStart.getTime() - duration)
              const prevEnd = new Date(currentStart.getTime())
              return date >= prevStart && date < prevEnd
            }
            return false
          case 'all':
            return false // No previous period for 'all'
          default:
            return false
        }
      })
    }

    const currentData = getCurrentPeriodData(selectedPeriod)
    const previousData = getPreviousPeriodData(selectedPeriod)

    // Calculate metrics with proper data handling
    const calculateMetrics = (data) => {
      const totalSales = data.reduce((total, transaction) => total + calculateTransactionTotal(transaction), 0)
      
      const totalPayments = data.reduce((total, transaction) => {
        return total + calculateTotalPayments(transaction)
      }, 0)
      
      const totalCylinders = data.reduce((total, transaction) => {
        const returns = (transaction.returns_breakdown?.max_empty?.kg6 || 0) + 
                       (transaction.returns_breakdown?.max_empty?.kg13 || 0) + 
                       (transaction.returns_breakdown?.max_empty?.kg50 || 0) +
                       (transaction.returns_breakdown?.swap_empty?.kg6 || 0) + 
                       (transaction.returns_breakdown?.swap_empty?.kg13 || 0) + 
                       (transaction.returns_breakdown?.swap_empty?.kg50 || 0) +
                       (transaction.returns_breakdown?.return_full?.kg6 || 0) + 
                       (transaction.returns_breakdown?.return_full?.kg13 || 0) + 
                       (transaction.returns_breakdown?.return_full?.kg50 || 0)
        
        const outright = (transaction.outright_breakdown?.kg6 || 0) + 
                        (transaction.outright_breakdown?.kg13 || 0) + 
                        (transaction.outright_breakdown?.kg50 || 0)
        
        return total + returns + outright
      }, 0)
      
      return { 
        totalSales, 
        totalPayments, 
        totalCylinders, 
        transactionCount: data.length 
      }
    }

    const currentMetrics = calculateMetrics(currentData)
    const previousMetrics = calculateMetrics(previousData)

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Customer insights
    const getCustomerInsights = () => {
      const customerStats = {}
      
      currentData.forEach(transaction => {
        const customer = safeCustomers.find(c => c.id === transaction.customerId)
        if (customer) {
          if (!customerStats[customer.id]) {
            customerStats[customer.id] = {
              name: customer.name,
              totalSales: 0,
              totalTransactions: 0,
              totalCylinders: 0
            }
          }
          
          customerStats[customer.id].totalSales += calculateTransactionTotal(transaction)
          customerStats[customer.id].totalTransactions += 1
          
          const cylinders = (transaction.returns_breakdown?.max_empty?.kg6 || 0) + 
                           (transaction.returns_breakdown?.max_empty?.kg13 || 0) + 
                           (transaction.returns_breakdown?.max_empty?.kg50 || 0) +
                           (transaction.outright_breakdown?.kg6 || 0) + 
                           (transaction.outright_breakdown?.kg13 || 0) + 
                           (transaction.outright_breakdown?.kg50 || 0)
          
          customerStats[customer.id].totalCylinders += cylinders
        }
      })
      
      return Object.values(customerStats).sort((a, b) => b.totalSales - a.totalSales)
    }

    return {
      currentData,
      previousData,
      currentMetrics,
      previousMetrics,
      growth: {
        sales: calculateGrowth(currentMetrics.totalSales, previousMetrics.totalSales),
        payments: calculateGrowth(currentMetrics.totalPayments, previousMetrics.totalPayments),
        cylinders: calculateGrowth(currentMetrics.totalCylinders, previousMetrics.totalCylinders),
        transactions: calculateGrowth(currentMetrics.transactionCount, previousMetrics.transactionCount)
      },
      customerInsights: getCustomerInsights(),
      safeCustomers,
      safeTransactions
    }
  }, [
    transactions, 
    customers, 
    selectedPeriod, 
    dateRange, 
    customerFilter, 
    transactionTypeFilter, 
    statusFilter, 
    minAmount, 
    maxAmount, 
    searchQuery
  ])

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

  // Generate custom report
  const generateCustomReport = () => {
    const report = {
      period: selectedPeriod,
      dateRange,
      metrics: reportingData.currentMetrics,
      growth: reportingData.growth,
      customerInsights: reportingData.customerInsights,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gas-sales-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting & Insights</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and business intelligence</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            onClick={generateCustomReport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Date Range</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start Date"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End Date"
                  />
                </div>
              </div>
              
              <div>
                <Label>Customer</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {reportingData.safeCustomers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Transaction Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="refill">Refill Only</SelectItem>
                    <SelectItem value="outright">Outright Only</SelectItem>
                    <SelectItem value="swipe">Swipe Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min Amount"
                />
              </div>
              
              <div>
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max Amount"
                />
              </div>
              
              <div>
                <Label>Search</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Report Period:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="quarterly">This Quarter</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-40"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-40"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Gas Sales Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(reportingData.currentMetrics.totalSales)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {reportingData.growth.sales >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportingData.growth.sales >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {reportingData.growth.sales >= 0 ? '+' : ''}{reportingData.growth.sales.toFixed(1)}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Payments Collected</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(reportingData.currentMetrics.totalPayments)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {reportingData.growth.payments >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportingData.growth.payments >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {reportingData.growth.payments >= 0 ? '+' : ''}{reportingData.growth.payments.toFixed(1)}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Cylinders Sold</p>
                <p className="text-2xl font-bold text-purple-900">
                  {reportingData.currentMetrics.totalCylinders}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {reportingData.growth.cylinders >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportingData.growth.cylinders >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {reportingData.growth.cylinders >= 0 ? '+' : ''}{reportingData.growth.cylinders.toFixed(1)}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <Flame className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Customer Orders</p>
                <p className="text-2xl font-bold text-orange-900">
                  {reportingData.currentMetrics.transactionCount}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {reportingData.growth.transactions >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportingData.growth.transactions >= 0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {reportingData.growth.transactions >= 0 ? '+' : ''}{reportingData.growth.transactions.toFixed(1)}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-200 rounded-lg">
                <Users className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportingData.currentData.map((transaction, index) => ({
                date: new Date(transaction.date).toLocaleDateString(),
                sales: calculateTransactionTotal(transaction)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportingData.customerInsights.slice(0, 5).map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.totalTransactions} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatCurrency(customer.totalSales)}</p>
                    <p className="text-sm text-gray-600">{customer.totalCylinders} cylinders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-2xl font-bold text-gray-900">{selectedPeriod}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Transactions Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{reportingData.currentData.length}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Previous Period</p>
              <p className="text-2xl font-bold text-gray-900">{reportingData.previousData.length}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{reportingData.safeCustomers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 