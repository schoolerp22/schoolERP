/**
 * Utility functions for holiday management
 */

/**
 * Checks if a given date is a holiday
 * @param {Date|string} date - The date to check
 * @param {Array} holidays - Array of holiday objects from DB
 * @returns {Object|null} - The holiday object if found, otherwise null
 */
export const checkIsHoliday = (date, holidays = []) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // 1. Check for Sundays
    if (checkDate.getDay() === 0) {
        return {
            name: "Sunday",
            type: "Weekly",
            isWeekly: true
        };
    }

    // 2. Check for Manual Holidays in DB
    for (const holiday of holidays) {
        const start = new Date(holiday.start_date);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(holiday.end_date || holiday.start_date);
        end.setHours(23, 59, 59, 999);

        if (checkDate >= start && checkDate <= end) {
            return holiday;
        }
    }

    return null;
};

/**
 * Calculates total school days in a range, excluding holidays and Sundays
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @param {Array} holidays - Array of holiday objects from DB
 * @returns {number}
 */
export const calculateExpectedSchoolDays = (startDate, endDate, holidays = []) => {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    current.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
        if (!checkIsHoliday(current, holidays)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};
