import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { 
  Building, 
  MapPin, 
  Users, 
  Package, 
  DollarSign, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  Globe,
  Phone,
  Mail,
  Clock,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap
} from "lucide-react"
import { useStore } from "../lib/store"

const branchStatuses = {
  active: { name: "Active", icon: CheckCircle, color: "bg-green-500" },
  inactive: { name: "Inactive", icon: AlertCircle, color: "bg-red-500" },
  maintenance: { name: "Maintenance", icon: Clock, color: "bg-yellow-500" }
}

const branchTypes = {
  main: { name: "Main Branch", color: "bg-purple-500" },
  retail: { name: "Retail", color: "bg-blue-500" },
  warehouse: { name: "Warehouse", color: "bg-orange-500" },
  distribution: { name: "Distribution", color: "bg-green-500" }
}

export default function MultiBranch() {
  const { customers, transactions } = useStore()
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [isAddingBranch, setIsAddingBranch] = useState(false)
  const [isEditingBranch, setIsEditingBranch] = useState(false)
  const [branchForm, setBranchForm] = useState({
    name: "",
    type: "retail",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    manager: "",
    status: "active",
    description: "",
    capacity: "",
    openingHours: "",
    timezone: "UTC"
  })



  const handleAddBranch = () => {
    const newBranch = {
      id: Date.now().toString(),
      ...branchForm,
      customers: 0,
      transactions: 0,
      revenue: 0
    }
    setBranches(prev => [...prev, newBranch])
    setIsAddingBranch(false)
    setBranchForm({
      name: "",
      type: "retail",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      manager: "",
      status: "active",
      description: "",
      capacity: "",
      openingHours: "",
      timezone: "UTC"
    })
  }

  const handleEditBranch = () => {
    if (!selectedBranch) return
    
    setBranches(prev => prev.map(branch => 
      branch.id === selectedBranch.id 
        ? { ...branch, ...branchForm }
        : branch
    ))
    setIsEditingBranch(false)
    setSelectedBranch(null)
    setBranchForm({
      name: "",
      type: "retail",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      manager: "",
      status: "active",
      description: "",
      capacity: "",
      openingHours: "",
      timezone: "UTC"
    })
  }

  const handleDeleteBranch = (branchId) => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return
    }
    setBranches(prev => prev.filter(branch => branch.id !== branchId))
  }

  const handleEditClick = (branch) => {
    setSelectedBranch(branch)
    setBranchForm(branch)
    setIsEditingBranch(true)
  }

  const getBranchStats = () => {
    const totalBranches = branches.length
    const activeBranches = branches.filter(b => b.status === "active").length
    const totalCustomers = branches.reduce((sum, b) => sum + b.customers, 0)
    const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0)

    return { totalBranches, activeBranches, totalCustomers, totalRevenue }
  }

  const stats = getBranchStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multi-Branch Management</h2>
          <p className="text-gray-600">Manage multiple locations and branch operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Building className="w-4 h-4 mr-1" />
            Multi-Location
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Globe className="w-4 h-4 mr-1" />
            Centralized
          </Badge>
        </div>
      </div>

      {/* Branch Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold">{stats.totalBranches}</p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeBranches}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Branch Locations
                </CardTitle>
                <Button
                  onClick={() => setIsAddingBranch(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branches.map(branch => {
                  const status = branchStatuses[branch.status]
                  const type = branchTypes[branch.type]
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={branch.id}
                      className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => setSelectedBranch(branch)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center`}>
                            <Building className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{branch.name}</h3>
                              <Badge className={`${status.color} text-white`}>
                                {status.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {type.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{branch.address}, {branch.city}, {branch.state}</p>
                            <p className="text-sm text-gray-600">Manager: {branch.manager}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-center">
                              <p className="text-sm font-medium">{branch.customers}</p>
                              <p className="text-xs text-gray-600">Customers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">{branch.transactions}</p>
                              <p className="text-xs text-gray-600">Transactions</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">${branch.revenue.toLocaleString()}</p>
                              <p className="text-xs text-gray-600">Revenue</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(branch)
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteBranch(branch.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branch Details/Form */}
        <div>
          {isAddingBranch || isEditingBranch ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isAddingBranch ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  {isAddingBranch ? "Add New Branch" : "Edit Branch"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Branch Name</label>
                  <Input
                    value={branchForm.name}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter branch name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Branch Type</label>
                  <Select value={branchForm.type} onValueChange={(value) => setBranchForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(branchTypes).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <Input
                    value={branchForm.address}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <Input
                      value={branchForm.city}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <Input
                      value={branchForm.state}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                  <Input
                    value={branchForm.zipCode}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="ZIP code"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    value={branchForm.email}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Manager</label>
                  <Input
                    value={branchForm.manager}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, manager: e.target.value }))}
                    placeholder="Branch manager"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={branchForm.status} onValueChange={(value) => setBranchForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(branchStatuses).map(([key, status]) => (
                        <SelectItem key={key} value={key}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={branchForm.description}
                    onChange={(e) => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Branch description"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isAddingBranch ? handleAddBranch : handleEditBranch}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isAddingBranch ? "Add Branch" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingBranch(false)
                      setIsEditingBranch(false)
                      setSelectedBranch(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedBranch ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Branch Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedBranch.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedBranch.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state} {selectedBranch.zipCode}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{selectedBranch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{selectedBranch.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Manager: {selectedBranch.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{selectedBranch.openingHours}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedBranch.customers}</p>
                    <p className="text-sm text-gray-600">Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">${selectedBranch.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleEditClick(selectedBranch)}
                  className="w-full"
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Branch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Branch Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Select a branch from the list to view detailed information and manage its settings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 