const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = connectDB;
