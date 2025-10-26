#!/usr/bin/env node

// Generate bcrypt hash for admin password
import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Admin@123';

const hash = await bcrypt.hash(password, 10);

console.log('========================================');
console.log('Bcrypt Hash Generated');
console.log('========================================');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('========================================');
console.log('\nUse this hash in your SQL INSERT statement.');
