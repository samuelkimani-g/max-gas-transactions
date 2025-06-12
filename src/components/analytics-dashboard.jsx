"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"
import { BarChart3, DollarSign, CreditCard, Package, TrendingUp, Users, Calendar } from "lucide-react"

export default function AnalyticsDashboard() {
  const { transactions, customers } = useStore()

  // Calculate total sales
  const totalSales = transactions.reduce((total, t) => {
    // MaxGas Refills (Returns)
    const refill6kg = (t.return6kg || 0) * (t.refillPrice6kg || 0)
    const refill13kg = (t.return13kg || 0) * (t.refillPrice13kg || 0)
    const refill50kg = (t.return50kg || 0) * (t.refillPrice50kg || 0)

    // MaxGas Outright Sales (Full cylinders)
    const outright6kg = (t.outright6kg || 0) * (t.outrightPrice6kg || 0)
    const outright13kg = (t.outright13kg || 0) * (t.outrightPrice13kg || 0)
    const outright50kg = (t.outright50kg || 0) * (t.outrightPrice50kg || 0)

    // Other Company Swipes
    const swipe6kg = (t.swipeReturn6kg || 0) * (t.swipeRefillPrice6kg || 0)
    const swipe13kg = (t.swipeReturn13kg || 0) * (t.swipeRefillPrice13kg || 0)
    const swipe50kg = (t.swipeReturn50kg || 0) * (t.swipeRefillPrice50kg || 0)

    return (
      total +
      refill6kg +
      refill13kg +
      refill50kg +
      outright6kg +
      outright13kg +
      outright50kg +
      swipe6kg +
      swipe13kg +
      swipe50kg
    )
  }, 0)

  // Calculate total payments received
  const totalPayments = transactions.reduce((total, t) => total + (t.paid || 0), 0)

  // Calculate outstanding balance
  const totalOutstanding = totalSales - totalPayments

  // Calculate total cylinders
  const totalCylinders = transactions.reduce((total, t) => {
    const returns = (t.return6kg || 0) + (t.return13kg || 0) + (t.return50kg || 0)
    const outright = (t.outright6kg || 0) + (t.outright13kg || 0) + (t.outright50kg || 0)
    const swipes = (t.swipeReturn6kg || 0) + (t.swipeReturn13kg || 0) + (t.swipeReturn50kg || 0)
    return total + returns + outright + swipes
  }, 0)

  // Calculate monthly sales data
  const monthlySales = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    const total =
      (t.return6kg || 0) * (t.refillPrice6kg || 0) +
      (t.return13kg || 0) * (t.refillPrice13kg || 0) +
      (t.return50kg || 0) * (t.refillPrice50kg || 0) +
      (t.outright6kg || 0) * (t.outrightPrice6kg || 0) +
      (t.outright13kg || 0) * (t.outrightPrice13kg || 0) +
      (t.outright50kg || 0) * (t.outrightPrice50kg || 0) +
      (t.swipeReturn6kg || 0) * (t.swipeRefillPrice6kg || 0) +
      (t.swipeReturn13kg || 0) * (t.swipeRefillPrice13kg || 0) +
      (t.swipeReturn50kg || 0) * (t.swipeRefillPrice50kg || 0)

    acc[month] = (acc[month] || 0) + total
    return acc
  }, {})

  // Calculate cylinder type distribution
  const cylinderData = transactions.reduce((acc, t) => {
    acc["6kg"] = (acc["6kg"] || 0) + (t.return6kg || 0) + (t.outright6kg || 0) + (t.swipeReturn6kg || 0)
    acc["13kg"] = (acc["13kg"] || 0) + (t.return13kg || 0) + (t.outright13kg || 0) + (t.swipeReturn13kg || 0)
    acc["50kg"] = (acc["50kg"] || 0) + (t.return50kg || 0) + (t.outright50kg || 0) + (t.swipeReturn50kg || 0)
    return acc
  }, {})

  // Get recent transactions
  const recentTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Calculate service type breakdown
  const serviceBreakdown = transactions.reduce(
    (acc, t) => {
      const refills = (t.return6kg || 0) + (t.return13kg || 0) + (t.return50kg || 0)
      const outright = (t.outright6kg || 0) + (t.outright13kg || 0) + (t.outright50kg || 0)
      const swipes = (t.swipeReturn6kg || 0) + (t.swipeReturn13kg || 0) + (t.swipeReturn50kg || 0)

      acc.refills += refills
      acc.outright += outright
      acc.swipes += swipes
      return acc
    },
    { refills: 0, outright: 0, swipes: 0 },
  )

  const maxCylinderCount = Math.max(...Object.values(cylinderData))
  const maxMonthlySales = Math.max(...Object.values(monthlySales))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Sales</CardTitle>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-orange-100 mt-1">All-time sales value</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-green-500 to-green-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Payments Received</CardTitle>
              <CreditCard className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPayments)}</div>
            <p className="text-green-100 mt-1">Total payments collected</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-red-500 to-red-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Outstanding</CardTitle>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-red-100 mt-1">Total unpaid amount</p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Cylinders</CardTitle>
              <Package className="w-8 h-8 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCylinders}</div>
            <p className="text-blue-100 mt-1">Cylinders processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(monthlySales).map(([month, sales]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{month}</span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${maxMonthlySales > 0 ? (sales / maxMonthlySales) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                      {formatCurrency(sales)}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(monthlySales).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cylinder Distribution Chart */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cylinder Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(cylinderData).map(([size, count], index) => {
                const colors = [
                  "from-orange-500 to-orange-600",
                  "from-orange-600 to-orange-700",
                  "from-orange-700 to-orange-800",
                ]
                return (
                  <div key={size} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{size} Cylinders</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`bg-gradient-to-r ${colors[index]} h-3 rounded-full transition-all duration-500`}
                          style={{
                            width: `${maxCylinderCount > 0 ? (count / maxCylinderCount) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[40px] text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
              {Object.keys(cylinderData).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No cylinder data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Breakdown */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Service Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div>
                  <h3 className="font-semibold text-green-800">Refills</h3>
                  <p className="text-sm text-green-600">MaxGas returns</p>
                </div>
                <div className="text-2xl font-bold text-green-700">{serviceBreakdown.refills}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div>
                  <h3 className="font-semibold text-blue-800">Outright Sales</h3>
                  <p className="text-sm text-blue-600">Full cylinders sold</p>
                </div>
                <div className="text-2xl font-bold text-blue-700">{serviceBreakdown.outright}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div>
                  <h3 className="font-semibold text-orange-800">Swipes</h3>
                  <p className="text-sm text-orange-600">Other company cylinders</p>
                </div>
                <div className="text-2xl font-bold text-orange-700">{serviceBreakdown.swipes}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const customer = customers.find((c) => c.id === transaction.customerId)
                const total =
                  (transaction.return6kg || 0) * (transaction.refillPrice6kg || 0) +
                  (transaction.return13kg || 0) * (transaction.refillPrice13kg || 0) +
                  (transaction.return50kg || 0) * (transaction.refillPrice50kg || 0) +
                  (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 0) +
                  (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 0) +
                  (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 0) +
                  (transaction.swipeReturn6kg || 0) * (transaction.swipeRefillPrice6kg || 0) +
                  (transaction.swipeReturn13kg || 0) * (transaction.swipeRefillPrice13kg || 0) +
                  (transaction.swipeReturn50kg || 0) * (transaction.swipeRefillPrice50kg || 0)

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{customer?.name || "Unknown Customer"}</h4>
                      <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(total)}</div>
                      <div className="text-sm text-gray-500">
                        {total - (transaction.paid || 0) > 0 ? "Outstanding" : "Paid"}
                      </div>
                    </div>
                  </div>
                )
              })}
              {recentTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">{customers.length}</div>
              <p className="text-gray-600 mt-2">Total Customers</p>
              <div className="mt-4 text-sm text-gray-500">{transactions.length} total transactions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">
                {formatCurrency(transactions.length > 0 ? totalSales / transactions.length : 0)}
              </div>
              <p className="text-gray-600 mt-2">Per Transaction</p>
              <div className="mt-4 text-sm text-gray-500">Based on {transactions.length} transactions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">
                {totalSales > 0 ? Math.round((totalPayments / totalSales) * 100) : 0}%
              </div>
              <p className="text-gray-600 mt-2">Payment Collection</p>
              <div className="mt-4 text-sm text-gray-500">
                {formatCurrency(totalPayments)} of {formatCurrency(totalSales)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
