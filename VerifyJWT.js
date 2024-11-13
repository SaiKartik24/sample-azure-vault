

const jwt = require('jsonwebtoken');
const secretKey = "Hema";


const verifyJwt = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).send({ status: false, message: "Token required" });
    }

    jwt.verify(token, 'Hema', (err, user) => {  // Ensure 'Hema' is the same secret used when generating the token
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.status(403).send({ status: false, message: "Invalid token or token expired" });
        }
        req.data = user;
        next();
    });
};


// const verifyJwt = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader) return res.status(401).json({ message: 'Access token is missing!' });

//     const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

//     jwt.verify(token, secretKey, (err, decoded) => {
//         if (err) return res.status(403).json({ message: 'Token is invalid or expired!' });

//         const currentTime = Math.floor(Date.now() / 1000); // in seconds
//         const timeLeft = decoded.exp - currentTime;

//         if (timeLeft < 300) { // Less than 5 minutes
//             const newToken = jwt.sign({ data: decoded.data }, secretKey, { expiresIn: '1h' });
//             res.setHeader('Authorization', newToken);
//         }

//         req.user = decoded.data; // Attach user data to request
//         next();
//     });
// };


module.exports = {verifyJwt };