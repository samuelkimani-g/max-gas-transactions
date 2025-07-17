import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  History, 
  User, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  Trash2,
  Settings,
  Database,
  FileText,
  DollarSign,
  Package,
  Users,
  Calendar,
  ArrowUpDown,
  RefreshCw
} from "lucide-react"
import { useStore } from "../lib/store"

const actionTypes = {
  create: { name: "Create", icon: Plus, color: "bg-green-500" },
  update: { name: "Update", icon: Edit, color: "bg-blue-500" },
  delete: { name: "Delete", icon: Trash2, color: "bg-red-500" },
  view: { name: "View", icon: Eye, color: "bg-gray-500" },
  export: { name: "Export", icon: Download, color: "bg-purple-500" },
  login: { name: "Login", icon: User, color: "bg-indigo-500" },
  logout: { name: "Logout", icon: User, color: "bg-gray-600" }
}

const entityTypes = {
  customer: { name: "Customer", icon: Users, color: "bg-blue-500" },
  transaction: { name: "Transaction", icon: DollarSign, color: "bg-green-500" },
  cylinder: { name: "Cylinder", icon: Package, color: "bg-orange-500" },
  invoice: { name: "Invoice", icon: FileText, color: "bg-purple-500" },
  user: { name: "User", icon: User, color: "bg-indigo-500" },
  system: { name: "System", icon: Settings, color: "bg-gray-500" }
}

const severityLevels = {
  low: { name: "Low", color: "bg-gray-500" },
  medium: { name: "Medium", color: "bg-yellow-500" },
  high: { name: "High", color: "bg-orange-500" },
  critical: { name: "Critical", color: "bg-red-500" }
}

export default function AuditTrail() {
  const { customers, transactions } = useStore()
  const [auditLogs, setAuditLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterEntity, setFilterEntity] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterUser, setFilterUser] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("desc")



  // Apply filters
  useEffect(() => {
    let filtered = auditLogs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.includes(searchQuery)
      )
    }

    // Action filter
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    // Entity filter
    if (filterEntity !== "all") {
      filtered = filtered.filter(log => log.entity === filterEntity)
    }

    // Severity filter
    if (filterSeverity !== "all") {
      filtered = filtered.filter(log => log.severity === filterSeverity)
    }

    // User filter
    if (filterUser !== "all") {
      filtered = filtered.filter(log => log.user === filterUser)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      let startDate
      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = null
      }
      if (startDate) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= startDate)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case "timestamp":
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
          break
        case "user":
          aValue = a.user
          bValue = b.user
          break
        case "action":
          aValue = a.action
          bValue = b.action
          break
        case "severity":
          aValue = a.severity
          bValue = b.severity
          break
        default:
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredLogs(filtered)
  }, [auditLogs, searchQuery, filterAction, filterEntity, filterSeverity, filterUser, dateRange, sortBy, sortOrder])

  const exportAuditLog = () => {
    const csvContent = [
      "Timestamp,User,Action,Entity,Description,Severity,IP Address",
      ...filteredLogs.map(log => 
        `${log.timestamp},${log.user},${log.action},${log.entity},${log.description},${log.severity},${log.ipAddress}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getAuditStats = () => {
    const totalLogs = auditLogs.length
    const todayLogs = auditLogs.filter(log => {
      const today = new Date()
      const logDate = new Date(log.timestamp)
      return logDate.toDateString() === today.toDateString()
    }).length
    const criticalLogs = auditLogs.filter(log => log.severity === "critical").length
    const uniqueUsers = new Set(auditLogs.map(log => log.user)).size

    return { totalLogs, todayLogs, criticalLogs, uniqueUsers }
  }

  const stats = getAuditStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-gray-600">Track all system changes and user activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <History className="w-4 h-4 mr-1" />
            Complete Log
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Database className="w-4 h-4 mr-1" />
            Secure
          </Badge>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
              <History className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Logs</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayLogs}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalLogs}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Action Type</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionTypes).map(([key, action]) => (
                    <SelectItem key={key} value={key}>
                      {action.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Entity Type</label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {Object.entries(entityTypes).map(([key, entity]) => (
                    <SelectItem key={key} value={key}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Severity</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {Object.entries(severityLevels).map(([key, severity]) => (
                    <SelectItem key={key} value={key}>
                      {severity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">User</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="severity">Severity</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {auditLogs.length} logs
            </p>
            <Button onClick={exportAuditLog} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.map(log => {
              const action = actionTypes[log.action]
              const entity = entityTypes[log.entity]
              const severity = severityLevels[log.severity]
              const ActionIcon = action.icon
              const EntityIcon = entity.icon

              return (
                <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <ActionIcon className={`w-5 h-5 ${action.color} text-white rounded-full p-1`} />
                        <EntityIcon className={`w-4 h-4 ${entity.color} text-white rounded-full p-0.5`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.description}</span>
                          <Badge className={`${severity.color} text-white text-xs`}>
                            {severity.name}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <span>User: {log.user}</span>
                            <span>IP: {log.ipAddress}</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          {log.details.changes.length > 0 && (
                            <p className="text-xs text-blue-600">
                              Changes: {log.details.changes.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{log.action.toUpperCase()}</p>
                      <p>{log.entity}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredLogs.length === 0 && (
            <p className="text-center text-gray-500 py-8">No audit logs found matching your criteria</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 