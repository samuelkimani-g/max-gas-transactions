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

export function calculateTransactionTotal(transaction) {
  if (!transaction) return 0

  // MaxGas Refills (Returns) - Price is per kg
  const refill6kg = (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135)
  const refill13kg = (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135)
  const refill50kg = (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)

  // MaxGas Outright Sales (Full cylinders) - Price is per cylinder
  const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
  const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
  const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

  // Other Company Swipes - Price is per kg
  const swipe6kg = (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160)
  const swipe13kg = (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160)
  const swipe50kg = (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)

  return (
    refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
  )
}

export function calculateOutstanding(transaction) {
  const total = calculateTransactionTotal(transaction)
  const paid = transaction.paid || 0
  return total - paid
}
