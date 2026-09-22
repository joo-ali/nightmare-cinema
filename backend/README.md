# Nightmare Cinema Backend

Backend structure follows the same training approach: Express + MongoDB/Mongoose + modules + middleware + utilities.

## First run

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Make sure MongoDB is running locally.
4. Run `npm run dev`.
5. Open `http://localhost:3000/`.

Expected response:

```json
{
  "message": "Nightmare Cinema API is running",
  "cinema": "Royal Mall"
}
```
