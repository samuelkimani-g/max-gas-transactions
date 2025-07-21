import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Mail, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  DollarSign,
  Calendar,
  Users,
  Settings,
  Zap,
  Phone,
  Smartphone
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const reminderTypes = {
  sms: { name: "SMS", icon: Smartphone, color: "bg-green-500" },
  email: { name: "Email", icon: Mail, color: "bg-blue-500" },
  both: { name: "Both", icon: MessageSquare, color: "bg-purple-500" }
}

const paymentStatuses = {
  pending: { name: "Pending", icon: Clock, color: "bg-yellow-500" },
  overdue: { name: "Overdue", icon: AlertCircle, color: "bg-red-500" },
  paid: { name: "Paid", icon: CheckCircle, color: "bg-green-500" }
}

const reminderTemplates = {
  gentle: {
    name: "Gentle Reminder",
    subject: "Payment Reminder - Gas Cylinder Services",
    body: "Dear {customerName}, this is a friendly reminder that payment of ${amount} for invoice {invoiceNumber} is due on {dueDate}. Thank you for your business!"
  },
  urgent: {
    name: "Urgent Reminder",
    subject: "URGENT: Payment Overdue - Gas Cylinder Services",
    body: "Dear {customerName}, your payment of ${amount} for invoice {invoiceNumber} is now overdue. Please arrange payment immediately to avoid service interruption."
  },
  final: {
    name: "Final Notice",
    subject: "FINAL NOTICE: Payment Required - Gas Cylinder Services",
    body: "Dear {customerName}, this is your final notice. Payment of ${amount} for invoice {invoiceNumber} is severely overdue. Legal action may be taken if payment is not received within 7 days."
  }
}

