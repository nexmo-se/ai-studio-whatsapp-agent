const express = require('express');
const low = require('lowdb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
app.use(express.static("express"));
const axios = require("axios");

const { v4: uuidv4 } = require('uuid');
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
let region = "us";
const validRegion = ["us", "eu"]
wsServer.on('request', function(request) {
    console.log(`${(new Date())} received a new connection from ${request.origin}`)
    const userId = uuidv4();
    // Acccept all request, can set to accept only specific origin
    const connection = request.accept(null, request.origin)
    clients[userId] = connection
})

// Use JSON file for storage
const FileSync = require('lowdb/adapters/FileSync');
const { application } = require('express');
const adaptor = new FileSync('db.json')
const db = low(adaptor)
db.defaults({ messages: []})
  .write()
//   {
//     sender: // parameter user name
//     senderPhoneNumber: // parameter PROFILE_NAME
//     startDate:
//     startTime:
//     agentPhoneNumber:
//     sessionId:
//     message:
//     from:
//   }

//   post pass message {
//     transcription: [
//       { Agent: 'What question do you have?' },
//       { User: 'no' },
//       {
//         Agent: 'No answer was found. Would you like to talk to a teacher?'
//       }
//     ],
//     parameters: [
//       { name: 'SENDER_PHONE_NUMBER', value: '60127884647' },
//       { name: 'CONVERSATION_START_DATE', value: '2022-11-08' },
//       { name: 'CONVERSATION_START_TIME', value: '15:13:48' },
//       { name: 'AGENT_PHONE_NUMBER', value: '972523292139' },
//       { name: 'INITIAL_MESSAGE', value: '' },
//       {
//         name: 'SESSION_ID',
//         value: 'c972bcf7-4dfe-4572-964c-f90693e90adb'
//       },
//       { name: 'PROFILE_NAME', value: 'iujie' },
//       {
//         name: 'INITIAL_MESSAGE_PAYLOAD',
//         value: '{"text": "", "type": "text"}'
//       }
//     ]
//   }
// default URL for website
app.use(express.static(path.join(__dirname, "../build")));

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname, "../build/index.html"));
});

// body: {
//     sessionId: '8ff60bb3-8ab0-4484-8344-782f5d249f1b',
//     history: { transcription: [Array], parameters: [Array] }
//   },
app.post('/pastMessages', async function(req,res){
    console.log("post pass message", req.body)
    if (req.query.region && validRegion.includes(req.query.region)) region = req.query.region
    const history = req.body.history
    const transcription = history.transcription;

    const senderPhoneNumberParam = req.body.history.parameters.find((param) => param.name === "SENDER_PHONE_NUMBER");
    const existingData = db.get("messages").find({senderPhoneNumber: senderPhoneNumberParam.value}).value()
    if (existingData) {
       const message = existingData["message"]
       const sessionId = req.body.sessionId
        const newMessage = message.concat(transcription)
        // Update the user with the modified inventory
        await db.get('messages')
        .find({ senderPhoneNumber: senderPhoneNumberParam.value })
        .assign({sessionId, message: newMessage, isActive: true })
        .write();
    }
    else {
        const data = {sessionId: req.body.sessionId, isActive: true};
        history.parameters.forEach((param) => {
            if (param.name === "PROFILE_NAME") data["sender"] = param.value;
            if (param.name === "AGENT_PHONE_NUMBER") data["agentPhoneNumber"] = param.value;
            if (param.name === "CONVERSATION_START_DATE") data["startDate"] = param.value;
            if (param.name === "CONVERSATION_START_TIME") data["startTime"] = param.value;
            if (param.name === "SENDER_PHONE_NUMBER") data["senderPhoneNumber"] = param.value;
        })
        data["message"] = transcription
        await db.get('messages').push(data).write();
    }

    broadcast()
    res.sendStatus(200)
});

// body: {
//     sessionId: '8ff60bb3-8ab0-4484-8344-782f5d249f1b',
//     text: 'ok',
//     type: 'text'
//   },

app.post('/currentMessage', async function(req,res){
    console.log("post current message", req.body)

    updateDbMessage(req.body.sessionId, "User", req.body.text)

    broadcast()

    res.sendStatus(200).end();
});

app.post('/disconnect/:sessionId', async function(req, res) {
    const url = `https://studio-api-${region}.ai.vonage.com/live-agent/disconnect/${req.params.sessionId}`
	try {
		await axios.post(url, {}, {
            headers: {
                "X-Vgai-Key" : process.env.API_KEY
            }
        });

		res.sendStatus(200).end();
	} catch (err) {
        if (err.response.data.statusCode === 404) {
            console.log("session id not found")
        }
	} finally{
        // set is active to false
        db.get("messages")
        .find({sessionId: req.params.sessionId})
        .assign({isActive: false})
        .write()
        
        broadcast();
    } 
})

app.post('/sendMessage/:sessionId', async function(req, res) {
    const url = `https://studio-api-${region}.ai.vonage.com/live-agent/outbound/${req.params.sessionId}`
    const message =
        {
            "message_type": req.body.messageType,
            "text": req.body.message
        }
	try {
		await axios.post(url, message, {
            headers: {
                "Content-Type": "application/json",
                "X-Vgai-Key" : process.env.API_KEY
            }
        });

        updateDbMessage(req.params.sessionId, "Agent", req.body.message)
        broadcast()
		res.sendStatus(200).end();
	} catch (err) {
        console.log("err ", err)
	}
})

function broadcast() {
    const messages = db.get("messages").value();

    for (key in clients) {
        clients[key].send(JSON.stringify(messages));
    }    
}

async function updateDbMessage(sessionId, user, text) {
    let message = db.get("messages").find({sessionId}).get("message").value()
    const newMessage = {}
    newMessage[user] = text
    message.push(newMessage);

    // Update the user with the modified inventory
    await db.get('messages')
    .find({ sessionId })
    .assign({ message })
    .write();
}

app.get('/history', function(req,res){
    res.send({history: db.get('messages').value()}).end()
});

app.post('/clearHistory', async function(req,res){
    //Disconnect all session
    const dbData = db.get('messages').value()
    dbData.forEach(async (data) => {
        const url = `https://studio-api-${region}.ai.vonage.com/live-agent/disconnect/${data.sessionId}`
        try {
            await axios.post(url, {}, {
                headers: {
                    "X-Vgai-Key" : process.env.API_KEY
                }
            });
        }
        catch(err) {
            console.log("err", err.message)
        }
    })

    // clear DB
    if (db.has('messages').value()) {
        db.get('messages').remove({}).write()
      }

    broadcast()

    res.sendStatus(200).end()
});

