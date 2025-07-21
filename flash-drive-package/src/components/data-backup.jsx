import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  Cloud, 
  Download, 
  Upload, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  Calendar,
  FileText,
  Archive,
  Trash2,
  RotateCcw,
  Zap,
  Lock,
  Unlock
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const backupProviders = {
  google: { name: "Google Drive", icon: Cloud, color: "bg-blue-500" },
  dropbox: { name: "Dropbox", icon: Cloud, color: "bg-blue-600" },
  onedrive: { name: "OneDrive", icon: Cloud, color: "bg-blue-700" },
  local: { name: "Local Storage", icon: HardDrive, color: "bg-gray-500" }
}

const backupStatuses = {
  completed: { name: "Completed", icon: CheckCircle, color: "bg-green-500" },
  inProgress: { name: "In Progress", icon: RefreshCw, color: "bg-blue-500" },
  failed: { name: "Failed", icon: AlertCircle, color: "bg-red-500" },
  scheduled: { name: "Scheduled", icon: Clock, color: "bg-yellow-500" }
}

export default function DataBackup() {
  const { customers, transactions } = useStore()
  const [selectedProvider, setSelectedProvider] = useState("google")
  const [backupFrequency, setBackupFrequency] = useState("daily")
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupHistory, setBackupHistory] = useState([])
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    encryptBackups: true,
    keepVersions: 10,
    compression: true,
    includeAttachments: true
  })
  const [connectionStatus, setConnectionStatus] = useState("connected")
  const { toast } = useToast()


  const createBackup = async () => {
    setIsBackingUp(true)
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))
      
      const backup = {
        id: Date.now().toString(),
        provider: selectedProvider,
        timestamp: new Date().toISOString(),
        status: "completed",
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        type: "manual",
        dataPoints: { customers: customers.length, transactions: transactions.length }
      }

      setBackupHistory(prev => [backup, ...prev])
      toast({ title: "Backup Complete", description: `Backup completed successfully! Size: ${backup.size}`, variant: "success" })
    } catch (error) {
      console.error('Error creating backup:', error)
      toast({ title: "Backup Error", description: "Error creating backup. Please try again.", variant: "error" })
    } finally {
      setIsBackingUp(false)
    }
  }

  const restoreBackup = async (backupId) => {
    setIsRestoring(true)
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000))
      
      toast({ title: "Restore Complete", description: "Backup restored successfully! The application will refresh with restored data.", variant: "success" })
      // In a real app, you would reload the data from the backup
      window.location.reload()
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast({ title: "Restore Error", description: "Error restoring backup. Please try again.", variant: "error" })
    } finally {
      setIsRestoring(false)
    }
  }

  const deleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBackupHistory(prev => prev.filter(backup => backup.id !== backupId))
      toast({ title: "Backup Deleted", description: "Backup deleted successfully!", variant: "success" })
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast({ title: "Delete Error", description: "Error deleting backup. Please try again.", variant: "error" })
    }
  }

  const testConnection = async () => {
    try {
      setConnectionStatus("connecting")
      await new Promise(resolve => setTimeout(resolve, 2000))
      setConnectionStatus("connected")
      toast({ title: "Connection Test", description: "Connection test successful!", variant: "success" })
    } catch (error) {
      setConnectionStatus("failed")
      toast({ title: "Connection Failed", description: "Connection test failed. Please check your settings.", variant: "error" })
    }
  }

  const getDataSize = () => {
    const data = { customers, transactions }
    const jsonString = JSON.stringify(data)
    const sizeInBytes = new Blob([jsonString]).size
    return (sizeInBytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const getBackupStats = () => {
    const totalBackups = backupHistory.length
    const successfulBackups = backupHistory.filter(b => b.status === "completed").length
    const failedBackups = backupHistory.filter(b => b.status === "failed").length
    const totalSize = backupHistory
      .filter(b => b.status === "completed")
      .reduce((sum, b) => sum + parseFloat(b.size), 0)
      .toFixed(1)

    return { totalBackups, successfulBackups, failedBackups, totalSize }
  }

  const stats = getBackupStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Backup & Restore</h2>
          <p className="text-gray-600">Secure cloud backup and data recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Cloud className="w-4 h-4 mr-1" />
            Cloud Sync
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Shield className="w-4 h-4 mr-1" />
            Encrypted
          </Badge>
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Backups</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulBackups}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedBackups}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">{stats.totalSize} MB</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Backup Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Cloud Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(backupProviders).map(([key, provider]) => {
                    const ProviderIcon = provider.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <ProviderIcon className={`w-4 h-4 ${provider.color} text-white rounded-full p-0.5`} />
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Backup Frequency</label>
              <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-backup</span>
                <input
                  type="checkbox"
                  checked={backupSettings.autoBackup}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    autoBackup: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Encrypt backups</span>
                <input
                  type="checkbox"
                  checked={backupSettings.encryptBackups}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    encryptBackups: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compress data</span>
                <input
                  type="checkbox"
                  checked={backupSettings.compression}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    compression: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </div>

            <Button
              onClick={testConnection}
              variant="outline"
              className="w-full"
              disabled={connectionStatus === "connecting"}
            >
              {connectionStatus === "connecting" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Testing...
                </>
              ) : connectionStatus === "connected" ? (
                <>
                  <Wifi className="w-4 h-4 mr-2 text-green-500" />
                  Test Connection
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-2 text-red-500" />
                  Test Connection
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Data Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Data Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Data Overview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Customers:</span>
                  <span className="font-medium">{customers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span className="font-medium">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <span className="font-medium">{getDataSize()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Last Backup</h4>
              <div className="text-sm">
                {backupHistory.length > 0 ? (
                  <>
                    <p className="font-medium">
                      {new Date(backupHistory[0].timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      {backupHistory[0].size} • {backupHistory[0].type}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">No backups yet</p>
                )}
              </div>
            </div>

            <Button
              onClick={createBackup}
              disabled={isBackingUp || connectionStatus === "failed"}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isBackingUp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Backup...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  Create Backup Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Advanced Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Keep Versions</label>
              <Select 
                value={backupSettings.keepVersions.toString()} 
                onValueChange={(value) => setBackupSettings(prev => ({
                  ...prev,
                  keepVersions: parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 versions</SelectItem>
                  <SelectItem value="10">10 versions</SelectItem>
                  <SelectItem value="20">20 versions</SelectItem>
                  <SelectItem value="50">50 versions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Include attachments</span>
                <input
                  type="checkbox"
                  checked={backupSettings.includeAttachments}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    includeAttachments: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Backup Schedule</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Next backup: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                <li>• Frequency: {backupFrequency}</li>
                <li>• Provider: {backupProviders[selectedProvider].name}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {backupHistory.map(backup => {
              const provider = backupProviders[backup.provider]
              const status = backupStatuses[backup.status]
              const ProviderIcon = provider.icon
              const StatusIcon = status.icon

              return (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ProviderIcon className={`w-5 h-5 ${provider.color} text-white rounded-full p-1`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{provider.name}</span>
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {backup.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(backup.timestamp).toLocaleString()} • {backup.size}
                      </p>
                      {backup.error && (
                        <p className="text-xs text-red-600">{backup.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.status === "completed" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackup(backup.id)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBackup(backup.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {backupHistory.length === 0 && (
            <p className="text-center text-gray-500 py-8">No backup history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 