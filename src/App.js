import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Contacts from './components/Contacts';
import Messages from './components/Messages';
import './App.css'
const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

const HOST = process.env.REACT_APP_WEBSOCKET || window.location.origin.replace(/^http/, 'ws')
const ws = new WebSocket(HOST);

function App() {
  const [chatsData, setChatsData] = useState([]);
  const [currentChatData, setCurrentChatData] = useState();
  const inputRef = useRef();

  ws.onmessage = function (event) {
    console.log("on message", JSON.parse(event.data))
    const data = JSON.parse(event.data);
    console.log("Data received", data);
    setChatsData(data)

    // update current data
    if (currentChatData) {
      const newCurrentData = data.find((t_data) => t_data["senderPhoneNumber"] === currentChatData["senderPhoneNumber"])
      setCurrentChatData(newCurrentData)
    }

  };
  ws.onopen = () => {
    console.log("Websocket client connected")
  }

  useEffect(() => {
    console.log("chat data", chatsData)
  }, [chatsData])
  useEffect(() => {
    // pull past chat data
    const url = `${serverPath}/history`
    axios.get(url)
    .then((res) => {
      setChatsData(res.data.history)
      console.log("history response received: ", res);
    })
    .catch((err) => {
      console.log("history axios error: ", err);
    })
  },[])

  function disconnect() {
    if (!currentChatData) return;
    const url = `${serverPath}/disconnect/${currentChatData.sessionId}`
    axios.post(url, {})
    .then((res) => {
      console.log("Disconnect response received: ", res);
    })
    .catch((err) => {
      console.log("disconnect axios error: ", err);
    })
  }

  function sendVideoLink() {
    if (!currentChatData) return;
    const url = `${serverPath}/sendMessage/${currentChatData.sessionId}`
    axios.post(url, {
      "messageType": "text",
      "message": `Join the call: https://tokbox-events.herokuapp.com/room/test?skip=yes`
    })
    .then((res) => {
      console.log("video link sent: ", res);
      window.open('https://tokbox-events.herokuapp.com/room/test?skip=yes','_blank');

    })
    .catch((err) => {
      console.log("video link axios error: ", err);
    })
  }

  function sendMessage() {
    if (!currentChatData || !inputRef.current.value) return;
    const url = `${serverPath}/sendMessage/${currentChatData.sessionId}`
    axios.post(url, {
      "messageType": "text",
      "message": inputRef.current.value
    })
    .then((res) => {
      console.log("message sent: ", res);
    })
    .catch((err) => {
      console.log("send message axios error: ", err);
    }).finally(() => {
      inputRef.current.value = ""
    })
  }

  return (
    <div className="App">
      <h1>Agent Dashboard</h1>
      <Contacts
      chatsData={chatsData}
      setCurrentChatData={setCurrentChatData}
      ></Contacts>
      <div id="messages-section">
        <h3>Chat: {currentChatData ? currentChatData.sender : ""} {currentChatData && !currentChatData.isActive ? "(disconnected)" : ""}</h3>
        <button id="end-conversation" className="secondary" onClick={disconnect} disabled={currentChatData && currentChatData.isActive ? false: true}>End connection</button>
        <hr></hr>
        <Messages
        currentChatData={currentChatData}>
        </Messages>
        <div id="input-section">
          <button id="video-button" className="secondary" onClick={sendVideoLink} disabled={currentChatData && currentChatData.isActive ? false: true}>
            <img src={currentChatData && currentChatData.isActive ? "/assets/video-call.svg" : "/assets/video-call-disabled.svg"}></img>
          </button>
          <input ref={inputRef} placeholder='Type message here...' type="text" id="text-message" name="text-message"></input>
          <button id="send-button" className="primary" onClick={sendMessage} disabled={currentChatData && currentChatData.isActive ? false: true}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
