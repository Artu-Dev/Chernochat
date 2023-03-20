const messagesContainer = document.querySelector(".messages");
const form = document.querySelector("#messageForm");
const imgInput = document.querySelector("#inputImg");
const textInput = document.querySelector("#inputText");
const submitBtn = document.querySelector("#submitBtn");
const isTypingBar = document.querySelector(".isTypingBar");
const URL = "http://localhost:4000";
const socket = io(URL, { autoConnect: false });
const options = {
  quality: 0.6,
  maxWidth: 800,
  maxHeight: 800,
  convertSize: 1000000,
};

function onUsernameSelection(username) {
  const color = generateColor();
  socket.auth = { username, color };
  socket.connect();
}

function destroyed() {
  socket.off("connect_error");
}

function getUsername() {
  const username = window.prompt("Digite um apelido");

  if (!username) {
    alert("Apelido invalido");
    return getUsername();
  } else if (username.length < 3) {
    alert("Apelido muito curtinho");
    return getUsername();
  } else if (username.length > 18) {
    alert("Apelido muito looongo");
    return getUsername();
  }

  onUsernameSelection(username);
}

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
  console.log(user);
  isTypingBar.textContent = `${user} está digitando...`;
  if(typing) {
    isTypingBar.classList.remove('typeHide');
  } else {
    isTypingBar.classList.add('typeHide');
  }
}

function generateColor() {
  let color = "";
  const hue = Math.round(Math.random() * 360);
  if (hue > 220 && hue < 360) color = `hsl(${hue}deg 100% 26%)`;
  else color = `hsl(${hue}deg 100% 18.5%)`;
  return color;
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

function uploadImg(result) {
  socket.emit("imageUpload", result, (status) => {});
  imgInput.value = null;
}

let timer = [];
function isTyping() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    socket.emit('isTyping', false);
  }, 1000);
  socket.emit('isTyping', true);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (textInput.value) {
    socket.emit("chat message", textInput.value);
    textInput.value = "";
  }

  if (imgInput.value) {
    if(imgInput.files[0].type === 'image/gif'){
      uploadImg(imgInput.files[0]);
      return;
    }
    compress(imgInput.files[0]);
  }
});

textInput.addEventListener("input", () => {
  isTyping();

});

socket.onAny((event, ...args) => {
  //console.log(event, args);
});

socket.on("chat message", ({ type, msg, nick, time, color }) => {
  if (!time) time = new Date().toLocaleTimeString();
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

  if (!time) time = new Date().toLocaleTimeString();
  printChat(type, img, nick, time);
});

socket.on("isTyping", ({isTyping, username}) => {
  printIstyping(isTyping, username);
})

socket.on("connect_error", (err) => {
  alert(err.message);
  getUsername();
});

getUsername();
