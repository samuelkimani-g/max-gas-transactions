import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Hand, 
  Move, 
  Camera, 
  Wifi, 
  WifiOff,
  Download,
  Upload,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Battery,
  Signal,
  Clock
} from "lucide-react"

const deviceTypes = {
  mobile: { name: "Mobile", icon: Smartphone, color: "bg-blue-500", width: "320px" },
  tablet: { name: "Tablet", icon: Tablet, color: "bg-green-500", width: "768px" },
  desktop: { name: "Desktop", icon: Monitor, color: "bg-purple-500", width: "1024px" }
}

const mobileFeatures = {
  touchOptimized: { name: "Touch Optimized", icon: Hand, status: "active" },
  swipeGestures: { name: "Swipe Gestures", icon: Move, status: "active" },
  cameraIntegration: { name: "Camera Integration", icon: Camera, status: "active" },
  offlineMode: { name: "Offline Mode", icon: WifiOff, status: "active" },
  pushNotifications: { name: "Push Notifications", icon: Zap, status: "active" },
  voiceCommands: { name: "Voice Commands", icon: Settings, status: "active" }
}

export default function MobileOptimization() {
  const [currentDevice, setCurrentDevice] = useState("desktop")
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [batteryLevel, setBatteryLevel] = useState(null)
  const [networkType, setNetworkType] = useState("unknown")
  const [deviceOrientation, setDeviceOrientation] = useState("portrait")
  const [touchSupport, setTouchSupport] = useState(false)
  const [pwaInstallable, setPwaInstallable] = useState(false)

  useEffect(() => {
    // Detect device type based on screen width
    const detectDevice = () => {
      const width = window.innerWidth
      if (width < 768) {
        setCurrentDevice("mobile")
      } else if (width < 1024) {
        setCurrentDevice("tablet")
      } else {
        setCurrentDevice("desktop")
      }
    }

    // Check online status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Check battery level
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery()
          setBatteryLevel(battery.level * 100)
        } catch (error) {
          console.log('Battery API not supported')
        }
      }
    }

    // Check network type
    const checkNetwork = () => {
      if ('connection' in navigator) {
        setNetworkType(navigator.connection.effectiveType || 'unknown')
      }
    }

    // Check device orientation
    const checkOrientation = () => {
      setDeviceOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    // Check touch support
    setTouchSupport('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Check PWA installability
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstallable(false) // Already installed
    } else {
      setPwaInstallable(true)
    }

    // Initial checks
    detectDevice()
    checkBattery()
    checkNetwork()
    checkOrientation()

    // Event listeners
    window.addEventListener('resize', detectDevice)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  const getDeviceStats = () => {
    return {
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    }
  }

  const stats = getDeviceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mobile Optimization</h2>
          <p className="text-gray-600">Responsive design and mobile-specific features</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Smartphone className="w-4 h-4 mr-1" />
            Responsive
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Hand className="w-4 h-4 mr-1" />
            Touch Ready
          </Badge>
        </div>
      </div>

      {/* Device Detection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(deviceTypes).map(([key, device]) => {
          const DeviceIcon = device.icon
          const isActive = currentDevice === key
          
          return (
            <Card key={key} className={isActive ? "ring-2 ring-blue-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DeviceIcon className={`w-8 h-8 ${device.color} text-white rounded-full p-1`} />
                    <div>
                      <p className="font-semibold">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.width}</p>
                    </div>
                  </div>
                  {isActive && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Screen Resolution</p>
                <p className="text-gray-600">{stats.screenWidth} × {stats.screenHeight}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Pixel Ratio</p>
                <p className="text-gray-600">{stats.pixelRatio}x</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Platform</p>
                <p className="text-gray-600">{stats.platform}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Language</p>
                <p className="text-gray-600">{stats.language}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Status</span>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <Badge className={isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Network Type</span>
                <Badge variant="outline">{networkType}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Orientation</span>
                <Badge variant="outline">{deviceOrientation}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Touch Support</span>
                <Badge className={touchSupport ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {touchSupport ? "Supported" : "Not Supported"}
                </Badge>
              </div>

              {batteryLevel !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Battery Level</span>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    <span className="text-sm">{batteryLevel.toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Mobile Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(mobileFeatures).map(([key, feature]) => {
              const FeatureIcon = feature.icon
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FeatureIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-sm text-gray-600">
                        {key === 'touchOptimized' && 'Optimized for touch interactions'}
                        {key === 'swipeGestures' && 'Swipe navigation support'}
                        {key === 'cameraIntegration' && 'Camera access for scanning'}
                        {key === 'offlineMode' && 'Work without internet connection'}
                        {key === 'pushNotifications' && 'Real-time notifications'}
                        {key === 'voiceCommands' && 'Voice control support'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {feature.status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Responsive Design */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Responsive Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Breakpoints</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mobile:</span>
                  <span className="font-medium">320px - 767px</span>
                </div>
                <div className="flex justify-between">
                  <span>Tablet:</span>
                  <span className="font-medium">768px - 1023px</span>
                </div>
                <div className="flex justify-between">
                  <span>Desktop:</span>
                  <span className="font-medium">1024px+</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Responsive Features:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Fluid grid layouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Flexible images and media</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Mobile-first approach</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Touch-friendly interfaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Optimized navigation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              PWA Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Progressive Web App</h4>
              <p className="text-sm text-gray-600 mb-3">
                Install this app on your device for a native app experience.
              </p>
              {pwaInstallable ? (
                <Button className="w-full bg-purple-500 hover:bg-purple-600">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              ) : (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Already Installed
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">PWA Features:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Offline functionality</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Push notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Background sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>App shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Native app feel</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 