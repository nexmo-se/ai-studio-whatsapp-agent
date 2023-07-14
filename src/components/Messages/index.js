import { useRef, useEffect } from 'react'
import './styles.css'

export default function Messages({currentChatData}) {
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
                    <p className="from-them">{`${currentChatData.sender}: `}<span>{message["User"].startsWith('http') ? <a href={message['User']}>{message['User']}</a> : message['User']}</span></p>
                    :
                    <p className="from-me">{message['Agent'].startsWith('http') ? <span><a href={message['Agent']}>{message['Agent']}</a></span> : message["Agent"]}</p>
                }
            </div>
            )
        })}
        <div ref={messagesEndRef} />
    </div>
    )    
}