"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      path: "/api/socketio",
      autoConnect: false,
    });
  }
  return socket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    if (!s.connected) {
      s.connect();
    } else {
      setConnected(true);
    }

    return () => {
      s.off("connect");
      s.off("disconnect");
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join:conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave:conversation", conversationId);
  }, []);

  const joinFeed = useCallback(() => {
    socketRef.current?.emit("join:feed");
  }, []);

  const onNewMessage = useCallback(
    (callback: (message: unknown) => void) => {
      socketRef.current?.on("new:message", callback);
      return () => {
        socketRef.current?.off("new:message", callback);
      };
    },
    []
  );

  const onNewSnap = useCallback(
    (callback: (snap: unknown) => void) => {
      socketRef.current?.on("new:snap", callback);
      return () => {
        socketRef.current?.off("new:snap", callback);
      };
    },
    []
  );

  const onDrama = useCallback(
    (callback: (event: unknown) => void) => {
      socketRef.current?.on("drama:event", callback);
      return () => {
        socketRef.current?.off("drama:event", callback);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    connected,
    joinConversation,
    leaveConversation,
    joinFeed,
    onNewMessage,
    onNewSnap,
    onDrama,
  };
}
