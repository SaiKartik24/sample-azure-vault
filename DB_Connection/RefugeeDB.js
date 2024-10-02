require('dotenv').config();

const sql = require('mssql');

// Configuration for the MS SQL Server connection
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: parseInt(process.env.DB_PORT, 10) || 1433, // Ensure the port is a number
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
