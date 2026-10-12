# WWW — Backend API

REST API and real-time server for **WWW**, a collaborative task board app.

**Live API:** https://todoapp-be-mrt0.onrender.com
**Frontend repo / live demo:** https://github.com/akali17/TodoApp_FE

> Hosted on Render's free tier. The first request after inactivity can take ~50 seconds while the server wakes up.

## Features

- JWT authentication with email + password and Google OAuth (bcrypt password hashing)
- Email verification, password reset and board invitations sent by email (Brevo API)
- Boards, columns and cards with ordering, card moves and card members
- Board membership: invite, accept, remove, leave
- Real-time updates with Socket.IO rooms per board (join / leave board, online members)
- Hourly cron job (node-cron) that notifies card members about deadlines due within 24 hours
- Notifications and statistics endpoints (board stats, activity stats, cards with deadlines)

## Tech stack

Node.js, Express 5, MongoDB (Mongoose), Socket.IO, JSON Web Token, google-auth-library, bcrypt, node-cron, Axios (Brevo email API)
Deployed on Render, database on MongoDB Atlas.

## Project structure

```
src/
├── config/        # MongoDB connection
├── controllers/   # Request handlers (users, boards, columns, cards, notifications, stats)
├── middlewares/   # JWT auth middleware
├── models/        # Mongoose schemas
├── routes/        # Express routers
├── socket/        # Socket.IO setup and events
├── utils/         # Email service, deadline cron job, validators
├── app.js         # Express app, CORS, routes, error handling
└── server.js      # HTTP + Socket.IO server entry point
```

## API overview

All routes are prefixed with `/api`. Routes marked 🔒 require `Authorization: Bearer <token>`.

| Resource | Endpoints |
| --- | --- |
| Users | `POST /users/register`, `POST /users/login`, `POST /users/google-login`, `POST /users/verify-email`, `POST /users/forgot-password`, `POST /users/reset-password`, 🔒 `GET /users/me`, 🔒 `PUT /users/profile`, 🔒 `POST /users/change-password` |
| Boards 🔒 | `GET /boards`, `POST /boards`, `GET /boards/:id/full`, `PUT /boards/:id`, `DELETE /boards/:id`, `POST /boards/:id/invite`, `POST /boards/accept-invite`, `POST /boards/:id/leave` |
| Columns 🔒 | `POST /columns`, `PUT /columns/:id`, `DELETE /columns/:id`, `POST /columns/reorder` |
| Cards 🔒 | `POST /cards`, `GET /cards/:id`, `PUT /cards/:id`, `DELETE /cards/:id`, `PATCH /cards/:cardId/move`, `PATCH /cards/reorder` |
| Notifications 🔒 | `GET /notifications`, `PATCH /notifications/:id/read`, `DELETE /notifications/:id` |
| Stats 🔒 | `GET /stats/board-stats`, `GET /stats/activity-stats`, `GET /stats/cards-with-deadlines` |

## Run locally

```bash
git clone https://github.com/akali17/TodoApp_BE.git
cd TodoApp_BE
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_api_key   # optional: without it, emails are skipped
EMAIL_FROM=your_sender_email
NODE_ENV=development
```

```bash
npm run dev     # nodemon
# or
npm start
```

The API runs at http://localhost:5000/api.

## Author

Hoàng Gia Bảo — [github.com/akali17](https://github.com/akali17)
