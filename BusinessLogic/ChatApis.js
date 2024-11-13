const sql = require('mssql');
var pool = require("../DB_Connection/RefugeeDB");

const postChatMessage = async (req, res) => {
    try {
        // Extract data from the request body
        const { caseAgentId, refugeeId, sender, message } = req.body;

        // Validate the required fields
        if (!caseAgentId || !refugeeId || !sender || !message) {
            return res.status(400).json({ statusCode: 400, message: 'Missing required fields' });
        }

        // Ensure sender is one of the participants
        if (![caseAgentId, refugeeId].includes(sender)) {
            return res.status(400).json({ statusCode: 400, message: 'Sender is not part of this conversation' });
        }

        // Prepare the SQL query with named parameters
        const query = `
            INSERT INTO Messages (Case_Agent_Id, Refugee_Id, Sender_Id, Message)
            VALUES (@caseAgentId, @refugeeId, @sender, @message)
        `;

        // Execute the query using MS SQL Server's syntax
        const pool = await sql.connect(config); // Assuming `config` is defined and contains DB connection info
        
        const result = await pool.request()
            .input('caseAgentId', sql.Int, caseAgentId)
            .input('refugeeId', sql.Int, refugeeId)
            .input('sender', sql.Int, sender)
            .input('message', sql.Text, message)
            .query(query);

        // Send a success response with the inserted message
        res.status(201).json({
            statusCode: 201,
            message: 'Message added successfully',
            messageId: result.recordset.insertId, // Return the ID of the inserted message
            caseAgentId,
            refugeeId,
            sender,
            message,
            timestamp: new Date().toISOString() // Include the timestamp
        });
    } catch (error) {
        console.error("Error in postChatMessage:", error);
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
};

const getChatConversation = async (req, res) => {
    try {
        // Extract data from the query parameters
        const { caseAgentId, refugeeId } = req.query;

        // Validate the required fields
        if (!caseAgentId || !refugeeId) {
            return res.status(400).json({ statusCode: 400, message: 'Missing required query parameters' });
        }

        // Query to find all messages between the case agent and refugee
        const query = `
            SELECT * FROM Messages
            WHERE Case_Agent_Id = ? AND Refugee_Id = ?
            ORDER BY timestamp ASC
        `;
        const queryParams = [caseAgentId, refugeeId];

        // Execute the query
        const [results] = await pool.query(query, queryParams);

        // Check if any messages were found
        if (results.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Conversation not found' });
        }

        // Format the conversation similar to the MongoDB response format
        const formattedConversation = {
            caseAgentId,
            refugeeId,
            conversation: results.map(row => ({
                sender: row.Sender_Id,
                message: row.Message,
                _id: row.Message_Id,
                timestamp: row.timestamp.toISOString()
            }))
        };

        // Send a success response with the formatted conversation data
        res.status(200).json({
            statusCode: 200,
            message: 'Conversation retrieved successfully',
            conversation: formattedConversation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
};


module.exports = {postChatMessage, getChatConversation};
