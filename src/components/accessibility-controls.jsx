import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { useToast } from "../hooks/use-toast"

import { 
  Mic, 
  MicOff, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Accessibility,
  Smartphone,
  Monitor,
  Zap,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"

const accessibilityFeatures = {
  highContrast: { name: "High Contrast", icon: Eye, color: "bg-yellow-500" },
  voiceCommands: { name: "Voice Commands", icon: Mic, color: "bg-blue-500" },
  screenReader: { name: "Screen Reader", icon: Volume2, color: "bg-green-500" },
  largeText: { name: "Large Text", icon: Monitor, color: "bg-purple-500" },
  reducedMotion: { name: "Reduced Motion", icon: Pause, color: "bg-red-500" }
}

const voiceCommands = {
  "add customer": { action: "addCustomer", description: "Add a new customer" },
  "view analytics": { action: "viewAnalytics", description: "Open analytics dashboard" },
  "scan barcode": { action: "scanBarcode", description: "Open barcode scanner" },
  "generate invoice": { action: "generateInvoice", description: "Create new invoice" },
  "search customers": { action: "searchCustomers", description: "Search customer database" },
  "view reports": { action: "viewReports", description: "Open reporting section" },
  "back to home": { action: "goHome", description: "Return to main dashboard" },
  "help": { action: "showHelp", description: "Show available commands" }
}

export default function AccessibilityControls() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    voiceCommands: false,
    screenReader: false,
    largeText: false,
    reducedMotion: false,
    fontSize: "medium",
    colorScheme: "default"
  })
  const [voiceFeedback, setVoiceFeedback] = useState(true)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const recognitionRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true)
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript)
          processVoiceCommand(finalTranscript.toLowerCase())
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }

    // Apply accessibility settings
    applyAccessibilitySettings()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [accessibilitySettings])

  const applyAccessibilitySettings = () => {
    const root = document.documentElement

    // High contrast mode
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    root.style.fontSize = accessibilitySettings.largeText ? '1.2rem' : '1rem'

    // Reduced motion
    if (accessibilitySettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.1s')
    } else {
      root.style.setProperty('--animation-duration', '0.3s')
    }

    // Color scheme
    root.setAttribute('data-theme', accessibilitySettings.colorScheme)
  }

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({ title: "Speech Not Supported", description: "Speech recognition is not supported in this browser.", variant: "error" })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      speakFeedback("Voice recognition activated. Say 'help' for available commands.")
    }
  }

  const processVoiceCommand = (command) => {
    const matchedCommand = Object.entries(voiceCommands).find(([key]) => 
      command.includes(key)
    )

    if (matchedCommand) {
      const [key, { action, description }] = matchedCommand
      executeVoiceAction(action)
      speakFeedback(`Executing: ${description}`)
    } else {
      speakFeedback("Command not recognized. Say 'help' for available commands.")
    }
  }

  const executeVoiceAction = (action) => {
    switch (action) {
      case 'addCustomer':
        // Navigate to add customer form
        window.location.href = '/?action=add-customer'
        break
      case 'viewAnalytics':
        // Navigate to analytics
        window.location.href = '/?action=analytics'
        break
      case 'scanBarcode':
        // Navigate to barcode scanner
        window.location.href = '/?action=scan'
        break
      case 'generateInvoice':
        // Navigate to invoice generator
        window.location.href = '/?action=invoice'
        break
      case 'searchCustomers':
        // Focus on search input
        const searchInput = document.querySelector('input[placeholder*="search"]')
        if (searchInput) searchInput.focus()
        break
      case 'viewReports':
        // Navigate to reports
        window.location.href = '/?action=reports'
        break
      case 'goHome':
        // Go to home
        window.location.href = '/'
        break
      case 'showHelp':
        speakFeedback("Available commands: add customer, view analytics, scan barcode, generate invoice, search customers, view reports, back to home")
        break
      default:
        break
    }
  }

  const speakFeedback = (text) => {
    if (!voiceFeedback) return

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const installPWA = async () => {
    if (!window.deferredPrompt) {
      toast({ title: "PWA Install Unavailable", description: "PWA installation is not available.", variant: "error" })
      return
    }

    window.deferredPrompt.prompt()
    const { outcome } = await window.deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsPWAInstalled(true)
      speakFeedback("App installed successfully")
    }
    
    window.deferredPrompt = null
    setInstallPrompt(null)
  }

  const toggleAccessibilityFeature = (feature) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const resetAccessibilitySettings = () => {
    setAccessibilitySettings({
      highContrast: false,
      voiceCommands: false,
      screenReader: false,
      largeText: false,
      reducedMotion: false,
      fontSize: "medium",
      colorScheme: "default"
    })
    speakFeedback("Accessibility settings reset to default")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accessibility & Mobile</h2>
          <p className="text-gray-600">Enhanced accessibility and mobile experience</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Accessibility className="w-4 h-4 mr-1" />
            WCAG 2.1
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Smartphone className="w-4 h-4 mr-1" />
            PWA Ready
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PWA Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Progressive Web App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Install as Mobile App</h4>
              <p className="text-sm text-gray-600 mb-3">
                Install this app on your mobile device for a native app experience with offline functionality.
              </p>
              {isPWAInstalled ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Installed
                </Badge>
              ) : (
                <Button onClick={installPWA} disabled={!window.deferredPrompt}>
                  <Zap className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Offline Support</p>
                <p className="text-gray-600">Work without internet</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Push Notifications</p>
                <p className="text-gray-600">Stay updated</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Background Sync</p>
                <p className="text-gray-600">Auto-sync data</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Native Experience</p>
                <p className="text-gray-600">App-like feel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Voice Recognition</p>
                <p className="text-sm text-gray-600">Control the app with voice commands</p>
              </div>
              <Button
                onClick={toggleVoiceRecognition}
                variant={isListening ? "default" : "outline"}
                className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>

            {isListening && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Listening...</p>
                {transcript && (
                  <p className="text-sm text-blue-600 mt-1">" {transcript} "</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Available Commands:</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {Object.entries(voiceCommands).map(([command, { description }]) => (
                  <div key={command} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">"{command}"</span>
                    <span className="text-gray-600">{description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Voice Feedback</span>
              <input
                type="checkbox"
                checked={voiceFeedback}
                onChange={(e) => setVoiceFeedback(e.target.checked)}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="w-5 h-5" />
              Accessibility Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(accessibilityFeatures).map(([key, feature]) => {
              const FeatureIcon = feature.icon
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FeatureIcon className={`w-5 h-5 ${feature.color} text-white rounded-full p-1`} />
                    <div>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-sm text-gray-600">
                        {key === 'highContrast' && 'Enhanced color contrast for better visibility'}
                        {key === 'voiceCommands' && 'Control the app with voice commands'}
                        {key === 'screenReader' && 'Optimized for screen readers'}
                        {key === 'largeText' && 'Increase text size for better readability'}
                        {key === 'reducedMotion' && 'Reduce animations for motion sensitivity'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessibilitySettings[key]}
                    onChange={() => toggleAccessibilityFeature(key)}
                    className="rounded"
                  />
                </div>
              )
            })}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Text Size</span>
                <select 
                  value={accessibilitySettings.fontSize} 
                  onChange={(e) => setAccessibilitySettings(prev => ({ ...prev, fontSize: e.target.value }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Color Scheme</span>
                <select 
                  value={accessibilitySettings.colorScheme} 
                  onChange={(e) => setAccessibilitySettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="default">Default</option>
                  <option value="high-contrast">High Contrast</option>
                  <option value="dark">Dark Mode</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>
            </div>

            <Button onClick={resetAccessibilitySettings} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </CardContent>
        </Card>

        {/* Mobile Responsiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Mobile Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Responsive Design</h4>
              <p className="text-sm text-gray-600 mb-3">
                Optimized for all screen sizes with touch-friendly interfaces.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-white rounded">
                  <p className="font-medium">Mobile</p>
                  <p className="text-gray-600">320px+</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <p className="font-medium">Tablet</p>
                  <p className="text-gray-600">768px+</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <p className="font-medium">Desktop</p>
                  <p className="text-gray-600">1024px+</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <p className="font-medium">Large</p>
                  <p className="text-gray-600">1440px+</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Mobile Features:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Touch-optimized buttons and controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Swipe gestures for navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Camera integration for barcode scanning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Offline data synchronization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Push notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Voice commands support</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 