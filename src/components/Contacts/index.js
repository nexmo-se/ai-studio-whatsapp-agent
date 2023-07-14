import clsx from 'clsx';
import "./styles.css"

export default function Contacts({chatContacts, setCurrentChatData}) {
    function updateCurrentChatData(e) {
      e.preventDefault();
      const targetSessionId = e.target.closest('div').getAttribute("data-sessionid")
      const targetChat = chatContacts.find((data) => data.sessionId === targetSessionId)

      setCurrentChatData(targetChat)
    }

    return (
      <div id="contacts">
        <h3>Contacts</h3>
        {/* <button className='secondary clearHistory' onClick={clearHistory}>Clear history</button> */}
        <hr></hr>
        {
            chatContacts.map((data, index) => {
                return (
                    <div className={clsx("contact-card", (data.isActive)? "" : "inactive")} key={`contact-${index}`} data-sessionid={data.sessionId} onClick={updateCurrentChatData}>
                    <h4>{`${data.sender} (${data.senderPhoneNumber})`}<span className="inactive-tag">{data.isActive? "" : "(disconnected)"}</span></h4>
                    {
                        Object.keys(data.message[data.message.length - 1])[0] === "User" ? 
                        <p>{`${data.sender}: ${data.message[data.message.length - 1]["User"]}`}</p>
                        :
                        <p>{`agent: ${data.message[data.message.length - 1]["Agent"]}`}</p>
                    }
                    </div>
                )
            })
        }        
      </div>
    )
}