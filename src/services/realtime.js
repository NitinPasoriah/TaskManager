let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToUser(userId, eventName, payload) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(userId.toString()).emit(eventName, payload);
}

module.exports = { setSocketServer, emitToUser };
