import 'dotenv/config'; // must stay the first import: it loads .env
import app from './app.js';
import connectDB from './config/db.js';

const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing in server/.env: ${missing.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
