var express = require('express');
var router = express.Router();
const user = require('../BusinessLogic/RefugeeApi');
const Messages = require('../BusinessLogic/ChatApis');
const { verifyJwt } = require('../VerifyJWT');




// User APi Routes
router.post('/Register', user.postRefugee);
router.post('/Login', user.loginRefugee);
router.get('/getUserByRoleID',user.getAllRefugeesByRoleAndId);


// Chat Api Routes
router.post('/sendMessages', Messages.postChatMessage);
router.get('/getMessages', Messages.getChatConversation);



module.exports = router;
