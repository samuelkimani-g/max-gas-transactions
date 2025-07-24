import { create } from "zustand"
import { persist } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import { calculateTransactionTotal } from "./calculations";

// Global safety mechanism - ensure customers is never undefined
const ensureSafeCustomers = (state) => {
  if (!state.customers || !Array.isArray(state.customers)) {
    console.warn('[STORE] customers was undefined/invalid, setting to empty array')
    state.customers = []
  }
  return state.customers
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://max-gas-backend.onrender.com/api'
const API_TIMEOUT = 30000 // 30 seconds

// Demo mode disabled - using real backend and database
const DEMO_MODE = false

// Demo users for frontend-only deployment
const DEMO_USERS = {
  'admin@maxgas.com': {
    id: 1,
    username: 'admin',
    email: 'admin@maxgas.com',
    fullName: 'System Administrator',
    role: 'admin',
    permissions: ['all']
  },
  'manager1@maxgas.com': {
    id: 2,
    username: 'manager1',
    email: 'manager1@maxgas.com',
    fullName: 'Jane Smith',
    role: 'manager',
    permissions: ['customers', 'transactions', 'reports']
  },
  'operator1@maxgas.com': {
    id: 3,
    username: 'operator1',
    email: 'operator1@maxgas.com',
    fullName: 'Michael Brown',
    role: 'operator',
    permissions: ['customers', 'transactions']
  }
}

// Demo passwords
const DEMO_PASSWORDS = {
  'admin@maxgas.com': 'admin123',
  'manager1@maxgas.com': 'manager123',
  'operator1@maxgas.com': 'operator123'
}

// Helper function for API calls with timeout and loading states
const apiCall = async (endpoint, options = {}) => {
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
  const timeoutId = setTimeout(() => {
    console.log('[API] Request timeout after 30 seconds')
    controller.abort()
  }, API_TIMEOUT) // Use API_TIMEOUT
  
  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      ...options,
    })
    
    clearTimeout(timeoutId)
    console.log('[API] Response status:', response.status)
    
    if (!response.ok) {
      const text = await response.text()
      console.log('[API] Error response:', text)
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server may be sleeping, please try again')
    }
    throw error
  }
}

