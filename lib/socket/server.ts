import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
      console.log(`[Socket] ${socket.id} joined conv:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("join:agent", (agentId: string) => {
      socket.join(`agent:${agentId}`);
    });

    socket.on("join:feed", () => {
      socket.join("feed");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitNewMessage(conversationId: string, message: unknown) {
  io?.to(`conv:${conversationId}`).emit("new:message", message);
}

export function emitNewSnap(snap: unknown) {
  io?.to("feed").emit("new:snap", snap);
}

export function emitAgentUpdate(agentId: string, update: unknown) {
  io?.to(`agent:${agentId}`).emit("agent:update", update);
}

export function emitDramaEvent(event: unknown) {
  io?.to("feed").emit("drama:event", event);
}

export function emitActivityFeed(activity: unknown) {
  io?.to("feed").emit("activity", activity);
}
