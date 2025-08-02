// Device Authentication Logic for MaxGas App
// Handles device ID generation, auto-login, and permission requests

class DeviceAuth {
  constructor() {
    this.deviceIdKey = 'maxgas_device_id';
    this.tokenKey = 'maxgas_jwt_token';
    this.apiBase = process.env.REACT_APP_API_URL || 'https://max-gas-backend.onrender.com/api';
  }

  // Generate a new UUID for device identification
  generateDeviceId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or create device ID from localStorage
  getDeviceId() {
    let deviceId = localStorage.getItem(this.deviceIdKey);
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(this.deviceIdKey, deviceId);
      console.log('🔐 Generated new device ID:', deviceId);
    }
    
    return deviceId;
  }

  // Store JWT token
  storeToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get stored JWT token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Remove stored token (for logout)
  clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Attempt auto-login with device ID
  async attemptAutoLogin() {
    try {
      const deviceId = this.getDeviceId();
      
      console.log('🔄 Attempting auto-login with device ID:', deviceId);
      
      const response = await fetch(`${this.apiBase}/auth/auto-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_identifier: deviceId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Auto-login successful for user:', data.user.username);
        this.storeToken(data.token);
        return {
          success: true,
          user: data.user,
          device: data.device
        };
      } else {
        console.log('❌ Auto-login failed:', data.message);
        return {
          success: false,
          code: data.code || 'AUTO_LOGIN_FAILED',
          message: data.message
        };
      }
    } catch (error) {
      console.error('🚨 Auto-login error:', error);
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Network error during auto-login'
      };
    }
  }

  // Verify stored token
  async verifyToken() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await fetch(`${this.apiBase}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          user: data.user
        };
      } else {
        // Token is invalid, clear it
        this.clearToken();
        return {
          success: false,
          message: data.message
        };
      }
    } catch (error) {
      console.error('🚨 Token verification error:', error);
      return {
        success: false,
        message: 'Network error during token verification'
      };
    }
  }

  // Manual login
  async manualLogin(username, password) {
    console.log('🔍 [DEVICE-AUTH] manualLogin called with username:', username);
    try {
      console.log('🔍 [DEVICE-AUTH] Making API request to:', `${this.apiBase}/auth/login`);
      
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      console.log('🔍 [DEVICE-AUTH] Response status:', response.status);
      console.log('🔍 [DEVICE-AUTH] Response ok:', response.ok);

      const data = await response.json();
      console.log('🔍 [DEVICE-AUTH] Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Manual login successful for user:', data.user.username);
        console.log('🔍 [DEVICE-AUTH] Storing token...');
        this.storeToken(data.token);
        console.log('🔍 [DEVICE-AUTH] Token stored, returning success');
        return {
          success: true,
          user: data.user
        };
      } else {
        console.log('🔍 [DEVICE-AUTH] Login failed, returning error');
        return {
          success: false,
          message: data.message
        };
      }
    } catch (error) {
      console.error('🚨 Manual login error:', error);
      console.log('🔍 [DEVICE-AUTH] Caught error, returning network error');
      return {
        success: false,
        message: 'Network error during login'
      };
    }
  }

  // Logout
  async logout() {
    try {
      const deviceId = this.getDeviceId();
      const token = this.getToken();
      
      if (token) {
        await fetch(`${this.apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            device_identifier: deviceId
          })
        });
      }
    } catch (error) {
      console.error('🚨 Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  // Get device info for permission request
  getDeviceInfo() {
    const deviceId = this.getDeviceId();
    return {
      deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  // Check if device is trusted (has valid token)
  isDeviceTrusted() {
    const token = this.getToken();
    return !!token;
  }
}

// Create singleton instance
const deviceAuth = new DeviceAuth();

export default deviceAuth; 