import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";
const JSON_HEADERS = { "Content-Type": "application/json" };

function randomInt() {
  return Math.floor(Math.random() * 1_000_000_000);
}

function decodeJwt(token) {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
}

async function registerUser(prefix) {
  const email = `${prefix}_${randomInt()}@test.dev`;
  const username = `${prefix}${randomInt().toString().slice(-4)}`;
  const color = `#${Math.floor(Math.random() * 16_777_215)
    .toString(16)
    .padStart(6, "0")}`;

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email,
      password: "test12345",
      username,
      color,
    }),
  });

  if (!response.ok) {
    throw new Error(`register failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    id: decodeJwt(data.access_token).sub,
    username,
  };
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(API_URL, { transports: ["websocket"] });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(6000).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error(`${event} timeout`));
        return;
      }
      resolve(response);
    });
  });
}

async function run() {
  const owner = await registerUser("owner");
  const guest = await registerUser("guest");

  const ownerSocket = await connectSocket();
  const guestSocket = await connectSocket();

  const room = await emitWithAck(ownerSocket, "createRoom", {
    name: `room_${randomInt()}`,
    authorId: owner.id,
    isPrivate: true,
  });

  const guestRoomsBeforeInvite = await emitWithAck(guestSocket, "listRooms", {
    userId: guest.id,
  });
  const seesPrivateRoomBeforeInvite = (guestRoomsBeforeInvite || []).some(
    (visibleRoom) => Number(visibleRoom.id) === Number(room.id),
  );
  if (seesPrivateRoomBeforeInvite) {
    throw new Error("private room should not be visible before invite");
  }

  await emitWithAck(ownerSocket, "sendMessage", {
    content: "before invite",
    userId: owner.id,
    roomId: room.id,
  });

  await emitWithAck(ownerSocket, "inviteToRoom", {
    roomId: room.id,
    username: guest.username,
    canSeeHistory: false,
  });

  const guestRoomsAfterInvite = await emitWithAck(guestSocket, "listRooms", {
    userId: guest.id,
  });
  const seesPrivateRoomAfterInvite = (guestRoomsAfterInvite || []).some(
    (visibleRoom) => Number(visibleRoom.id) === Number(room.id),
  );
  if (!seesPrivateRoomAfterInvite) {
    throw new Error("private room should be visible after invite");
  }

  await emitWithAck(guestSocket, "joinRoom", {
    roomId: room.id,
    userId: guest.id,
  });

  const firstHistory = await emitWithAck(guestSocket, "findMessagesByRoom", {
    roomId: room.id,
    userId: guest.id,
  });

  if (!Array.isArray(firstHistory) || firstHistory.length !== 0) {
    throw new Error(
      `history restriction failed, expected 0, got ${Array.isArray(firstHistory) ? firstHistory.length : "non-array"}`,
    );
  }

  await emitWithAck(ownerSocket, "sendMessage", {
    content: "after invite",
    userId: owner.id,
    roomId: room.id,
  });

  const secondHistory = await emitWithAck(guestSocket, "findMessagesByRoom", {
    roomId: room.id,
    userId: guest.id,
  });

  if (!Array.isArray(secondHistory) || secondHistory.length < 1) {
    throw new Error("history after join failed");
  }

  const targetMessage = secondHistory[secondHistory.length - 1];

  const updatedWithReaction = await emitWithAck(guestSocket, "addReaction", {
    messageId: targetMessage.id,
    userId: guest.id,
    roomId: room.id,
    type: "LIKE",
  });

  const likeCountAfterAdd = (updatedWithReaction.reactions || []).filter(
    (reaction) => reaction.type === "LIKE",
  ).length;

  if (likeCountAfterAdd < 1) {
    throw new Error("reaction add failed");
  }

  const updatedAfterRemove = await emitWithAck(guestSocket, "removeReaction", {
    messageId: targetMessage.id,
    userId: guest.id,
    roomId: room.id,
    type: "LIKE",
  });

  const likeCountAfterRemove = (updatedAfterRemove.reactions || []).filter(
    (reaction) => reaction.type === "LIKE",
  ).length;

  if (likeCountAfterRemove !== 0) {
    throw new Error("reaction remove failed");
  }

  ownerSocket.disconnect();
  guestSocket.disconnect();

  console.log(`PASS room=${room.id}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
