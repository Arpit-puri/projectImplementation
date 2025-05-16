const crypto = require('crypto');

// Validate environment variable
if (!process.env.CRYPTO_SECRET) {
  throw new Error('CRYPTO_SECRET is not properly configured in .env file');
}
const algorithm = 'aes-256-cbc';
// Generate key using the crypto secret
const key = crypto.scryptSync(process.env.CRYPTO_SECRET, 'salt', 32); // 32 bytes = 256 bits
const iv = crypto.randomBytes(16); // Better to use random IV for each encryption

function encrypt(text) {
  if (!text) throw new Error('No text provided for encryption');
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Store IV with the encrypted text (IV doesn't need to be secret)
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!encryptedText) throw new Error('No text provided for decryption');
  
  const [ivHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };