const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users')
const app = express()
const server = http.createServer(app)

const io = socketio(server)
io.on('connection', (socket) => {
    console.log('new webSocket connection')

    socket.on('join', ({ username, room }, callback) => {

        const {error, user} = addUser({id: socket.id, username, room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username}
        has joined!`))
        callback()
        })
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('This message contains profane language')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        const url = `https://google.com/maps?q=${location.lat},${location.long}`
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
        }
    })
})

const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))
app.get('', (req, res) => {
    res.send()
})

server.listen(3000, () => {
    console.log('app is listening on port 3000')
})