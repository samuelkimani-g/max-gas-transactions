import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  CheckSquare, 
  Square, 
  Users, 
  Package, 
  DollarSign, 
  Mail, 
  MessageSquare,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Archive,
  Send,
  Filter,
  Search,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const bulkActions = {
  customers: {
    sendEmail: { name: "Send Email", icon: Mail, color: "bg-blue-500" },
    sendSMS: { name: "Send SMS", icon: MessageSquare, color: "bg-green-500" },
    exportData: { name: "Export Data", icon: Download, color: "bg-purple-500" },
    changeCategory: { name: "Change Category", icon: Users, color: "bg-orange-500" },
    archive: { name: "Archive", icon: Archive, color: "bg-gray-500" },
    delete: { name: "Delete", icon: Trash2, color: "bg-red-500" }
  },
  transactions: {
    markPaid: { name: "Mark as Paid", icon: CheckCircle, color: "bg-green-500" },
    markPending: { name: "Mark as Pending", icon: Clock, color: "bg-yellow-500" },
    exportData: { name: "Export Data", icon: Download, color: "bg-purple-500" },
    generateInvoices: { name: "Generate Invoices", icon: DollarSign, color: "bg-blue-500" },
    delete: { name: "Delete", icon: Trash2, color: "bg-red-500" }
  }
}

const customerCategories = {
  vip: { name: "VIP", color: "bg-purple-500" },
  regular: { name: "Regular", color: "bg-blue-500" },
  new: { name: "New", color: "bg-green-500" }
}

