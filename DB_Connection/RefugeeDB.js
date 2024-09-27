const sql = require('mssql');

// Configuration for the MS SQL Server connection
const config = {
    user: 'na-app-user', // SQL Server username
    password: 'Miracle#123', // SQL Server password
    server: 'newamericans-app.database.windows.net', // Use your server's IP address or hostname (e.g., 'localhost' for local development)
    database: 'na-app', // Your database name
    options: {
        trustServerCertificate: true, // For development environments with self-signed certs
        enableArithAbort: true, // Ensures compatibility for certain environments
    },
    port: 1433 // Default port for MS SQL Server
};

// Connect to the database
sql.connect(config)
    .then(pool => {
        console.log("MS SQL Database connected successfully!");
        return pool; // Use the pool for subsequent queries
    })
    .catch(err => {
        console.error("Error connecting to the database:", err);
    });

module.exports = sql;
