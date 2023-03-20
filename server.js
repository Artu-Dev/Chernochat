const express = require("express");
const path = require("path");
const { writeFile } = require("fs");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = -1;
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:4000",
  },
});

app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.set("Content-Type", "application/javascript");
  }
  next();
});

app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use("/", (req, res) => {
  res.render("index.html");
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const color = socket.handshake.auth.color;
  const error = {
    send(msg) {
      return next(new Error(msg));
    },
  };
  if (!username) {
    error.send("Apelido invalido");
  } else if (username.length < 3) {
    error.send("Apelido muito curtinho");
  } else if (username.length > 18) {
    error.send("Apelido muito looongo");
  }

  socket.username = [username, color];
  next();
});

io.on("connection", (socket) => {
  const usersON = [];
  for (let [id, socket] of io.of("/").sockets) {
    usersON.push({
      userID: id,
      username: socket.username[0],
    });
  }

  const username = socket.handshake.auth.username;
  const color = socket.handshake.auth.color;

  console.log("usuario conectado");
  socket.broadcast.emit("connected", `${username} conectado`);

  socket.on("chat message", (msg) =>
    chatMessage(socket, msg, { username, color })
  );

  socket.on("imageUpload", (image, callback) =>
    imageUpload(socket, image, callback, { username, color })
  );

  socket.on('isTyping', (isTyping) => {
    console.log(isTyping);
    socket.broadcast.emit('isTyping', {isTyping, username});
  })

  socket.on("disconnect", () => disconnect(socket, username));
});

server.listen(port, () => {
  console.log("ouvindo na porta "+port);
});

function disconnect(socket, username) {
  socket.broadcast.emit("logOut", `${username} desconectado`);
  console.log("a user disconnected");
}
function chatMessage(socket, msg, { username, color }) {
  const time = new Date().toLocaleTimeString();
  socket.broadcast.emit("chat message", {
    type: "stranger",
    msg: msg,
    nick: username,
    time: time,
    color: color,
  });
  socket.emit("chat message", { type: "you", msg: msg, nick: username });
}
function imageUpload(socket, image, callback, { username, color }) {
  const time = new Date().toLocaleTimeString();
  writeFile("public/tmp/imageUpload", image, (err) => {
    callback({ message: err ? "failure" : "success" });
  });
  console.log("enviando");
  socket.broadcast.emit("imageUpload", {
    src: image.toString("base64"),
    type: "stranger",
    nick: username,
    time: time,
    color: color,
  });
  socket.emit("imageUpload", {
    src: image.toString("base64"),
    type: "you",
    nick: username,
  });
}
