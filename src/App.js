import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Contacts from './components/Contacts';
import Messages from './components/Messages';
import './App.css'
import Instructions from './components/Instructions';
import { serverPath } from './settings';
const queryParams = new URLSearchParams(window.location.search)
const jwt = queryParams.get("ref")

let hostUrl = process.env.REACT_APP_WEBSOCKET || window.location.origin.replace(/^http/, 'ws')
// Add jwt
hostUrl = hostUrl + `?jwt=${jwt}`
const ws = new WebSocket(hostUrl);

function App() {
  const [chatContacts, setChatContacts] = useState([]);
  const [currentChatData, setCurrentChatData] = useState();
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMessageSending, setIsMessageSending] = useState(false)
  const [disableActions, setDisableActions] = useState(true)
  const [userId, setUserId] = useState(null)


  const apiKeyInputRef = useRef();
  const messageInputRef = useRef();

  ws.onmessage = function (event) {
    console.log("on message", JSON.parse(event.data))
    const data = JSON.parse(event.data);
    console.log("Data received", data);
    if (data.userId) {
      setUserId(data.userId)
    }
    else {
      setChatContacts((prevData) => {
        const chatIndex = prevData.findIndex((contact) => contact.sessionId === data.sessionId )
        if (data.startDate && chatIndex === -1) {
            return [...prevData, data]
        }
        else if (!data.startDate && chatIndex !== -1){
          const newChat = [...prevData]
          newChat[chatIndex].message.push(data.message)
          console.log("new chat ", newChat)
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

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);
    return () => {
        window.removeEventListener("keydown", handleUserKeyPress);
    };
}, [handleUserKeyPress]);

  useEffect(() => {
    if (chatContacts.length > 0) {
      // update current data
      if (currentChatData) {
        const newCurrentData = chatContacts.find((t_data) => t_data["sessionId"] === currentChatData["sessionId"])
        setCurrentChatData({...newCurrentData})
      }
    }
    // eslint-disable-next-line 
  }, [chatContacts])

  // useEffect(() => {
  //   if (currentChatData && !disableActions && !isMessageSending) {
  //     messageInputRef.current.focus()
  //   }
  // }, [currentChatData])

  useEffect(() => {
    if (currentChatData && currentChatData.isActive) {
      setDisableActions(false)
    }
    else {
      if (messageInputRef.current) {
        messageInputRef.current.value = ''
      }
      setDisableActions(true)
    }
  }, [currentChatData])

  function submitApiKey() {
    setIsRegistering(true)
    const url = `${serverPath}/addAIStudioKey`
    axios.post(url, {
      "jwt": jwt,
      "apiKey": apiKeyInputRef.current.value
    })
    .then((res) => {
      console.log("res: ", res)
      const userId = res.data.userId
      if (userId) {
        setUserId(userId)
      }
    })
    .catch((err) => {
      console.log("addAIStudioKey axios error: ", err);
    })
    .finally(() => {
      setIsRegistering(false)
    })
  }

  function disconnect() {
    if (!currentChatData) return;
    const url = `${serverPath}/disconnect/${userId}`
    axios.post(url, {
      sessionId: currentChatData.sessionId,
      region: currentChatData.region
    })
    .then((res) => {
      if (res.data.err) {
        alert(res.data.err)
      }
      else {
        const contactIndex = chatContacts.findIndex((contact) => contact.sessionId === currentChatData.sessionId) 
        if (contactIndex !== -1) {
          let updatedContact =  [...chatContacts]
          updatedContact[contactIndex]['isActive'] = false
          setChatContacts(updatedContact)
        }
      }
      console.log("Disconnect response received: ", res);
    })
    .catch((err) => {
      alert(err)
      console.log("disconnect axios error: ", err);
    })
  }

  function sendVideoLink() {
    if (!currentChatData) return;
    setIsMessageSending(true)
    const url = `${serverPath}/sendMessage/${userId}`

    axios.post(url, {
      "region": currentChatData.region,
      "sessionId": currentChatData.sessionId,
      "messageType": "text",
      "messageText": `Join the call: https://freeconferencing.vonage.com/room/${currentChatData.sessionId}`
    })
    .then((res) => {
      if (res.data.err) {
        alert(res.data.err)
      }
      updateSentChatMessage(res.data.chatMessage)
      window.open(`https://freeconferencing.vonage.com/room/${currentChatData.sessionId}`,'_blank');

    })
    .catch((err) => {
      alert(err)
    })
    .finally(()=> {
      setIsMessageSending(false)
    })
  }
  function handleUserKeyPress(e) {
    if (e.code === "Enter") {
      sendMessage();
    }
  };

  function sendMessage() {    
    console.log("inside sent message")
    if (!currentChatData || !messageInputRef.current.value) return;

    setIsMessageSending(true)
    const url = `${serverPath}/sendMessage/${userId}`
    axios.post(url, {
      "region": currentChatData.region,
      "sessionId": currentChatData.sessionId,
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
      setIsMessageSending(false)
      messageInputRef.current.value = ""
    })
  }

  function updateSentChatMessage(chatMessage) {
    if (chatMessage) {
      const contactIndex = chatContacts.findIndex((contact) => contact.sessionId === chatMessage.sessionId) 
      if (contactIndex !== -1) {
        let updatedContact =  [...chatContacts]
        updatedContact[contactIndex]['message'].push(chatMessage.message)
        setChatContacts(updatedContact)
      }
    }
  }

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
          chatContacts={chatContacts}
          setCurrentChatData={setCurrentChatData}
          ></Contacts>
          <div id="messages-section">
            <h3>Chat: {currentChatData ? currentChatData.sender : ""} {disableActions && currentChatData ? "(disconnected)" : ""}</h3>
            <button id="end-conversation" className="secondary" onClick={disconnect} disabled={disableActions || isMessageSending}>End connection</button>
            <hr></hr>
            <Messages
            currentChatData={currentChatData}>
            </Messages>
            <div id="input-section">
              <button id="video-button" className="secondary" onClick={sendVideoLink} disabled={disableActions || isMessageSending}>
                <img alt="video-call" src={disableActions || isMessageSending ? "/assets/video-call-disabled.svg" : "/assets/video-call.svg"}></img>
              </button>
              <input ref={messageInputRef} placeholder='Type message here...' type="text" id="text-message" name="text-message" disabled={disableActions || isMessageSending}></input>
              <button id="send-button" className="primary" onClick={sendMessage} disabled={disableActions || isMessageSending}>Send</button>
            </div>
           </div>
        </div>
      :
        <div id="pre-register">
          <label>AI Studio Key <span>&#40; please refer to <a href="https://studio.docs.ai.vonage.com/api-integration/authentication" _blank="true">AI Studio Authentication </a>to get the API Key &#41;</span></label>
          <input type="password" ref={apiKeyInputRef} autoFocus></input>
          <div id="input-section">
            <button className="primary" onClick={submitApiKey} disabled={isRegistering}>Register</button>
          </div>
        </div>
      }
    </div>
  );
}

export default App;
