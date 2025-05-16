require('dotenv').config();

const requiredEnvVars = [
    'PORT',
    'MASTER_DB_URI',
    'JWT_SECRET',
    'CRYPTO_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
];

console.log('Checking environment variables...\n');

let allVarsPresent = true;

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.error(`❌ ${varName} is not set`);
        allVarsPresent = false;
    } else {
        // Mask sensitive values
        const displayValue = varName.includes('SECRET') || varName.includes('CLIENT_SECRET') 
            ? '********' 
            : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
});

console.log('\nEnvironment check complete!');
if (!allVarsPresent) {
    console.error('\n⚠️ Some environment variables are missing. Please check your .env file.');
    process.exit(1);
} else {
    console.log('\n✨ All environment variables are properly configured!');
} 