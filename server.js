const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const { writeFile } = require("fs");
const server = http.createServer(app);
const URL = process.env.URL;
const io = require("socket.io")(server, {
  cors: {
    origin: URL || "http://localhost:3000",
  },
});
let userData = {};

console.log(URL);

app.use(express.static(path.join(__dirname, "public")));

app.use("*.js", (req, res, next) => {
  res.set("Content-Type", "application/javascript");
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

  const userinvalid = validateUsername(username, error);
  if (userinvalid) {
    return error.send(userinvalid);
  } else {
    userData[socket.id] = { username, color };
    next();
  }
});

io.on("connection", (socket) => {
  socket.emit("connection");
  console.log("usuario conectado: "+socket.id);

  const username = socket.handshake.auth.username;
  const color = socket.handshake.auth.color;

  socket.broadcast.emit("connected", `${username} conectado`);

  socket.on("chat message", (msg, time, replyTarget) =>
    chatMessage(socket, replyTarget, msg, time, { username, color })
  );

  socket.on("imageUpload", (replyTarget, image, time, callback) =>
    imageUpload(socket, replyTarget, image, time, callback, { username, color })
  );

  socket.on("isTyping", (isTyping) => {
    socket.broadcast.emit("isTyping", { isTyping, username });
  });

  socket.on("disconnect", () => disconnect(socket, username));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("ouvindo na porta " + port);
});

function disconnect(socket, username) {
  socket.broadcast.emit("logOut", `${username} desconectado`);
  console.log("a user disconnected");
  delete userData[socket.id];
  console.log(userData);
}
function chatMessage(socket, replyTarget, msg, time, { username, color }) {
  socket.broadcast.emit("chat message", {
    type: "stranger",
    msg: msg,
    time: time,
    color: color,
    nick: username,
    reply: replyTarget,
  });
  socket.emit("chat message", {
    type: "you",
    msg: msg,
    time: time,
    nick: username,
    color: color,
    reply: replyTarget,
  });
}
function imageUpload(socket, replyTarget, image, time, callback, { username, color }) {
  writeFile("public/tmp/imageUpload", image, (err) => {
    callback({ message: err ? "failure" : "success" });
  });
  console.log("enviando");
  socket.broadcast.emit("imageUpload", {
    src: image.toString("base64"),
    type: "stranger",
    time: time,
    nick: username,
    color: color,
    reply: replyTarget,
  });
  socket.emit("imageUpload", {
    src: image.toString("base64"),
    type: "you",
    time: time,
    nick: username,
    color: color,
    reply: replyTarget,
  });
}
function validateUsername(username) {
  const existingUser = Object.values(userData).find(
    (user) => user.username === username
  );

  if (!username) {
    return "Apelido invalido";
  }
  if (existingUser) {
    return "Este apelido já está em uso.";
  }
  if (username.length < 3) {
    return "Apelido muito curtinho";
  }
  if (username.length > 18) {
    return "Apelido muito looongo";
  }

  return null; //se o username for valido, retorna null
}