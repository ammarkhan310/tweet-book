//General imports
var express = require('express');
var cors = require('cors');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json'));

//Auth imports
let verifyToken = require('./middleware/authorize');

//Database imports
var mongoose = require('mongoose');
var Users = require('./models/user_model');
var Posts = require('./models/post_model');
var Logins = require('./models/login_model');
var Comments = require('./models/comment_model');

//router imports
var default_router = require('./routes/index');
var getuser = require('./routes/getuser');
var getpost = require('./routes/getpost');
var adduser = require('./routes/adduser');
var login = require('./routes/login');
var addfriend = require('./routes/addfriend');
var submitpost = require('./routes/submitpost');
var submitcomment = require('./routes/submitcomment');
const Messages = require('./models/message_model');

var app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

//connect to mongodb
mongoose.connect(config.db_uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, function(error){
	if(error){
		console.log("Could not connect to database");
	}else{

		console.log("Connected to MongoDB");
	}
})

//Routing
app.use(default_router);
app.use(getuser);
app.use(getpost);
app.use(adduser);
app.use(login);
app.use(verifyToken, addfriend);
app.use(verifyToken, submitpost);
app.use(verifyToken, submitcomment);

//start the application
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function(){
	console.log(`Listening for requests on port ${app.get('port')}`)
});



/* 	*	*	*	*	*	*	*	*	*	*
 * 			CHAT COMPONENT				*
 *	*	*	*	*	*	*	*	*	*	*/
// Map users => sockets
var sockets = {}

// Maps sockets => users
var users = {}

// Listen for socket.io connections
const io = require("socket.io")(3001, {
	cors: {
	  origin: "*",
	  methods: ["GET", "POST", "OPTION"]
	}
});


// Called when a user connects to the server
io.on("connection", socket => {
	console.log("Connection established")

	// Whenever we receive a request to send a message, perform the following
	socket.on("sendMessage", function(sender, receiver, message) {
		console.log(sender, "=>", receiver, ":", message)
		
		const newMessage = new Messages({
			sender: sender,
			receiver: receiver,
			contents: message,
			timestamp: Date.now()
		})

		// Save the message then send the updated messages to the partner
		newMessage.save(function (err, messages) {
			if (err) return console.error(err)
			updateMessages(sender, receiver)
		})
		
	});

	// Called when a user would like to update their chat window (new window)
	socket.on("getMessages", function(user, partner) {
		Messages.find({$or:[
			{sender:user, receiver:partner},
			{sender:partner, receiver:user}
		]}).toArray(function(err, messages){
			console.log(messages);
		});
	});

	// Called when a user disconnects
	socket.on("disconnect", function() {
		delete sockets[users[socket]]
		delete users[socket]
	});

	// Called when a user connects; stores a reference from the user to their active socket
	socket.on("login", function(uid) {
		console.log("uid logged in:", uid)

		// Get user/socket references so we can lookup sockets for message passing
		sockets[uid] = socket
		users[socket] = uid
	})
});

/*	When a user sends a message to their conversation partner, we'd like to
 *  send them a message with the updated messages for that conversation.
 */

function updateMessages(user, partner) {
	var query = Messages.find({$or:[
		{'sender':user, 'receiver':partner},
		{'sender':partner, 'receiver':user}
	]})

	query.exec(function (err, res) {
		console.log(res);
	})
}
