"use client"

import { useEffect } from "react"
import EnhancedCustomerDetail from "./enhanced-customer-detail"

export default function CustomerDetail({ customerId, onBack }) {
  useEffect(() => {
    console.log("CustomerDetail component rendered with customerId:", customerId)
  }, [customerId])

  // Validate props
  if (!customerId) {
    console.error("CustomerDetail: customerId is required")
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Error: Customer ID is missing</h2>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!onBack || typeof onBack !== "function") {
    console.error("CustomerDetail: onBack function is required")
  }

  return <EnhancedCustomerDetail customerId={customerId} onBack={onBack} />
}
