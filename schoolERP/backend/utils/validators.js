/**
 * Helper to check if a value is a valid number
 * @param {any} value - The value to check
 * @returns {boolean}
 */
export const isValidNumber = (value) => {
    return typeof value === 'number' && !isNaN(value);
};

/**
 * Validates basic accounting fields
 * @param {Object} data 
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateFeeSetup = (data) => {
    const { className, feeHeads } = data;

    if (!className || typeof className !== 'string') {
        return { isValid: false, message: "Valid className is required" };
    }

    if (feeHeads && !Array.isArray(feeHeads)) {
        return { isValid: false, message: "feeHeads must be an array" };
    }

    return { isValid: true };
};

export const validatePayment = (data) => {
    const { studentId, amount, paymentMode, months } = data;

    if (!studentId) return { isValid: false, message: "studentId is required" };
    if (!isValidNumber(amount) || amount <= 0) return { isValid: false, message: "Amount must be a positive number" };

    const validModes = ['Cash', 'Online', 'Card', 'UPI', 'Cheque', 'Cash with Bank Details'];
    if (!paymentMode || !validModes.includes(paymentMode)) {
        return { isValid: false, message: `paymentMode must be one of: ${validModes.join(', ')}` };
    }

    if (!months || !Array.isArray(months) || months.length === 0) {
        return { isValid: false, message: "At least one month must be selected for payment" };
    }

    return { isValid: true };
};
