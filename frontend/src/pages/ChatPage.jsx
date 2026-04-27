import { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar.jsx";
import RoomList from "../components/RoomList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { createSocket, emitWithAck } from "../lib/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import useTypingIndicator from "../hooks/useTypingIndicator.js";

export default function ChatPage() {
  const { userClaims, userProfile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const initialRoomsRetryRef = useRef(null);
  const currentUsername = userProfile?.username || userClaims?.email || "User";

  const activeRoom = useMemo(
    () => rooms.find((room) => Number(room.id) === Number(activeRoomId)) ?? null,
    [rooms, activeRoomId],
  );
  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];
  const { typingText, onTypingEvent, clearTypingForUsername, applyTypingSnapshot } =
    useTypingIndicator(
    activeRoomId,
    currentUsername,
    );
  const onTypingEventRef = useRef(onTypingEvent);
  const typingSnapshotRef = useRef(applyTypingSnapshot);
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => {
    onTypingEventRef.current = onTypingEvent;
  }, [onTypingEvent]);

  useEffect(() => {
    typingSnapshotRef.current = applyTypingSnapshot;
  }, [applyTypingSnapshot]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    const socketInstance = createSocket();
    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      setError("");
      setIsConnected(true);
      refreshRoomsWithRetry(socketInstance);
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
    socketInstance.on("messageUpdated", (updatedMessage) => {
      if (!updatedMessage) return;
      const roomId = Number(updatedMessage.roomId);
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map((message) =>
          Number(message.id) === Number(updatedMessage.id) ? updatedMessage : message,
        ),
      }));
    });

    socketInstance.on("userTyping", (event) => onTypingEventRef.current(event));
    socketInstance.on("typingSnapshot", (payload) => {
      if (!payload || Number(payload.roomId) !== Number(activeRoomIdRef.current)) return;
      typingSnapshotRef.current(payload.users);
    });

    return () => {
      if (initialRoomsRetryRef.current) {
        clearTimeout(initialRoomsRetryRef.current);
      }
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  async function refreshRooms(sourceSocket) {
    const currentSocket = sourceSocket ?? socketRef.current;
    if (!currentSocket || !currentSocket.connected) return false;
    setLoadingRooms(true);
    try {
      const result = await emitWithAck(currentSocket, "listRooms", {
        userId: userClaims?.sub,
      });
      setRooms(Array.isArray(result) ? result : []);
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoadingRooms(false);
    }
  }

  async function refreshRoomsWithRetry(sourceSocket, remainingAttempts = 4) {
    const ok = await refreshRooms(sourceSocket);
    if (ok) return;

    if (remainingAttempts <= 1) return;

    if (initialRoomsRetryRef.current) {
      clearTimeout(initialRoomsRetryRef.current);
    }

    initialRoomsRetryRef.current = setTimeout(() => {
      const currentSocket = sourceSocket ?? socketRef.current;
      if (!currentSocket || !currentSocket.connected) return;
      refreshRoomsWithRetry(currentSocket, remainingAttempts - 1);
    }, 1000);
  }

  async function createRoom(payload) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub) return;
    try {
      const room = await emitWithAck(currentSocket, "createRoom", {
        name: payload.name,
        authorId: userClaims.sub,
        isPrivate: Boolean(payload.isPrivate),
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
      const history = await emitWithAck(currentSocket, "findMessagesByRoom", {
        roomId,
        userId: userClaims.sub,
      });
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

  async function inviteToRoom(payload) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected) return;
    try {
      await emitWithAck(currentSocket, "inviteToRoom", payload);
      await refreshRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addReaction(messageId, type) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub || !activeRoomId) return;
    try {
      await emitWithAck(currentSocket, "addReaction", {
        messageId,
        roomId: activeRoomId,
        userId: userClaims.sub,
        type,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeReaction(messageId, type) {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected || !userClaims?.sub || !activeRoomId) return;
    try {
      await emitWithAck(currentSocket, "removeReaction", {
        messageId,
        roomId: activeRoomId,
        userId: userClaims.sub,
        type,
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
              onRefresh={() => refreshRooms()}
              onCreate={createRoom}
              onJoin={joinRoom}
              onInvite={inviteToRoom}
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
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
              currentUserId={userClaims?.sub}
            />
          </div>
        </div>
      </main>
    </>
  );
}
