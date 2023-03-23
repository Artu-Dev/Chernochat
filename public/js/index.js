const messagesContainer = document.querySelector(".messages");
const form = document.querySelector("#messageForm");
const imgInput = document.querySelector("#inputImg");
const textInput = document.querySelector("#inputText");
const submitBtn = document.querySelector("#submitBtn");
const isTypingBar = document.querySelector(".isTypingBar");

const socket = io();
const options = {
  quality: 0.6,
  maxWidth: 800,
  maxHeight: 800,
  convertSize: 1000000,
};

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");
const color = urlParams.get("color");

//-----------------------Functions

function printChat(type, msg, username, time, color) {
  const container = document.createElement("li");
  const userDiv = document.createElement("div");
  const timeDiv = document.createElement("div");
  const p = document.createElement("p");

  userDiv.style.color = color;

  timeDiv.textContent = time;
  userDiv.textContent = username;
  timeDiv.classList.add("time");
  userDiv.classList.add("username");
  container.classList.add(type);

  if (typeof msg !== "object") {
    p.textContent = msg;
    container.appendChild(p);
    if (type === "you" || type === "stranger")
      container.insertBefore(userDiv, p);
  } else {
    container.appendChild(msg);
    if (type === "you" || type === "stranger")
      container.insertBefore(userDiv, msg);
  }

  messagesContainer.appendChild(container);
  container.appendChild(timeDiv);

  window.scrollTo(0, document.body.scrollHeight);
}

function printIstyping(typing, user) {
  isTypingBar.textContent = `${user} está digitando...`;
  if (typing) {
    isTypingBar.classList.remove("typeHide");
  } else {
    isTypingBar.classList.add("typeHide");
  }
}

function compress(image) {
  new Compressor(image, {
    quality: options.quality,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    convertSize: options.maxSize,

    success(result) {
      uploadImg(result);
    },
    error(err) {
      console.log(err.message);
    },
  });
}

function gif(gif) {
  if (gif.size > 1000000) {
    alert("Oh nao, Imagem Muito grande!");
    imgInput.value = "";
    return;
  }
  uploadImg(gif);
}

function uploadImg(result) {
  socket.emit("imageUpload", result, GetTime(), (status) => {});
  imgInput.value = null;
}

let timer = [];
function isTyping() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    socket.emit("isTyping", false);
  }, 1000);
  socket.emit("isTyping", true);
}

function GetTime() {
  const time = new Date().toLocaleTimeString();
  return time;
}

function printError(err) {
  const errorBox = document.querySelector(".error-box");

  errorBox.textContent = err;
  errorBox.classList.remove("hide");

  setTimeout(() => {
    errorBox.classList.add("hide");
  }, 4000);
}

// -----------------------Events
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (textInput.value) {
    socket.emit("chat message", textInput.value, GetTime());
    textInput.value = "";
  }

  if (imgInput.value) {
    if (imgInput.files[0].type === "image/gif") {
      gif(imgInput.files[0]);
      return;
    }
    compress(imgInput.files[0]);
  }
});

textInput.addEventListener("input", () => {
  isTyping();
});

//-----------------------socket.io events
socket.on("chat message", ({ type, msg, nick, time, color }) => {
  printChat(type, msg, nick, time, color);
});

socket.on("connected", (msg) => {
  printChat("alert", msg);
});

socket.on("logOut", (msg) => {
  printChat("disconnect", msg);
});

socket.on("imageUpload", ({ src, type, nick, time }) => {
  const img = new Image(src);
  img.removeAttribute("width");
  img.src = `data:image/jpg;base64,${src}`;
  img.classList.add("img");
  printChat(type, img, nick, time);
});

socket.on("isTyping", ({ isTyping, username }) => {
  printIstyping(isTyping, username);
});

socket.on("connect_error", (err) => {
  printError(err);
  window.location.replace(`./index.html?err=${err.message}`);
});

// init
socket.auth = { username, color };
socket.connect();

const url = new URL(window.location.href);
url.searchParams.delete("username");
url.searchParams.delete("color");
window.history.replaceState(null, "", url);
