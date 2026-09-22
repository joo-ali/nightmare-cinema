# Nightmare Cinema

Full-stack cinema ticket booking system for Nightmare Cinema at Royal Mall.

## Stack

- Frontend: HTML, CSS, Bootstrap 5, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT + bcrypt
- Email: Nodemailer

## Main features

- Register, email verification, login, forgot password and reset password
- Movies, movie details and real showtimes
- Dynamic seat maps based on screen configuration
- Atomic seat booking to reduce double-booking risk
- My Bookings and booking cancellation
- Booking confirmation email with booking code
- Offers and promo codes with specific valid booking dates
- Promo codes restricted to selected movies or all movies
- Admin dashboard for movies, screens, showtimes, offers and bookings

## Run

### Backend

1. Open `backend`.
2. Copy `.env.example` to `.env`.
3. Fill in the environment variables.
4. Run `npm install`.
5. Make sure MongoDB is running.
6. Run `npm run dev`.

The API runs on `https://nightmare-cinema.vercel.app/` by default.

### Frontend

Open the project folder with VS Code and run `index.html` using Live Server.

The default frontend URL used by CORS is:

`http://127.0.0.1:5500`

## Main pages

- `index.html` — Home
- `movies.html` — Movies
- `movie.html?id=...` — Movie details and showtimes
- `booking.html` — Seat selection
- `checkout.html` — Checkout and promo code
- `success.html` — Booking confirmation
- `my-bookings.html` — User bookings
- `offers.html` — Active and upcoming offers
- `auth.html` — Login and registration
- `forgot-password.html` — Forgot password
- `reset-password.html` — Reset password
- `admin.html` — Admin dashboard

## Notes

- `.env` is intentionally excluded from the project package.
- `node_modules` is intentionally excluded. Run `npm install` inside `backend`.
- Online payment fields are UI-only until a payment gateway is integrated.
