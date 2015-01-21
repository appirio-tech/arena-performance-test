var users = require("./users");
var config = require("./config");
var io = require("socket.io-client");
var fs = require("fs");
var numberOfUsers = 20;
var userOffset = 0;

if(process.argv && process.argv[2] && process.argv[3]) {
    numberOfUsers = Number(process.argv[2]);
    userOffset = Number(process.argv[3]);
}

console.log(numberOfUsers);
console.log(userOffset);

var ABCPathCode = "";

fs.readFile("./ABCPath.java", 'utf8', function(err, data) {
  if (err) throw err;
  ABCPathCode = data;
});

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

    this.compilePracticeProblem = function(componentID, languageID, code) {
        if(that.state != 'dead') {
            setTimeout (function() {
                console.log(that.user.username + " is compiling");
                that.socket.emit("CompileRequest", {componentID: componentID, language: languageID, code: code});
            }, Math.floor((Math.random() * 60000 * 10)));
        }
    }

    // Keep alive request / response
    this.keepAlive = function() {
        if(that.state != 'dead') {
            setTimeout(function() {
                that.socket.emit("KeepAliveRequest", {});
                that.keepAlive();
            }, 20000);
        }
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
                    that.compilePracticeProblem(config.practiceComponentId, config.javaLanguageId, ABCPathCode);
                });

    this.socket.on("PopUpGenericResponse", function (resp) {
                    if(resp.message != "Your code compiled successfully.") {
                        console.log("[ERROR] User " + that.user.username + " practice problem compilation failed: " + JSON.stringify(resp));
                        that.state = 'dead';
                        new testHandler(that.user);
                    } else {
                        that.compilePracticeProblem(config.practiceComponentId, config.javaLanguageId, ABCPathCode);
                    }
                });

    this.socket.on("connect_error", function (resp) {
                    console.log("[ERROR] " + resp);
                });

    this.socket.on("KeepAliveResponse", function (resp) {
                });

    this.keepAlive();
}

for(var i = userOffset; i < users.length && i < (numberOfUsers + userOffset); i++) {
    var testHandlers = [];
    testHandlers.push(new testHandler(users[i]));
}
