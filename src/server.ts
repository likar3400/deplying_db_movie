import 'dotenv/config';
import app from './app.js'; 
import { connectDB } from './config/database.js'; 
import { seedMovies } from './schemas/seed.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    seedMovies();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();