import React, { useState, useEffect } from 'react';
import deviceAuth from '../lib/device-auth';
import { useStore } from '../lib/store';

const PermissionRequest = () => {
  const { login } = useStore();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDeviceInfo(deviceAuth.getDeviceInfo());
  }, []);

  const copyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceInfo.deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy device ID:', error);
    }
  };

  const handleManualLogin = async (e) => {
    console.log('🔍 [PERMISSION] Form submission event:', e);
    e.preventDefault();
    console.log('🔍 [PERMISSION] Manual login form submitted!');
    console.log('🔍 [PERMISSION] Username:', loginForm.username);
    console.log('🔍 [PERMISSION] Password length:', loginForm.password.length);
    console.log('🔍 [PERMISSION] Prevented default form submission');
    
    setIsLoading(true);
    setLoginError('');

    try {
      console.log('🔍 [PERMISSION] About to call store.login...');
      // Add a small delay to see if the page refreshes before the API call
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('🔍 [PERMISSION] Still here after delay, calling store.login...');
      
      const result = await login(loginForm.username, loginForm.password);
      console.log('🔍 [PERMISSION] Store login result:', result);
      
      if (result.success) {
        console.log('🔍 [PERMISSION] Login successful, checking store state...');
        // Check if the store state was actually updated
        const storeState = useStore.getState();
        console.log('🔍 [PERMISSION] Store state after login:', {
          isAuthenticated: storeState.isAuthenticated,
          user: storeState.user
        });
        
        // Wait a bit to see if the component re-renders
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🔍 [PERMISSION] After 500ms delay, store state:', {
          isAuthenticated: useStore.getState().isAuthenticated,
          user: useStore.getState().user
        });
        
        console.log('🔍 [PERMISSION] Login successful, no need to reload - store will handle state update');
        // The store will automatically update the authentication state
        // No need to reload the page
      } else {
        console.log('🔍 [PERMISSION] Login failed:', result.message);
        setLoginError(result.message);
      }
    } catch (error) {
      console.error('🔍 [PERMISSION] Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      console.log('🔍 [PERMISSION] Finally block executed');
      setIsLoading(false);
    }
  };

  if (!deviceInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* VERSION INDICATOR */}
      <div className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-sm z-50">
        PERMISSION REQUEST v{Date.now()}
      </div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Device Access Required</h1>
          <p className="text-gray-600">This device needs administrator approval to access MaxGas</p>
        </div>

        {/* Device Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={deviceInfo.deviceId}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm font-mono"
                />
                <button
                  onClick={copyDeviceId}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <p className="text-sm text-gray-600">{deviceInfo.platform}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Browser
              </label>
              <p className="text-sm text-gray-600">{deviceInfo.userAgent.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to get access:</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              Copy your Device ID above
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              Contact your administrator
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              Provide the Device ID to them
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              Refresh this page once approved
            </li>
          </ol>
        </div>

        {/* Manual Login Option */}
        <div className="border-t pt-6">
          <button
            onClick={() => setShowManualLogin(!showManualLogin)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showManualLogin ? 'Hide' : 'Show'} manual login option
          </button>

                     {showManualLogin && (
             <form onSubmit={handleManualLogin} className="mt-4 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Username
                 </label>
                 <input
                   type="text"
                   value={loginForm.username}
                   onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Password
                 </label>
                 <input
                   type="password"
                   value={loginForm.password}
                   onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>

               {loginError && (
                 <div className="text-red-600 text-sm">{loginError}</div>
               )}

               <button
                 type="submit"
                 disabled={isLoading}
                 onClick={() => console.log('🔍 [PERMISSION] Button clicked!')}
                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {isLoading ? 'Logging in...' : 'Login'}
               </button>
             </form>
           )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            MaxGas - Gas Cylinder Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest; 