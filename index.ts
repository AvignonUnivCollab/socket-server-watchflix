import express from "express"
import http from "http"
import { Server, Socket } from "socket.io"
import cors from "cors"

const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

/**
 * État global des salons
 * roomId -> state
 */
type RoomState = {
  videoId: number | null
  isPlaying: boolean
  currentTime: number
}

const roomsState = new Map<string, RoomState>()

io.on("connection", (socket: Socket) => {
  console.log("Client connecté :", socket.id)

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId)
    console.log(`${socket.id} rejoint le salon ${roomId}`)

    // Envoyer l'état actuel au nouvel utilisateur
    const state = roomsState.get(roomId)
    if (state) {
      socket.emit("sync-state", state)
    }
  })

  socket.on("video-action", ({ roomId, action }) => {
    console.log("Action vidéo :", action)

    // Sauvegarde de l'état serveur
    roomsState.set(roomId, {
      videoId: action.videoId,
      isPlaying: action.type === "play",
      currentTime: action.time ?? 0,
    })

    // Broadcast à tous sauf l'émetteur
    //socket.to(roomId).emit("video-action", action)
    io.to(roomId).emit("video-action", action)
  })

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId)
    console.log(`${socket.id} quitte le salon ${roomId}`)
  })

  socket.on("disconnect", () => {
    console.log("Client déconnecté :", socket.id)
  })
})

server.listen(3001, () => {
  console.log("Socket.IO server lancé sur http://localhost:3001")
})
