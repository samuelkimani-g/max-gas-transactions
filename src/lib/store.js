import { create } from "zustand"
import { persist } from "zustand/middleware"

// API base URL - adjust this to match your backend
const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://your-backend-url.com/api' : 'http://localhost:5000/api'

// Demo mode for frontend-only deployment
const DEMO_MODE = true // Force demo mode for now - can be made dynamic later

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

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken')
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
      'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
  }
  console.log('[API] Request:', url, options.method || 'GET', 'Headers:', headers)
  if (options.body) {
    try { console.log('[API] Body:', JSON.parse(options.body)) } catch { console.log('[API] Body:', options.body) }
  }
  const response = await fetch(url, {
    headers,
    ...options,
  })
  console.log('[API] Response status:', response.status)
  if (!response.ok) {
    const text = await response.text()
    console.log('[API] Error response:', text)
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const useStore = create(
  persist(
    (set, get) => ({
      customers: [],
      transactions: [],
      selectedCustomerId: null,
      searchQuery: "",
      isAddingTransaction: false,
      isLoading: false,
      isAuthenticated: false,
      user: null,

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
          const result = await apiCall('/customers', {
            method: 'POST',
            body: JSON.stringify(customer)
          })
          
          set((state) => ({
            customers: [...state.customers, result.data.customer],
          }))
          
          return result.data.customer
        } catch (error) {
          console.error('Failed to add customer:', error)
          throw error
        }
      },

      updateCustomer: async (id, customer) => {
        try {
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
          await apiCall(`/customers/${id}`, {
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
      addTransaction: async (transaction) => {
        try {
          const result = await apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
          })
          
          console.log("Store: Adding transaction:", result.data.transaction)
          console.log("Store: Total transactions after add:", get().transactions.length + 1)

          set((state) => ({
            transactions: [...state.transactions, result.data.transaction],
          }))
          
          return result.data.transaction
        } catch (error) {
          console.error('Failed to add transaction:', error)
          throw error
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
              user: data.data.user
            })
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
        localStorage.removeItem('authToken')
        set({
          isAuthenticated: false,
          user: null,
          customers: [],
          transactions: []
        })
      },

      // Bulk payment for customer - pay all outstanding transactions
      recordBulkPayment: async (customerId, amount, note = "") => {
        try {
          await apiCall('/transactions/bulk-customer-payment', {
            method: 'PUT',
            body: JSON.stringify({ customerId, amount, note })
          })
          
          set((state) => {
            const customerTransactions = state.transactions
              .filter((t) => t.customerId === customerId)
              .sort((a, b) => new Date(a.date) - new Date(b.date)) // Oldest first

            let remainingAmount = amount
            const updatedTransactions = state.transactions.map((transaction) => {
              if (transaction.customerId !== customerId || remainingAmount <= 0) {
                return transaction
              }

              const total = calculateTransactionTotal(transaction)
              const currentPaid = transaction.paid || 0
              const outstanding = total - currentPaid

              if (outstanding <= 0) {
                return transaction
              }

              const paymentForThis = Math.min(outstanding, remainingAmount)
              remainingAmount -= paymentForThis

              return {
                ...transaction,
                paid: currentPaid + paymentForThis,
                notes: transaction.notes ? `${transaction.notes}\n${note}` : note,
              }
            })

            return {
              transactions: updatedTransactions,
            }
          })
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
          console.log("Store: Loaded transactions:", result.data.transactions.length, "transactions")
          console.log("Store: Sample transaction:", result.data.transactions[0])
          set({ transactions: result.data.transactions, isLoading: false })
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
        return state.transactions.filter((t) => t.customerId === customerId)
      },

      getCustomerOutstanding: (customerId) => {
        const state = get()
        const transactions = state.transactions.filter((t) => t.customerId === customerId)
        return transactions.reduce((total, t) => {
          const transactionTotal = calculateTransactionTotal(t)
          return total + (transactionTotal - (t.paid || 0))
        }, 0)
      },

      getFilteredCustomers: () => {
        const state = get()
        let filteredCustomers = state.customers

        // Apply search filter
        if (state.searchQuery) {
          filteredCustomers = filteredCustomers.filter(
            (customer) =>
              customer.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
              customer.phone.includes(state.searchQuery) ||
              (customer.email && customer.email.toLowerCase().includes(state.searchQuery.toLowerCase())),
          )
        }

        return filteredCustomers
      },

      getFilteredTransactions: () => {
        const state = get()
        return state.transactions
      },

      getCustomerCylinderBalance: (customerId) => {
        const state = get()
        const customerTransactions = state.transactions.filter((t) => t.customerId === customerId)
        
        let balance = {
          '6kg': 0,
          '13kg': 0,
          '50kg': 0,
        }

        customerTransactions.forEach((transaction) => {
          // CORRECTED FORMULA: Balance = Load - Max Returns - Swipes - Outright
          
          // LOAD (Cylinders given to customer for the day)
          const load6kg = (transaction.maxGas6kgLoad || 0)
          const load13kg = (transaction.maxGas13kgLoad || 0)
          const load50kg = (transaction.maxGas50kgLoad || 0)

          // MAX RETURNS (Our company cylinders returned for refill)
          const maxReturns6kg = (transaction.return6kg || 0)
          const maxReturns13kg = (transaction.return13kg || 0)
          const maxReturns50kg = (transaction.return50kg || 0)

          // SWIPES (Other company cylinders returned)
          const swipes6kg = (transaction.swipeReturn6kg || 0)
          const swipes13kg = (transaction.swipeReturn13kg || 0)
          const swipes50kg = (transaction.swipeReturn50kg || 0)

          // OUTRIGHT (Full cylinders sold - customer keeps these)
          const outright6kg = (transaction.outright6kg || 0)
          const outright13kg = (transaction.outright13kg || 0)
          const outright50kg = (transaction.outright50kg || 0)
          

          
          // CALCULATE BALANCE: Load - Max Returns - Swipes - Outright
          balance['6kg'] += load6kg - maxReturns6kg - swipes6kg - outright6kg
          balance['13kg'] += load13kg - maxReturns13kg - swipes13kg - outright13kg
          balance['50kg'] += load50kg - maxReturns50kg - swipes50kg - outright50kg
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

// Helper function for transaction calculations (moved from calculations.js)
function calculateTransactionTotal(transaction) {
  // MaxGas Refills - Price is per kg
  const refillTotal =
    (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135) +
    (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135) +
    (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)

  // MaxGas Outright - Price is per cylinder
  const outrightTotal =
    (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200) +
    (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500) +
    (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

  // Swipes - Price is per kg
  const swipeTotal =
    (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160) +
    (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160) +
    (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)

  return refillTotal + outrightTotal + swipeTotal
}

// Helper function to calculate outstanding amount
function calculateOutstanding(transaction) {
  const total = calculateTransactionTotal(transaction)
  const paid = transaction.paid || 0
  return total - paid
}
