import { useRef, useEffect } from 'react'
import './styles.css'

export default function Messages({currentChatData}) {
    // const sampleData =  {
    //     "sessionId": "5bb389b2-36f1-4d14-b1ad-59842a65d1b2",
    //     "senderPhoneNumber": "60127884647",
    //     "startDate": "2022-11-08",
    //     "startTime": "16:26:11",
    //     "agentPhoneNumber": "972523292139",
    //     "sender": "iujie",
    //     "message": [
    //       {
    //         "Agent": "What question do you have?"
    //       },
    //       {
    //         "User": "no but"
    //       },
    //       {
    //         "Agent": "No answer was found. Would you like to talk to a teacher?"
    //       }
    //     ]
    //   }
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  
    useEffect(() => {
      scrollToBottom()
    }, [currentChatData]);
  

    return (
    <div id="message-container" className={currentChatData && currentChatData.isActive ? "" : "disabled"}>
        {currentChatData && currentChatData.message.map((message, index) => {
            return (
            <div key={`message-${index}`}>
                {
                    Object.keys(message)[0] === "User" ? 
                    <p className="from-them">{`${currentChatData.sender}: ${message["User"]}`}</p>
                    :
                    <p className="from-me">{`${message["Agent"]}`}</p>
                }
            </div>
            )
        })}
        <div ref={messagesEndRef} />
    </div>
    )    
}