var users = require("./users");
var config = require("./config");
var io = require("socket.io-client");

var testHandler = function(user) {
    this.user = user;
    this.socket = io.connect("https://arenaws.topcoder.com", {"force new connection": true});
    this.state;

    var that = this;

    this.login = function() {
        that.socket.emit("LoginRequest", that.user);
    }

    this.moveToRoom = function(roomID, roomType) {
        that.socket.emit("MoveRequest", {roomID: roomID, roomType: roomType});
    }

    this.postChat = function(message) {
        that.socket.emit("ChatRequest", {msg: message, roomId: config.chatRoomId, scope: config.chatGlobalScope});
    }

    this.openPracticeProblem = function(componentId) {
        that.socket.emit("OpenComponentForCodingRequest", {componentID: config.practiceComponentId, handle: that.user.username});
    }

    // Connect with the web socket and try to login
    this.socket.on("connect", function (resp) {
                    that.login();
                });

    // Receive the login response and move into lobby room
    this.socket.on("LoginResponse", function (resp) {
                    console.log("Logged in user " + that.user.username);

                    that.state = "entering";
                    that.moveToRoom(config.chatRoomId, config.chatRoomType);
                });

    // Receive room info, post to chat, and open practice room
    this.socket.on("RoomInfoResponse", function (resp) {
                    if(that.state === "entering") {
                        that.postChat("hello!");
                        that.state = "practicing";
                        that.moveToRoom(config.practiceRoomId, config.practiceRoomType);
                    } else if (that.state === "practicing") {
                        that.openPracticeProblem(config.practiceRoundId, config.practiceComponentId, config.practiceDivisionId);
                    }
                });

    this.socket.on("OpenComponentResponse", function (resp) {
                    console.log("component opened");
                });


    this.socket.on("connect_error", function (resp) {
                    console.log("[ERROR] " + resp);
                });
}

for(var i = 0; i < users.length; i++) {
    var testHandlers = [];
    testHandlers.push(new testHandler(users[i]));
}