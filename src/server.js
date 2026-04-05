require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { setSocketServer } = require('./services/realtime');
const { verifyToken } = require('./utils/token');
const User = require('./models/User');
const logger = require('./utils/logger');

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const bearer = socket.handshake.auth?.token || socket.handshake.headers.authorization;
      const token = bearer && bearer.startsWith('Bearer ') ? bearer.slice(7) : bearer;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      User.findById(decoded.sub)
        .then((user) => {
          if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return next(new Error('Invalid token'));
          }

          socket.userId = decoded.sub;
          return next();
        })
        .catch(() => next(new Error('Invalid token')));
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId.toString());
  });

  setSocketServer(io);

  server.listen(port, () => {
    logger.info(`TaskManager API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
