// Centralized Calculation Hub for Gas Cylinder Transactions
// This ensures all calculations use the same formulas across the application

/**
 * Calculate total returns for a specific cylinder size
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {string} size - The cylinder size (kg6, kg13, kg50)
 * @returns {number} Total returns for the size
 */
export function calculateTotalReturnsForSize(returnsBreakdown, size) {
  if (!returnsBreakdown) return 0;
  
  const maxEmpty = returnsBreakdown.max_empty?.[size] || 0;
  const swapEmpty = returnsBreakdown.swap_empty?.[size] || 0;
  const returnFull = returnsBreakdown.return_full?.[size] || 0;
  
  return maxEmpty + swapEmpty + returnFull;
}

/**
 * Calculate total returns across all sizes
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @returns {number} Total returns
 */
export function calculateTotalReturns(returnsBreakdown) {
  if (!returnsBreakdown) return 0;
  
  const kg6 = calculateTotalReturnsForSize(returnsBreakdown, 'kg6');
  const kg13 = calculateTotalReturnsForSize(returnsBreakdown, 'kg13');
  const kg50 = calculateTotalReturnsForSize(returnsBreakdown, 'kg50');
  
  return kg6 + kg13 + kg50;
}

/**
 * Calculate total outright for a specific cylinder size
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @param {string} size - The cylinder size (kg6, kg13, kg50)
 * @returns {number} Total outright for the size
 */
export function calculateTotalOutrightForSize(outrightBreakdown, size) {
  if (!outrightBreakdown) return 0;
  return outrightBreakdown[size] || 0;
}

/**
 * Calculate total outright across all sizes
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @returns {number} Total outright
 */
export function calculateTotalOutright(outrightBreakdown) {
  if (!outrightBreakdown) return 0;
  
  const kg6 = calculateTotalOutrightForSize(outrightBreakdown, 'kg6');
  const kg13 = calculateTotalOutrightForSize(outrightBreakdown, 'kg13');
  const kg50 = calculateTotalOutrightForSize(outrightBreakdown, 'kg50');
  
  return kg6 + kg13 + kg50;
}

/**
 * Calculate total load for a specific cylinder size (returns + outright)
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @param {string} size - The cylinder size (kg6, kg13, kg50)
 * @returns {number} Total load for the size
 */
export function calculateTotalLoadForSize(returnsBreakdown, outrightBreakdown, size) {
  const returns = calculateTotalReturnsForSize(returnsBreakdown, size);
  const outright = calculateTotalOutrightForSize(outrightBreakdown, size);
  return returns + outright;
}

/**
 * Calculate total load across all sizes
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @returns {number} Total load
 */
export function calculateTotalLoad(returnsBreakdown, outrightBreakdown) {
  const kg6 = calculateTotalLoadForSize(returnsBreakdown, outrightBreakdown, 'kg6');
  const kg13 = calculateTotalLoadForSize(returnsBreakdown, outrightBreakdown, 'kg13');
  const kg50 = calculateTotalLoadForSize(returnsBreakdown, outrightBreakdown, 'kg50');
  
  return kg6 + kg13 + kg50;
}

/**
 * Calculate cylinder balance for a specific size
 * @param {number} load - Cylinders given to customer
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @param {string} size - The cylinder size (kg6, kg13, kg50)
 * @returns {number} Cylinder balance for the size
 */
export function calculateCylinderBalanceForSize(load, returnsBreakdown, outrightBreakdown, size) {
  const returns = calculateTotalReturnsForSize(returnsBreakdown, size);
  const outright = calculateTotalOutrightForSize(outrightBreakdown, size);
  return load - returns - outright;
}

/**
 * Calculate cylinder balance across all sizes
 * @param {Object} loadBreakdown - The load breakdown object
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @returns {Object} Cylinder balance object with individual sizes and total
 */
export function calculateCylinderBalance(loadBreakdown, returnsBreakdown, outrightBreakdown) {
  const kg6 = calculateCylinderBalanceForSize(loadBreakdown?.kg6 || 0, returnsBreakdown, outrightBreakdown, 'kg6');
  const kg13 = calculateCylinderBalanceForSize(loadBreakdown?.kg13 || 0, returnsBreakdown, outrightBreakdown, 'kg13');
  const kg50 = calculateCylinderBalanceForSize(loadBreakdown?.kg50 || 0, returnsBreakdown, outrightBreakdown, 'kg50');
  
  return {
    kg6,
    kg13,
    kg50,
    total: kg6 + kg13 + kg50
  };
}

/**
 * Calculate financial bill from returns and outright
 * @param {Object} returnsBreakdown - The returns breakdown object
 * @param {Object} outrightBreakdown - The outright breakdown object
 * @returns {number} Total bill amount
 */
export function calculateTotalBill(returnsBreakdown, outrightBreakdown) {
  if (!returnsBreakdown || !outrightBreakdown) return 0;
  
  // Max Empty returns: count * price * kg
  const maxEmptyTotal = 
    (returnsBreakdown.max_empty?.kg6 || 0) * (returnsBreakdown.max_empty?.price6 || 0) * 6 +
    (returnsBreakdown.max_empty?.kg13 || 0) * (returnsBreakdown.max_empty?.price13 || 0) * 13 +
    (returnsBreakdown.max_empty?.kg50 || 0) * (returnsBreakdown.max_empty?.price50 || 0) * 50;
  
  // Swap Empty returns: count * price * kg
  const swapEmptyTotal = 
    (returnsBreakdown.swap_empty?.kg6 || 0) * (returnsBreakdown.swap_empty?.price6 || 0) * 6 +
    (returnsBreakdown.swap_empty?.kg13 || 0) * (returnsBreakdown.swap_empty?.price13 || 0) * 13 +
    (returnsBreakdown.swap_empty?.kg50 || 0) * (returnsBreakdown.swap_empty?.price50 || 0) * 50;
  
  // Outright purchases: count * price
  const outrightTotal = 
    (outrightBreakdown.kg6 || 0) * (outrightBreakdown.price6 || 0) +
    (outrightBreakdown.kg13 || 0) * (outrightBreakdown.price13 || 0) +
    (outrightBreakdown.kg50 || 0) * (outrightBreakdown.price50 || 0);
  
  return maxEmptyTotal + swapEmptyTotal + outrightTotal;
}

/**
 * Calculate financial balance
 * @param {number} totalBill - Total bill amount
 * @param {number} amountPaid - Amount paid
 * @returns {number} Financial balance
 */
export function calculateFinancialBalance(totalBill, amountPaid) {
  return totalBill - (amountPaid || 0);
}

/**
 * Calculate transaction total (legacy function for backward compatibility)
 * @param {Object} transaction - Transaction object
 * @returns {number} Total bill amount
 */
export function calculateTransactionTotal(transaction) {
  if (!transaction) return 0;
  const returnsBreakdown = transaction.returns_breakdown || {};
  const outrightBreakdown = transaction.outright_breakdown || {};
  return calculateTotalBill(returnsBreakdown, outrightBreakdown);
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Ksh 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
