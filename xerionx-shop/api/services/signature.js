const crypto = require('crypto');

class SignatureService {
  /**
   * Generate a secure signature for Roblox API requests
   * @param {Object} data - The data to sign
   * @param {string} secret - The secret key
   * @returns {string} - The generated signature
   */
  static generateSignature(data, secret) {
    const sortedData = this.sortObjectKeys(data);
    const jsonString = JSON.stringify(sortedData);
    return crypto
      .createHmac('sha256', secret)
      .update(jsonString)
      .digest('hex');
  }

  /**
   * Verify a signature from Roblox API requests
   * @param {Object} data - The received data
   * @param {string} signature - The received signature
   * @param {string} secret - The secret key
   * @returns {boolean} - Whether the signature is valid
   */
  static verifySignature(data, signature, secret) {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Sort object keys alphabetically for consistent signing
   * @param {Object} obj - The object to sort
   * @returns {Object} - The sorted object
   */
  static sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedObj = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    });

    return sortedObj;
  }

  /**
   * Generate a unique verification code for account linking
   * @returns {string} - A 6-character alphanumeric code
   */
  static generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars
    let code = '';
    const randomBytes = crypto.randomBytes(6);
    
    for (let i = 0; i < 6; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    
    return code;
  }

  /**
   * Generate a secure license key
   * @param {string} prefix - Optional prefix for the key
   * @returns {string} - The generated license key
   */
  static generateLicenseKey(prefix = 'XERIONX') {
    const segment = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${segment.match(/.{1,4}/g).join('-')}`;
  }

  /**
   * Hash sensitive data
   * @param {string} data - The data to hash
   * @returns {string} - The hashed data
   */
  static hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a unique transaction ID
   * @returns {string} - The generated transaction ID
   */
  static generateTransactionId() {
    return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

module.exports = SignatureService;
