import { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar.jsx";
import RoomList from "../components/RoomList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { createSocket, emitWithAck } from "../lib/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import useTypingIndicator from "../hooks/useTypingIndicator.js";

export default function ChatPage() {
  const { userClaims } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const currentUsername = userClaims?.email ?? "User";

  const activeRoom = useMemo(
    () => rooms.find((room) => Number(room.id) === Number(activeRoomId)) ?? null,
    [rooms, activeRoomId],
  );
  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];
  const { typingText, onTypingEvent, clearTypingForUsername } = useTypingIndicator(
    activeRoomId,
    currentUsername,
  );
  const onTypingEventRef = useRef(onTypingEvent);

  useEffect(() => {
    onTypingEventRef.current = onTypingEvent;
  }, [onTypingEvent]);

  useEffect(() => {
    const socketInstance = createSocket();
    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      setError("");
      setIsConnected(true);
      refreshRooms(socketInstance);
    });

    socketInstance.on("connect_error", () => {
      setError("Unable to connect to websocket server.");
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("newMessage", (message) => {
      const roomId = Number(message.roomId);
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));
      const authorName = message.user?.username || message.user?.email;
      clearTypingForUsername(authorName);
    });

    socketInstance.on("userTyping", (event) => onTypingEventRef.current(event));

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  async function refreshRooms(sourceSocket) {
    const currentSocket = sourceSocket ?? socketRef.current;
    if (!currentSocket || !currentSocket.connected) return;
    setLoadingRooms(true);
    try {
      const result = await emitWithAck(currentSocket, "listRooms", {});
      setRooms(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function createRoom(name) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub) return;
    try {
      const room = await emitWithAck(currentSocket, "createRoom", {
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
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub) return;
    try {
      setLoadingMessages(true);
      await emitWithAck(currentSocket, "joinRoom", {
        roomId,
        userId: userClaims.sub,
      });
      setActiveRoomId(roomId);
      const history = await emitWithAck(currentSocket, "findMessagesByRoom", { roomId });
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: Array.isArray(history) ? history : [] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage(content) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub || !activeRoomId) return;
    try {
      await emitWithAck(currentSocket, "sendMessage", {
        content,
        userId: userClaims.sub,
        roomId: activeRoomId,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function setTyping(isTyping) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !activeRoomId) return;

    currentSocket.emit("typing", {
      roomId: activeRoomId,
      username: currentUsername,
      isTyping,
    });
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
              loading={loadingRooms || !isConnected}
            />
          </div>
          <div className="col-12 col-lg-8">
            <ChatWindow
              activeRoom={activeRoom}
              messages={activeMessages}
              loadingMessages={loadingMessages}
              typingText={typingText}
              onSend={sendMessage}
              onTypingChange={setTyping}
            />
          </div>
        </div>
      </main>
    </>
  );
}
