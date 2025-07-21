# Gas Cylinder Dashboard - Multi-Device Deployment Guide

## 🖥️ Enterprise Desktop Deployment

This guide explains how to deploy the Gas Cylinder Dashboard to multiple desktop computers with role-based configurations.

## 📋 Prerequisites

- Windows 10/11 computers
- Node.js 18+ installed on each machine
- Network access to backend: `https://max-gas-backend.onrender.com`
- Admin rights for installation

## 🎯 Device Role Configuration

### Available Roles:

1. **Operator Terminal** 
   - Auto-login as operator
   - Can add customers and transactions
   - Cannot approve requests or view reports
   - Limited permissions for data entry staff

2. **Manager Terminal**
   - Auto-login as manager  
   - Full customer and transaction management
   - Can approve operator requests
   - Access to reports and analytics
   - User management capabilities

3. **Admin Terminal**
   - Auto-login as admin
   - Full system access
   - User management and system settings
   - All features enabled

## 🚀 Installation Steps

### Method 1: Role-Specific Installation Scripts

1. **Download the project** to each computer
2. **Run the appropriate script** for each device:

#### For Operator Terminals:
```batch
scripts\deploy-operator.bat
```

#### For Manager Terminals:  
```batch
scripts\deploy-manager.bat
```

#### For Admin Terminals:
```batch
scripts\deploy-admin.bat
```

3. **Create desktop shortcuts:**
```batch
scripts\create-shortcuts.bat
```

### Method 2: Manual Configuration

1. **Install dependencies:**
```bash
npm install
cd electron && npm install && cd ..
```

2. **Set environment variables** (Windows):
```batch
# For Operator
set DEVICE_ROLE=operator
set DEVICE_NAME=Operator-Terminal-1
set AUTO_LOGIN=true

# For Manager  
set DEVICE_ROLE=manager
set DEVICE_NAME=Manager-Terminal-1
set AUTO_LOGIN=true

# For Admin
set DEVICE_ROLE=admin  
set DEVICE_NAME=Admin-Terminal-1
set AUTO_LOGIN=true
```

3. **Build and run:**
```bash
npm run build
npm run desktop:dev
```

## 🔧 Configuration Options

### Environment Variables:

- `DEVICE_ROLE`: `operator` | `manager` | `admin`
- `DEVICE_NAME`: Custom name for the terminal
- `AUTO_LOGIN`: `true` | `false` (enable/disable auto-login)
- `DEVICE_ID`: Unique identifier (auto-generated if not set)

### Features by Role:

| Feature | Operator | Manager | Admin |
|---------|----------|---------|-------|
| Add Customers | ✅ | ✅ | ✅ |
| Add Transactions | ✅ | ✅ | ✅ |
| Delete Items | Request Approval | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ✅ | ✅ |
| Approve Requests | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ✅ |

## 🌐 Data Synchronization

### ✅ **Real-time Data Sharing:**
- All desktop terminals connect to the same backend
- Data entered on ANY device appears on ALL devices
- Web users see desktop data instantly
- Mobile users see desktop data instantly

### 🔄 **How It Works:**
1. **Operator Terminal** → Adds customer → **Backend Database**
2. **Manager Terminal** → Sees new customer immediately
3. **Web Users** → See new customer in browser
4. **Mobile Users** → See new customer on phone

## 📱 Mobile & Web Access

### Web Access:
- URL: `https://max-gas-transactions.vercel.app`
- Same data as desktop terminals
- Manual login required
- Full responsive design

### Mobile Access:
- Same web URL works on mobile browsers
- Touch-optimized interface
- Can also use role-based auto-login if configured

## 🛡️ Security Features

- **Role-based permissions** enforced by backend
- **JWT token authentication** for all requests
- **Device-specific configurations** stored locally
- **Audit trail** for all actions
- **Approval workflow** for sensitive operations

## 🚀 Starting the Applications

### Desktop Shortcut:
Double-click the desktop shortcut created during installation

### Manual Start:
```bash
npm run desktop:dev
```

### Auto-start on Boot (Optional):
Add the desktop shortcut to Windows Startup folder:
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

## 🔧 Troubleshooting

### Common Issues:

1. **App won't start:**
   - Check Node.js is installed: `node --version`
   - Reinstall dependencies: `npm install`

2. **Auto-login not working:**
   - Check environment variables are set
   - Verify backend connectivity
   - Check console for error messages

3. **Data not syncing:**
   - Check internet connection
   - Verify backend URL: `https://max-gas-backend.onrender.com/health`
   - Check browser console for API errors

4. **Permission errors:**
   - Verify user role configuration
   - Check backend RBAC settings
   - Contact admin for role assignment

## 📞 Support

For technical support or configuration help:
- Check backend status: `https://max-gas-backend.onrender.com/health`
- Review console logs for error messages
- Contact system administrator

## 🎉 Success!

Once configured, you'll have:
- ✅ Multiple desktop terminals with role-based access
- ✅ Real-time data synchronization across all devices
- ✅ Web and mobile access to the same data
- ✅ Professional approval workflow system
- ✅ Fast, reliable performance with always-on backend 





Computer 1: Run install-operator.bat
Computer 2: Run install-manager.bat
Computer 3: Run install-admin.bat