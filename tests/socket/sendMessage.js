import io from "socket.io-client";

const WS_URL = "http://localhost:3000";
const ROOM_ID = Number(process.env.ROOM_ID ?? "1");
const USER_ID =
  process.env.USER_ID ?? "a4faf605-76d0-4f45-ae04-4ed6ac9170ff";

const messageData = {
  userId: USER_ID,
  content: "Test Message",
  roomId: ROOM_ID,
};

function sendMessage() {
  const socket = io(WS_URL);

  socket.on("connect", () => {
    socket.emit(
      "joinRoom",
      { roomId: ROOM_ID, userId: USER_ID },
      (joinResponse) => {
        console.log("Join room response:", joinResponse);
        socket.emit("sendMessage", messageData);
        console.log("Message envoyé:", messageData);
      },
    );
  });

  socket.on("newMessage", (message) => {
    console.log("Message reçu:", message);
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    console.log("Déconnecté du serveur");
    process.exit(0);
  });

  socket.on("error", (error) => {
    console.error("Erreur socket:", error);
    process.exit(1);
  });

  setTimeout(() => {
    socket.disconnect();
  }, 10000);
}

sendMessage();