export const useStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // State
        customers: [],
        transactions: [],
        selectedCustomerId: null,
        searchQuery: "",
        isAuthenticated: false,
        user: null,
        token: null,

        // Safe customers getter - ALWAYS returns an array
        get safeCustomers() {
          const state = get()
          return ensureSafeCustomers(state)
        },

        // Auto-refresh data periodically (every 30 seconds) to keep devices in sync
        startAutoRefresh: () => {
          const refreshInterval = setInterval(async () => {
            try {
              const state = get()
              if (state.token && !DEMO_MODE) {
                await state.loadCustomers()
                await state.loadTransactions()
              }
            } catch (error) {
              console.error('[AUTO-REFRESH] Failed to refresh data:', error)
            }
          }, 30000) // 30 seconds
          
          // Store interval ID so we can clear it later
          set({ refreshInterval })
        },
        
        stopAutoRefresh: () => {
          const state = get()
          if (state.refreshInterval) {
            clearInterval(state.refreshInterval)
            set({ refreshInterval: null })
          }
        },
        
        // Manual refresh function
        refreshAllData: async () => {
          try {
            await get().loadCustomers()
            await get().loadTransactions()
            console.log('[MANUAL-REFRESH] Data refreshed successfully')
          } catch (error) {
            console.error('[MANUAL-REFRESH] Failed to refresh data:', error)
            throw error
          }
        },

        // Check for existing token on startup
        checkAuthStatus: async () => {
          const token = localStorage.getItem('authToken')
          if (token) {
            // Demo mode token validation
            if (DEMO_MODE && token.startsWith('demo_token_')) {
              console.log('[AUTH] Demo token found, restoring session')
              // Extract user info from demo token
              const tokenParts = token.split('_')
              const userId = parseInt(tokenParts[2])
              const demoUser = Object.values(DEMO_USERS).find(user => user.id === userId)
              
              if (demoUser) {
                set({
                  isAuthenticated: true,
                  user: demoUser
                })
                return true
              }
            }
            
            // Real backend token validation
            try {
              const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              })
              
              if (response.ok) {
                const data = await response.json()
                if (data.success) {
                  set({
                    isAuthenticated: true,
                    user: data.data.user
                  })
                  return true
                }
              }
            } catch (error) {
              console.error('Token validation failed:', error)
            }
            
            // If token is invalid, remove it
            localStorage.removeItem('authToken')
          }
          return false
        },

        // Customer Actions
        addCustomer: async (customer) => {
          try {
            if (DEMO_MODE) {
              // Demo mode - add customer locally
              const newCustomer = {
                id: Date.now(), // Use timestamp as ID
                ...customer,
                status: 'active',
                createdAt: new Date().toISOString()
              }
              
              set((state) => ({
                customers: [...state.customers, newCustomer],
              }))
              
              console.log('[DEMO] Added customer:', newCustomer)
              return newCustomer
            }
            
            const result = await apiCall('/customers', {
              method: 'POST',
              body: JSON.stringify(customer)
            })
            
            // IMPORTANT: Reload customers from server to ensure sync across devices
            await get().loadCustomers()
            
            return result.data.customer
          } catch (error) {
            console.error('Failed to add customer:', error)
            throw error
          }
        },

        updateCustomer: async (id, customer) => {
          try {
            if (DEMO_MODE) {
              // Demo mode - update customer locally
              const updatedCustomer = { ...customer, id, updatedAt: new Date().toISOString() }
              
              set((state) => ({
                customers: state.customers.map((c) => (c.id === id ? { ...c, ...updatedCustomer } : c)),
              }))
              
              console.log('[DEMO] Updated customer:', updatedCustomer)
              return updatedCustomer
            }
            
            const result = await apiCall(`/customers/${id}`, {
              method: 'PUT',
              body: JSON.stringify(customer)
            })
            
            set((state) => ({
              customers: state.customers.map((c) => (c.id === id ? result.data.customer : c)),
            }))
            
            return result.data.customer
          } catch (error) {
            console.error('Failed to update customer:', error)
            throw error
          }
        },

        deleteCustomer: async (id) => {
          try {
            if (DEMO_MODE) {
              // Demo mode - delete customer locally
              set((state) => ({
                customers: state.customers.filter((c) => c.id !== id),
                transactions: state.transactions.filter((t) => t.customerId !== id),
                selectedCustomerId: state.selectedCustomerId === id ? null : state.selectedCustomerId,
              }))
              
              console.log('[DEMO] Deleted customer:', id)
              return
            }
            
            // Use force delete for easier testing - removes customer and all related transactions
            await apiCall(`/customers/${id}?force=true`, {
              method: 'DELETE'
            })
            
            set((state) => ({
              customers: state.customers.filter((c) => c.id !== id),
              transactions: state.transactions.filter((t) => t.customerId !== id),
              selectedCustomerId: state.selectedCustomerId === id ? null : state.selectedCustomerId,
            }))
          } catch (error) {
            console.error('Failed to delete customer:', error)
            throw error
          }
        },

        // Transaction Actions
        addTransaction: async (transactionData) => {
          // The transactionData is now expected to be in the new "Reconciled Ledger System" format
          // from the rebuilt add-transaction-form.jsx
          try {
            if (DEMO_MODE) {
              // Demo mode would need a more complex simulation for the new format.
              // For now, we focus on the real backend implementation.
              console.warn('[DEMO] addTransaction in demo mode is not fully compatible with the new ledger system.');
              return;
            }
            
            const result = await apiCall('/transactions', {
              method: 'POST',
              body: JSON.stringify(transactionData) // Send the new structured data directly
            });
            
            console.log("Store: Adding transaction:", result.data.transaction);
            
            // Add the new transaction to the local state
            set((state) => ({
              transactions: [...state.transactions, result.data.transaction],
            }));
            
            // IMPORTANT: Reload customers to update their financial/cylinder balances in the UI
            await get().loadCustomers();

            return result.data.transaction;
          } catch (error) {
            console.error('Failed to add transaction:', error);
            // Propagate the actual error message from the API
            const errorData = await error.response?.json();
            throw new Error(errorData?.message || error.message || 'Failed to add transaction. Please try again.');
          }
        },

        // Approval Actions
        submitApprovalRequest: async (approvalData) => {
          try {
            const result = await apiCall('/approvals', {
              method: 'POST',
              body: JSON.stringify(approvalData)
            })
            
            return result.data.approval
          } catch (error) {
            console.error('Failed to submit approval request:', error)
            throw error
          }
        },

        getApprovals: async () => {
          try {
            const result = await apiCall('/approvals')
            return result.data.approvals
          } catch (error) {
            console.error('Failed to get approvals:', error)
            throw error
          }
        },

        approveRequest: async (approvalId, managerNotes = '') => {
          try {
            const result = await apiCall(`/approvals/${approvalId}/approve`, {
              method: 'PUT',
              body: JSON.stringify({ managerNotes })
            })
            
            return result.data
          } catch (error) {
            console.error('Failed to approve request:', error)
            throw error
          }
        },

        rejectRequest: async (approvalId, managerNotes) => {
          try {
            const result = await apiCall(`/approvals/${approvalId}/reject`, {
              method: 'PUT',
              body: JSON.stringify({ managerNotes })
            })
            
            return result.data
          } catch (error) {
            console.error('Failed to reject request:', error)
            throw error
          }
        },

        updateTransaction: async (id, transaction) => {
          try {
            const result = await apiCall(`/transactions/${id}`, {
              method: 'PUT',
              body: JSON.stringify(transaction)
            })
            
            set((state) => ({
              transactions: state.transactions.map((t) => (t.id === id ? result.data.transaction : t)),
            }))
            
            return result.data.transaction
          } catch (error) {
            console.error('Failed to update transaction:', error)
            throw error
          }
        },

        deleteTransaction: async (id) => {
          try {
            await apiCall(`/transactions/${id}`, {
              method: 'DELETE'
            })
            
            set((state) => ({
              transactions: state.transactions.filter((t) => t.id !== id),
            }))
          } catch (error) {
            console.error('Failed to delete transaction:', error)
            throw error
          }
        },

        bulkDeleteTransactions: async (ids) => {
          try {
            await apiCall('/transactions/bulk-delete', {
              method: 'DELETE',
              body: JSON.stringify({ ids })
            })
            
            set((state) => ({
              transactions: state.transactions.filter((t) => !ids.includes(t.id)),
            }))
          } catch (error) {
            console.error('Failed to bulk delete transactions:', error)
            throw error
          }
        },

        bulkUpdateTransactionPayments: async (ids, amount) => {
          try {
            await apiCall('/transactions/bulk-payment', {
              method: 'PUT',
              body: JSON.stringify({ ids, amount })
            })
            
            set((state) => ({
              transactions: state.transactions.map((t) => (ids.includes(t.id) ? { ...t, paid: amount } : t)),
            }))
          } catch (error) {
            console.error('Failed to bulk update payments:', error)
            throw error
          }
        },

        // Authentication Actions
        login: async (username, password) => {
          try {
            console.log('[LOGIN] Frontend login attempt:', username)
            
            // Demo mode authentication
            if (DEMO_MODE) {
              console.log('[LOGIN] Using demo mode')
              const demoUser = DEMO_USERS[username]
              const expectedPassword = DEMO_PASSWORDS[username]
              
              if (!demoUser || password !== expectedPassword) {
                throw new Error('Incorrect password')
              }
              
              // Create a mock token
              const mockToken = `demo_token_${demoUser.id}_${Date.now()}`
              localStorage.setItem('authToken', mockToken)
              
              set({
                isAuthenticated: true,
                user: demoUser
              })
              
              console.log('[LOGIN] Demo login success:', demoUser)
              return { user: demoUser, token: mockToken }
            }
            
            // Real backend authentication
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password })
            })
            console.log('[LOGIN] Frontend response status:', response.status)
            let data
            try {
              data = await response.json()
            } catch {
              data = null
            }
            if (!response.ok) {
              // Always show backend error message if available
              const msg = (data && data.message) ? data.message : `Login failed: ${response.status} ${response.statusText}`
              console.log('[LOGIN] Frontend error response:', msg)
              throw new Error(msg)
            }
            console.log('[LOGIN] Frontend login success:', data)
            if (data.success) {
              localStorage.setItem('authToken', data.data.token)
              set({
                isAuthenticated: true,
                user: data.data.user,
                token: data.data.token
              })
              
              // Start auto-refresh to keep data in sync across devices
              get().startAutoRefresh()
              
              return data.data
            } else {
              throw new Error(data.message || 'Login failed')
            }
          } catch (error) {
            console.error('[LOGIN] Frontend error:', error)
            throw error
          }
        },

        logout: () => {
          // Stop auto-refresh
          get().stopAutoRefresh()
          
          localStorage.removeItem('authToken')
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            // Don't clear customers and transactions in demo mode so data persists
            ...(DEMO_MODE ? {} : { customers: [], transactions: [] })
          })
        },

        // Bulk payment for customer - pay all outstanding transactions
        recordBulkPayment: async (customerId, amount, note = "") => {
          try {
            await apiCall('/transactions/bulk-customer-payment', {
              method: 'PUT',
              body: JSON.stringify({ customerId, amount, note })
            })
            // After payment, reload transactions from backend
            const result = await apiCall(`/transactions?customerId=${customerId}`)
            set((state) => ({
              transactions: [
                ...state.transactions.filter(t => t.customerId !== customerId),
                ...result.data.transactions
              ]
            }))
          } catch (error) {
            console.error('Failed to record bulk payment:', error)
            throw error
          }
        },

        // Data Loading Actions
        loadCustomers: async () => {
          try {
            set({ isLoading: true })
            
            if (DEMO_MODE) {
              // Load demo customers
              const demoCustomers = [
                {
                  id: 1,
                  name: 'Adebayo Johnson',
                  phone: '+2348012345679',
                  email: 'adebayo@email.com',
                  address: '45 Victoria Island, Lagos',
                  category: 'premium',
                  creditLimit: 50000,
                  status: 'active',
                  notes: 'Regular customer, pays on time'
                },
                {
                  id: 2,
                  name: 'Fatima Hassan',
                  phone: '+2348012345680',
                  email: 'fatima@email.com',
                  address: '12 Ikeja, Lagos',
                  category: 'regular',
                  creditLimit: 25000,
                  status: 'active',
                  notes: 'New customer'
                },
                {
                  id: 3,
                  name: 'Chukwudi Okonkwo',
                  phone: '+2348012345681',
                  email: 'chukwudi@email.com',
                  address: '78 Surulere, Lagos',
                  category: 'wholesale',
                  creditLimit: 100000,
                  status: 'active',
                  notes: 'Wholesale customer, large orders'
                }
              ]
              set({ customers: demoCustomers, isLoading: false })
              return
            }
            
            const result = await apiCall('/customers')
            set({ customers: result.data.customers, isLoading: false })
          } catch (error) {
            console.error('Failed to load customers:', error)
            set({ isLoading: false })
            throw error
          }
        },

        loadTransactions: async () => {
          try {
            set({ isLoading: true })
            
            if (DEMO_MODE) {
              // Load demo transactions
              const demoTransactions = [
                {
                  id: 1,
                  customerId: 1,
                  userId: 1,
                  date: '2024-01-15T00:00:00.000Z',
                  maxGas6kgLoad: 5,
                  maxGas13kgLoad: 3,
                  maxGas50kgLoad: 1,
                  return6kg: 2,
                  return13kg: 1,
                  return50kg: 0,
                  outright6kg: 0,
                  outright13kg: 0,
                  outright50kg: 0,
                  swipeReturn6kg: 0,
                  swipeReturn13kg: 0,
                  swipeReturn50kg: 0,
                  refillPrice6kg: 135,
                  refillPrice13kg: 135,
                  refillPrice50kg: 135,
                  outrightPrice6kg: 3200,
                  outrightPrice13kg: 3500,
                  outrightPrice50kg: 8500,
                  swipeRefillPrice6kg: 160,
                  swipeRefillPrice13kg: 160,
                  swipeRefillPrice50kg: 160,
                  total: 405,
                  paid: 405,
                  balance: 0,
                  paymentMethod: 'cash',
                  status: 'completed',
                  notes: 'Regular refill order'
                },
                {
                  id: 2,
                  customerId: 2,
                  userId: 1,
                  date: '2024-01-16T00:00:00.000Z',
                  maxGas6kgLoad: 2,
                  maxGas13kgLoad: 1,
                  maxGas50kgLoad: 0,
                  return6kg: 0,
                  return13kg: 0,
                  return50kg: 0,
                  outright6kg: 1,
                  outright13kg: 0,
                  outright50kg: 0,
                  swipeReturn6kg: 0,
                  swipeReturn13kg: 0,
                  swipeReturn50kg: 0,
                  refillPrice6kg: 135,
                  refillPrice13kg: 135,
                  refillPrice50kg: 135,
                  outrightPrice6kg: 3200,
                  outrightPrice13kg: 3500,
                  outrightPrice50kg: 8500,
                  swipeRefillPrice6kg: 160,
                  swipeRefillPrice13kg: 160,
                  swipeRefillPrice50kg: 160,
                  total: 3200,
                  paid: 2000,
                  balance: 1200,
                  paymentMethod: 'credit',
                  status: 'completed',
                  notes: 'Outright purchase with partial payment'
                }
              ]
              console.log("Store: Loaded demo transactions:", demoTransactions.length, "transactions")
              set({ transactions: demoTransactions, isLoading: false })
              return
            }
            
            const result = await apiCall('/transactions')
            const transactions = result.data?.transactions || result.data || []
            console.log("Store: Loaded transactions:", transactions.length, "transactions")
            if (transactions.length > 0) {
              console.log("Store: Sample transaction:", transactions[0])
            }
            set({ transactions, isLoading: false })
          } catch (error) {
            console.error('Failed to load transactions:', error)
            set({ isLoading: false })
            throw error
          }
        },

        // Analytics Actions
        saveAnalytics: async (analyticsData) => {
          try {
            const savedAnalytics = await apiCall('/analytics', {
              method: 'POST',
              body: JSON.stringify(analyticsData)
            })
            return savedAnalytics
          } catch (error) {
            console.error('Failed to save analytics:', error)
            throw error
          }
        },

        saveForecast: async (forecastData) => {
          try {
            const savedForecast = await apiCall('/forecasts', {
              method: 'POST',
              body: JSON.stringify(forecastData)
            })
            return savedForecast
          } catch (error) {
            console.error('Failed to save forecast:', error)
            throw error
          }
        },

        // Payment Actions
        savePayment: async (paymentData) => {
          try {
            const savedPayment = await apiCall('/payments', {
              method: 'POST',
              body: JSON.stringify(paymentData)
            })
            return savedPayment
          } catch (error) {
            console.error('Failed to save payment:', error)
            throw error
          }
        },

        // UI State Actions
        setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setIsAddingTransaction: (isAdding) => set({ isAddingTransaction: isAdding }),

        // Utility functions
        getCustomerTransactions: (customerId) => {
          const state = get()
          return state.transactions.filter((t) => t.customerId === customerId || t.customer_id === customerId)
        },

        getCustomerOutstanding: (customerId) => {
          const state = get()
          const transactions = state.transactions.filter((t) => t.customerId === customerId || t.customer_id === customerId)
          return transactions.reduce((total, t) => {
            const transactionTotal = calculateTransactionTotal(t)
            return total + (transactionTotal - (parseFloat(t.amount_paid) || 0))
          }, 0)
        },

        // Getters with safety checks
        getFilteredCustomers: () => {
          const state = get()
          ensureSafeCustomers(state) // Ensure customers is always safe
          return state.customers.filter((customer) => {
            if (!state.searchQuery) return true
            const query = state.searchQuery.toLowerCase()
            return (
              customer.name.toLowerCase().includes(query) ||
              customer.phone.toLowerCase().includes(query) ||
              (customer.email && customer.email.toLowerCase().includes(query)) ||
              (customer.address && customer.address.toLowerCase().includes(query))
            )
          })
        },

        getFilteredTransactions: () => {
          const state = get()
          return state.transactions
        },

        getCustomerCylinderBalance: (customerId) => {
          const state = get()
          const customerTransactions = state.transactions.filter((t) => t.customerId === customerId || t.customer_id === customerId)
          let balance = {
            '6kg': 0,
            '13kg': 0,
            '50kg': 0,
          }
          customerTransactions.forEach((transaction) => {
            // New structure: Load - (Max Empty + Swap Empty + Return Full) - Outright
            const load6kg = transaction.load_6kg || 0;
            const load13kg = transaction.load_13kg || 0;
            const load50kg = transaction.load_50kg || 0;
            const maxEmpty6kg = transaction.returns_breakdown?.max_empty?.kg6 || 0;
            const maxEmpty13kg = transaction.returns_breakdown?.max_empty?.kg13 || 0;
            const maxEmpty50kg = transaction.returns_breakdown?.max_empty?.kg50 || 0;
            const swapEmpty6kg = transaction.returns_breakdown?.swap_empty?.kg6 || 0;
            const swapEmpty13kg = transaction.returns_breakdown?.swap_empty?.kg13 || 0;
            const swapEmpty50kg = transaction.returns_breakdown?.swap_empty?.kg50 || 0;
            const returnFull6kg = transaction.returns_breakdown?.return_full?.kg6 || 0;
            const returnFull13kg = transaction.returns_breakdown?.return_full?.kg13 || 0;
            const returnFull50kg = transaction.returns_breakdown?.return_full?.kg50 || 0;
            const outright6kg = transaction.outright_breakdown?.kg6 || 0;
            const outright13kg = transaction.outright_breakdown?.kg13 || 0;
            const outright50kg = transaction.outright_breakdown?.kg50 || 0;
            balance['6kg'] += load6kg - (maxEmpty6kg + swapEmpty6kg + returnFull6kg) - outright6kg;
            balance['13kg'] += load13kg - (maxEmpty13kg + swapEmpty13kg + returnFull13kg) - outright13kg;
            balance['50kg'] += load50kg - (maxEmpty50kg + swapEmpty50kg + returnFull50kg) - outright50kg;
          })
          return balance
        },
      }),
      {
        name: "gas-cylinder-store",
        partialize: (state) => ({
          customers: state.customers,
          transactions: state.transactions,
          selectedCustomerId: state.selectedCustomerId,
          searchQuery: state.searchQuery,
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        }),
      }
    )
  )
)
