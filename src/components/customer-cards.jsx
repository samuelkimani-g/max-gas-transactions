"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { User, Phone, Mail, MapPin, Eye } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"

export default function CustomerCards() {
  const { getFilteredCustomers, setSelectedCustomerId, getCustomerOutstanding, getCustomerTransactions, getCustomerCylinderBalance } = useStore()
  const customers = getFilteredCustomers()

  // Safety check
  const safeCustomers = customers || []

  // Debug logging
  console.log("CustomerCards: Total customers:", safeCustomers.length)
  safeCustomers.forEach(customer => {
    const transactions = getCustomerTransactions(customer.id)
    console.log(`Customer ${customer.name} (ID: ${customer.id}) has ${transactions.length} transactions:`, transactions)
  })

  if (safeCustomers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new customer.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {safeCustomers.map((customer) => {
        const outstanding = getCustomerOutstanding(customer.id)
        const transactions = getCustomerTransactions(customer.id)
        const cylinderBalance = getCustomerCylinderBalance(customer.id)

        return (
          <Card
            key={customer.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/90 backdrop-blur-sm"
            onClick={() => {
              console.log("Card clicked, customer ID:", customer.id) // Debug log
              setSelectedCustomerId(customer.id)
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{customer.name}</CardTitle>
                <Badge className={outstanding > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {outstanding > 0 ? "Outstanding" : "Paid"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Cylinder Balance Section */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cylinder Balance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">6kg:</span>
                    <span className={`text-xs font-medium ${cylinderBalance['6kg'] < 0 ? 'text-red-600' : cylinderBalance['6kg'] > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {cylinderBalance['6kg'] < 0 ? `-${Math.abs(cylinderBalance['6kg'])}` : cylinderBalance['6kg'] > 0 ? `+${cylinderBalance['6kg']}` : cylinderBalance['6kg']}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">13kg:</span>
                    <span className={`text-xs font-medium ${cylinderBalance['13kg'] < 0 ? 'text-red-600' : cylinderBalance['13kg'] > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {cylinderBalance['13kg'] < 0 ? `-${Math.abs(cylinderBalance['13kg'])}` : cylinderBalance['13kg'] > 0 ? `+${cylinderBalance['13kg']}` : cylinderBalance['13kg']}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">50kg:</span>
                    <span className={`text-xs font-medium ${cylinderBalance['50kg'] < 0 ? 'text-red-600' : cylinderBalance['50kg'] > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {cylinderBalance['50kg'] < 0 ? `-${Math.abs(cylinderBalance['50kg'])}` : cylinderBalance['50kg'] > 0 ? `+${cylinderBalance['50kg']}` : cylinderBalance['50kg']}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {cylinderBalance['6kg'] > 0 || cylinderBalance['13kg'] > 0 || cylinderBalance['50kg'] > 0 ? 
                    "⚠️ Customer owes cylinders" : 
                    cylinderBalance['6kg'] < 0 || cylinderBalance['13kg'] < 0 || cylinderBalance['50kg'] < 0 ? 
                    "✅ You owe cylinders" : 
                    "✅ Balance settled"
                  }
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Outstanding Balance:</span>
                  <span className={`font-semibold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(outstanding)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Transactions:</span>
                  <span className="font-medium">{transactions.length}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("Setting customer ID:", customer.id) // Debug log
                  setSelectedCustomerId(customer.id)
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
