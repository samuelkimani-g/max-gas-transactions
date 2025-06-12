"use client"

import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Search, Plus, Users, BarChart3, FileText } from "lucide-react"
import { useStore } from "./lib/store"
import CustomerCards from "./components/customer-cards"
import CustomerDetail from "./components/customer-detail.jsx"
import AddCustomerForm from "./components/add-customer-form"
import AnalyticsDashboard from "./components/analytics-dashboard"
import ExportImport from "./components/export-import"

export default function App() {
  const { customers, selectedCustomerId, setSelectedCustomerId, setSearchQuery, searchQuery } = useStore()
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  // Add debug logging
  useEffect(() => {
    console.log("App rendered, selectedCustomerId:", selectedCustomerId)
    console.log("Available customers:", customers)
  }, [selectedCustomerId, customers])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleBackFromDetail = () => {
    console.log("Navigating back from customer detail")
    setSelectedCustomerId(null)
  }

  const handleAddCustomerSuccess = () => {
    setIsAddingCustomer(false)
  }

  if (isAddingCustomer) {
    return <AddCustomerForm onBack={() => setIsAddingCustomer(false)} onSuccess={handleAddCustomerSuccess} />
  }

  if (selectedCustomerId !== null) {
    console.log("Rendering customer detail for ID:", selectedCustomerId)
    return <CustomerDetail customerId={selectedCustomerId} onBack={handleBackFromDetail} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Gas Cylinder Manager
            </h1>
            <p className="text-gray-600 mt-1">Manage your gas cylinder inventory and customer transactions</p>
          </div>
          <Button
            onClick={() => setIsAddingCustomer(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="customers" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-white shadow-lg border-0">
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Customers
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export/Import
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 w-full sm:w-[300px] bg-white shadow-sm border-gray-200"
              />
            </div>
          </div>

          <TabsContent value="customers" className="m-0">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customers
                  </CardTitle>
                  <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {customers.length} {customers.length === 1 ? "customer" : "customers"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CustomerCards />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="m-0">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="export" className="m-0">
            <ExportImport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
