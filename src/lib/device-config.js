// Device-specific configuration for auto-login and role assignment
// This allows different devices to have different default roles

// Device configuration based on environment
export function getDeviceInfo() {
  // Browser-compatible device detection
  let deviceName = 'Unknown Device'
  let deviceType = 'web'
  
  try {
    // Try to get device info from various sources
    if (window.electron) {
      deviceType = 'desktop'
      deviceName = 'Desktop App'
    } else if (navigator.userAgent) {
      const ua = navigator.userAgent
      if (ua.includes('Windows')) deviceName = 'Windows Device'
      else if (ua.includes('Mac')) deviceName = 'Mac Device'
      else if (ua.includes('Linux')) deviceName = 'Linux Device'
      else if (ua.includes('Mobile')) deviceName = 'Mobile Device'
      else deviceName = 'Web Browser'
    }
  } catch (error) {
    console.log('[DEVICE] Could not detect device info:', error)
  }

  // Default configuration
  const config = {
    deviceId: generateDeviceId(),
    deviceName,
    deviceType,
    role: null, // Will be set by deployment script
    displayName: `${deviceName}`,
    autoLogin: false,
    credentials: null
  }

  // Try to load saved device config
  try {
    const savedConfig = localStorage.getItem('deviceConfig')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      return { ...config, ...parsed }
    }
  } catch (error) {
    console.log('[DEVICE] Could not load saved config:', error)
  }

  return config
}

// Generate a unique device ID
function generateDeviceId() {
  // Try to get a persistent device ID
  let deviceId = localStorage.getItem('deviceId')
  
  if (!deviceId) {
    // Generate a new device ID
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    localStorage.setItem('deviceId', deviceId)
  }
  
  return deviceId
}

// Get OS hostname equivalent for browser
function getDeviceIdentifier() {
  // Browser-compatible device identification
  try {
    // Use a combination of available browser APIs
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
    
    const fingerprint = canvas.toDataURL()
    return 'browser_' + btoa(fingerprint).substr(0, 8)
  } catch (error) {
    // Fallback to user agent hash
    return 'device_' + btoa(navigator.userAgent || 'unknown').substr(0, 8)
  }
} 