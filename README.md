# TaskManager Backend

A RESTful backend API for a task tracking and team collaboration platform. The project supports:

- User registration, login, profile updates, and secure logout
- Task CRUD with filtering, sorting, and search
- Team or project creation and membership management
- Comments and local file attachments on tasks
- Optional real-time notifications through Socket.IO

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- Socket.IO for live notifications
- Multer for attachments

## Setup

1. Install dependencies:

   npm install

2. Create your environment file:

   Copy .env.example to .env and update the values.

3. Start MongoDB locally or point MONGODB_URI to your hosted database.

4. Run the API:

   npm run dev

## API Overview

Base path: /api

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- PATCH /auth/me
- PATCH /auth/password

### Teams

- POST /teams
- GET /teams
- GET /teams/:teamId
- POST /teams/join
- PATCH /teams/:teamId
- DELETE /teams/:teamId
- POST /teams/:teamId/members
- DELETE /teams/:teamId/members/:userId

### Tasks

- POST /tasks
- GET /tasks
- GET /tasks/:taskId
- PATCH /tasks/:taskId
- DELETE /tasks/:taskId
- PATCH /tasks/:taskId/complete
- PATCH /tasks/:taskId/assign

Query support on GET /tasks:

- status
- teamId
- assignedTo
- createdBy
- search
- sortBy
- sortOrder
- page
- limit

### Comments

- GET /tasks/:taskId/comments
- POST /tasks/:taskId/comments
- DELETE /comments/:commentId

### Attachments

- POST /tasks/:taskId/attachments
- DELETE /tasks/:taskId/attachments/:attachmentId

### Notifications

- GET /notifications
- PATCH /notifications/:notificationId/read
- PATCH /notifications/read-all

### AI Draft Helper

- POST /ai/task-description

This helper returns a generated task description draft. If OPENAI_API_KEY is not configured, the API falls back to a structured template response.

## Real-Time Updates

The server exposes a Socket.IO endpoint. When a task is assigned or updated, the affected users receive live notification events.

## Submission Notes

- Push the repository to a public GitHub repository.
- Add the GitHub repository link to your submission.
- Make sure your .env file is never committed.
