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

const users: { userId: string; socketId: string }[] = []

const getRoom = ({
  userId,
  socketId,
}: {
  userId: string
  socketId: string
}) => {
  const userIndx = users.findIndex((user) => user.socketId === socketId)
  console.log(users[userIndx], userId)
  return '1'
}

const joinRoom = ({
  userId,
  socketId,
}: {
  userId: string
  socketId: string
}) => {
  users.push({ userId, socketId })
  return '1'
}

const leaveRoom = ({ socketId }: { socketId: string }) => {
  const userIndx = users.findIndex((user) => user.socketId === socketId)
  if (!userIndx) {
    return { userId: null }
  }
  const user = { ...users[userIndx] }
  users.splice(userIndx)
  return { userId: user.userId }
}

io.on('connection', (socket) => {
  socket.on('CanvasJoin', async (payload) => {
    console.log(`${payload.userId} joined`)
    const { userId } = payload
    joinRoom({ userId, socketId: socket.id })
    socket.join(getRoom({ userId, socketId: socket.id }))
  })

  socket.on('CanvasUpdate', async (payload) => {
    console.log(`${payload.userId} updated the canvas`)
    const { dataURL, userId } = payload

    socket.to(getRoom({ userId, socketId: socket.id })).emit('CanvasResponse', {
      dataURL,
    })
  })

  socket.on('disconnect', () => {
    const { userId } = leaveRoom({ socketId: socket.id })
    console.log(`${userId} leaved`)
  })
})

server.listen(env.PORT, () => {
  console.log(`listening on *:${env.PORT}`)
})