export default function PaymentReminders() {
  const { customers, transactions } = useStore()
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [reminderType, setReminderType] = useState("both")
  const [selectedTemplate, setSelectedTemplate] = useState("gentle")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sentReminders, setSentReminders] = useState([])
  const [automationSettings, setAutomationSettings] = useState({
    enabled: true,
    autoSend: true,
    reminderDays: [7, 3, 1],
    maxReminders: 3
  })
  const { toast } = useToast()

  // Get customers with pending payments
  const customersWithPendingPayments = customers.filter(customer => {
    const customerTransactions = transactions.filter(t => t.customerId === customer.id)
    return customerTransactions.some(t => t.status === 'pending' || t.status === 'overdue')
  })

  const getCustomerOutstandingAmount = (customerId) => {
    const customerTransactions = transactions.filter(t => t.customerId === customerId)
    return customerTransactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  }

  const getCustomerPaymentStatus = (customerId) => {
    const customerTransactions = transactions.filter(t => t.customerId === customerId)
    const hasOverdue = customerTransactions.some(t => t.status === 'overdue')
    const hasPending = customerTransactions.some(t => t.status === 'pending')
    
    if (hasOverdue) return 'overdue'
    if (hasPending) return 'pending'
    return 'paid'
  }

  const sendReminders = async () => {
    setIsSending(true)
    try {
      const promises = selectedCustomers.map(async (customerId) => {
        const customer = customers.find(c => c.id === customerId)
        const amount = getCustomerOutstandingAmount(customerId)
        const template = reminderTemplates[selectedTemplate]
        
        // Replace template variables
        let message = customMessage || template.body
        message = message
          .replace('{customerName}', customer.name)
          .replace('{amount}', amount.toFixed(2))
          .replace('{invoiceNumber}', 'INV-' + Date.now().toString().slice(-6))
          .replace('{dueDate}', new Date().toLocaleDateString())

        const reminder = {
          id: Date.now().toString() + Math.random(),
          customerId,
          customerName: customer.name,
          type: reminderType,
          template: selectedTemplate,
          message,
          amount,
          sentAt: new Date().toISOString(),
          status: 'sent'
        }

        // Simulate sending delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        
        return reminder
      })

      const results = await Promise.all(promises)
      setSentReminders(prev => [...results, ...prev])
      
      toast({ title: "Reminders Sent", description: `Successfully sent ${results.length} reminders!`, variant: "success" })
    } catch (error) {
      console.error('Error sending reminders:', error)
      toast({ title: "Reminder Error", description: "Error sending reminders. Please try again.", variant: "error" })
    } finally {
      setIsSending(false)
      setSelectedCustomers([])
    }
  }

  const sendAutomatedReminders = async () => {
    if (!automationSettings.enabled) return

    const overdueCustomers = customersWithPendingPayments.filter(customer => {
      const status = getCustomerPaymentStatus(customer.id)
      return status === 'overdue'
    })

    if (overdueCustomers.length === 0) return

    setIsSending(true)
    try {
      const promises = overdueCustomers.map(async (customer) => {
        const amount = getCustomerOutstandingAmount(customer.id)
        const template = reminderTemplates.urgent
        
        let message = template.body
          .replace('{customerName}', customer.name)
          .replace('{amount}', amount.toFixed(2))
          .replace('{invoiceNumber}', 'INV-' + Date.now().toString().slice(-6))
          .replace('{dueDate}', new Date().toLocaleDateString())

        const reminder = {
          id: Date.now().toString() + Math.random(),
          customerId: customer.id,
          customerName: customer.name,
          type: 'both',
          template: 'urgent',
          message,
          amount,
          sentAt: new Date().toISOString(),
          status: 'automated'
        }

        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
        return reminder
      })

      const results = await Promise.all(promises)
      setSentReminders(prev => [...results, ...prev])
      
      console.log(`Automated reminders sent to ${results.length} customers`)
    } catch (error) {
      console.error('Error sending automated reminders:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Auto-send reminders every 5 minutes if enabled
  useEffect(() => {
    if (automationSettings.autoSend) {
      const interval = setInterval(sendAutomatedReminders, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [automationSettings.autoSend])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Reminders</h2>
          <p className="text-gray-600">Automated payment notifications and reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Bell className="w-4 h-4 mr-1" />
            Automated
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Zap className="w-4 h-4 mr-1" />
            Smart
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customersWithPendingPayments.map(customer => {
                const amount = getCustomerOutstandingAmount(customer.id)
                const status = getCustomerPaymentStatus(customer.id)
                const statusInfo = paymentStatuses[status]
                const StatusIcon = statusInfo.icon
                
                return (
                  <div 
                    key={customer.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomers.includes(customer.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedCustomers(prev => 
                        prev.includes(customer.id)
                          ? prev.filter(id => id !== customer.id)
                          : [...prev, customer.id]
                      )
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color} text-white rounded-full p-0.5`} />
                          <Badge className={`${statusInfo.color} text-white text-xs`}>
                            {statusInfo.name}
                          </Badge>
                        </div>
                        <p className="font-semibold text-red-600">${amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {customersWithPendingPayments.length === 0 && (
              <p className="text-center text-gray-500 py-4">No customers with pending payments</p>
            )}
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Reminder Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reminder Type</label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reminderTypes).map(([key, type]) => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`w-4 h-4 ${type.color} text-white rounded-full p-0.5`} />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Message Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reminderTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Custom Message (Optional)</label>
              <Textarea 
                value={customMessage} 
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Leave empty to use template..."
                rows={3}
              />
            </div>

            <Button 
              onClick={sendReminders} 
              disabled={selectedCustomers.length === 0 || isSending}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminders ({selectedCustomers.length})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-send reminders</span>
                <input
                  type="checkbox"
                  checked={automationSettings.enabled}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    enabled: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Smart automation</span>
                <input
                  type="checkbox"
                  checked={automationSettings.autoSend}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    autoSend: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Automation Rules</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Send gentle reminder 7 days before due date</li>
                <li>• Send urgent reminder 3 days before due date</li>
                <li>• Send final notice 1 day before due date</li>
                <li>• Maximum 3 reminders per invoice</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Status</h4>
              <div className="text-xs text-gray-600">
                <p>• {customersWithPendingPayments.length} customers with pending payments</p>
                <p>• {customersWithPendingPayments.filter(c => getCustomerPaymentStatus(c.id) === 'overdue').length} overdue payments</p>
                <p>• {sentReminders.length} reminders sent today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sent Reminders History */}
      {sentReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Sent Reminders History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sentReminders.map(reminder => {
                const typeInfo = reminderTypes[reminder.type]
                const TypeIcon = typeInfo.icon
                
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className={`w-4 h-4 ${typeInfo.color} text-white rounded-full p-0.5`} />
                        <span className="font-medium">{reminder.customerName}</span>
                        <Badge variant="outline" className="text-xs">
                          {reminder.template}
                        </Badge>
                        {reminder.status === 'automated' && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{reminder.message.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-500">
                        Sent: {new Date(reminder.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">${reminder.amount.toFixed(2)}</p>
                      <Badge className="bg-green-500 text-white text-xs">
                        Sent
                      </Badge>
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