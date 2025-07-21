// Device-specific configuration system
// This allows each desktop/device to have a pre-configured role

// Device configuration - can be customized per installation
const DEVICE_CONFIG = {
  // Set this during installation/deployment
  deviceRole: process.env.DEVICE_ROLE || 'operator', // 'admin', 'manager', 'operator'
  deviceId: process.env.DEVICE_ID || generateDeviceId(),
  deviceName: process.env.DEVICE_NAME || 'Desktop-Terminal',
  autoLogin: process.env.AUTO_LOGIN === 'true' || true,
  
  // Role-specific configurations
  roleConfigs: {
    operator: {
      username: 'operator1@maxgas.com',
      displayName: 'Operator Terminal',
      permissions: ['customers:read', 'customers:create', 'transactions:read', 'transactions:create'],
      theme: 'operator',
      features: {
        canAddCustomers: true,
        canAddTransactions: true,
        canViewReports: false,
        canManageUsers: false,
        canApproveRequests: false
      }
    },
    manager: {
      username: 'manager1@maxgas.com', 
      displayName: 'Manager Terminal',
      permissions: ['customers:all', 'transactions:all', 'reports:all', 'approvals:all'],
      theme: 'manager',
      features: {
        canAddCustomers: true,
        canAddTransactions: true,
        canViewReports: true,
        canManageUsers: true,
        canApproveRequests: true
      }
    },
    admin: {
      username: 'admin@maxgas.com',
      displayName: 'Admin Terminal', 
      permissions: ['all'],
      theme: 'admin',
      features: {
        canAddCustomers: true,
        canAddTransactions: true,
        canViewReports: true,
        canManageUsers: true,
        canApproveRequests: true,
        canManageSystem: true
      }
    }
  }
}

// Generate unique device ID
function generateDeviceId() {
  const os = require('os');
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  return `${platform}-${arch}-${hostname}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '');
}

// Get current device configuration
export function getDeviceConfig() {
  return {
    ...DEVICE_CONFIG,
    currentRole: DEVICE_CONFIG.roleConfigs[DEVICE_CONFIG.deviceRole]
  };
}

// Auto-login function for device-specific roles
export function getAutoLoginCredentials() {
  if (!DEVICE_CONFIG.autoLogin) return null;
  
  const roleConfig = DEVICE_CONFIG.roleConfigs[DEVICE_CONFIG.deviceRole];
  
  // Return pre-configured credentials based on role
  const credentials = {
    operator: { username: 'operator1@maxgas.com', password: 'operator123' },
    manager: { username: 'manager1@maxgas.com', password: 'manager123' },
    admin: { username: 'admin@maxgas.com', password: 'admin123' }
  };
  
  return credentials[DEVICE_CONFIG.deviceRole];
}

// Check if feature is enabled for current device
export function isFeatureEnabled(feature) {
  const roleConfig = DEVICE_CONFIG.roleConfigs[DEVICE_CONFIG.deviceRole];
  return roleConfig.features[feature] || false;
}

// Get device display info
export function getDeviceInfo() {
  const roleConfig = DEVICE_CONFIG.roleConfigs[DEVICE_CONFIG.deviceRole];
  return {
    deviceName: DEVICE_CONFIG.deviceName,
    deviceId: DEVICE_CONFIG.deviceId,
    role: DEVICE_CONFIG.deviceRole,
    displayName: roleConfig.displayName,
    theme: roleConfig.theme
  };
}

// Update device configuration (for runtime changes)
export function updateDeviceConfig(newConfig) {
  Object.assign(DEVICE_CONFIG, newConfig);
  localStorage.setItem('deviceConfig', JSON.stringify(DEVICE_CONFIG));
}

// Load saved device configuration
export function loadDeviceConfig() {
  const saved = localStorage.getItem('deviceConfig');
  if (saved) {
    Object.assign(DEVICE_CONFIG, JSON.parse(saved));
  }
  return DEVICE_CONFIG;
} 