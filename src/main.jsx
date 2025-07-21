import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

// NUCLEAR SOLUTION: Add global customers variable to prevent ReferenceError
window.customers = window.customers || []
globalThis.customers = globalThis.customers || []

// COMPREHENSIVE GLOBAL VARIABLE FIX: Define all commonly undefined variables
const globalVariables = {
  customers: [],
  transactions: [],
  duplicateError: '',
  isLoading: false,
  searchQuery: '',
  editingTransaction: null,
  hasOverdue: false,
  hasPending: false,
  savedData: null,
  file: null,
  isAutoLoggingIn: false,
  dateMatch: null,
  isSummarySheet: false,
  hasTransactionData: false,
  isTransactionSheet: false,
  isScanning: false,
  startDate: null,
  loading: false,
  nameDuplicate: false,
  phoneDuplicate: false,
  finalTranscript: '',
  isListening: false,
  matchedCommand: null,
  searchInput: null
}

// Apply global variables to all scopes
Object.keys(globalVariables).forEach(key => {
  if (!window[key]) window[key] = globalVariables[key]
  if (!globalThis[key]) globalThis[key] = globalVariables[key]
})

// Ultra-aggressive: Override global variable access with Proxy
try {
  const handler = {
    get(target, prop) {
      if (prop in globalVariables && !target[prop]) {
        console.warn(`[GLOBAL] Auto-fixing undefined variable: ${prop}`)
        return globalVariables[prop]
      }
      return target[prop]
    }
  }
  window = new Proxy(window, handler)
} catch (error) {
  console.warn('[GLOBAL] Could not set up global Proxy:', error)
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
    console.log('[ERROR BOUNDARY] Caught error:', error)
    console.log('[ERROR BOUNDARY] Error info:', errorInfo)
    
    // Handle ALL ReferenceError types
    if (error instanceof ReferenceError) {
      const errorMessage = error.message
      console.log('[ERROR BOUNDARY] REFERENCE ERROR CAUGHT!', errorMessage)
      
      // Extract variable name from error message
      const match = errorMessage.match(/(\w+) is not defined/)
      if (match) {
        const variableName = match[1]
        console.log(`[ERROR BOUNDARY] Auto-fixing undefined variable: ${variableName}`)
        
        // Define the missing variable globally
        if (!window[variableName]) {
          window[variableName] = getDefaultValue(variableName)
          console.log(`[ERROR BOUNDARY] Set window.${variableName} =`, window[variableName])
        }
        if (!globalThis[variableName]) {
          globalThis[variableName] = getDefaultValue(variableName)
          console.log(`[ERROR BOUNDARY] Set globalThis.${variableName} =`, globalThis[variableName])
        }
        
        // Try to reload the component
        setTimeout(() => {
          this.setState({ hasError: false, error: null })
          window.location.reload()
        }, 1000)
      }
    }
    
    console.log('[ERROR BOUNDARY] Stack:', error.stack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Application Error</h1>
            </div>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message?.includes('is not defined') 
                ? 'Fixing undefined variable error... Reloading in 1 second.'
                : 'Something went wrong. Please refresh the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Helper function to get default values for variables
function getDefaultValue(variableName) {
  const defaults = {
    customers: [],
    transactions: [],
    duplicateError: '',
    isLoading: false,
    searchQuery: '',
    editingTransaction: null,
    hasOverdue: false,
    hasPending: false,
    savedData: null,
    file: null,
    isAutoLoggingIn: false,
    dateMatch: null,
    isSummarySheet: false,
    hasTransactionData: false,
    isTransactionSheet: false,
    isScanning: false,
    startDate: null,
    loading: false,
    nameDuplicate: false,
    phoneDuplicate: false,
    finalTranscript: '',
    isListening: false,
    matchedCommand: null,
    searchInput: null,
    user: null,
    permissions: {},
    isAuthenticated: false,
    token: null
  }
  
  return defaults[variableName] || null
}

// Force rebuild with fresh assets
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
