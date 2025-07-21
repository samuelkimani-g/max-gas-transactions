import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  Camera, 
  QrCode, 
  Barcode, 
  Package, 
  Search, 
  History, 
  MapPin, 
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Zap,
  Scan,
  X
} from "lucide-react"
import { useStore } from "../lib/store"
import { useToast } from "../hooks/use-toast"

const scanModes = {
  camera: { name: "Camera", icon: Camera, color: "bg-blue-500" },
  manual: { name: "Manual Entry", icon: Barcode, color: "bg-green-500" },
  file: { name: "File Upload", icon: Upload, color: "bg-purple-500" }
}

const cylinderStatuses = {
  available: { name: "Available", icon: CheckCircle, color: "bg-green-500" },
  inUse: { name: "In Use", icon: Clock, color: "bg-yellow-500" },
  maintenance: { name: "Maintenance", icon: AlertCircle, color: "bg-red-500" },
  retired: { name: "Retired", icon: X, color: "bg-gray-500" }
}

export default function BarcodeScanner() {
  const { customers, transactions } = useStore()
  const [scanMode, setScanMode] = useState("camera")
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCodes, setScannedCodes] = useState([])
  const [manualCode, setManualCode] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [cylinderData, setCylinderData] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const { toast } = useToast()


  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setIsScanning(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({ title: "Camera Access Denied", description: "Unable to access camera. Please check permissions.", variant: "error" })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const simulateScan = () => {
    const codes = ["CYL-001", "CYL-002", "CYL-003", "CYL-004", "CYL-005"]
    const randomCode = codes[Math.floor(Math.random() * codes.length)]
    
    const scan = {
      id: Date.now().toString(),
      code: randomCode,
      timestamp: new Date().toISOString(),
      mode: scanMode,
      cylinder: cylinderData[randomCode] || null
    }

    setScannedCodes(prev => [scan, ...prev])
    
    if (cylinderData[randomCode]) {
      // Update cylinder status
      setCylinderData(prev => ({
        ...prev,
        [randomCode]: {
          ...prev[randomCode],
          lastScanned: new Date().toISOString()
        }
      }))
    }

    toast({ title: "Scan Complete", description: `Scanned: ${randomCode}`, variant: "success" })
  }

  const handleManualScan = () => {
    if (!manualCode.trim()) return

    const scan = {
      id: Date.now().toString(),
      code: manualCode.trim(),
      timestamp: new Date().toISOString(),
      mode: "manual",
      cylinder: cylinderData[manualCode.trim()] || null
    }

    setScannedCodes(prev => [scan, ...prev])
    setManualCode("")

    if (cylinderData[manualCode.trim()]) {
      toast({ title: "Cylinder Found", description: `Found cylinder: ${manualCode.trim()}`, variant: "success" })
    } else {
      toast({ title: "Cylinder Not Found", description: `Cylinder ${manualCode.trim()} not found in database`, variant: "error" })
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Simulate processing file
      setTimeout(() => {
        const codes = ["CYL-006", "CYL-007", "CYL-008"]
        codes.forEach(code => {
          const scan = {
            id: Date.now().toString() + Math.random(),
            code,
            timestamp: new Date().toISOString(),
            mode: "file",
            cylinder: cylinderData[code] || null
          }
          setScannedCodes(prev => [scan, ...prev])
        })
        toast({ title: "File Processed", description: `Processed ${codes.length} codes from file`, variant: "success" })
        setSelectedFile(null)
      }, 2000)
    }
  }

  const addCylinder = (code) => {
    if (!code || cylinderData[code]) return

    const newCylinder = {
      id: code,
      type: "Propane",
      size: "20 lb",
      status: "available",
      location: "Main Warehouse",
      lastScanned: new Date().toISOString(),
      customer: null,
      history: []
    }

    setCylinderData(prev => ({ ...prev, [code]: newCylinder }))
    toast({ title: "Cylinder Added", description: `Added new cylinder: ${code}`, variant: "success" })
  }

  const updateCylinderStatus = (code, newStatus) => {
    if (!cylinderData[code]) return

    setCylinderData(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        status: newStatus,
        lastScanned: new Date().toISOString()
      }
    }))
  }

  const filteredCylinders = Object.values(cylinderData).filter(cylinder => {
    const matchesSearch = cylinder.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cylinder.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || cylinder.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barcode & QR Scanner</h2>
          <p className="text-gray-600">Track cylinders with barcode and QR code scanning</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Camera className="w-4 h-4 mr-1" />
            Real-time
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Zap className="w-4 h-4 mr-1" />
            Instant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Scanner Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scan Mode Selection */}
              <div className="flex gap-2">
                {Object.entries(scanModes).map(([key, mode]) => {
                  const ModeIcon = mode.icon
                  return (
                    <Button
                      key={key}
                      variant={scanMode === key ? "default" : "outline"}
                      onClick={() => {
                        setScanMode(key)
                        if (isScanning) stopCamera()
                      }}
                      className="flex items-center gap-2"
                    >
                      <ModeIcon className={`w-4 h-4 ${mode.color} text-white rounded-full p-0.5`} />
                      {mode.name}
                    </Button>
                  )
                })}
              </div>

              {/* Camera Scanner */}
              {scanMode === "camera" && (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    {isScanning ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Camera not active</p>
                        </div>
                      </div>
                    )}
                    {isScanning && (
                      <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-32 h-32 border-2 border-blue-500"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button onClick={stopCamera} variant="outline" className="flex-1">
                          <X className="w-4 h-4 mr-2" />
                          Stop Camera
                        </Button>
                        <Button onClick={simulateScan} className="flex-1">
                          <Scan className="w-4 h-4 mr-2" />
                          Simulate Scan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Entry */}
              {scanMode === "manual" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter barcode or QR code"
                      onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    />
                    <Button onClick={handleManualScan}>
                      <Search className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter the barcode or QR code manually and press Scan or Enter
                  </p>
                </div>
              )}

              {/* File Upload */}
              {scanMode === "file" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".txt,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline">
                        Choose File
                      </Button>
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                      Upload a text file with barcode/QR codes (one per line)
                    </p>
                  </div>
                  {selectedFile && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">Processing: {selectedFile.name}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {scannedCodes.map(scan => {
                  const mode = scanModes[scan.mode]
                  const ModeIcon = mode.icon
                  const cylinder = scan.cylinder
                  const status = cylinder ? cylinderStatuses[cylinder.status] : null
                  const StatusIcon = status ? status.icon : null

                  return (
                    <div key={scan.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ModeIcon className={`w-4 h-4 ${mode.color} text-white rounded-full p-0.5`} />
                        <span className="font-medium">{scan.code}</span>
                        {status && (
                          <Badge className={`${status.color} text-white text-xs`}>
                            {status.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                      {cylinder && (
                        <div className="mt-2 text-xs">
                          <p className="text-gray-600">{cylinder.type} - {cylinder.size}</p>
                          <p className="text-gray-600">Location: {cylinder.location}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {scannedCodes.length === 0 && (
                <p className="text-center text-gray-500 py-4">No scans yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cylinder Database */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cylinder Database
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search cylinders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(cylinderStatuses).map(([key, status]) => (
                    <SelectItem key={key} value={key}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCylinders.map(cylinder => {
              const status = cylinderStatuses[cylinder.status]
              const StatusIcon = status.icon

              return (
                <div key={cylinder.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{cylinder.id}</h3>
                    <Badge className={`${status.color} text-white`}>
                      {status.name}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{cylinder.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span>{cylinder.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{cylinder.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span>{cylinder.customer || "None"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Scanned:</span>
                      <span>{new Date(cylinder.lastScanned).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Select
                      value={cylinder.status}
                      onValueChange={(value) => updateCylinderStatus(cylinder.id, value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(cylinderStatuses).map(([key, status]) => (
                          <SelectItem key={key} value={key}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline">
                      <History className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredCylinders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No cylinders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 