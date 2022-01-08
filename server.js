const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {UserJoin, getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botname = 'ChatCord Bot';
//Run when a client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username,room}) => {
        const user = UserJoin(socket.id,username,room);
        socket.join(user.room);
    //Welcome current user
    socket.emit('message', formatMessage(botname,'Welcome to chat cord'));

    //Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botname,`${user.username} joined`));
        //send users and room info
        io.to(user.room).emit('roomusers',{
        room: user.room,
        users: getRoomUsers(user.room)
        });
    });

    

    //Runs when client dissconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botname,`${user.username} has left the chat`));
            //send users and room info
            io.to(user.room).emit('roomusers',{
            room: user.room,
            users: getRoomUsers(user.room)
            });
        }
        
    });

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));