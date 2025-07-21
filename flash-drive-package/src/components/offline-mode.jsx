import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Settings,
  Zap,
  Shield,
  HardDrive,
  ArrowUpDown,
  AlertCircle,
  CheckSquare,
  Square
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const syncStatuses = {
  online: { name: "Online", icon: Wifi, color: "bg-green-500" },
  offline: { name: "Offline", icon: WifiOff, color: "bg-red-500" },
  syncing: { name: "Syncing", icon: RefreshCw, color: "bg-blue-500" },
  error: { name: "Error", icon: AlertTriangle, color: "bg-yellow-500" }
}

const dataTypes = {
  customers: { name: "Customers", icon: Database, color: "bg-blue-500" },
  transactions: { name: "Transactions", icon: Database, color: "bg-green-500" },
  invoices: { name: "Invoices", icon: Database, color: "bg-purple-500" },
  settings: { name: "Settings", icon: Settings, color: "bg-gray-500" }
}

export default function OfflineMode() {
  const { customers, transactions } = useStore()
  const [connectionStatus, setConnectionStatus] = useState("online")
  const [offlineData, setOfflineData] = useState({})
  const [pendingChanges, setPendingChanges] = useState([])
  const [syncHistory, setSyncHistory] = useState([])
  const [selectedDataTypes, setSelectedDataTypes] = useState(["customers", "transactions"])
  const [autoSync, setAutoSync] = useState(true)
  const [conflictResolution, setConflictResolution] = useState("server")
  const [lastSync, setLastSync] = useState(new Date().toISOString())
  const { toast } = useToast()

  // Simulate connection status changes
  useEffect(() => {
    const checkConnection = () => {
      const isOnline = navigator.onLine
      setConnectionStatus(isOnline ? "online" : "offline")
      
      if (!isOnline && connectionStatus === "online") {
        // Going offline - save current state
        saveOfflineData()
      } else if (isOnline && connectionStatus === "offline") {
        // Coming back online - sync data
        syncData()
      }
    }

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    
    // Initial check
    checkConnection()

    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
    }
  }, [connectionStatus])

  const saveOfflineData = () => {
    const data = {
      customers: customers,
      transactions: transactions,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('offlineData', JSON.stringify(data))
    setOfflineData(data)
    
    const syncEvent = {
      id: Date.now().toString(),
      type: "offline_save",
      timestamp: new Date().toISOString(),
      status: "completed",
      message: "Data saved for offline use"
    }
    setSyncHistory(prev => [syncEvent, ...prev])
  }

  const loadOfflineData = () => {
    const savedData = localStorage.getItem('offlineData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setOfflineData(data)
      return data
    }
    return null
  }

  const syncData = async () => {
    setConnectionStatus("syncing")
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      // Simulate conflicts
      const conflicts = Math.random() > 0.7 ? [
        { id: "conflict-1", type: "customer", field: "email", local: "old@email.com", server: "new@email.com" },
        { id: "conflict-2", type: "transaction", field: "amount", local: "100.00", server: "150.00" }
      ] : []

      if (conflicts.length > 0) {
        setConnectionStatus("error")
        const syncEvent = {
          id: Date.now().toString(),
          type: "sync_conflict",
          timestamp: new Date().toISOString(),
          status: "error",
          message: `${conflicts.length} conflicts detected`,
          conflicts
        }
        setSyncHistory(prev => [syncEvent, ...prev])
        return
      }

      // Successful sync
      setConnectionStatus("online")
      setLastSync(new Date().toISOString())
      setPendingChanges([])
      
      const syncEvent = {
        id: Date.now().toString(),
        type: "sync_success",
        timestamp: new Date().toISOString(),
        status: "completed",
        message: "Data synchronized successfully"
      }
      setSyncHistory(prev => [syncEvent, ...prev])
      
    } catch (error) {
      setConnectionStatus("error")
      const syncEvent = {
        id: Date.now().toString(),
        type: "sync_error",
        timestamp: new Date().toISOString(),
        status: "error",
        message: "Sync failed: " + error.message
      }
      setSyncHistory(prev => [syncEvent, ...prev])
    }
  }

  const downloadOfflineData = () => {
    const data = {
      customers: customers,
      transactions: transactions,
      settings: {
        autoSync,
        conflictResolution,
        selectedDataTypes
      },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `offline-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uploadOfflineData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          setOfflineData(data)
          toast({ title: "Upload Complete", description: "Offline data uploaded successfully!", variant: "success" })
        } catch (error) {
          toast({ title: "Upload Error", description: `Error reading file: ${error.message}`, variant: "error" })
        }
      }
      reader.readAsText(file)
    }
  }

  const resolveConflict = (conflictId, resolution) => {
    setPendingChanges(prev => prev.filter(change => change.id !== conflictId))
    
    const syncEvent = {
      id: Date.now().toString(),
      type: "conflict_resolved",
      timestamp: new Date().toISOString(),
      status: "completed",
      message: `Conflict resolved using ${resolution}`
    }
    setSyncHistory(prev => [syncEvent, ...prev])
  }

  const getOfflineStats = () => {
    const offlineDataSize = JSON.stringify(offlineData).length
    const pendingChangesCount = pendingChanges.length
    const lastSyncTime = new Date(lastSync)
    const timeSinceSync = Date.now() - lastSyncTime.getTime()
    const hoursSinceSync = Math.floor(timeSinceSync / (1000 * 60 * 60))

    return { offlineDataSize, pendingChangesCount, hoursSinceSync }
  }

  const stats = getOfflineStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Offline Mode</h2>
          <p className="text-gray-600">Work without internet connection with data synchronization</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <HardDrive className="w-4 h-4 mr-1" />
            Local Storage
          </Badge>
          <Badge variant="outline" className="text-sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Auto Sync
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus === "online" ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const status = syncStatuses[connectionStatus]
                const StatusIcon = status.icon
                return (
                  <>
                    <StatusIcon className={`w-8 h-8 ${status.color} text-white rounded-full p-1`} />
                    <div>
                      <p className="font-semibold">{status.name}</p>
                      <p className="text-sm text-gray-600">
                        {connectionStatus === "online" ? "Connected to server" : "Working offline"}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Last sync</p>
              <p className="font-medium">
                {stats.hoursSinceSync === 0 ? "Just now" : `${stats.hoursSinceSync} hours ago`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline Data</p>
                <p className="text-2xl font-bold">{(stats.offlineDataSize / 1024).toFixed(1)} KB</p>
              </div>
              <HardDrive className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Changes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingChangesCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Success</p>
                <p className="text-2xl font-bold text-green-600">
                  {syncHistory.filter(h => h.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {syncHistory.filter(h => h.status === "error").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offline Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Offline Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-sync when online</span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Save data locally</span>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Conflict Resolution</label>
              <Select value={conflictResolution} onValueChange={setConflictResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Server wins</SelectItem>
                  <SelectItem value="local">Local wins</SelectItem>
                  <SelectItem value="manual">Manual resolution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Data Types to Sync</label>
              <div className="space-y-2 mt-2">
                {Object.entries(dataTypes).map(([key, dataType]) => {
                  const DataIcon = dataType.icon
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDataTypes.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDataTypes(prev => [...prev, key])
                          } else {
                            setSelectedDataTypes(prev => prev.filter(t => t !== key))
                          }
                        }}
                        className="rounded"
                      />
                      <DataIcon className={`w-4 h-4 ${dataType.color} text-white rounded-full p-0.5`} />
                      <span className="text-sm">{dataType.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveOfflineData} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Save Offline
              </Button>
              <Button onClick={loadOfflineData} variant="outline" className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Load Offline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sync Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={syncData}
              disabled={connectionStatus === "offline" || connectionStatus === "syncing"}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {connectionStatus === "syncing" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Download/Upload</h4>
                <div className="space-y-2">
                  <Button onClick={downloadOfflineData} variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={uploadOfflineData}
                      className="hidden"
                      id="upload-data"
                    />
                    <label htmlFor="upload-data">
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Data
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Status</h4>
                <div className="text-xs space-y-1">
                  <p>• Local data: {(stats.offlineDataSize / 1024).toFixed(1)} KB</p>
                  <p>• Pending changes: {stats.pendingChangesCount}</p>
                  <p>• Last sync: {stats.hoursSinceSync === 0 ? "Just now" : `${stats.hoursSinceSync} hours ago`}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offline Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Offline Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(offlineData).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(offlineData).map(([key, data]) => {
                  if (key === "timestamp") return null
                  const dataType = dataTypes[key]
                  const DataIcon = dataType?.icon
                  
                  return (
                    <div key={key} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {DataIcon && <DataIcon className={`w-4 h-4 ${dataType.color} text-white rounded-full p-0.5`} />}
                        <span className="font-medium">{dataType?.name || key}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {Array.isArray(data) ? `${data.length} items` : "Data available"}
                      </p>
                    </div>
                  )
                })}
                <p className="text-xs text-gray-500">
                  Last saved: {offlineData.timestamp ? new Date(offlineData.timestamp).toLocaleString() : "Never"}
                </p>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No offline data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sync History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {syncHistory.map(event => {
              const status = syncStatuses[event.status]
              const StatusIcon = status.icon

              return (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${status.color} text-white rounded-full p-0.5`} />
                      <span className="font-medium">{event.message}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <Badge className={`${status.color} text-white text-xs`}>
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  {event.conflicts && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                      <p className="text-xs font-medium text-yellow-800">Conflicts detected:</p>
                      {event.conflicts.map(conflict => (
                        <div key={conflict.id} className="text-xs text-yellow-700 mt-1">
                          {conflict.type} - {conflict.field}: {conflict.local} vs {conflict.server}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {syncHistory.length === 0 && (
            <p className="text-center text-gray-500 py-4">No sync history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 