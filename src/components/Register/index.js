import { useState, useRef } from 'react';
import axios from 'axios';
import { serverPath } from '../../settings';
import './styles.css'

export default function Register({setUserId, authToken}) {
    const apiKeyInputRef = useRef();
    const [isFetching, setIsFetching] = useState(false)

    function submitApiKey() {
        if (!apiKeyInputRef.current || apiKeyInputRef.current.value === '') {
          alert("missing AI Studio X-Vgai-Key")
          return;
        }
        if (isFetching) return
    
        setIsFetching(true)
        const url = `${serverPath}/addAIStudioKey`
        axios.post(url, {
          "apiKey": apiKeyInputRef.current.value
        },
        {
            headers: { 
                'Authorization': `${authToken}`,
                'Content-Type' : 'application/json' 
            }
        })
        .then((res) => {
          const userId = res.data.userId
          if (userId) {
            setUserId(userId)
          }
        })
        .catch((err) => {
          console.log("addAIStudioKey axios error: ", err);
        })
        .finally(() => {
          setIsFetching(false)
        })
      }

    return (
        <div>
            <label>AI Studio X-Vgai-Key <span>&#40; please refer to <a href="https://studio.docs.ai.vonage.com/api-integration/authentication" target="_blank" rel="noreferrer">AI Studio Authentication </a>to get the X-Vgai-Key &#41;</span></label>
            <input type="password" ref={apiKeyInputRef} autoFocus></input>
            <div id="input-section">
            <button className="primary" onClick={submitApiKey} disabled={isFetching}>Register</button>
            </div>
        </div>
    )

}