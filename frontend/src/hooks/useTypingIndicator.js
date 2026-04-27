import { useEffect, useMemo, useRef, useState } from "react";

export default function useTypingIndicator(activeRoomId, currentUsername) {
  const [typingUsers, setTypingUsers] = useState({});
  const timersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setTypingUsers({});
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
  }, [activeRoomId]);

  function onTypingEvent(event) {
    if (!event?.username || event.username === currentUsername) {
      return;
    }

    if (timersRef.current.has(event.username)) {
      clearTimeout(timersRef.current.get(event.username));
    }

    if (!event.isTyping) {
      timersRef.current.delete(event.username);
      setTypingUsers((prev) => {
        if (!prev[event.username]) return prev;
        const next = { ...prev };
        delete next[event.username];
        return next;
      });
      return;
    }

    setTypingUsers((prev) => ({ ...prev, [event.username]: true }));
  }

  function clearTypingForUsername(username) {
    if (!username) return;
    if (timersRef.current.has(username)) {
      clearTimeout(timersRef.current.get(username));
      timersRef.current.delete(username);
    }
    setTypingUsers((prev) => {
      if (!prev[username]) return prev;
      const next = { ...prev };
      delete next[username];
      return next;
    });
  }

  function applyTypingSnapshot(users) {
    if (!Array.isArray(users)) {
      setTypingUsers({});
      return;
    }

    const next = {};
    for (const username of users) {
      if (!username || username === currentUsername) continue;
      next[username] = true;
    }
    setTypingUsers(next);
  }

  const typingText = useMemo(() => {
    const names = Object.keys(typingUsers);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} est en train d'ecrire`;
    if (names.length === 2) return `${names[0]} et ${names[1]} sont en train d'ecrire`;
    return `${names[0]}, ${names[1]} et ${names.length - 2} autres sont en train d'ecrire`;
  }, [typingUsers]);

  return { typingText, onTypingEvent, clearTypingForUsername, applyTypingSnapshot };
}
