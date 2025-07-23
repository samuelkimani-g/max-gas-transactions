"use client"

import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Search, Plus, Users, BarChart3, FileText, TrendingUp, Trash2, LogOut, Shield, Clock } from "lucide-react"
import { useStore } from "./lib/store"
import { useRBAC } from "./lib/rbac"
import CustomerCards from "./components/customer-cards"
import CustomerDetail from "./components/customer-detail.jsx"
import AddCustomerForm from "./components/add-customer-form"
import AnalyticsDashboard from "./components/enhanced-analytics-dashboard"
import ExportImport from "./components/export-import"
import ReportingInsights from "./components/reporting-insights"
import UserManagement from "./components/user-management"
import ApprovalManagement from "./components/approval-management"
import Login from "./components/login"
import { Toaster } from "./components/ui/toster";
import { getAutoLoginCredentials, getDeviceInfo, isFeatureEnabled } from './lib/device-config'

// import BarcodeScanner from "./components/barcode-scanner"


export default function App() {
  const { 
    isAuthenticated, 
    selectedCustomerId, 
    setSelectedCustomerId, 
    checkAuthStatus, 
    loadCustomers, 
    loadTransactions,
    login,
    logout,
    user,
    customers,
    transactions,
    searchQuery,
    setSearchQuery
  } = useStore()
  
  const [currentView, setCurrentView] = useState('customers')
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get device configuration
        const deviceConfig = getDeviceInfo()
        setDeviceInfo(deviceConfig)
        
        // Check for existing authentication
        await checkAuthStatus()
        
        if (!isAuthenticated) {
          // Try auto-login for desktop devices
          const autoCredentials = getAutoLoginCredentials()
          if (autoCredentials && window.electron) { // Only for desktop app
            setIsAutoLoggingIn(true)
            try {
              await login(autoCredentials.username, autoCredentials.password)
              console.log(`[DEVICE] Auto-logged in as ${deviceConfig.role}: ${deviceConfig.displayName}`)
            } catch (error) {
              console.error('[DEVICE] Auto-login failed:', error)
            } finally {
              setIsAutoLoggingIn(false)
            }
          }
        }
      } finally {
        setIsInitializing(false)
      }
    }
    
    initializeApp()
  }, [])

  // Load data whenever authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[APP] User authenticated, loading data...')
      loadCustomers()
      loadTransactions()
    }
  }, [isAuthenticated])

  const rbac = useRBAC(user)

  // Add debug logging
  useEffect(() => {
    console.log("App rendered, selectedCustomerId:", selectedCustomerId)
    console.log("Available customers:", customers || [])
  }, [selectedCustomerId, customers])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleBackFromDetail = () => {
    console.log("Navigating back from customer detail")
    setSelectedCustomerId(null)
  }

  const handleAddCustomerSuccess = async () => {
    setIsAddingCustomer(false)
    // Refresh customers from database to show the new customer
    await loadCustomers()
  }

  // Show loading state while initializing or auto-logging in
  if (isInitializing || isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isAutoLoggingIn ? 'Auto-logging in...' : 'Initializing...'}
          </h2>
          <p className="text-gray-600">
            {isAutoLoggingIn 
              ? 'Please wait while we authenticate your session' 
              : 'Please wait while we load your application'
            }
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
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

            {user && (
              <p className="text-sm text-gray-500 mt-1">
                Logged in as: <span className="font-medium">{user.fullName}</span> ({user.role})
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {rbac?.permissions.canAddCustomer && (
            <Button
              onClick={() => setIsAddingCustomer(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
              </Button>
            )}
            <Button
              onClick={logout}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
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
              {rbac?.permissions.canAccessAnalytics && (
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              )}
              {rbac?.permissions.canAccessReports && (
              <TabsTrigger
                value="reporting"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Reporting
              </TabsTrigger>
              )}
              {rbac?.permissions.canAccessUsers && (
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
              )}
              {rbac?.permissions.canApproveRequests && (
                <TabsTrigger
                  value="approvals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Approvals
                </TabsTrigger>
              )}
              {rbac?.permissions.canAccessExport && (
              <TabsTrigger
                value="export"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export/Import
              </TabsTrigger>
              )}
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    Customers
                  </h2>
                  <div className="text-sm text-gray-500">
                    {(customers || []).length} {(customers || []).length === 1 ? "customer" : "customers"}
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

          <TabsContent value="reporting" className="m-0">
            <ReportingInsights />
          </TabsContent>





          {rbac?.permissions.canAccessUsers && (
            <TabsContent value="users" className="m-0">
              <UserManagement />
            </TabsContent>
          )}
          {rbac?.permissions.canApproveRequests && (
            <TabsContent value="approvals" className="m-0">
              <ApprovalManagement />
            </TabsContent>
          )}
          {rbac?.permissions.canAccessExport && (
          <TabsContent value="export" className="m-0">
            <ExportImport />
          </TabsContent>
          )}
        </Tabs>
      </div>


      <Toaster />
    </div>
  )
}
