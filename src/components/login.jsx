import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useStore } from "../lib/store"
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Trim whitespace from inputs
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    // Debug: print password value (for dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LOGIN] Username value:', JSON.stringify(trimmedUsername))
      console.log('[LOGIN] Password value:', JSON.stringify(trimmedPassword))
    }

    try {
      await login(trimmedUsername, trimmedPassword)
    } catch (error) {
      // Show backend error message if available
      if (error && error.message && error.message.startsWith('{')) {
        try {
          const errObj = JSON.parse(error.message)
          setError(errObj.message || "Login failed. Please check your credentials.")
        } catch {
          setError(error.message || "Login failed. Please check your credentials.")
        }
      } else if (error && error.message) {
        setError(error.message)
      } else {
        setError("Login failed. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
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
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <h4 className="font-medium text-gray-900 mb-2">Default Credentials:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Admin:</strong> admin@maxgas.com / admin123</p>
              <p><strong>Manager:</strong> manager1@maxgas.com / manager123</p>
              <p><strong>Operator:</strong> operator1@maxgas.com / operator123</p>
              <p className="text-xs text-gray-500 mt-2">Note: Passwords are case-sensitive. These are the correct credentials as seeded in the database.</p>
            </div>
            {process.env.NODE_ENV === 'production' && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>Demo Mode:</strong> This is a frontend-only demo. Data is simulated and changes won't persist.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 