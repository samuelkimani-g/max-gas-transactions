// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://max-gas-backend.onrender.com/api'
const API_TIMEOUT = 30000 // 30 seconds

// Helper function for API calls with timeout and loading states
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken')
  const url = `${API_BASE_URL}${endpoint}`
  
  // Debug token status
  if (!token) {
    console.log('[API] WARNING: No auth token found in localStorage')
  } else {
    console.log('[API] Auth token present:', token.substring(0, 20) + '...')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }
  console.log('[API] Request:', url, options.method || 'GET', 'Headers:', headers)
  if (options.body) {
    try { console.log('[API] Body:', JSON.parse(options.body)) } catch { console.log('[API] Body:', options.body) }
  }
  
  // Add timeout for slow requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    console.log('[API] Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('[API] Error response:', errorText)
      throw new Error(`API call failed: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[API] Response data:', data)
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[API] Error:', error)
    throw error
  }
}

// Convenience methods for common HTTP methods
export const apiGet = (endpoint) => apiCall(endpoint, { method: 'GET' })
export const apiPost = (endpoint, data) => apiCall(endpoint, { 
  method: 'POST', 
  body: JSON.stringify(data) 
})
export const apiPut = (endpoint, data) => apiCall(endpoint, { 
  method: 'PUT', 
  body: JSON.stringify(data) 
})
export const apiDelete = (endpoint) => apiCall(endpoint, { method: 'DELETE' })
export const apiPatch = (endpoint, data) => apiCall(endpoint, { 
  method: 'PATCH', 
  body: JSON.stringify(data) 
})
