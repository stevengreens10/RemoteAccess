var socket;
var canvas;
var isAllowed = false;
var mobileInput;
var statusP;
function setup(){
    canvas = createCanvas(1366,768);
    canvas.parent("screen");
    document.oncontextmenu = function(){{
      return false;
    }}
    socket = io.connect("http://138.197.15.195:3002");
    // socket = io.connect("10.0.0.8:3002");

    statusP = createP("");
    statusP.parent("status")


    if(isMobile()){
      mobileInput = createInput("");
      mobileInput.id = "mobile";
    }

    var ipBox = createInput("");
    ipBox.elt.placeholder = "IP of computer";
    ipBox.parent("connect");
    var passBox = createInput("");
    passBox.elt.placeholder = "Password";
    passBox.parent("connect");
    var connectButton = createButton("Connect");
    connectButton.parent("connect");
    connectButton.mousePressed(function(){
      connectTo(ipBox.value(),passBox.value());
    });

    socket.on('screenshot', function(data){
      console.log("Received image");
      document.getElementById("image").src = "data:image/jpg;base64," + data;
    });

    socket.on('status', function(data){
      statusP.html(data);
    });
}

function connectTo(ip,password){
  var data = {
    pass: password,
    ip: ip
  }
  socket.emit('changecomputer', data);

  // requestImage();
  // setInterval(requestImage,300);
}

function requestImage(){
  socket.emit('requestimage', undefined);
}


function draw(){
  if(mobileInput){
    if(mobileInput.value() != ""){
      var character = mobileInput.value().toUpperCase().charCodeAt(mobileInput.value().length-1);

      var data = {
          type: "keypress",
          keyCode: character
      }

      socket.emit('input', data);

      data = {
          type: "keyrelease",
          keyCode: character
      }

      socket.emit('input', data);

      mobileInput.elt.value = "";
    }
  }
}

function mouseWheel(e){
  var data = {
    type: "mousescroll",
    amount: e.delta
  }
  socket.emit('input',data);
}
function mouseMoved(){
    if(mouseWithinBounds()){
        var data = {
            type: "mousemove",
            x: mouseX,
            y: mouseY
        }

        //socket.emit('input', data);
    }
    return false;
}

function mouseDragged(){
    if(mouseWithinBounds()){
      if(!isMobile()){
          var data = {
              type: "mousedrag",
              x: mouseX,
              y: mouseY
          }
          socket.emit('input', data);
        }
        return false;
    }
}

function mousePressed(){
    if(mouseWithinBounds()){
        var data = {
            type: "mousepress",
            button: mouseButton,
            x: mouseX,
            y: mouseY
        }

        socket.emit('input', data);
        return false;
    }

}

function mouseReleased(){
    if(mouseWithinBounds()){
        var data = {
            type: "mouserelease",
            button: mouseButton
        }

        socket.emit('input', data);
        return false;
    }
}

function keyPressed(){
    if(mouseWithinBounds()){
        var data = {
            type: "keypress",
            keyCode: keyCode
        }

        if(keyCode != 229) socket.emit('input', data);
        if(!isMobile()) return false;
  }
}

function keyReleased(){
  if(mouseWithinBounds()){
    var data = {
      type: "keyrelease",
      keyCode: keyCode
    }
    if(keyCode != 229) socket.emit('input' , data);
    if(!isMobile()) return false;
  }
}

function mouseWithinBounds(){
    return (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height);
}

function isMobile(){
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}
