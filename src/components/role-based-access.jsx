import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { 
  Shield, 
  User, 
  Users, 
  Lock, 
  Unlock, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Settings,
  CheckCircle,
  X,
  AlertTriangle,
  Key,
  Database,
  FileText,
  DollarSign,
  Package,
  Building,
  Clock,
  Calendar
} from "lucide-react"
import { useStore } from "../lib/store"

const userRoles = {
  admin: { 
    name: "Administrator", 
    color: "bg-red-500",
    description: "Full system access and control",
    permissions: ["all"]
  },
  manager: { 
    name: "Manager", 
    color: "bg-blue-500",
    description: "Manage operations and staff",
    permissions: ["customers", "transactions", "reports", "invoices", "branches"]
  },
  operator: { 
    name: "Operator", 
    color: "bg-green-500",
    description: "Daily operations and customer service",
    permissions: ["customers", "transactions", "invoices"]
  },
  viewer: { 
    name: "Viewer", 
    color: "bg-gray-500",
    description: "Read-only access to reports",
    permissions: ["reports"]
  }
}

const permissions = {
  customers: { name: "Customer Management", icon: Users, description: "Create, edit, delete customers" },
  transactions: { name: "Transaction Management", icon: DollarSign, description: "Process payments and transactions" },
  reports: { name: "Reports & Analytics", icon: FileText, description: "View reports and analytics" },
  invoices: { name: "Invoice Management", icon: FileText, description: "Generate and manage invoices" },
  branches: { name: "Branch Management", icon: Building, description: "Manage multiple branches" },
  users: { name: "User Management", icon: User, description: "Manage system users" },
  settings: { name: "System Settings", icon: Settings, description: "Configure system settings" },
  audit: { name: "Audit Trail", icon: Clock, description: "View audit logs" },
  backup: { name: "Data Backup", icon: Database, description: "Manage data backups" },
  integrations: { name: "Integrations", icon: Package, description: "Manage third-party integrations" }
}

const userStatuses = {
  active: { name: "Active", icon: CheckCircle, color: "bg-green-500" },
  inactive: { name: "Inactive", icon: X, color: "bg-red-500" },
  suspended: { name: "Suspended", icon: AlertTriangle, color: "bg-yellow-500" }
}

export default function RoleBasedAccess() {
  const { customers, transactions } = useStore()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "operator",
    status: "active",
    branch: "",
    permissions: [],
    notes: ""
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")



  const handleAddUser = () => {
    const newUser = {
      id: Date.now().toString(),
      ...userForm,
      lastLogin: null,
      createdAt: new Date().toISOString()
    }
    setUsers(prev => [...prev, newUser])
    setIsAddingUser(false)
    setUserForm({
      username: "",
      email: "",
      fullName: "",
      role: "operator",
      status: "active",
      branch: "",
      permissions: [],
      notes: ""
    })
  }

  const handleEditUser = () => {
    if (!selectedUser) return
    
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...userForm }
        : user
    ))
    setIsEditingUser(false)
    setSelectedUser(null)
    setUserForm({
      username: "",
      email: "",
      fullName: "",
      role: "operator",
      status: "active",
      branch: "",
      permissions: [],
      notes: ""
    })
  }

  const handleDeleteUser = (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    setUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleEditClick = (user) => {
    setSelectedUser(user)
    setUserForm(user)
    setIsEditingUser(true)
  }

  const togglePermission = (permission) => {
    setUserForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getEffectivePermissions = (user) => {
    if (user.permissions.includes("all")) {
      return Object.keys(permissions)
    }
    return user.permissions
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getUserStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === "active").length
    const adminUsers = users.filter(u => u.role === "admin").length
    const recentLogins = users.filter(u => {
      if (!u.lastLogin) return false
      const lastLogin = new Date(u.lastLogin)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return lastLogin > oneDayAgo
    }).length

    return { totalUsers, activeUsers, adminUsers, recentLogins }
  }

  const stats = getUserStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role-Based Access Control</h2>
          <p className="text-gray-600">Manage user permissions and security access</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Shield className="w-4 h-4 mr-1" />
            Secure
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Key className="w-4 h-4 mr-1" />
            Granular
          </Badge>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-red-600">{stats.adminUsers}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Logins</p>
                <p className="text-2xl font-bold">{stats.recentLogins}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  System Users
                </CardTitle>
                <Button
                  onClick={() => setIsAddingUser(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(userRoles).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(userStatuses).map(([key, status]) => (
                      <SelectItem key={key} value={key}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User List */}
              <div className="space-y-3">
                {filteredUsers.map(user => {
                  const role = userRoles[user.role]
                  const status = userStatuses[user.status]
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={user.id}
                      className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center`}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{user.fullName}</h3>
                              <Badge className={`${role.color} text-white`}>
                                {role.name}
                              </Badge>
                              <Badge className={`${status.color} text-white`}>
                                {status.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-600">Branch: {user.branch}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-2">
                            {user.lastLogin ? (
                              <p>Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
                            ) : (
                              <p>Never logged in</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(user)
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteUser(user.id)
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
              
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found matching your criteria</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Details/Form */}
        <div>
          {isAddingUser || isEditingUser ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isAddingUser ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  {isAddingUser ? "Add New User" : "Edit User"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <Input
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    type="email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    value={userForm.fullName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(userRoles).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={userForm.status} onValueChange={(value) => setUserForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(userStatuses).map(([key, status]) => (
                        <SelectItem key={key} value={key}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Branch</label>
                  <Input
                    value={userForm.branch}
                    onChange={(e) => setUserForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="Enter branch"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <Textarea
                    value={userForm.notes}
                    onChange={(e) => setUserForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isAddingUser ? handleAddUser : handleEditUser}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isAddingUser ? "Add User" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingUser(false)
                      setIsEditingUser(false)
                      setSelectedUser(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedUser ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedUser.fullName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedUser.notes}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{selectedUser.username}</span>
                    <span>•</span>
                    <span>{selectedUser.email}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Role:</span>
                    <Badge className={`${userRoles[selectedUser.role].color} text-white`}>
                      {userRoles[selectedUser.role].name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`${userStatuses[selectedUser.status].color} text-white`}>
                      {userStatuses[selectedUser.status].name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Branch:</span>
                    <span>{selectedUser.branch}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Login:</span>
                    <span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : "Never"}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="space-y-2">
                    {getEffectivePermissions(selectedUser).map(permission => {
                      const perm = permissions[permission]
                      const PermIcon = perm.icon
                      return (
                        <div key={permission} className="flex items-center gap-2 text-sm">
                          <PermIcon className="w-4 h-4 text-gray-500" />
                          <span>{perm.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button
                  onClick={() => handleEditClick(selectedUser)}
                  className="w-full"
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Select a user from the list to view detailed information and manage their permissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 