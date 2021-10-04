const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')


const app = express();
const server = http.createServer(app);
const io = socketio(server);




// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'BITCAMP Bot';

// Run when client connects                                        // socket.emit 클라이언트 단일  / broadcast 클라이언트 제외 모두 / io.emit 모두
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) =>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room)

        
         
        // Welcome current user
    socket.emit('message', formatMessage(botName,'Welcome to BIT Occasion!'))

    // Broadcast when a user connects
    socket.broadcast
        .to(user.room)
        .emit('message', formatMessage(botName,`${user.username} 님이 채팅방에 들어오셨습니다.`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) =>{
        const user = getCurrentUser(socket.id);

        io
        .to(user.room)
        .emit('message', formatMessage(user.username, msg));
    
    });

    // Runs when client disconnects
    socket.on('disconnect', ()=> {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} 님이 채팅방을 나가셨습니다.`));

              // Send users and room info
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        }

    });
    
});

const PORT = 3000 || process.env.PORT

server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

