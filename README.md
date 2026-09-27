# Nightmare Cinema

Nightmare Cinema is a full-stack cinema ticket booking system for **Royal Mall**.

The project combines a responsive frontend built with HTML, CSS, Bootstrap, and Vanilla JavaScript with a Node.js / Express backend and MongoDB database.

## Tech Stack

### Frontend
- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- Brevo Email API

## Main Features

- User registration
- Email verification
- Login and authentication
- Forgot password and reset password
- Movie listing and movie details
- Cinema screens and showtimes
- Dynamic seat selection
- Booking and checkout flow
- Booking confirmation
- My Bookings page
- Booking cancellation
- Booking confirmation email
- Admin dashboard
- Admin role authorization
- Movie management
- Screen management
- Showtime management
- Booking overview

## Project Structure

```text
nightmare-cinema-1/
│
├── assets/
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── admin.js
│   └── password.js
│
├── backend/
│   ├── db/
│   │   ├── dbConnection.js
│   │   └── models/
│   ├── src/
│   │   ├── middleware/
│   │   ├── modules/
│   │   └── utilities/
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── index.html
├── movies.html
├── movie.html
├── booking.html
├── checkout.html
├── success.html
├── my-bookings.html
├── auth.html
├── forgot-password.html
├── reset-password.html
└── admin.html
```

## Main Pages

- `index.html` — Home page
- `movies.html` — Movies list
- `movie.html?id=...` — Movie details and showtimes
- `booking.html` — Seat selection
- `checkout.html` — Booking checkout
- `success.html` — Booking confirmation
- `my-bookings.html` — User bookings
- `auth.html` — Login and registration
- `forgot-password.html` — Forgot password
- `reset-password.html` — Reset password
- `admin.html` — Admin dashboard

## Backend Architecture

The backend is organized into separate modules instead of keeping all logic in one file.

```text
backend/
├── db/
├── src/
│   ├── middleware/
│   ├── modules/
│   │   ├── users/
│   │   ├── auth/
│   │   ├── movies/
│   │   ├── showtimes/
│   │   └── bookings/
│   └── utilities/
└── index.js
```

The project uses REST APIs with HTTP methods such as:

- `GET`
- `POST`
- `PUT`
- `DELETE`

## Authentication and Authorization

The project uses JWT authentication.

Passwords are hashed using `bcrypt`.

Protected backend routes use authentication middleware, while admin-only operations also use the admin authorization middleware.

Example flow:

```text
Request
  ↓
verifyToken
  ↓
adminAuth
  ↓
Controller
  ↓
MongoDB
```

## Database

MongoDB is used with Mongoose.

Main models include:

- User
- Movie
- Screen
- Showtime
- Booking

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/joo-ali/nightmare-cinema-1.git
cd nightmare-cinema-1
```

### 2. Configure the backend

Open the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/NightmareCinema
JWT_SECRET=replace_with_a_strong_jwt_secret
EMAIL_TOKEN_SECRET=replace_with_a_strong_email_token_secret
EMAIL_USER=your_verified_sender_email
BREVO_API_KEY=your_brevo_api_key
FRONTEND_URL=http://127.0.0.1:5500
```

> Never upload the real `.env` file or secret API keys to GitHub.

### 3. Start MongoDB

Make sure MongoDB is running locally before starting the backend.

### 4. Run the backend

```bash
npm run dev
```

The backend should run on:

```text
http://localhost:3000
```

### 5. Run the frontend

Open the project using VS Code and run `index.html` with Live Server.

Example frontend URL:

```text
http://127.0.0.1:5500
```

## API Configuration

The current frontend JavaScript files use the deployed backend API:

```text
https://nightmare-cinema.vercel.app
```

For local backend testing, change the API URL in the frontend JavaScript files to:

```text
http://localhost:3000
```

Files that contain the API URL include:

- `js/app.js`
- `js/auth.js`
- `js/admin.js`
- `js/password.js`

## Admin Dashboard

The admin dashboard provides management functions for:

- Movies
- Screens
- Showtimes
- Bookings

Admin access is protected on both the frontend and backend.

The backend verifies the JWT token first and then checks that the authenticated user has the `admin` role.

## Security Notes

- Passwords are not stored in plain text.
- JWT is used for authenticated requests.
- Admin routes are protected by role-based authorization.
- `.env` should never be committed.
- `node_modules` should not be committed.
- Sensitive credentials and API keys must remain private.

## Git Workflow

The project is developed as a team using Git and GitHub.

Each project part can be developed in a separate branch and merged into `main` using a Pull Request.

Example branches:

```text
auth-users
movies-showtimes
booking-seats
admin
```

Recommended workflow:

```text
branch
  ↓
commit
  ↓
push
  ↓
pull request
  ↓
merge into main
```

## Notes

- Online payment fields are currently interface elements until a real payment gateway is integrated.
- The frontend and backend are connected through JavaScript `fetch()` requests.
- MongoDB stores the real application data used by the website.
