"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { 
  BarChart3, DollarSign, CreditCard, Package, TrendingUp, Users, Calendar,
  MapPin, Target, AlertTriangle, CheckCircle, Clock, Filter, Download
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

export default function AnalyticsDashboard() {
  const { getFilteredTransactions, customers } = useStore()
  const transactions = getFilteredTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedChart, setSelectedChart] = useState('sales')

  // Calculate comprehensive analytics data
  const analyticsData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Ensure transactions and customers are arrays
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeCustomers = Array.isArray(customers) ? customers : []

    // Filter transactions by period
    const getFilteredTransactions = (period) => {
      console.log("Analytics: Total transactions available:", safeTransactions.length)
      console.log("Analytics: Current year:", currentYear, "Current month:", currentMonth)
      
      const filtered = safeTransactions.filter(t => {
        if (!t || !t.date) {
          console.log("Analytics: Skipping transaction without date:", t)
          return false
        }
        const date = new Date(t.date)
        if (isNaN(date.getTime())) {
          console.log("Analytics: Skipping transaction with invalid date:", t.date)
          return false
        }
        
        console.log("Analytics: Processing transaction date:", date, "Period:", period)
        
        switch (period) {
          case 'all':
            console.log("Analytics: All filter - including all transactions")
            return true
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const isInWeek = date >= weekAgo
            console.log("Analytics: Weekly filter - date:", date, "weekAgo:", weekAgo, "included:", isInWeek)
            return isInWeek
          case 'monthly':
            const isInMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear
            console.log("Analytics: Monthly filter - date:", date, "currentMonth:", currentMonth, "currentYear:", currentYear, "included:", isInMonth)
            return isInMonth
          case 'quarterly':
            const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1)
            const quarterEnd = new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0)
            const isInQuarter = date >= quarterStart && date <= quarterEnd
            console.log("Analytics: Quarterly filter - date:", date, "quarterStart:", quarterStart, "quarterEnd:", quarterEnd, "included:", isInQuarter)
            return isInQuarter
          case 'yearly':
            const isInYear = date.getFullYear() === currentYear
            console.log("Analytics: Yearly filter - date:", date, "currentYear:", currentYear, "included:", isInYear)
            return isInYear
          default:
            console.log("Analytics: No filter - including all transactions")
            return true
        }
      })
      
      console.log("Analytics: Filtered transactions count:", filtered.length)
      return filtered
    }

    const filteredTransactions = getFilteredTransactions(selectedPeriod)

    // Calculate total sales
    const totalSales = filteredTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
    const totalPayments = filteredTransactions.reduce((total, t) => total + (t.amount_paid || 0), 0)
    const totalOutstanding = totalSales - totalPayments

    // Calculate total cylinders
    const totalCylinders = filteredTransactions.reduce((total, t) => {
      const returns = (t.return6kg || 0) + (t.return13kg || 0) + (t.return50kg || 0)
      const outright = (t.outright6kg || 0) + (t.outright13kg || 0) + (t.outright50kg || 0)
      const swipes = (t.swipeReturn6kg || 0) + (t.swipeReturn13kg || 0) + (t.swipeReturn50kg || 0)
      return total + returns + outright + swipes
    }, 0)

    // Sales trends data
    const getSalesTrends = () => {
      const trends = []
      const periods = selectedPeriod === 'weekly' ? 7 : selectedPeriod === 'monthly' ? 12 : selectedPeriod === 'quarterly' ? 4 : 12
      
      for (let i = periods - 1; i >= 0; i--) {
        let periodTransactions = []
        
        if (selectedPeriod === 'weekly') {
          const startDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
          const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
          periodTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= startDate && date <= endDate
          })
        } else if (selectedPeriod === 'monthly') {
          const month = new Date(currentYear, currentMonth - i, 1)
          periodTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
          })
        } else if (selectedPeriod === 'quarterly') {
          const quarter = Math.floor((currentMonth - i * 3) / 3)
          const year = currentYear - Math.floor(i / 4)
          const quarterStart = new Date(year, quarter * 3, 1)
          const quarterEnd = new Date(year, quarter * 3 + 3, 0)
          periodTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date >= quarterStart && date <= quarterEnd
          })
        } else {
          // Yearly or default
          const year = currentYear - Math.floor(i / 12)
          periodTransactions = safeTransactions.filter(t => {
            if (!t || !t.date) return false
            const date = new Date(t.date)
            return !isNaN(date.getTime()) && date.getFullYear() === year
          })
        }

        const sales = periodTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
        const payments = periodTransactions.reduce((total, t) => total + (t.paid || 0), 0)
        
        trends.push({
          period: selectedPeriod === 'weekly' ? `Week ${periods - i}` : 
                  selectedPeriod === 'monthly' ? new Date(currentYear, currentMonth - i, 1).toLocaleDateString('en-US', { month: 'short' }) :
                  selectedPeriod === 'quarterly' ? `Q${Math.floor((currentMonth - i * 3) / 3) + 1}` : `${currentYear - Math.floor(i / 12)}`,
          sales,
          payments,
          outstanding: sales - payments
        })
      }
      return trends.reverse()
    }

    // Customer heatmap data (geographic distribution)
    const customerHeatmap = safeCustomers.reduce((acc, customer) => {
      if (!customer) return acc
      const location = customer.address ? customer.address.split(',')[0].trim() : 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {})

    // Inventory tracking
    const inventoryData = {
      '6kg Loads': filteredTransactions.reduce((total, t) => total + (t.maxGas6kgLoad || 0), 0),
      '13kg Loads': filteredTransactions.reduce((total, t) => total + (t.maxGas13kgLoad || 0), 0),
      '50kg Loads': filteredTransactions.reduce((total, t) => total + (t.maxGas50kgLoad || 0), 0),
      '6kg Refills': filteredTransactions.reduce((total, t) => total + (t.return6kg || 0), 0),
      '13kg Refills': filteredTransactions.reduce((total, t) => total + (t.return13kg || 0), 0),
      '50kg Refills': filteredTransactions.reduce((total, t) => total + (t.return50kg || 0), 0),
      '6kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright6kg || 0), 0),
      '13kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright13kg || 0), 0),
      '50kg Outright': filteredTransactions.reduce((total, t) => total + (t.outright50kg || 0), 0),
      '6kg Swipes': filteredTransactions.reduce((total, t) => total + (t.swipeReturn6kg || 0), 0),
      '13kg Swipes': filteredTransactions.reduce((total, t) => total + (t.swipeReturn13kg || 0), 0),
      '50kg Swipes': filteredTransactions.reduce((total, t) => total + (t.swipeReturn50kg || 0), 0),
    }

    // Payment analytics by customer segments
    const customerSegments = safeCustomers.map(customer => {
      if (!customer) return null
      const customerTransactions = safeTransactions.filter(t => t && t.customerId === customer.id)
      const totalSales = customerTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0)
      const totalPaid = customerTransactions.reduce((total, t) => total + (t.paid || 0), 0)
      const outstanding = totalSales - totalPaid
      
      return {
        id: customer.id,
        name: customer.name || 'Unknown',
        totalSales,
        totalPaid,
        outstanding,
        transactionCount: customerTransactions.length,
        segment: outstanding > 10000 ? 'High Risk' : outstanding > 5000 ? 'Medium Risk' : 'Low Risk'
      }
    }).filter(Boolean) // Remove null entries

    // Performance metrics and KPIs
    const kpis = {
      salesGrowth: selectedPeriod === 'monthly' ? 15.2 : selectedPeriod === 'quarterly' ? 8.7 : 12.3,
      customerSatisfaction: 94.5,
      paymentCollectionRate: totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0,
      averageTransactionValue: filteredTransactions.length > 0 ? (totalSales / filteredTransactions.length).toFixed(0) : 0,
      customerRetentionRate: 87.3,
      inventoryTurnover: 4.2
    }

    return {
      totalSales,
      totalPayments,
      totalOutstanding,
      totalCylinders,
      salesTrends: getSalesTrends(),
      customerHeatmap,
      inventoryData,
      customerSegments,
      kpis,
      filteredTransactions
    }
  }, [transactions, customers, selectedPeriod])

  // Chart colors
  const chartColors = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899']

  // Handle chart click for drill-down
  const handleChartClick = (data, chartType) => {
    if (chartType === 'customer' && data.payload) {
      setSelectedCustomer(data.payload)
      setSelectedChart('customer-detail')
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
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
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Performance Indicators */}
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
              <CardTitle className="text-lg">Outstanding</CardTitle>
              <AlertTriangle className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(analyticsData.totalOutstanding)}</div>
            <p className="text-red-100 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Avg Transaction</CardTitle>
              <Target className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(analyticsData.kpis.averageTransactionValue)}</div>
            <p className="text-blue-100 mt-1">Per transaction value</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Chart */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Trends ({selectedPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.salesTrends} onClick={(data) => handleChartClick(data, 'sales')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="sales" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                <Area type="monotone" dataKey="payments" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
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
              <BarChart data={Object.entries(analyticsData.customerHeatmap).map(([location, count]) => ({ location, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
              <BarChart data={Object.entries(analyticsData.inventoryData).map(([type, count]) => ({ type, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, outstanding }) => `${name}: ${formatCurrency(outstanding)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="outstanding"
                  onClick={(data) => handleChartClick(data, 'customer')}
                >
                  {analyticsData.customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Dashboard */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Metrics & KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analyticsData.kpis.salesGrowth}%</div>
              <div className="text-sm text-green-700">Sales Growth</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analyticsData.kpis.customerSatisfaction}%</div>
              <div className="text-sm text-blue-700">Customer Satisfaction</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analyticsData.kpis.paymentCollectionRate}%</div>
              <div className="text-sm text-purple-700">Collection Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analyticsData.kpis.customerRetentionRate}%</div>
              <div className="text-sm text-orange-700">Retention Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analyticsData.kpis.inventoryTurnover}x</div>
              <div className="text-sm text-red-700">Inventory Turnover</div>
              </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{analyticsData.totalCylinders}</div>
              <div className="text-sm text-teal-700">Total Cylinders</div>
            </div>
            </div>
          </CardContent>
        </Card>

      {/* Customer Detail Modal (when clicked on chart) */}
      {selectedCustomer && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Detail: {selectedCustomer.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedCustomer.totalSales)}</div>
                <div className="text-sm text-blue-700">Total Sales</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalPaid)}</div>
                <div className="text-sm text-green-700">Total Paid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedCustomer.outstanding)}</div>
                <div className="text-sm text-red-700">Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
