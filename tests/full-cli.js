import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import io from "socket.io-client";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const WS_URL = process.env.WS_URL ?? API_URL;

const rl = createInterface({ input, output });

let token = null;
let userId = null;
let email = null;
let socket = null;
let currentRoomId = null;

function decodeJwtPayload(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payloadBase64.padEnd(
    payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
    "=",
  );
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      data.message
        ? Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message
        : `HTTP ${response.status}`,
    );
  }

  return data;
}

function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error("Socket is not connected"));
      return;
    }

    socket.timeout(5000).emit(event, payload, (err, response) => {
      if (err) {
        reject(new Error(`Socket timeout on ${event}`));
        return;
      }
      resolve(response);
    });
  });
}

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function registerFlow() {
  const registerEmail = await ask("email: ");
  const registerUsername = await ask("username: ");
  const registerPassword = await ask("password: ");
  const registerColor = await ask("color: ");

  const result = await postJson("/auth/register", {
    email: registerEmail,
    username: registerUsername,
    password: registerPassword,
    color: registerColor,
  });

  token = result.access_token;
  const payload = decodeJwtPayload(token);
  userId = payload.sub;
  email = payload.email;
  console.log(`Registered and authenticated as ${email} (${userId}).`);
}

async function loginFlow() {
  const loginEmail = await ask("email: ");
  const loginPassword = await ask("password: ");

  const result = await postJson("/auth/login", {
    email: loginEmail,
    password: loginPassword,
  });

  token = result.access_token;
  const payload = decodeJwtPayload(token);
  userId = payload.sub;
  email = payload.email;
  console.log(`Authenticated as ${email} (${userId}).`);
}

async function connectSocket() {
  if (socket?.connected) {
    return;
  }

  socket = io(WS_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log(`Socket connected (${socket.id}).`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected.");
  });

  socket.on("newMessage", (message) => {
    const roomLabel =
      typeof message.roomId === "number" ? `room ${message.roomId}` : "room ?";
    console.log(
      `\n[newMessage][${roomLabel}] ${message.userId}: ${message.content}`,
    );
  });

  socket.on("userTyping", (typing) => {
    const state = typing.isTyping ? "is typing" : "stopped typing";
    console.log(`\n[typing] ${typing.username} ${state}`);
  });

  socket.on("error", (err) => {
    console.log("Socket error:", err);
  });

  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
}

async function listRoomsFlow() {
  const rooms = await emitAck("listRooms", {});
  if (!Array.isArray(rooms) || rooms.length === 0) {
    console.log("No rooms available.");
    return;
  }

  console.log("\nRooms:");
  for (const room of rooms) {
    const participantCount = Array.isArray(room.participants)
      ? room.participants.length
      : 0;
    console.log(
      `- id=${room.id} name="${room.name ?? "unnamed"}" participants=${participantCount}`,
    );
  }
}

async function createRoomFlow() {
  const name = await ask("room name: ");
  const room = await emitAck("createRoom", { name, authorId: userId });
  currentRoomId = room.id;
  console.log(`Created room ${room.id} and joined it.`);
}

async function joinRoomFlow() {
  const roomIdRaw = await ask("room id to join: ");
  const roomId = Number(roomIdRaw);
  if (Number.isNaN(roomId)) {
    console.log("Invalid room id.");
    return;
  }

  await emitAck("joinRoom", { roomId, userId });
  currentRoomId = roomId;
  console.log(`Joined room ${roomId}.`);
}

async function historyFlow() {
  if (!currentRoomId) {
    console.log("Join a room first.");
    return;
  }

  const messages = await emitAck("findMessagesByRoom", { roomId: currentRoomId });
  if (!Array.isArray(messages) || messages.length === 0) {
    console.log("No messages yet in current room.");
    return;
  }

  console.log(`\nHistory for room ${currentRoomId}:`);
  for (const msg of messages) {
    const author = msg.user?.username ?? msg.userId;
    console.log(`- ${author}: ${msg.content}`);
  }
}

async function sendMessageFlow() {
  if (!currentRoomId) {
    console.log("Join a room first.");
    return;
  }

  const content = await ask("message: ");
  if (!content) {
    console.log("Empty message skipped.");
    return;
  }

  await emitAck("sendMessage", { userId, content, roomId: currentRoomId });
}

async function typingFlow() {
  if (!currentRoomId) {
    console.log("Join a room first.");
    return;
  }

  await emitAck("typing", {
    roomId: currentRoomId,
    username: email ?? userId,
    isTyping: true,
  });
  setTimeout(() => {
    if (!socket?.connected) {
      return;
    }
    socket.emit("typing", {
      roomId: currentRoomId,
      username: email ?? userId,
      isTyping: false,
    });
  }, 1000);
}

async function authenticatedLoop() {
  await connectSocket();
  let running = true;

  while (running) {
    console.log("\nActions:");
    console.log("1) refresh/list rooms");
    console.log("2) create room");
    console.log("3) join room");
    console.log("4) show current room history");
    console.log("5) send message");
    console.log("6) send typing signal");
    console.log("7) logout");
    console.log("8) quit");

    const choice = await ask("> ");

    try {
      if (choice === "1") await listRoomsFlow();
      else if (choice === "2") await createRoomFlow();
      else if (choice === "3") await joinRoomFlow();
      else if (choice === "4") await historyFlow();
      else if (choice === "5") await sendMessageFlow();
      else if (choice === "6") await typingFlow();
      else if (choice === "7") {
        running = false;
        token = null;
        userId = null;
        email = null;
        currentRoomId = null;
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      } else if (choice === "8") {
        process.exit(0);
      } else {
        console.log("Unknown choice.");
      }
    } catch (error) {
      console.log("Action failed:", error.message);
    }
  }
}

async function main() {
  while (true) {
    try {
      console.log("\nWelcome to chat CLI");
      console.log("1) register");
      console.log("2) login");
      console.log("3) quit");
      const choice = await ask("> ");

      if (choice === "1") {
        await registerFlow();
        await authenticatedLoop();
      } else if (choice === "2") {
        await loginFlow();
        await authenticatedLoop();
      } else if (choice === "3") {
        break;
      } else {
        console.log("Unknown choice.");
      }
    } catch (error) {
      console.log("Error:", error.message);
    }
  }

  if (socket) {
    socket.disconnect();
  }
  rl.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
