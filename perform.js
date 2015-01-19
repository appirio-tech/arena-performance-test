var users = require("./users");
var io = require("socket.io-client");

var testHandler = function(user) {
    this.user = user;
    this.socket = io.connect("https://arenaws.topcoder.com", {"force new connection": true});
    var that = this;

    this.login = function() {
        that.socket.emit("LoginRequest", that.user);
    }

    this.moveToRoom = function(roomID, roomType) {
        that.socket.emit("MoveRequest", {roomID: roomID, roomType: roomType});
    }

    this.postChat = function(message) {
        that.socket.emit("ChatRequest", {msg: message, roomId: 11, scope: 1});
    }

    // Connect with the web socket and try to login
    this.socket.on("connect", function (resp) {
                    that.login();
                });

    // Receive the login response and move into lobby room
    this.socket.on("LoginResponse", function (resp) {
                    console.log("Logged in user " + that.user.username);
                    that.moveToRoom(11, 5);
                });

    // Receive room info and post to chat
    this.socket.on("RoomInfoResponse", function (resp) {
                    that.postChat("hello!");
                });

    this.socket.on("connect_error", function (resp) {
                    console.log("[ERROR] " + resp);
                });
}

for(var i = 0; i < users.length; i++) {
    var testHandlers = [];
    testHandlers.push(new testHandler(users[i]));
}