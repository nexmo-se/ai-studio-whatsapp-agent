import clsx from 'clsx';
import axios from 'axios';
import "./styles.css"
const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

export default function Contacts({chatsData, setCurrentChatData}) {
    // const sampleData = [{
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
    //       },
    //       {
    //         "User": "i have question"
    //       }
    //     ]
    //   },
    //   {
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
    // ];
  
    function updateCurrentChatData(e) {
      e.preventDefault();
      const targetSessionId = e.target.closest('div').getAttribute("data-sessionid")
      const targetChat = chatsData.find((data) => data.sessionId === targetSessionId)

      setCurrentChatData(targetChat)
    }

    function clearHistory(e) {
      e.preventDefault();
      const url = `${serverPath}/clearHistory`
      axios.post(url, {})
      .then((res) => {
        console.log("clearHistory response received: ", res);
      })
      .catch((err) => {
        console.log("clearHistory axios error: ", err);
      })
    }

    return (
      <div id="contacts">
        <h3>Contacts</h3>
        <button className='secondary clearHistory' onClick={clearHistory}>Clear history</button>
        <hr></hr>
        {
            chatsData.map((data, index) => {
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