export default function BulkOperations() {
  const { customers, transactions, updateCustomer, updateTransaction, deleteCustomer, deleteTransaction } = useStore()
  const [selectedMode, setSelectedMode] = useState("customers")
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedAction, setSelectedAction] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [bulkHistory, setBulkHistory] = useState([])
  const { toast } = useToast()

  const filteredItems = () => {
    let items = selectedMode === "customers" ? customers : transactions
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter(item => {
        if (selectedMode === "customers") {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.email.toLowerCase().includes(searchQuery.toLowerCase())
        } else {
          return item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.customerId.toLowerCase().includes(searchQuery.toLowerCase())
        }
      })
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (selectedMode === "customers") {
        items = items.filter(item => item.category === filterStatus)
      } else {
        items = items.filter(item => item.status === filterStatus)
      }
    }

    return items
  }

  const handleSelectAll = () => {
    const items = filteredItems()
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const executeBulkAction = async () => {
    if (!selectedAction || selectedItems.length === 0) return

    setIsProcessing(true)
    try {
      const action = bulkActions[selectedMode][selectedAction]
      const results = []

      for (const itemId of selectedItems) {
        try {
          switch (selectedAction) {
            case "sendEmail":
              await simulateEmailSending(itemId)
              results.push({ id: itemId, status: "success", message: "Email sent" })
              break

            case "sendSMS":
              await simulateSMSSending(itemId)
              results.push({ id: itemId, status: "success", message: "SMS sent" })
              break

            case "exportData":
              await simulateDataExport(itemId)
              results.push({ id: itemId, status: "success", message: "Data exported" })
              break

            case "changeCategory":
              const newCategory = prompt("Enter new category (vip/regular/new):")
              if (newCategory && customerCategories[newCategory]) {
                updateCustomer(itemId, { category: newCategory })
                results.push({ id: itemId, status: "success", message: `Category changed to ${newCategory}` })
              }
              break

            case "markPaid":
              updateTransaction(itemId, { status: "paid" })
              results.push({ id: itemId, status: "success", message: "Marked as paid" })
              break

            case "markPending":
              updateTransaction(itemId, { status: "pending" })
              results.push({ id: itemId, status: "success", message: "Marked as pending" })
              break

            case "generateInvoices":
              await simulateInvoiceGeneration(itemId)
              results.push({ id: itemId, status: "success", message: "Invoice generated" })
              break

            case "archive":
              // Simulate archiving
              results.push({ id: itemId, status: "success", message: "Archived" })
              break

            case "delete":
              if (selectedMode === "customers") {
                deleteCustomer(itemId)
              } else {
                deleteTransaction(itemId)
              }
              results.push({ id: itemId, status: "success", message: "Deleted" })
              break

            default:
              results.push({ id: itemId, status: "error", message: "Unknown action" })
          }
        } catch (error) {
          results.push({ id: itemId, status: "error", message: error.message })
        }
      }

      const bulkOperation = {
        id: Date.now().toString(),
        mode: selectedMode,
        action: selectedAction,
        itemsCount: selectedItems.length,
        results,
        timestamp: new Date().toISOString()
      }

      setBulkHistory(prev => [bulkOperation, ...prev])
      setSelectedItems([])
      setSelectedAction("")

      const successCount = results.filter(r => r.status === "success").length
      toast({ title: "Bulk Operation Complete", description: `${successCount}/${results.length} items processed successfully.`, variant: "success" })

    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast({ title: "Bulk Operation Error", description: "Error executing bulk action. Please try again.", variant: "error" })
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateEmailSending = async (itemId) => {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  }

  const simulateSMSSending = async (itemId) => {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
  }

  const simulateDataExport = async (itemId) => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  }

  const simulateInvoiceGeneration = async (itemId) => {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
  }

  const getItemDisplayName = (item) => {
    if (selectedMode === "customers") {
      return item.name
    } else {
      const customer = customers.find(c => c.id === item.customerId)
      return `${item.description} - ${customer?.name || 'Unknown Customer'}`
    }
  }

  const getItemStatus = (item) => {
    if (selectedMode === "customers") {
      return item.category || "regular"
    } else {
      return item.status || "pending"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
          <p className="text-gray-600">Manage multiple customers and transactions efficiently</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Zap className="w-4 h-4 mr-1" />
            Bulk Actions
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Settings className="w-4 h-4 mr-1" />
            Advanced
          </Badge>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Operation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={selectedMode === "customers" ? "default" : "outline"}
              onClick={() => {
                setSelectedMode("customers")
                setSelectedItems([])
                setSelectedAction("")
              }}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Customers ({customers.length})
            </Button>
            <Button
              variant={selectedMode === "transactions" ? "default" : "outline"}
              onClick={() => {
                setSelectedMode("transactions")
                setSelectedItems([])
                setSelectedAction("")
              }}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Transactions ({transactions.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={`Search ${selectedMode}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {selectedMode === "customers" ? (
                  Object.entries(customerCategories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} of {filteredItems().length} selected
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(bulkActions[selectedMode]).map(([key, action]) => {
              const ActionIcon = action.icon
              return (
                <Button
                  key={key}
                  variant={selectedAction === key ? "default" : "outline"}
                  onClick={() => setSelectedAction(key)}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                  disabled={selectedItems.length === 0}
                >
                  <ActionIcon className={`w-5 h-5 ${action.color} text-white rounded-full p-1`} />
                  <span className="text-xs">{action.name}</span>
                </Button>
              )
            })}
          </div>
          
          {selectedAction && selectedItems.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <Button
                onClick={executeBulkAction}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute ({selectedItems.length} items)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAction("")
                  setSelectedItems([])
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {selectedMode === "customers" ? <Users className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              {selectedMode === "customers" ? "Customers" : "Transactions"}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedItems.length === filteredItems().length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedItems.length === filteredItems().length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems().map(item => {
              const isSelected = selectedItems.includes(item.id)
              const status = getItemStatus(item)
              const statusColor = selectedMode === "customers" 
                ? customerCategories[status]?.color || "bg-gray-500"
                : status === "paid" ? "bg-green-500" : status === "overdue" ? "bg-red-500" : "bg-yellow-500"

              return (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{getItemDisplayName(item)}</p>
                        <p className="text-sm text-gray-600">
                          {selectedMode === "customers" ? item.email : `$${item.amount} - ${new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit", 
                  year: "2-digit"
                })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColor} text-white`}>
                        {selectedMode === "customers" ? customerCategories[status]?.name || status : status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredItems().length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No {selectedMode} found matching your criteria
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operations History */}
      {bulkHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Operation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {bulkHistory.map(operation => {
                const action = bulkActions[operation.mode][operation.action]
                const ActionIcon = action.icon
                const successCount = operation.results.filter(r => r.status === "success").length
                const errorCount = operation.results.filter(r => r.status === "error").length

                return (
                  <div key={operation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ActionIcon className={`w-4 h-4 ${action.color} text-white rounded-full p-0.5`} />
                        <span className="font-medium">{action.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {operation.mode}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{operation.itemsCount} items</p>
                        <p className="text-xs text-gray-600">
                          {new Date(operation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {successCount > 0 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {successCount} successful
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errorCount} failed
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 