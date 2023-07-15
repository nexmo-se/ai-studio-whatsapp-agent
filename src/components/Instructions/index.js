
import { useEffect, useState } from 'react'
import './styles.css'
import { serverPath } from '../../settings'

export default function Instructions({userId, setUserId}) {
    const [open, setOpen] = useState(false)
    const [pastMessagesUrl, setPastMessageUrl] = useState(null)
    const [currentMessageUrl, setCurrentMessageUrl] = useState(null)

    useEffect(() => {
        if (userId) {
          setCurrentMessageUrl(`${serverPath}/currentMessage/${userId}?region=us`)
          setPastMessageUrl(`${serverPath}/pastMessages/${userId}?region=us`)
          setOpen(true)
        }
    }, [userId])


    function copyPassMessagesUrl(e) {
        navigator.clipboard.writeText(pastMessagesUrl);
        const targetElement = e.currentTarget;

        targetElement.innerHTML = "Copied!"
        setTimeout(() => {
            targetElement.innerHTML = "Copy"
        }, 2500);
    }

    function copyCurrentMessageUrl(e) {
        navigator.clipboard.writeText(currentMessageUrl);
        const targetElement = e.currentTarget;
        targetElement.innerHTML = "Copied!"
        setTimeout((e) => {
            targetElement.innerHTML = "Copy"
        }, 2500);
    }

    function resetAIStudioKey() {
        setUserId(null)
    }


    return (
        <>
        {open &&
          <div id="instruction">
            <h4>Please paste below URLs in your AI Studio <a target="_blank" href="https://studio.docs.ai.vonage.com/whatsapp/nodes/actions/live-agent-routing">Whatsapp Live Agent Routing Node</a>.</h4>
            <p className="important"><small>Note: replace region=us to region=eu if you are using eu AI studio server</small></p>
            <p><b>Start Connection EP:</b> {pastMessagesUrl} <span><button className="tertiary" onClick={copyPassMessagesUrl}>Copy</button></span></p>
            <p><b>Inbound transfer EP:</b> {currentMessageUrl} <span><button className="tertiary" onClick={copyCurrentMessageUrl}>Copy</button></span></p>
            <p><button className="secondary" onClick={resetAIStudioKey}>Reset AI Studio Key</button></p>
          </div>
        }
         <p><button className="tertiary" onClick={() => setOpen(!open)}>{open ? "Hide Instructions" : "Show Instructions"}</button></p>
        </>
    )
}
