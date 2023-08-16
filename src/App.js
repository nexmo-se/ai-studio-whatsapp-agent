import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { serverPath } from './settings';
import Contacts from './components/Contacts';
import Messages from './components/Messages';
import Instructions from './components/Instructions';
import Register from './components/Register';

import './App.css'
import Introduction from './components/Introduction';

const queryParams = new URLSearchParams(window.location.search)
const authToken = queryParams.get("ref")

let hostUrl = process.env.REACT_APP_WEBSOCKET || window.location.origin.replace(/^http/, 'ws')
// Add jwt
hostUrl = hostUrl + `/?jwt=${authToken}`
const ws = new WebSocket(hostUrl);

function App() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState();
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [disableActions, setDisableActions] = useState(true)
  const [userId, setUserId] = useState(null)

  const messageInputRef = useRef();

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log("Data received", data);
    if (data.userId) {
      setUserId(data.userId)
    }
    else {
      setChats((prevData) => {
        const chatIndex = prevData.findIndex((contact) => contact.sessionId === data.sessionId )
        if (data.startDate && chatIndex === -1) {
            return [...prevData, data]
        }
        else if (!data.startDate && chatIndex !== -1){
          const newChat = [...prevData]
          newChat[chatIndex].message.push(data.message)
          return newChat
        }
        else {
          return prevData
        }
      })
    }
  };

  ws.onopen = () => {
    console.log("Websocket client connected")
    setIsLoading(false)
  }

  function disconnect() {
    if (!currentChat || isFetching) return;

    setIsFetching(true)

    const url = `${serverPath}/disconnect/${userId}`
    axios.post(url, {
      sessionId: currentChat.sessionId,
      region: currentChat.region
    })
    .then((res) => {
      if (res.data.err) {
        alert(res.data.err)
      }
      else {
        const contactIndex = chats.findIndex((contact) => contact.sessionId === currentChat.sessionId) 
        if (contactIndex !== -1) {
          let updatedContact =  [...chats]
          updatedContact[contactIndex]['isActive'] = false
          setChats(updatedContact)
        }
      }
    })
    .catch((err) => {
      alert(err)
    })
    .finally(() => {
      setIsFetching(false)
    })
  }

  function sendVideoLink() {
    if (!currentChat || isFetching) return;

    setIsFetching(true)
    const url = `${serverPath}/sendMessage/${userId}`

    axios.post(url, {
      "region": currentChat.region,
      "sessionId": currentChat.sessionId,
      "messageType": "text",
      "messageText": `Join the call: https://freeconferencing.vonage.com/room/${currentChat.sessionId}`
    })
    .then((res) => {
      if (res.data.err) {
        alert(res.data.err)
      }
      updateSentChatMessage(res.data.chatMessage)
      window.open(`https://freeconferencing.vonage.com/room/${currentChat.sessionId}`,'_blank');

    })
    .catch((err) => {
      alert(err)
    })
    .finally(()=> {
      setIsFetching(false)
    })
  }

  const updateSentChatMessage = useCallback((chatMessage) => {
    if (chatMessage) {
      const contactIndex = chats.findIndex((contact) => contact.sessionId === chatMessage.sessionId) 
      if (contactIndex !== -1) {
        let updatedContact =  [...chats]
        updatedContact[contactIndex]['message'].push(chatMessage.message)
        setChats(updatedContact)
      }
    }
  }, [chats])

  const sendMessage = useCallback(() => {    
    if (!currentChat || messageInputRef.current.value === '' || isFetching) return;

    setIsFetching(true)
    const url = `${serverPath}/sendMessage/${userId}`
    axios.post(url, {
      "region": currentChat.region,
      "sessionId": currentChat.sessionId,
      "messageType": "text",
      "messageText": messageInputRef.current.value
    })
    .then((res) => {
      if (res.data.err) {
        alert(res.data.err)
      }
      updateSentChatMessage(res.data.chatMessage)
    })
    .catch((err) => {
      alert(err)
    }).finally(() => {
      setIsFetching(false)
    })
  }, [currentChat, isFetching, userId, updateSentChatMessage])

  const handleUserKeyPress = useCallback((e) => {
    if (e.code === "Enter") {
      sendMessage();
    }
  }, [sendMessage]);

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);
    return () => {
        window.removeEventListener("keydown", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

  useEffect(() => {
    if (currentChat) {
      const newCurrentData = chats.find((t_data) => t_data["sessionId"] === currentChat["sessionId"])
      setCurrentChat({...newCurrentData})
    }
    // eslint-disable-next-line 
  }, [chats])

  useEffect(() => {
    if (currentChat && currentChat.isActive && !isFetching) {
      setDisableActions(false)
      setTimeout(() => {
        messageInputRef.current.focus()
       }, [1500])

    }
    else {
      if (messageInputRef.current) {
        messageInputRef.current.value = ''
      }
      setDisableActions(true)
    }
  }, [currentChat, isFetching])

  return (
    <div className="App">
      {isLoading && <div id="loading-spinner">
        <div className="loader"></div>
      </div> }
      {userId ? 
        <div id="post-register">
          <Instructions
            userId={userId}
            setUserId={setUserId}
          ></Instructions>
          <Contacts
          chats={chats}
          setCurrentChat={setCurrentChat}
          ></Contacts>
          <div id="messages-section">
            <h3>Chat: {currentChat ? currentChat.sender : ""} {currentChat && !currentChat.isActive ? "(disconnected)" : ""}</h3>
            <button id="end-conversation" className="secondary" onClick={disconnect} disabled={disableActions}>End connection</button>
            <hr></hr>
            <Messages
            currentChat={currentChat}>
            </Messages>
            <div id="input-section">
              <button id="video-button" className="secondary" onClick={sendVideoLink} disabled={disableActions}>
                <img alt="video-call" src={disableActions ? "/assets/video-call-disabled.svg" : "/assets/video-call.svg"}></img>
              </button>
              <input ref={messageInputRef} placeholder='Type message here...' type="text" id="text-message" name="text-message" disabled={disableActions}></input>
              <button id="send-button" className="primary" onClick={sendMessage} disabled={disableActions}>Send</button>
            </div>
           </div>
        </div>
      :
        <div id="pre-register">
          <Register
          setUserId={setUserId}
          authToken={authToken}
          ></Register>
          <Introduction></Introduction>
        </div>
      }
    </div>
  );
}

export default App;
