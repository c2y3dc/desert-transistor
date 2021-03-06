var express = require('express');
var app = express();
var path = require('path');
var dir = path.resolve(__dirname + '/../client');
var controller = require('./controller');
var helpers = require('./helpers');
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');  
var bodyParser = require('body-parser');
var morgan = require('morgan');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
var voteRouter = express.Router();
app.use('/api', voteRouter);

///////////////////////////    DATABASE    ///////////////////////////
//uses the url from the config file to connect to Mongo Labs
var mongoUrl = require('./config');
//connects to database
mongoose.connect(mongoUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('Database Connected');
});

///////////////////////////    SOCKET.IO    ///////////////////////////
//connects to Socket.io
io.on('connection', function(socket){
  
  console.log('a user connected');
  //teacher can be notified to new connections. NOT complete
  io.emit("event", {it: "works"});
  //listen for students to click button and emit confusion event
  socket.on('student:confusion', function(data) {
  	console.log('CONFUSION DATA', data);
  	//add the incoming student data to the database
    helpers.addVote(data, function(data) {
  		console.log("confusion added:", data);
      //pass the data down to the teacher to be displayed in the graph
      io.sockets.emit('teacher:update', data);
  	});
  });
  socket.on('teacher:newUser', function (newStudent) {
    io.sockets.emit('teacher:addUser');
  });
  socket.on('threshold', function (timeStamp) {
    console.log(timeStamp);
    io.sockets.emit('teacher:threshold', timeStamp);
    // io.sockets.emit('teacher:addUser');
  });
});

///////////////////////////    STARTING SERVER    ///////////////////////////

app.use(express.static(dir));

http.listen(port, function(){
  console.log('listening on *:3000');
});

require('./routes')(voteRouter);
