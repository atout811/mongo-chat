const mongo = require("mongodb").MongoClient;
const socketio = require("socket.io").listen(4000);

//connect to mongo
mongo.connect("mongodb://127.0.0.1/mongochat", function(err, client) {
  if (err) {
    throw err;
  }

  console.log("MongoDB connected ...");

  var db = client.db("mongochat");

  //Connect to socket io
  socketio.on("connection", function(socket) {
    let chat = db.collection("chats");

    // Create function to send status
    sendStatus = function(s) {
      socket.emit("status", s);
    };

    //Get Chat from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function(err, res) {
        if (err) {
          throw err;
        }

        //Emmt the messages
        socket.emit("output", res);
      });

    //Handle input event
    socket.on("input", function(data) {
      let name = data.name;
      let message = data.message;

      //check for name and message

      if (name == "" || message == "") {
        //sned errot status
        sendStatus("Please Enter a name and message");
      } else {
        // Insert message
        chat.insert({ name: name, message: message }, function() {
          socketio.emit("output", [data]);

          //send status object
          sendStatus({
            message: "Message sent",
            clear: true
          });
        });
      }
    });

    //Handle clear
    socket.on("clear", function(data) {
      //Remove all chat
      chat.remove({}, function() {
        //Emite cleared
        socket.emit("cleared");
      });
    });
  });
});
