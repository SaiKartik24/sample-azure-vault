const https = require('https');
require('dotenv').config();
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Azure Key Vault setup
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const credential = new DefaultAzureCredential();
const client = new SecretClient(`https://na-s.vault.azure.net/`, credential, {
    pipelineOptions: {
        httpClientOptions: { agent: httpsAgent }
    }
});

// Retrieve secrets from Azure Key Vault
async function getDatabaseSecrets() {
    const secretNames = ['db-user', 'db-password', 'db-server', 'db-database','db-port'];
    const secrets = {};

    for (const name of secretNames) {
        try {
            const secret = await client.getSecret(name);
            secrets[name] = secret.value;
            console.log(`Retrieved ${name}: ${secret.value}`); // Temporary log
        } catch (error) {
            console.error(`Failed to get secret ${name}:`, error.message);
        }
    }

    return secrets;
}

// Initialize database connection pool with Key Vault secrets
let pool; // Declare a variable to hold the pool

async function initializeDatabaseConnection() {
    try {
        const secrets = await getDatabaseSecrets();

        if (!secrets["db-user"] || !secrets["db-password"] || !secrets["db-server"] || !secrets["db-database"] || !secrets["db-port"]) {
            throw new Error("Missing one or more secrets from Key Vault");
        }

        const config = {
            user: secrets["db-user"],
            password: secrets["db-password"],
            server: secrets["db-server"],
            database: secrets["db-database"],
            port:parseInt(secrets["db-port"], 10),
            options: {
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            pool: {
                min: 0,   // Minimum number of connections in the pool
                max: 10,  // Maximum number of connections in the pool
                idleTimeoutMillis: 30000 // Time (in ms) before idle connections are closed
            }
        };

        // Create a connection pool
        pool = await sql.connect(config);
        console.log("MS SQL Database connected successfully!");
    } catch (err) {
        console.error("Error connecting to the database:", err);
    }
}

// Call the function to initialize the database connection
initializeDatabaseConnection();

// Export the sql module as is
module.exports = sql;

// Optional: Provide a method to get the connection pool
module.exports.getPool = () => {
    if (!pool) {
        throw new Error("Database connection pool not initialized.");
    }
    return pool;
};
