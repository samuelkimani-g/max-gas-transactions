import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { 
  FileText, 
  Download, 
  Send, 
  User, 
  Building, 
  Crown, 
  Star,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const customerCategories = {
  vip: { name: "VIP", icon: Crown, color: "bg-purple-500", discount: 0.15 },
  regular: { name: "Regular", icon: Star, color: "bg-blue-500", discount: 0.05 },
  new: { name: "New", icon: User, color: "bg-green-500", discount: 0.00 }
}

const paymentStatuses = {
  pending: { name: "Pending", icon: Clock, color: "bg-yellow-500" },
  paid: { name: "Paid", icon: CheckCircle, color: "bg-green-500" },
  overdue: { name: "Overdue", icon: AlertCircle, color: "bg-red-500" }
}

export default function InvoiceGenerator() {
  const { customers, transactions } = useStore()
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedTransactions, setSelectedTransactions] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvoices, setGeneratedInvoices] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    // Generate invoice number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setInvoiceNumber(`INV-${year}${month}${day}-${random}`)
    
    // Set default dates
    setInvoiceDate(date.toISOString().split('T')[0])
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + 30)
    setDueDate(dueDate.toISOString().split('T')[0])
  }, [])

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer)

  const calculateSubtotal = () => {
    return selectedTransactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0)
    }, 0)
  }

  const calculateDiscount = () => {
    if (!selectedCustomerData) return 0
    const category = customerCategories[selectedCustomerData.category || 'regular']
    return calculateSubtotal() * category.discount
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const invoice = {
        id: Date.now().toString(),
        invoiceNumber,
        customer: selectedCustomerData,
        transactions: selectedTransactions,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        total: calculateTotal(),
        date: invoiceDate,
        dueDate,
        status: paymentStatus,
        notes,
        generatedAt: new Date().toISOString()
      }

      setGeneratedInvoices(prev => [invoice, ...prev])
      
      // Simulate download
      const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({ title: "Invoice Generated", description: `Invoice ${invoiceNumber} generated successfully!`, variant: "success" })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ title: "Invoice Error", description: "Error generating invoice. Please try again.", variant: "error" })
    } finally {
      setIsGenerating(false)
    }
  }

  const sendInvoice = async (invoice) => {
    try {
      // Simulate sending invoice
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({ title: "Invoice Sent", description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customer.email}`, variant: "success" })
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast({ title: "Send Error", description: "Error sending invoice. Please try again.", variant: "error" })
    }
  }

  const customerTransactions = selectedCustomer 
    ? transactions.filter(t => t.customerId === selectedCustomer)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Generator</h2>
          <p className="text-gray-600">Create professional invoices for your customers</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <FileText className="w-4 h-4 mr-1" />
          Professional PDF
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Select Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers || []).map(customer => {
                    const category = customerCategories[customer.category || 'regular']
                    const CategoryIcon = category.icon
                    return (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className={`w-4 h-4 ${category.color} text-white rounded-full p-0.5`} />
                          <span>{customer.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.name}
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const category = customerCategories[selectedCustomerData.category || 'regular']
                    const CategoryIcon = category.icon
                    return (
                      <>
                        <CategoryIcon className={`w-5 h-5 ${category.color} text-white rounded-full p-1`} />
                        <span className="font-medium">{selectedCustomerData.name}</span>
                        <Badge className={`${category.color} text-white`}>
                          {category.name}
                        </Badge>
                      </>
                    )
                  })()}
                </div>
                <p className="text-sm text-gray-600">{selectedCustomerData.email}</p>
                <p className="text-sm text-gray-600">{selectedCustomerData.phone}</p>
                <p className="text-sm text-gray-600">{selectedCustomerData.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Invoice Number</label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Status</label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentStatuses).map(([key, status]) => {
                      const StatusIcon = status.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${status.color} text-white rounded-full p-0.5`} />
                            <span>{status.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Invoice Date</label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the invoice..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">-${calculateDiscount().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={generatePDF} 
              disabled={!selectedCustomer || selectedTransactions.length === 0 || isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Selection */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Select Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerTransactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTransactions.includes(transaction.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedTransactions(prev => 
                      prev.includes(transaction.id)
                        ? prev.filter(id => id !== transaction.id)
                        : [...prev, transaction.id]
                    )
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit", 
                  year: "2-digit"
                })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.amount}</p>
                      <p className="text-sm text-gray-600">{transaction.quantity} cylinders</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {customerTransactions.length === 0 && (
              <p className="text-center text-gray-500 py-4">No transactions found for this customer</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Invoices */}
      {generatedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedInvoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                    <p className="text-sm text-gray-600">
                      Generated: {new Date(invoice.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${paymentStatuses[invoice.status].color} text-white`}>
                      {paymentStatuses[invoice.status].name}
                    </Badge>
                    <span className="font-semibold">${invoice.total.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendInvoice(invoice)}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 