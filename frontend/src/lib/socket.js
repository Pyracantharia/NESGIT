import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";

export function createSocket() {
  return io(WS_URL, {
    transports: ["websocket"],
  });
}

export function emitWithAck(socket, event, payload, timeout = 6000) {
  return new Promise((resolve, reject) => {
    socket.timeout(timeout).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error(`Socket timeout on ${event}`));
        return;
      }
      resolve(response);
    });
  });
}
