# ICL
#### to start the application on local
- setup local or remote mongodb server (change the MONGODB_URI as specified)
- set environment variables in .env file\
**for. example**\
PORT=8000\
MONGODB_URI='mongodb://localhost:27017/icl'\
SUPER_USER_PASSWORD='icl-pass'\
JWT_SECRET='dev19-jwt-secret'\
MAX_IMAGE_SIZE_IN_MB=5\
- install packages for node server, frontend server and build react code
``` 
npm install
npm run build
```
- start the server in development mode
```
npm run start:dev
```
