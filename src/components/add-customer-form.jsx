"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ArrowLeft, Save, User, AlertTriangle } from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

// Kenyan Counties and their locations
const kenyanCounties = {
  "Mombasa County": [
    "Bamburi", "Bamburi Beach", "Belewa", "Bwagamoyo", "Changamwe", "Frere Town", 
    "Golo", "Jomvu", "Jomvu Kuu", "Jumba la Mtwana", "Kashani", "Kengeleni", 
    "Kilindini", "Kongowea", "Kisauni", "Kwa Bechombo", "Kwa Jomvu", "Likoni", 
    "Markupa", "Maunguja", "Mirarani", "Miritini", "Mitsolokani", "Mkunguni", 
    "Mombasa (city)", "Mtongwe", "Mwakirunge", "Mwandoni", "Mto Panga", "Nyali", 
    "Old Town", "Pendeza", "Shanzu", "Shimanzi", "Shimo la Tewa", "Utange", "Vifanjoni"
  ],
  "Kwale County": [
    "Kwale", "Ukunda", "Msambweni", "Kinango", "Lunga Lunga", "Bazo", "Bwaga Cheti", 
    "Chingwede", "Dololo", "Dundani", "Dzirive", "Golini", "Jambole", "Jego", 
    "Livundoni", "Vikinduni", "Wasin", "Majoreni"
  ],
  "Kilifi County": [
    "Kilifi", "Mariakani", "Takaungu", "Kikambala", "Mtwapa", "Ganze", "Malindi", 
    "Baolala", "Chakama", "Kaloleni", "Matano Manne", "Meraf", "Watamu", "Jilore", 
    "Kakuyuni", "Ganda", "Shella", "Maarafa", "Magarini", "Gongoni", "Sabaki", "Mnarani"
  ],
  "Taita‑Taveta County": [
    "Bura", "Mwatate", "Taveta", "Voi", "Wundanyi"
  ]
}

export default function AddCustomerForm({ onBack, onSuccess }) {
  const { customers, addCustomer } = useStore()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    county: "",
    category: "regular"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [duplicateError, setDuplicateError] = useState("")
  const { toast } = useToast()

  // Safety check
  const safeCustomers = customers || []

  // Get available locations based on selected county
  const availableLocations = formData.county ? kenyanCounties[formData.county] || [] : []

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value,
      // Reset location when county changes
      ...(name === 'county' && { location: '' })
    }))
    // Clear duplicate error when user starts typing
    if (duplicateError) setDuplicateError("")
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value,
      // Reset location when county changes
      ...(name === 'county' && { location: '' })
    }))
    if (duplicateError) setDuplicateError("")
  }

  // Check for duplicates
  const checkForDuplicates = () => {
    const normalizedName = formData.name.trim().toLowerCase()
    const normalizedPhone = formData.phone.trim().replace(/\s/g, '')
    
    const nameDuplicate = customers.find(c => 
      c.name.trim().toLowerCase() === normalizedName
    )
    
    const phoneDuplicate = customers.find(c => 
      c.phone.trim().replace(/\s/g, '') === normalizedPhone
    )

    if (nameDuplicate && phoneDuplicate) {
      return "A customer with this name and phone number already exists."
    } else if (nameDuplicate) {
      return "A customer with this name already exists."
    } else if (phoneDuplicate) {
      return "A customer with this phone number already exists."
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation
    if (!formData.name.trim()) {
      toast({ title: "Missing Name", description: "Customer name is required.", variant: "error" })
      setIsSubmitting(false)
      return
    }

    if (!formData.phone.trim()) {
      toast({ title: "Missing Phone Number", description: "Phone number is required.", variant: "error" })
      setIsSubmitting(false)
      return
    }

    if (!formData.county) {
      toast({ title: "Missing County", description: "Please select a county.", variant: "error" })
      setIsSubmitting(false)
      return
    }

    if (!formData.location) {
      toast({ title: "Missing Location", description: "Please select a specific location.", variant: "error" })
      setIsSubmitting(false)
      return
    }

    // Check for duplicates
    const duplicateError = checkForDuplicates()
    if (duplicateError) {
      setDuplicateError(duplicateError)
      setIsSubmitting(false)
      return
    }

    // Create address string
    const address = `${formData.location}, ${formData.county}`

    try {
      // Add customer via API
      await addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: address,
        county: formData.county,
        location: formData.location,
      })

      toast({ 
        title: "Customer Added", 
        description: `${formData.name} has been added successfully.`,
        variant: "success"
      })

      onSuccess()
    } catch (error) {
      console.error('Failed to add customer:', error)
      toast({ 
        title: "Error", 
        description: "Failed to add customer. Please try again.",
        variant: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Add New Customer
            </h1>
            <p className="text-gray-600">Enter customer information</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {duplicateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm">{duplicateError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 0712345678"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="county">County *</Label>
                  <Select value={formData.county} onValueChange={(value) => handleSelectChange('county', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a county" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(kenyanCounties).map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Specific Location *</Label>
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => handleSelectChange('location', value)}
                    disabled={!formData.county}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={formData.county ? "Select a location" : "Select a county first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
