import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { ClientToServerEvents } from './events/client-to-server'
import { ServerToClientEvents } from './events/server-to-client'

import { env } from './env'

const app = express()
const server = http.createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const users: { userId: string; socketId: string; roomId: string }[] = []
const roomCanvas = new Map<string, string>()

const getAvailableRoom = () => {
  return '1'
}

const getUserRoom = ({ userId }: { userId: string }) => {
  const user = users.find((user) => user.userId === userId)
  if (!user) {
    // console.log('getUserRoom', userId, users)
    console.error('cannot find user')
    return '1'
  }
  return user.roomId
}

const joinRoom = ({
  userId,
  socketId,
}: {
  userId: string
  socketId: string
}) => {
  const roomId = getAvailableRoom()
  users.push({ userId, socketId, roomId })
  return roomId
}

const leaveRoom = ({ socketId }: { socketId: string }) => {
  const userIndx = users.findIndex((user) => user.socketId === socketId)
  if (userIndx === -1) {
    return { userId: null }
  }
  const user = { ...users[userIndx] }
  users.splice(userIndx, 1)
  return { userId: user.userId }
}

io.on('connection', (socket) => {
  socket.on('CanvasJoin', async (payload) => {
    console.log(`${payload.userId} joined`)
    const { userId } = payload

    const roomId = joinRoom({ userId, socketId: socket.id })
    socket.join(roomId)

    socket.emit('CanvasResponse', {
      dataURL: roomCanvas.get(roomId) || '',
    })
  })

  socket.on('CanvasUpdate', async (payload) => {
    const { dataURL, userId } = payload
    const roomId = getUserRoom({ userId })
    roomCanvas.set(roomId, dataURL)

    socket.to(roomId).emit('CanvasResponse', {
      dataURL,
    })
  })

  socket.on('disconnect', () => {
    console.log('someone leave', socket.id)
    const { userId } = leaveRoom({ socketId: socket.id })
    console.log(`${userId} leaved`)
  })
})

server.listen(env.PORT, () => {
  console.log(`listening on *:${env.PORT}`)
})
