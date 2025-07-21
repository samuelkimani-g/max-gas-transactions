"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"
import { 
  Mail, MessageSquare, Cloud, Zap, Settings, 
  Send, Upload, Download, Link, Bell,
  CheckCircle, AlertCircle, Clock, User, FileText
} from "lucide-react"

export default function IntegrationServices() {
  const { transactions, customers } = useStore()
  const [smsStatus, setSmsStatus] = useState('connected')
  const [emailStatus, setEmailStatus] = useState('connected')
  const [cloudStatus, setCloudStatus] = useState('connected')
  const [apiStatus, setApiStatus] = useState('disconnected')
  const [webhookStatus, setWebhookStatus] = useState('connected')

  // Safety checks for data
  const safeCustomers = customers || []
  const safeTransactions = transactions || []
  const hasCustomers = safeCustomers.length > 0
  const hasTransactions = safeTransactions.length > 0
  const firstCustomer = hasCustomers ? safeCustomers[0] : null
  const firstTransaction = hasTransactions ? safeTransactions[0] : null

  // SMS Gateway Functions
  const sendSMS = async (phoneNumber, message) => {
    try {
      // Simulate SMS sending
      console.log(`Sending SMS to ${phoneNumber}: ${message}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, messageId: `sms_${Date.now()}` }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  const sendPaymentReminder = async (customer) => {
    const message = `Hi ${customer.name}, you have an outstanding balance of ${formatCurrency(1000)}. Please settle your payment. Thank you!`
    return await sendSMS(customer.phone, message)
  }

  const sendBulkSMS = async (customers, message) => {
    const results = []
    for (const customer of customers) {
      const result = await sendSMS(customer.phone, message)
      results.push({ customer: customer.name, ...result })
    }
    return results
  }

  // Email Service Functions
  const sendEmail = async (to, subject, content) => {
    try {
      // Simulate email sending
      console.log(`Sending email to ${to}: ${subject}`)
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true, messageId: `email_${Date.now()}` }
    } catch (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  const sendReceipt = async (transaction, customer) => {
    const subject = `Receipt for Transaction #${transaction.id}`
    const content = `
      Dear ${customer.name},
      
      Thank you for your business! Here's your receipt:
      
      Transaction ID: ${transaction.id}
      Date: ${new Date(transaction.date).toLocaleDateString()}
      Amount: ${formatCurrency(1000)}
      
      Best regards,
      MaxGas Team
    `
    return await sendEmail(customer.email, subject, content)
  }

  const sendReport = async (reportData, recipients) => {
    const subject = `MaxGas ${reportData.type} Report - ${new Date().toLocaleDateString()}`
    const content = `
      Dear Team,
      
      Please find attached the ${reportData.type} report for ${reportData.period}.
      
      Key Highlights:
      - Total Sales: ${formatCurrency(reportData.sales)}
      - Total Payments: ${formatCurrency(reportData.payments)}
      - Outstanding: ${formatCurrency(reportData.outstanding)}
      
      Best regards,
      MaxGas System
    `
    
    const results = []
    for (const recipient of recipients) {
      const result = await sendEmail(recipient, subject, content)
      results.push({ recipient, ...result })
    }
    return results
  }

  // Cloud Storage Functions
  const uploadToCloud = async (data, filename) => {
    try {
      // Simulate cloud upload
      console.log(`Uploading ${filename} to cloud storage`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { 
        success: true, 
        url: `https://cloud-storage.example.com/${filename}`,
        size: JSON.stringify(data).length
      }
    } catch (error) {
      console.error('Cloud upload failed:', error)
      return { success: false, error: error.message }
    }
  }

  const backupData = async () => {
    const backupData = {
      customers,
      transactions,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    const filename = `maxgas-backup-${new Date().toISOString().split('T')[0]}.json`
    return await uploadToCloud(backupData, filename)
  }

  const syncToCloud = async () => {
    const syncData = {
      customers: customers.length,
      transactions: transactions.length,
      lastSync: new Date().toISOString()
    }
    
    const filename = `maxgas-sync-${new Date().toISOString().split('T')[0]}.json`
    return await uploadToCloud(syncData, filename)
  }

  // API Integration Functions
  const connectToAPI = async (apiKey, endpoint) => {
    try {
      // Simulate API connection
      console.log(`Connecting to API: ${endpoint}`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      setApiStatus('connected')
      return { success: true, connectionId: `api_${Date.now()}` }
    } catch (error) {
      console.error('API connection failed:', error)
      setApiStatus('error')
      return { success: false, error: error.message }
    }
  }

  const syncWithAccounting = async () => {
    const accountingData = transactions.map(t => ({
      id: t.id,
      date: t.date,
      customer: customers.find(c => c.id === t.customerId)?.name,
              amount: 0,
      type: 'gas_sale'
    }))
    
    return await uploadToCloud(accountingData, 'accounting-sync.json')
  }

  // Webhook Functions
  const sendWebhook = async (event, data) => {
    try {
      // Simulate webhook sending
      console.log(`Sending webhook: ${event}`, data)
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, webhookId: `webhook_${Date.now()}` }
    } catch (error) {
      console.error('Webhook sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  const notifyNewTransaction = async (transaction) => {
    const webhookData = {
      event: 'transaction.created',
      data: {
        id: transaction.id,
        customerId: transaction.customerId,
        amount: 1000,
        timestamp: new Date().toISOString()
      }
    }
    return await sendWebhook('transaction.created', webhookData)
  }

  const notifyPaymentReceived = async (transaction) => {
    const webhookData = {
      event: 'payment.received',
      data: {
        transactionId: transaction.id,
        amount: transaction.paid,
        timestamp: new Date().toISOString()
      }
    }
    return await sendWebhook('payment.received', webhookData)
  }

  // Status indicators
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Error'
      default:
        return 'Connecting...'
    }
  }

  return (
    <div className="space-y-6">
      {/* SMS Gateway */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              SMS Gateway
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(smsStatus)}
              <span className="text-sm">{getStatusText(smsStatus)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Automated Messages</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => sendPaymentReminder(firstCustomer)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Payment Reminder
                </Button>
                <Button 
                  onClick={() => sendBulkSMS(safeCustomers.slice(0, 3), "Thank you for choosing MaxGas!")}
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Bulk SMS
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">SMS Templates</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Payment Reminder</div>
                  <div className="text-gray-600">Hi {firstCustomer?.name}, you have an outstanding balance...</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Order Confirmation</div>
                  <div className="text-gray-600">Your order #{firstTransaction?.id} has been confirmed...</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Delivery Update</div>
                  <div className="text-gray-600">Your gas cylinders will be delivered...</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Service */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Service
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(emailStatus)}
              <span className="text-sm">{getStatusText(emailStatus)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Email Automation</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => sendReceipt(firstTransaction, firstCustomer)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Receipt
                </Button>
                <Button 
                  onClick={() => sendReport({type: 'Sales', period: 'Monthly', sales: 50000, payments: 45000, outstanding: 5000}, ['admin@maxgas.com'])}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Send Report
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Receipt Email</div>
                  <div className="text-gray-600">Professional receipt with transaction details...</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Monthly Report</div>
                  <div className="text-gray-600">Comprehensive monthly business report...</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">Customer Welcome</div>
                  <div className="text-gray-600">Welcome new customers to MaxGas...</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Storage */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Cloud Storage
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(cloudStatus)}
              <span className="text-sm">{getStatusText(cloudStatus)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Backup & Sync</h3>
              <div className="space-y-3">
                <Button 
                  onClick={backupData}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
                <Button 
                  onClick={syncToCloud}
                  variant="outline"
                  className="w-full"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  Sync to Cloud
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Storage Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Total Storage:</span>
                  <span className="font-semibold">2.5 GB</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Used:</span>
                  <span className="font-semibold">1.2 GB</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Available:</span>
                  <span className="font-semibold">1.3 GB</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Last Backup:</span>
                  <span className="font-semibold">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Integration */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              API Integration
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(apiStatus)}
              <span className="text-sm">{getStatusText(apiStatus)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">External Integrations</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => connectToAPI('', 'https://api.accounting.com')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Connect Accounting API
                </Button>
                <Button 
                  onClick={syncWithAccounting}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Sync with Accounting
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connected Services</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>QuickBooks</span>
                  <span className="text-red-600">Disconnected</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Xero</span>
                  <span className="text-red-600">Disconnected</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>PayPal</span>
                  <span className="text-red-600">Disconnected</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Stripe</span>
                  <span className="text-red-600">Disconnected</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Support */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Webhook Support
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(webhookStatus)}
              <span className="text-sm">{getStatusText(webhookStatus)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Real-time Notifications</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => notifyNewTransaction(firstTransaction)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Transaction Webhook
                </Button>
                <Button 
                  onClick={() => notifyPaymentReceived(firstTransaction)}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Payment Webhook
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Webhook Events</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">transaction.created</div>
                  <div className="text-gray-600">New transaction recorded</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">payment.received</div>
                  <div className="text-gray-600">Payment received</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">customer.created</div>
                  <div className="text-gray-600">New customer added</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">inventory.low</div>
                  <div className="text-gray-600">Low inventory alert</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 