"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, User, Save, Clock } from "lucide-react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { toast } from "../hooks/use-toast"

export default function EditCustomerForm({ customer, onBack, onSuccess }) {
  const { updateCustomer, submitApprovalRequest } = useStore()
  const { permissions } = useRBAC()
  const [formData, setFormData] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // If user is operator, submit approval request instead of direct update
      if (permissions?.canRequestApproval && !permissions?.canEditCustomer) {
        const approvalData = {
          requestType: 'customer_edit',
          entityType: 'customer',
          entityId: customer.id,
          requestedChanges: formData,
          reason: `Requesting to update customer ${customer.name}`
        }

        await submitApprovalRequest(approvalData)

        toast({
          title: "Approval Request Submitted",
          description: "Your request has been sent to management for approval.",
        })

        onSuccess()
      } else {
        // Direct update for managers and admins
      await updateCustomer(customer.id, formData)

      toast({
        title: "Customer Updated",
        description: `${formData.name} has been updated successfully.`,
      })

      onSuccess()
      }
    } catch (error) {
      console.error('Failed to update customer:', error)
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Customer
            {permissions?.canRequestApproval && !permissions?.canEditCustomer && (
              <Clock className="w-4 h-4 text-yellow-500" title="Requires approval" />
            )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {permissions?.canRequestApproval && !permissions?.canEditCustomer ? 'Submit for Approval' : 'Update Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
