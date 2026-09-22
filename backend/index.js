import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dbConnection } from "./db/dbConnection.js";
import { AppError } from "./src/utilities/AppError.js";
import { errorHandling } from "./src/middleware/errorHandling.js";
import { userRoutes } from "./src/modules/users/users.routes.js";
import { passwordRoutes } from "./src/modules/auth/password.routes.js";
import { movieRoutes } from "./src/modules/movies/movies.routes.js";
import { screenRoutes } from "./src/modules/showtimes/screens.routes.js";
import { showtimeRoutes } from "./src/modules/showtimes/showtimes.routes.js";
import { bookingRoutes } from "./src/modules/bookings/bookings.routes.js";
import { offerRoutes } from "./src/modules/offers/offers.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://127.0.0.1:5500"
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Nightmare Cinema API is running",
    cinema: "Royal Mall"
  });
});

app.use(userRoutes);
app.use(passwordRoutes);
app.use(movieRoutes);
app.use(screenRoutes);
app.use(showtimeRoutes);
app.use(bookingRoutes);
app.use(offerRoutes);

app.use((req, res, next) => {
  next(new AppError("url not found", 404));
});

app.use(errorHandling);

const port = process.env.PORT || 3000;

await dbConnection();

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
