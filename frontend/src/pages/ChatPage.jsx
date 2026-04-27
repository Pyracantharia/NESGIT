import { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar.jsx";
import RoomList from "../components/RoomList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { createSocket, emitWithAck } from "../lib/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChatPage() {
  const { userClaims } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [error, setError] = useState("");

  const activeRoom = useMemo(
    () => rooms.find((room) => Number(room.id) === Number(activeRoomId)) ?? null,
    [rooms, activeRoomId],
  );
  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];

  useEffect(() => {
    const socketInstance = createSocket();
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setError("");
    });

    socketInstance.on("connect_error", () => {
      setError("Unable to connect to websocket server.");
    });

    socketInstance.on("newMessage", (message) => {
      const roomId = Number(message.roomId);
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, []);

  async function refreshRooms() {
    if (!socket) return;
    try {
      const result = await emitWithAck(socket, "listRooms", {});
      setRooms(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createRoom(name) {
    if (!socket || !userClaims?.sub) return;
    try {
      const room = await emitWithAck(socket, "createRoom", {
        name,
        authorId: userClaims.sub,
      });
      setActiveRoomId(room.id);
      await refreshRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinRoom(roomId) {
    if (!socket || !userClaims?.sub) return;
    try {
      await emitWithAck(socket, "joinRoom", {
        roomId,
        userId: userClaims.sub,
      });
      setActiveRoomId(roomId);
      const history = await emitWithAck(socket, "findMessagesByRoom", { roomId });
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: Array.isArray(history) ? history : [] }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(content) {
    if (!socket || !userClaims?.sub || !activeRoomId) return;
    try {
      await emitWithAck(socket, "sendMessage", {
        content,
        userId: userClaims.sub,
        roomId: activeRoomId,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <AppNavbar />
      <main className="container pb-4">
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <RoomList
              rooms={rooms}
              activeRoomId={activeRoomId}
              onRefresh={refreshRooms}
              onCreate={createRoom}
              onJoin={joinRoom}
            />
          </div>
          <div className="col-12 col-lg-8">
            <ChatWindow activeRoom={activeRoom} messages={activeMessages} onSend={sendMessage} />
          </div>
        </div>
      </main>
    </>
  );
}
