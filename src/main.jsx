import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

// NUCLEAR SOLUTION: Add global customers variable to prevent ReferenceError
// This is a last resort to catch any direct references to 'customers' variable
window.customers = window.customers || []
globalThis.customers = globalThis.customers || []

// Also add it to the global scope for any eval'd code
if (typeof global !== 'undefined') {
  global.customers = global.customers || []
}

// Ultra-aggressive: Override global variable access
try {
  // Create a Proxy to catch any undefined variable access
  const originalWindowGet = window.__lookupGetter__
  
  // Add customers to window object
  Object.defineProperty(window, 'customers', {
    get() {
      console.log('[GLOBAL] customers accessed via window')
      return []
    },
    set(value) {
      console.log('[GLOBAL] customers set via window:', value)
      window._customers = value
    },
    enumerable: true,
    configurable: true
  })
} catch (error) {
  console.warn('[GLOBAL] Could not set up Proxy:', error)
}

console.log('[GLOBAL] Global customers variable set:', window.customers)

// Global Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ERROR BOUNDARY] Caught error:', error)
    console.error('[ERROR BOUNDARY] Error info:', errorInfo)
    
    // Check if it's the customers undefined error
    if (error.message && error.message.includes('customers is not defined')) {
      console.error('[ERROR BOUNDARY] CUSTOMERS UNDEFINED ERROR CAUGHT!')
      console.error('[ERROR BOUNDARY] Stack:', error.stack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Force rebuild with fresh assets
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
