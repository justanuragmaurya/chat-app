# AI chat agent with real world data access.

<img width="1582" height="1035" alt="Screenshot 2026-02-06 at 9 24 12 PM" src="https://github.com/user-attachments/assets/ba43b84f-4001-4194-a372-5ad70a37be02" />
<img width="1582" height="1035" alt="Screenshot 2026-02-06 at 9 23 29 PM" src="https://github.com/user-attachments/assets/ddde8d30-ab51-491e-86fc-fa0c9c1d63d5" />

1. To start the project locally :
use `git clone https://github.com/justanuragmaurya/chat-app` to clone the repositry on your machine.

2. Change you directoy to the newly created project `cd chat-app`

3. Install pnpm as its the package manager I am using `npm install -g pnpm`

4. Now install all the dependencies with `pnpm install`

5. After the dependencies are installed create a `.env` file and all the enviorment variables as show in the `.env.example` file.

6. Now run the app with the command `pnpm dev`

7. The web app will be now available at `http://localhost:3000/`

8. If you want to run the in production mode the run cmd `pnpm build` and then `pnpm start` and the app will be ready at the same url as earlier. `http://localhost:3000/`

# Hosting Overview
The app is hosted at https://dev.anuragmaurya.com  , running on a virtual machine with complete CI/CD pipeline , so with each push a new image is pushed to dockerhub and then the image is used to run a containerized application the aws ec2 instance. I have used AWS ec2 for virtual machine and github actions / workflows for cicd pipeline.

# Architecture Overview
Tech Stack : 
1. Framework: NextJS 16
2. Language : Typescript
3. Auth : NextAuth
4. Database: Any PostgresSQL would work
5. AI Agent : OpenAI agent SDK with OpenRouter's api as the base url.
6. Deployment : Docker + GithubActions + AWS ec2

The app is built with nextjs where user vists a home page , if user is signed up then the user is redirected to `/chat` page and if not signed in sent to `/signin` page. 

A user can create a new workspace or continue with the all chats workspace.

The /chat endpoint has a chatbox for new conversations , when user send a mesage here then a new convo is created with the first message that the user has sent and the user is redirect to `/chat/{chat_id}` endpoint.

There in `/chat/{chatid}` endpoint id the last message is send by user , then the message is sent to the ai agent on `/api/chat` endpoint and the output is streamed to the client and once message has been completed it is saved in db.

The ai agent has a custom tool / function built to browse the web , i have used the langsearch api (by lanchain) since its free , can switch to brave search api to have improved results but it needed a credit card to be added so i went with langsearch.

Currently Hosted on Domain : https://dev.anuragmaurya.com
