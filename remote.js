
var express = require('express');
var app = express();
var net = require('net');

var HOST =
            // 'localhost';
          '138.197.15.195';
var PORT = 3002;
var server = app.listen(PORT);
var io = require("socket.io")(server);

var path = require('path');
var fs = require('fs');
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})
var upload = multer({storage: storage});



console.log("Server listening on " + HOST + ":" + PORT);


app.use(express.static('public'));

var allowed = {};
var IPs = {};
var passwords = {};
var computers = {};
var sockets = {};

io.sockets.on('connection', function(socket){

  console.log(socket.id + " has connected");
  sockets[socket.id] = socket;

  socket.on('input', function(data){
    var computer = computers[IPs[socket.id]];
    if(computer){
      if(allowed[socket.id]){
        console.log(JSON.stringify(data,undefined,3));
        computer.write(JSON.stringify(data)+"\n");
      }else{
        socket.emit('status', 'You do not have access to this computer');
      }
    }else{
      socket.emit('status', 'This computer does not exist');
    }
  });

  socket.on('disconnect', function(){
    delete allowed[socket.id];
    delete IPs[socket.id];
    delete sockets[socket.id];
  });

  socket.on('changecomputer', function(data){
    var password = data.pass;
    var ip = data.ip;
    delete allowed[socket.id];
    if(computers[ip] && password == passwords[ip]){
      allowed[socket.id] = true;
      IPs[socket.id] = ip;
      socket.emit('status', "Connected");
    }else{
      if(computers[ip]){
        socket.emit('status', 'That password is incorrect');
      }else{
        socket.emit('status', 'That computer is not connected');
      }
    }

  });

});


net.createServer(function(sock){

  console.log(sock.remoteAddress + " has connected");
  computers[sock.remoteAddress] = sock;
  passwords[sock.remoteAddress] = "";

  var path = "uploads/" + sock.remoteAddress + ".jpg";
  fs.open(path, "wx", function (err, fd) {
    fs.close(fd, function (err) {
    });
});

  sock.on('data', function(data){
    data = data.toString("utf8").trim();
    passwords[sock.remoteAddress] = data;
  })

}).listen(PORT+1,HOST);

console.log("Server listening on " + HOST + ":" + (PORT+1));

process.on('uncaughtException', function (err) {
  console.log(err);
})


app.post('/upload', upload.single('userfile'), function(req, res){
  var response = { "response": "OK" };

  var IDs = Object.keys(sockets);
  for(var i =0 ; i < IDs.length; i++){
    var socket = sockets[IDs[i]];
    if(IPs[socket.id] == req.file.originalname.substring(0,req.file.originalname.length-4)){
      var ip = IPs[socket.id];
      if(ip && computers[ip] && allowed[socket.id]){
        fs.readFile(__dirname + '/uploads/'+ip+'.jpg', function(err, buf){
          var data = buf.toString('base64');
          this.emit('status','Sending image...');
          this.emit('screenshot', data);
        }.bind(socket));
      }
    }
  }

  res.end(JSON.stringify(response));

});
