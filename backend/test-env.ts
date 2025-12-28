import { env } from './src/config/env.js';
console.log('✅ Env loaded successfully');
console.log('JWT_SECRET length:', env.JWT_SECRET.length);
