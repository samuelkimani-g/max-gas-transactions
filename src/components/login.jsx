import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useStore } from "../lib/store"
import { getDeviceInfo } from "../lib/device-config"
import { Eye, EyeOff } from "lucide-react"

export default function Login({ isAutoLoggingIn = false }) {
  const { login } = useStore()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  
  const deviceInfo = getDeviceInfo()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log('[LOGIN] Starting login process...')
      const result = await login(formData.username, formData.password)
      console.log('[LOGIN] Login successful, result:', result)
      
      // Check if we're authenticated after login
      const authStatus = useStore.getState().isAuthenticated
      console.log('[LOGIN] Authentication status after login:', authStatus)
      
      // Check if token is stored
      const token = localStorage.getItem('authToken')
      console.log('[LOGIN] Token stored:', token ? 'Yes' : 'No')
      
      if (token) {
        console.log('[LOGIN] Token preview:', token.substring(0, 20) + '...')
      }
      
    } catch (error) {
      console.error('[LOGIN] Login error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Gas Cylinder Manager</CardTitle>
            <p className="text-gray-600">Auto-logging in...</p>
            {deviceInfo && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-800">{deviceInfo.displayName}</p>
                <p className="text-xs text-blue-600">Device: {deviceInfo.deviceName}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
            {/* <User className="w-8 h-8 text-white" /> */}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Gas Cylinder Manager
          </CardTitle>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {/* <AlertCircle className="w-4 h-4" /> */}
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username or Email
              </Label>
              <div className="relative">
                {/* <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username or email"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                {/* <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">Debug Information:</h4>
              <button
                type="button"
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
              >
                {debugMode ? "Hide Debug" : "Show Debug"}
              </button>
            </div>
            
            {debugMode && (
              <div className="space-y-2 text-xs bg-yellow-50 p-2 rounded border">
                <p><strong>Username:</strong> "{formData.username}"</p>
                <p><strong>Password:</strong> "{formData.password}"</p>
                <p><strong>Password Length:</strong> {formData.password.length}</p>
                <p><strong>Current Credentials:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• sammy / kimani@90</li>
                  <li>• kamunyu / maxgas1455</li>
                </ul>
              </div>
            )}
            
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p><strong>Current Admin:</strong> sammy / kimani@90</p>
              <p><strong>Current Owner:</strong> kamunyu / maxgas1455</p>
              <p className="text-xs text-gray-500 mt-2">Note: Passwords are case-sensitive. Use the exact credentials above.</p>
            </div>
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <strong>Production Mode:</strong> Connected to real backend and database. All changes will persist.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 