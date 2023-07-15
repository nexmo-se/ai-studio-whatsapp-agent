const utils = require('./utils');
const express = require('express');
var cors = require('cors')
const low = require('lowdb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.static("express"));
const axios = require("axios");
const { encrypt, decrypt} = require('./EncryptionHandler')

const webSocketServerPort = process.env.PORT || 3002;
const webSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer(app);
server.listen(webSocketServerPort, () => {
    console.log('server started on port', webSocketServerPort);
});

const wsServer = new webSocketServer({
    httpServer: server
})
let clients = {};
const validRegion = ["us", "eu"]
let gnids = utils.getIniStuff(); 

// Use JSON file for storage
const FileSync = require('lowdb/adapters/FileSync');
const adaptor = new FileSync('db.json')
const db = low(adaptor)
db.defaults({ users: []})
  .write()

wsServer.on('request', function(request) {
    console.log(`${(new Date())} received a new connection from ${request.origin}`)
    // Acccept all request, can set to accept only specific origin
    const connection = request.accept(null, request.origin)
    const jwt = request.resourceURL.query.jwt
    let userId = getId(jwt)
    console.log("ws request", userId)
    if (userId != -1) {
        clients[userId] = connection
        console.log(`set connection ${userId}`)
        disconnectSessions(userId)

        // Check if db has userId exist
        const existingUser = db.get("users").find({"userId": userId}).value()
        if (existingUser && existingUser["hashedApiKey"]) {
            broadcast(userId, {userId})
        }
    }
})

// default URL for website
app.use(express.static(path.join(__dirname, "../build")));

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname, "../build/index.html"));
});

app.post('/addAIStudioKey', async function(req,res){
    const {jwt, apiKey} = req.body

    if (!jwt || !apiKey) {
        return res.sendStatus(501)
    }

    const hashedApiKey = encrypt(apiKey)
    let userId = getId(jwt)

    if (userId !== -1) {
        const existingUser = db.get("users").find({"userId": userId}).value()
        // add hashed APIKey to DB
        if (existingUser) {
            await db.get('users')
            .find({ userId })
            .assign({hashedApiKey})
            .write();
        }
        else {
            await db.get('users')
            .push({
                'userId': userId,
                'hashedApiKey': hashedApiKey
            })
            .write()
        }
        res.json({userId})
    }
    else {
        res.sendStatus(501)
    }
});

app.post('/pastMessages/:userId', async function(req,res){
    console.log("post pass message", req.body)
    const userId = req.params.userId
    const {sessionId} = req.body

    if (!userId || !sessionId) {
        console.log("missin userid ", userId, "or session id ", sessionId)
        return res.sendStatus(200);
    }

    let region = 'us'
    if (req.query.region && validRegion.includes(req.query.region)) {
        region = req.query.region
    }
    const history = req.body.history
    const transcription = history.transcription;

    const data = {sessionId, isActive: true, region};
    history.parameters.forEach((param) => {
        if (param.name === "PROFILE_NAME") data["sender"] = param.value;
        if (param.name === "AGENT_PHONE_NUMBER") data["agentPhoneNumber"] = param.value;
        if (param.name === "CONVERSATION_START_DATE") data["startDate"] = param.value;
        if (param.name === "CONVERSATION_START_TIME") data["startTime"] = param.value;
        if (param.name === "SENDER_PHONE_NUMBER") data["senderPhoneNumber"] = param.value;
    })
    data["message"] = transcription

    const existingUser = db.get("users").find({"userId": userId}).value()
    // add hashed APIKey to DB
    if (existingUser) {
        if (!existingUser[region]) {
            await db.get('users')
            .find({ userId })
            .push({ [region]: [sessionId] })
            .write();
        }
        else if (!existingUser[region].includes(sessionId)) {
            let sessionData = existingUser[region].push(sessionId)
            await db.get('users')
            .find({ userId })
            .push({ [region]: sessionData })
            .write();
        }     
    }
    broadcast(userId, data)
    
    res.sendStatus(200)
});

app.post('/currentMessage/:userId', async function(req,res){
    console.log("post current message", req.body)
    const {sessionId, type, text} = req.body
    const userId = req.params.userId
    if (!userId || !sessionId || !type) {
        return res.sendStatus(200);
    }

    let messageContent = text
    
    switch(type) {
        case 'image':
            if (req.body.image) {
                messageContent = req.body.image.url
            }
            break;
        case 'video':
            if (req.body.video) {
                messageContent = req.body.video.url
            }
            break;
        case 'file':
            if (req.body.file) {
                messageContent = req.body.file.url
            }
            break;
        default:
            break;
    }

    const chatMessage = {
        sessionId,
        messageType: type,
        message: {User: messageContent}
    }

    broadcast(userId, chatMessage)

    res.sendStatus(200);
});

app.post('/disconnect/:userId', async function(req, res) {
    const {region, sessionId} = req.body
    const userId = req.params.userId
    if (!userId || !region || !sessionId) {
        return res.sendStatus(501)
    }

    const userData =  db.get('users').find({ userId }).value()
    if (!userData || !userData["hashedApiKey"]) {
        return res.sendStatus(501)
    }

    const url = `https://studio-api-${region}.ai.vonage.com/live-agent/disconnect/${sessionId}`
	try {
		await axios.post(url, {}, {
            headers: {
                "X-Vgai-Key" : decrypt(userData["hashedApiKey"])
            }
        });
		res.json({err: null});
	} catch (err) {
        if (err.response.data.statusCode === 404) {
            console.log("disconnect: session id not found")
        }
        res.json({err});
	}
})

app.post('/sendMessage/:userId', async function(req, res) {
    const {sessionId, region, messageType, messageText} = req.body
    const userId = req.params.userId
    if (!userId || !region || !sessionId || !messageType || !messageText) return res.sendStatus(501)

    const userData =  db.get('users').find({ userId }).value()
    if (!userData || !userData["hashedApiKey"]) return res.status(501).send()

    const url = `https://studio-api-${region}.ai.vonage.com/live-agent/outbound/${sessionId}`
    
    let message = {
        "message_type": messageType,
        "text": messageText
    }

	try {
		await axios.post(url, message, {
            headers: {
                "Content-Type": "application/json",
                "X-Vgai-Key" : decrypt(userData["hashedApiKey"])
            }
        });

        const chatMessage = {
            sessionId,
            message: {Agent: messageText}
        }

		res.json({chatMessage, err: null});
	} catch (err) {
        console.log("send message err ", err)
        res.json({err: err});
	}
})

function getId(jwt) {
    let id = utils.getIdFromJWT(gnids, jwt);
    // let id = parseJwt(jwt);
    if (id <= 0) {
      return -1;
    }
    return id;
}

function broadcast(userId, data) {
    clients[userId].send(JSON.stringify(data)); 
}

function disconnectSessions(userId) {
    //Disconnect all session
    const dbData = db.get('users').find({ userId }).value()
    if (!dbData || !dbData['hashedApiKey']) return;
    validRegion.forEach((region) => {
        if (Array.isArray(dbData[region])) {
            dbData[region].forEach(async (sessionId) => {
                const url = `https://studio-api-${region}.ai.vonage.com/live-agent/disconnect/${sessionId}`
                try {
                    await axios.post(url, {}, {
                        headers: {
                            "X-Vgai-Key" : decrypt(dbData['hashedApiKey'])
                        }
                    });
                }
                catch(err) {
                    console.log("disconnect session err", err)
                }
            })
        }
    })

    // clear DB
    validRegion.forEach(async (region) => {
        await db.get('users')
        .find({ userId })
        .assign({[region]: []})
        .write()
    })
}

