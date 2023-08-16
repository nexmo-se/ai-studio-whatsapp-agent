import "./styles.css"

export default function Introduction() {
    return (  
    <div id="introduction">
        <p>This application functions as a live agent for Whatsapp AI-Studio. <br></br>
           Within Whatsapp AI-Studio, there exists a node referred to as <a target="_blank" rel="noreferrer" href="https://studio.docs.ai.vonage.com/whatsapp/nodes/actions/live-agent-routing">Live Agent Routing</a>.<br></br>
           This node allows you to direct a Whatsapp AI flow towards a web application. <br></br>
           Consequently, users on WhatsApp can engage in a chat with a live agent via this application.
        </p>
        <h3>How to use:</h3>
        <ol>
            <li>Generate <a href="https://studio.docs.ai.vonage.com/api-integration/authentication" target="_blank" rel="noreferrer">API Key</a> from your <a href="https://studio.ai.vonage.com/" target="_blank" rel="noreferrer">AI Studio Account</a></li>
            <li>Register your AI Studio API key using the form above.</li>
            <li>After registration completed, you will get 2 webhooks: <strong>Start Connection EP</strong> and <strong>Inbound transfer EP</strong></li>
            <li>Copy and Paste the webhooks into your AI Studio Live Agent Routing node. </li>
            <li>The WhatsApp user's connection with this application will be established when they reach the Live Agent Routing node in your AI flow</li>
        </ol>
        <h3><a href="https://www.youtube.com/watch?v=gdvHK3GpYrg" target="_blank" rel="noreferrer">Demo</a></h3>
    </div>
    )
}
