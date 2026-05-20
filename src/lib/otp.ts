/**
 * Generates a random 6-digit OTP code.
 * 
 * @returns {string} A 6-digit numeric string
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculates the expiration date for an OTP.
 * Default is 10 minutes from now.
 * 
 * @param {number} minutes - Minutes until expiration
 * @returns {Date} Expiration Date object
 */
export function getOtpExpiration(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

