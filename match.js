var io = require("socket.io-client");
var fs = require("fs");
var users = require("./users");
var config = require("./config");
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
    this.state = "";
    var that = this;
    this.problem = config.practiceProblems[0];

    // Connect with the web socket and try to login
    this.socket.on("connect", function (resp) {
        that.login();
    });

    this.login = function() {
        console.log(new Date() + " Sending login request for " + that.user.username);
        that.socket.emit("LoginRequest", that.user);
    }

    // Receive the login response and move into lobby room
    this.socket.on("LoginResponse", function (resp) {
        console.log(new Date() + " Logged in user " + that.user.username);

        that.state = "entering";
        //that.state = "entering-match";
        that.moveToRoom(config.chatRoomIds[Math.floor((Math.random() * 2))], config.chatRoomType);
    });

    this.moveToRoom = function(roomID, roomType) {
        that.socket.emit("MoveRequest", {roomID: roomID, roomType: roomType});
    }

    // Receive room info, post to chat, and open practice room
    this.socket.on("RoomInfoResponse", function (resp) {
        if(that.state === "entering") {
        	that.state = "registering";
            that.socket.emit("RegisterRequest", {roundID: config.matchRoundId, surveyData: []});
        } else if (that.state == "entering-match") {
       	    that.socket.emit("EnterRoundRequest", {roundID: config.matchRoundId});
       	    that.state = "in-match";

       	    console.log(new Date() + " " + that.user.username + " is in the match");

       	    that.socket.emit("OpenComponentForCodingRequest", {componentID: that.problem.practiceComponentId, handle: that.user.username});
        }
    });

    this.socket.on("OpenComponentResponse", function (resp) {
     	console.log(new Date() + " " + that.user.username + " opened the problem");
        that.compileProblem();
    });

    this.compileProblem = function() {
        if(that.state != 'dead') {
            console.log(new Date() + " " + that.user.username + " is compiling");
            that.socket.emit("CompileRequest", {componentID: that.problem.practiceComponentId, language: config.javaLanguageId, code: codes[that.problem.codeId]});
        }
    }

    this.socket.on("PopUpGenericResponse", function (resp) {
    	if(that.state === "registering") {
    		that.state = "registered";
    		if(resp.message == "You have successfully registered for the match." || resp.message == "You are already registered for Load Testing SRM 1") {
    			console.log(new Date() + " Registered " + that.user.username);
    		} else {
    			console.log(new Date() + " [ERROR] Registration failed for user " + that.user.username + " " + resp.message);
    		}
    	} else if (that.state == "in-match") {
            if(resp.message != "Your code compiled successfully.") {
                console.log(new Date() + " [ERROR] User " + that.user.username + " practice problem compilation failed: " + JSON.stringify(resp));
                that.state = 'dead';
            } else {
            	setTimeout(function() {
            		that.compileProblem();
            	}, Math.floor((Math.random() * 60000 * 5)));
            }
        }
	});

    this.postChat = function(message) {
        that.socket.emit("ChatRequest", {msg: message, roomId: config.chatRoomId, scope: config.chatGlobalScope});
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
