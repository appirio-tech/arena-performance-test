var users = require("./users");
var config = require("./config");
var io = require("socket.io-client");
var fs = require("fs");
var numberOfUsers = 20;
var userOffset = 0;
var testHandlers = [];


if(process.argv && process.argv[2] && process.argv[3]) {
    numberOfUsers = Number(process.argv[2]);
    userOffset = Number(process.argv[3]);
}

console.log(numberOfUsers);
console.log(userOffset);

var codes = [];

fs.readFile("./ABCPath.java", 'utf8', function(err, data) {
  if (err) throw err;
  codes["ABCPath"] = data;
});

fs.readFile("./ASeries.java", 'utf8', function(err, data) {
  if (err) throw err;
  codes["ASeries"] = data;
});

var testHandler = function(user) {

    this.user = user;
    this.socket = io.connect("https://arenaws.topcoder.com", {"force new connection": true});
    this.state;

    var problemIndex = Math.floor((Math.random() * 2));

    this.problem = config.practiceProblems[problemIndex];
    this.problemCode = codes[problemIndex];

    var that = this;

    this.login = function() {
        console.log(new Date() + " Sending login request for " + that.user.username);
        that.socket.emit("LoginRequest", that.user);
    }

    this.moveToRoom = function(roomID, roomType) {
        that.socket.emit("MoveRequest", {roomID: roomID, roomType: roomType});
    }

    this.postChat = function(message) {
        that.socket.emit("ChatRequest", {msg: message, roomId: config.chatRoomId, scope: config.chatGlobalScope});
    }

    this.openPracticeProblem = function(componentID) {
        that.socket.emit("OpenComponentForCodingRequest", {componentID: componentID, handle: that.user.username});
    }

    this.compilePracticeProblem = function() {
        if(that.state != 'dead') {
            console.log(new Date() + " " + that.user.username + " is compiling");
            that.socket.emit("CompileRequest", {componentID: that.problem.practiceComponentId, language: config.javaLanguageId, code: codes[that.problem.codeId]});
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
                    console.log(new Date() + " Logged in user " + that.user.username);

                    that.state = "entering";
                    that.moveToRoom(config.chatRoomId, config.chatRoomType);
                });

    // Receive room info, post to chat, and open practice room
    this.socket.on("RoomInfoResponse", function (resp) {
                    if(that.state === "entering") {
                        //that.postChat("hello!");
                        that.state = "practicing";
                        setTimeout(function() {
                            that.moveToRoom(that.problem.practiceRoomId, that.problem.practiceRoomType);    
                        }, Math.floor((Math.random() * 60000 * 10)));
                    } else if (that.state === "practicing") {
                        that.openPracticeProblem(that.problem.practiceComponentId);
                    }
                });

    this.socket.on("OpenComponentResponse", function (resp) {
                    that.compilePracticeProblem(that.problem.practiceComponentId, config.javaLanguageId, that.problemCode);
                });

    this.socket.on("PopUpGenericResponse", function (resp) {
                    if(resp.message != "Your code compiled successfully.") {
                        console.log(new Date() + " [ERROR] User " + that.user.username + " practice problem compilation failed: " + JSON.stringify(resp));
                        that.state = 'dead';
                        //new testHandler(that.user);
                    } else {
                        that.socket.emit("CloseProblemRequest", {problemID: that.problem.practiceComponentId});
                        that.state = "entering";
                        that.moveToRoom(config.chatRoomId, config.chatRoomType);
                    }
                });

    this.socket.on("connect_error", function (resp) {
                    console.log(new Date() + " [ERROR] " + resp);
                });

    this.socket.on("KeepAliveResponse", function (resp) {
                });

    this.keepAlive();
}

function countConnection() {
    var result = 0;

    for(var i = 0; i < testHandlers.length; i++) {
        if(testHandlers[i].state != 'dead') {
            result++;
        }
    }

    console.log(result + " active connections");

    setTimeout(countConnection, 30000);
}

for(var i = userOffset; i < users.length && i < (numberOfUsers + userOffset); i++) {
    testHandlers.push(new testHandler(users[i]));

}

countConnection();

