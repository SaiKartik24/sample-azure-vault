var sql = require("../DB_Connection/RefugeeDB");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET;

const postRefugee = async (req, res) => {
    try {
        const { firstName, lastName, email, password, dateOfBirth, age, gender, phoneNumber, countryOfOrigin, currentLocation, language, role } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !dateOfBirth || !gender || !countryOfOrigin || !currentLocation || !language || !role) {
            return res.status(400).json({ statusCode: 400, message: 'Missing required fields' });
        }

        // Validate gender
        if (!['Male', 'Female', 'Other'].includes(gender)) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid gender. Must be either "Male", "Female", or "Other".' });
        }

        // Validate role
        if (!['Case Agent', 'Refugee', 'Admin'].includes(role)) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid role. Must be either "Case Agent" or "Refugee".' });
        }

        // Check if email already exists
        const pool = await sql.connect(); // Reuse your connection pool from config
        const emailCheckQuery = 'SELECT * FROM Users_Registration WHERE email = @email';
        const emailExists = await pool.request()
            .input('email', sql.VarChar, email)
            .query(emailCheckQuery);

        if (emailExists.recordset.length > 0) {
            return res.status(400).json({ statusCode: 400, message: 'Email already exists' });
        }

        // Check if phone number exists
        if (phoneNumber) {
            const phoneCheckQuery = 'SELECT * FROM Users_Registration WHERE phoneNumber = @phoneNumber';
            const phoneExists = await pool.request()
                .input('phoneNumber', sql.VarChar, phoneNumber)
                .query(phoneCheckQuery);

            if (phoneExists.recordset.length > 0) {
                return res.status(400).json({ statusCode: 400, message: 'Phone number already exists' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new refugee data
        const insertQuery = `
            INSERT INTO Users_Registration 
            (firstName, lastName, email, password, dateOfBirth, age, gender, phoneNumber, countryOfOrigin, currentLocation, language, role, createdAt, updatedAt)
            VALUES 
            (@firstName, @lastName, @email, @password, @dateOfBirth, @age, @gender, @phoneNumber, @countryOfOrigin, @currentLocation, @language, @role, GETDATE(), GETDATE())
        `;

        await pool.request()
            .input('firstName', sql.VarChar, firstName)
            .input('lastName', sql.VarChar, lastName)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('dateOfBirth', sql.Date, dateOfBirth)
            .input('age', sql.Int, age)
            .input('gender', sql.VarChar, gender)
            .input('phoneNumber', sql.VarChar, phoneNumber)
            .input('countryOfOrigin', sql.VarChar, countryOfOrigin)
            .input('currentLocation', sql.VarChar, currentLocation)
            .input('language', sql.VarChar, language)
            .input('role', sql.VarChar, role)
            .query(insertQuery);

        res.status(201).json({ statusCode: 201, message: 'Client registered successfully' });

    } catch (error) {
        console.error("Error in postRefugee:", error);
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
};

const loginRefugee = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input fields
        if (!email || !password) {
            return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });
        }

        // Get a connection pool and run the query
        const pool = await sql.connect(); // Make sure pool is connected

        // Query the MSSQL database to find the user by email
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users_Registration WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid email or password' });
        }

        const refugee = result.recordset[0];

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, refugee.password);
        if (!isMatch) {
            return res.status(400).json({ statusCode: 400, message: 'Invalid email or password' });
        }

        // Generate Access Token (Short-lived)
        const accessToken = jwt.sign(
            {
                id: refugee.UserId,
                email: refugee.email,
                role: refugee.role,
                firstName: refugee.firstName,
                lastName: refugee.lastName,
            },
            'Hema',
            { expiresIn: '1h' }
        );


        // Send the response with both tokens
        res.status(200).json({
            statusCode: 200,
            message: 'Login successful',
            accessToken,

        });

    } catch (error) {
        console.error("Error in loginRefugee:", error);
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
};

const getAllRefugeesByRoleAndId = async (req, res) => {
    try {
        const userRole = req.data?.role; // Extract user role from token data
        const userId = req.data?.UserId; // Extract userId from token data

        // Check if the user is a Refugee and deny access
        if (userRole === 'Refugee') {
            return res.status(403).send({ message: "Forbidden: Refugees are not allowed to access this data", success: false });
        }

        // Get the role and UserId from query parameters
        const { role, UserId } = req.query;

        // Initialize the base query and parameters
        let query = 'SELECT * FROM Users_Registration WHERE 1=1'; // Changed to "WHERE 1=1" for easier dynamic querying
        const queryParams = [];

        // Handle access based on roles
        if (userRole === 'Case Agent') {
            // Case agents can only see refugees
            query += ' AND role = @role';
            queryParams.push({ name: 'role', type: sql.VarChar, value: 'Refugee' });
        } else if (userRole === 'Admin') {
            // Admins can filter by role if provided
            if (role) {
                if (!['Case Agent', 'Refugee', 'Admin'].includes(role)) {
                    return res.status(400).json({ statusCode: 400, message: 'Invalid role. Must be either "Case Agent", "Refugee", or "Admin".' });
                }
                query += ' AND role = @role';
                queryParams.push({ name: 'role', type: sql.VarChar, value: role });
            }
        }

        // Validate and append the UserId to the query if provided
        if (UserId) {
            if (isNaN(UserId)) {
                return res.status(400).json({ statusCode: 400, message: 'Invalid UserId format. Must be a number.' });
            }
            query += ' AND UserId = @UserId';
            queryParams.push({ name: 'UserId', type: sql.Int, value: parseInt(UserId, 10) });
        }

        // Get a connection pool
        const pool = await sql.connect(); // Ensure you're using the correct connection pool
        const request = pool.request();

        // Add parameters to the request
        queryParams.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        // Execute the query
        const result = await request.query(query);
        console.log(result, 'result');

        // Send a success response with the list of users/refugees
        res.status(200).json({
            statusCode: 200,
            message: 'Users fetched successfully',
            users: result.recordset
        });

    } catch (error) {
        console.error("Error in getAllRefugeesByRoleAndId:", error);
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
};






module.exports = { postRefugee, loginRefugee, getAllRefugeesByRoleAndId, };
