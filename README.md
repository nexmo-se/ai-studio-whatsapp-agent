This is a whatsapp agent for ticket: https://jira.vonage.com/browse/SEG-670

## Manual Deployment:

1. copy .env.example to .env
2. run `npm install`
3. run `npm run install:backend`
4. Fill in variables:
   - API_KEY: ai-studio api-key
5. run `npm run build`
6. run `npm run start:dev`
7. Make the local url public, you can use various technology such as ngrok or nginx

## Vonage AI studio

1. in your live-agent routing node, set:\
   Start Connection EP: `your-public-server`/pastMessages?region=`project-region`\
   Inbound transfer EP: `your--public-server`/currentMessage

Demo: [link](https://www.youtube.com/watch?v=gdvHK3GpYrg)
