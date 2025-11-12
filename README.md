# Online Learning Platform with GPT-3 Integration

## Project Overview
This project is an online learning platform built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It allows students to register, log in, browse courses, enroll in courses, and receive personalized course recommendations using GPT-3. Instructors can create, update, and delete their courses, as well as view the list of enrolled students.

This project demonstrates role-based access control (students vs. instructors), CRUD operations for courses, JWT-based authentication, and integration with OpenAI GPT-3 API for smart recommendations. The backend is fully functional, and the frontend is designed to be user-friendly with basic styling.

---

## Features

### Student Features
- Sign up and login using email and password.
- View all available courses.
- View course details.
- Enroll in courses.
- See a list of their enrolled courses.
- Receive GPT-based course recommendations by entering prompts like:
  > "I want to become a software engineer, which courses should I follow?"

### Instructor Features
- Sign up and login using email and password.
- Create new courses with title, description, and content.
- Update and delete own courses.
- View course details.
- View enrolled students for each course.

### GPT Integration
- Students can enter a prompt describing their learning goal.
- GPT-3 returns personalized course suggestions.
- Each suggestion shows a title, reason, and matched courses from the platform (if available).

---

## System Architecture
- **Backend:** Node.js + Express.js
- **Frontend:** React.js (Create React App)
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Token)
- **GPT-3 Integration:** OpenAI API

The backend exposes RESTful APIs for authentication, course management, enrollment, and GPT-3 recommendations.  
Frontend communicates with backend via HTTP requests to render data and perform actions.

---

## Database Structure

### Users
| Field      | Type     | Description            |
|------------|----------|------------------------|
| _id        | ObjectId | Unique user ID          |
| name       | String   | User's full name       |
| email      | String   | User email (unique)    |
| password   | String   | Hashed password        |
| role       | String   | 'student' or 'instructor' |
| createdAt  | Date     | Account creation date  |

### Courses
| Field      | Type     | Description                 |
|------------|----------|-----------------------------|
| _id        | ObjectId | Unique course ID            |
| title      | String   | Course title                |
| description| String   | Course description          |
| instructor | ObjectId | ID of the instructor (User) |
| content    | Array    | Course sections (title, type, body) |
| students   | Array    | Enrolled students with user ID and enrolledAt |
| createdAt  | Date     | Course creation date        |

### GPT Logs
| Field         | Type     | Description                    |
|---------------|----------|--------------------------------|
| _id           | ObjectId | Unique log ID                  |
| userId        | ObjectId | User who made the GPT request  |
| prompt        | String   | Prompt sent to GPT             |
| promptLength  | Number   | Length of the prompt           |
| maxSuggestions| Number   | Number of requested suggestions|
| tokensUsed    | Number   | Number of tokens used          |
| success       | Boolean  | Whether the request was successful |
| errorMessage  | String   | Error if any                   |
| timestamp     | Date     | Time of request                |
| ipAddress     | String   | Request IP                     |

---

## Setup Instructions
---
## Backend Setup
### 1. Clone the repository
```bash
git clone (https://github.com/AsmaAmeenGeek/OLP)
````
### 2. Go to the backend folder
```bash
cd backend
```
### 3. Install dependencies
```bash
npm install
```
### 4. Create a `.env` file in the backend root
```bash
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
OPENAI_API_KEY=<your_openai_api_key>
PORT=5000
```

### 5. Start the backend server
```bash
npm run dev
```
The backend runs at:
 **[http://localhost:5000](http://localhost:5000)**

##  Frontend Setup

### 1. Go to the frontend folder
```bash
cd frontend
````
### 2. Install dependencies
```bash
npm install
```
### 3. Start the frontend server
```bash
npm start
```
The frontend runs at:
 **[http://localhost:3000](http://localhost:3000)**

## API Documentation
### Authentication

| Endpoint           | Method | Auth | Description         |
| ------------------ | ------ | ---- | ------------------- |
| /api/auth/register | POST   | No   | Register a new user |
| /api/auth/login    | POST   | No   | Login existing user |

**Example Request:**
```json
POST /api/auth/register
{
  "name": "Asma Ameen",
  "email": "asma@example.com",
  "password": "mypassword",
  "role": "student"
}
```

**Example Response:**
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "64f....",
    "name": "Asma Ameen",
    "email": "asma@example.com",
    "role": "student",
    "createdAt": "2025-11-11T10:00:00.000Z"
  }
}
```

### Courses

| Endpoint                  | Method | Auth | Role       | Description            |
| ------------------------- | ------ | ---- | ---------- | ---------------------- |
| /api/courses              | GET    | No   | -          | Get all courses        |
| /api/courses/:id          | GET    | No   | -          | Get course details     |
| /api/courses              | POST   | Yes  | Instructor | Create a course        |
| /api/courses/:id          | PUT    | Yes  | Instructor | Update own course      |
| /api/courses/:id          | DELETE | Yes  | Instructor | Delete own course      |
| /api/courses/:id/enroll   | POST   | Yes  | Student    | Enroll in course       |
| /api/courses/:id/students | GET    | Yes  | Instructor | View enrolled students |

### GPT Recommendations

| Endpoint           | Method | Auth | Role    | Description                             |
| ------------------ | ------ | ---- | ------- | --------------------------------------- |
| /api/gpt/recommend | POST   | Yes  | Student | Get personalized course recommendations |
| /api/gpt/stats     | GET    | Yes  | Student | Get GPT usage stats for the user        |

**Example GPT Request:**
```json
POST /api/gpt/recommend
{
  "prompt": "I want to become a software engineer, what courses should I follow?",
  "maxSuggestions": 5
}
```

**Example GPT Response:**

```json
{
  "success": true,
  "recommendations": [
    {
      "suggested_title": "Introduction to Web Development",
      "reason": "Learn basic web development skills",
      "matched": true,
      "courses": [
        {
          "id": "64f....",
          "title": "Introduction to Web Development",
          "description": "Learn HTML, CSS, and JavaScript"
        }
      ]
    }
  ]
}
```
---

## Usage
1. Register as a student or instructor.
2. Login to access your dashboard.
3. Students can browse courses, enroll, and request GPT-based suggestions.
4. Instructors can create courses, update them, delete them, and view enrolled students.
5. GPT logs are automatically saved for each request.

---

## Deployment
* Host the backend on Heroku / Render / AWS.
* Host the frontend on Vercel / Netlify / AWS.
* Ensure environment variables are correctly set in the deployment platform.
* Provide the public URL for demo purposes.

---

## Notes
* Passwords are securely hashed using bcrypt.
* JWT is used for authentication.
* Role-based access control ensures that students cannot manage courses and instructors cannot enroll in courses.
