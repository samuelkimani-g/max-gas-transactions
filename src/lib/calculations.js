export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

// SOLUTION 1: Load-First Calculation System
export function calculateLoadDebt(transaction) {
  if (!transaction) return 0

  // Calculate total debt from load (cylinders taken)
  const load6kg = (transaction.maxGas6kgLoad || 0) * (transaction.refillPrice6kg || 135)
  const load13kg = (transaction.maxGas13kgLoad || 0) * (transaction.refillPrice13kg || 135)
  const load50kg = (transaction.maxGas50kgLoad || 0) * (transaction.refillPrice50kg || 135)

  return load6kg + load13kg + load50kg
}

export function calculateCredits(transaction) {
  if (!transaction) return 0

  // MaxGas Returns (customer's own cylinders) - Credits at refill price
  const returnCredits = 
    (transaction.return6kg || 0) * (transaction.refillPrice6kg || 135) +
    (transaction.return13kg || 0) * (transaction.refillPrice13kg || 135) +
    (transaction.return50kg || 0) * (transaction.refillPrice50kg || 135)

  // Outright purchases (new cylinders bought) - Credits at outright price
  const outrightCredits = 
    (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 2200) +
    (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 4400) +
    (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8000)

  // Swipes (other company cylinders) - Credits at swipe price
  const swipeCredits = 
    (transaction.swipeReturn6kg || 0) * (transaction.swipeRefillPrice6kg || 160) +
    (transaction.swipeReturn13kg || 0) * (transaction.swipeRefillPrice13kg || 160) +
    (transaction.swipeReturn50kg || 0) * (transaction.swipeRefillPrice50kg || 160)

  // Cash payment credits
  const cashCredits = transaction.paid || 0

  return returnCredits + outrightCredits + swipeCredits + cashCredits
}

// Updated function using Load-First approach
export function calculateTransactionTotal(transaction) {
  if (!transaction) return 0;
  // Refills (Max Empty and Swap Empty): count * price (removed kg multiplication)
  const refill6kg = ((transaction.returns_breakdown?.max_empty?.kg6 || 0) + (transaction.returns_breakdown?.swap_empty?.kg6 || 0)) * (transaction.returns_breakdown?.max_empty?.price6 || 135);
  const refill13kg = ((transaction.returns_breakdown?.max_empty?.kg13 || 0) + (transaction.returns_breakdown?.swap_empty?.kg13 || 0)) * (transaction.returns_breakdown?.max_empty?.price13 || 135);
  const refill50kg = ((transaction.returns_breakdown?.max_empty?.kg50 || 0) + (transaction.returns_breakdown?.swap_empty?.kg50 || 0)) * (transaction.returns_breakdown?.max_empty?.price50 || 135);
  // Outright: count * price
  const outright6kg = (transaction.outright_breakdown?.kg6 || 0) * (transaction.outright_breakdown?.price6 || 2200);
  const outright13kg = (transaction.outright_breakdown?.kg13 || 0) * (transaction.outright_breakdown?.price13 || 4400);
  const outright50kg = (transaction.outright_breakdown?.kg50 || 0) * (transaction.outright_breakdown?.price50 || 8000);
  return refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg;
}

// Updated outstanding calculation using Load-First approach
export function calculateOutstanding(transaction) {
  if (!transaction) return 0
  
  const loadDebt = calculateLoadDebt(transaction)
  const totalCredits = calculateCredits(transaction)
  
  // Outstanding = Load Debt - Total Credits
  return loadDebt - totalCredits
}

// Cylinder accountability functions
export function calculateCylinderBalance(transaction) {
  if (!transaction) return { taken: 0, returned: 0, discrepancy: 0 }

  const taken = 
    (transaction.maxGas6kgLoad || 0) + 
    (transaction.maxGas13kgLoad || 0) + 
    (transaction.maxGas50kgLoad || 0)

  const returned = 
    (transaction.return6kg || 0) + 
    (transaction.return13kg || 0) + 
    (transaction.return50kg || 0) +
    (transaction.outright6kg || 0) + 
    (transaction.outright13kg || 0) + 
    (transaction.outright50kg || 0) +
    (transaction.swipeReturn6kg || 0) + 
    (transaction.swipeReturn13kg || 0) + 
    (transaction.swipeReturn50kg || 0)

  return {
    taken,
    returned,
    discrepancy: taken - returned
  }
}

// Legacy function for backward compatibility (OLD SYSTEM)
export function calculateTransactionTotalOld(transaction) {
  if (!transaction) return 0

  // OLD SYSTEM: Only calculated from returns/outright/swipes
  const refill6kg = (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135)
  const refill13kg = (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135)
  const refill50kg = (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)

  const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
  const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
  const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

  const swipe6kg = (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160)
  const swipe13kg = (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160)
  const swipe50kg = (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)

  return (
    refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
  )
}
