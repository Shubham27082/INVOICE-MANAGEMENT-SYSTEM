# MERN Stack Application

A full-stack application built with MongoDB, Express, React, and Node.js.

## Project Structure

```
mern-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   └── sampleController.js
│   ├── models/
│   │   └── Sample.js
│   ├── routes/
│   │   └── api.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Installation

### Option 1: Install all dependencies at once

```bash
npm install
npm run install-all
```

### Option 2: Install dependencies separately

1. Install root dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

## Configuration

1. Update the MongoDB connection string in `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern_app
```

For MongoDB Atlas, use:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mern_app
```

## Running the Application

### Option 1: Run both frontend and backend concurrently (from root)

```bash
npm run dev
```

### Option 2: Run separately

1. Start the backend server (from root):
```bash
npm run server
```

Or from server directory:
```bash
cd server
npm run dev
```

2. Start the frontend (from root):
```bash
npm run client
```

Or from client directory:
```bash
cd client
npm start
```

## API Endpoints

- `GET /` - Returns "API running"
- `GET /api/sample` - Sample API endpoint

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Features

- ✅ Express server with CORS enabled
- ✅ MongoDB connection with Mongoose
- ✅ JSON parsing middleware
- ✅ Basic API routes
- ✅ React frontend with API integration
- ✅ Organized folder structure (models, routes, controllers, config)
- ✅ Environment variables support
- ✅ Development mode with hot reload

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- dotenv

### Frontend
- React
- Axios
- React Scripts

## Next Steps

1. Create more models in `server/models/`
2. Add more routes in `server/routes/`
3. Implement controllers in `server/controllers/`
4. Build React components in `client/src/`
5. Add authentication (JWT)
6. Implement state management (Redux/Context API)
7. Add form validation
8. Deploy to production

## License

ISC
