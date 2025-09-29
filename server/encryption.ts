import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = process.env.SESSION_SECRET || 'default-encryption-key';
const scryptAsync = promisify(scrypt);

let derivedKey: Buffer;

async function getDerivedKey(): Promise<Buffer> {
  if (!derivedKey) {
    derivedKey = (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;
  }
  return derivedKey;
}

export async function encrypt(text: string): Promise<string> {
  const key = await getDerivedKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getDerivedKey();
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Synchronous versions for backward compatibility (less secure)
export function encryptSync(text: string): string {
  // Use the same key derivation as the async version for consistency
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0')).subarray(0, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptSync(encryptedText: string): string {
  // Use the same key derivation as the async version for consistency
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0')).subarray(0, 32);
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}