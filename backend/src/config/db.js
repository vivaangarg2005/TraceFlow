const mongoose = require('mongoose');

/**
 * Connect to MongoDB with robust error handling and lifecycle listeners
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    console.info('👉 Please copy backend/.env.example to backend/.env and provide your MongoDB Atlas connection string.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // Timeout after 8 seconds if server cannot be reached
    });

    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host} (Database: ${conn.connection.name})`);

    // Connection lifecycle events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination (SIGINT)');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.info('💡 Tip: If using MongoDB Atlas, check that:');
    console.info('   1. Your IP address is added to Atlas Network Access whitelist (or 0.0.0.0/0 for dev).');
    console.info('   2. Your database user username and password in MONGODB_URI are correct.');
    console.info('   3. Special characters in your password are URL encoded (e.g., @ as %40).');
    process.exit(1);
  }
};

module.exports = connectDB;
