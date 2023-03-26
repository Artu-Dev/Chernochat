const messagesContainer = document.querySelector(".messages"),
      messageForm = document.querySelector("#messageForm"),
      imgInput = document.querySelector("#inputImg"),
      textInput = document.querySelector("#inputText"),
      submitBtn = document.querySelector("#submitBtn"),
      isTypingBar = document.querySelector(".isTypingBar");

const replyContent = document.querySelector(".replyBox"),
      replyName = replyContent.querySelector('.replyName'),
      replyMsg = replyContent.querySelector('.replymsg'),
      replyCloseBtn = document.querySelector(".fa-close");

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

var replyTarget = ''; 

//-----------------------Functions

function createReply(reply) {
  console.log(reply);
  const fragment = document.createDocumentFragment();
  const replyContainer = document.createElement("div");
  const replyUser = document.createElement("p");
  const replyMsg = document.createElement("div");

  replyContainer.classList.add('ChatReplyContainer');
  replyUser.classList.add('ChatReplyUser');
  replyMsg.classList.add('ChatReplyMsg');
  
  const image = document.querySelector(`[data="${reply.msg}"]`);
  if(image) {
    const cloneImg = image.cloneNode(true);
    replyMsg.appendChild(cloneImg);
  } else {
    replyMsg.textContent = reply.msg;
    twemoji.parse(replyMsg, {folder: 'svg', ext: '.svg'});
  }

  replyUser.textContent = reply.username;
  replyUser.style.color = reply.color;

  fragment.insertBefore(replyUser, fragment.firstChild);
  fragment.appendChild(replyMsg);
  replyContainer.appendChild(fragment);

  return replyContainer;
}

function closeReply() {
  replyContent.classList.add("hide");
  replyTarget = '';
}

function createChatFragment(type, msg, username, time, color, reply) {
  const fragment = document.createDocumentFragment();
  const container = document.createElement("li");
  const msgContainer = document.createElement("p");
  const userDiv = document.createElement("div");
  const timeDiv = document.createElement("div");
  const replyIcon = document.createElement("i");

  if(reply) {
    const replyContainer = createReply(reply);
    console.log(replyContainer);
    fragment.appendChild(replyContainer);
  }

  if (msg instanceof HTMLElement) {
    msg.setAttribute('data', username+time);
    fragment.appendChild(msg);
  } else {
    msgContainer.textContent = msg;
    fragment.appendChild(msgContainer);
  }

  userDiv.classList.add("username");
  timeDiv.classList.add("time");
  replyIcon.classList.add("fa-solid", "fa-reply", "configButton");
  container.classList.add(type);
  
  userDiv.style.color = color;
  userDiv.textContent = username;
  timeDiv.textContent = time;

  fragment.insertBefore(userDiv, fragment.firstChild);
  fragment.appendChild(replyIcon);
  fragment.appendChild(timeDiv);

  replyIcon.addEventListener("click", () => {
    printReplyInterface(username, msg, color);
    replyTarget = {username, msg, color};
    textInput.focus();
  });

  container.appendChild(fragment);
  twemoji.parse(msgContainer, {folder: 'svg', ext: '.svg'});
  return container;
}

function createChatAlert(type, msg) {
  const container = document.createElement("li");
  const p = document.createElement("p");

  container.classList.add(type);
  p.textContent = msg;

  container.appendChild(p);
  return container;
}

function printChat(type, msg, username, time, color, reply) {
  let chatElement;
  if (type === "disconnect" || type === "alert") {
    chatElement = createChatAlert(type, msg);
  } else {
    chatElement = createChatFragment(type, msg, username, time, color, reply);
  }

  messagesContainer.appendChild(chatElement);
  window.scrollTo(0, document.body.scrollHeight);
}

function printReplyInterface(username, msg, color) {
  if (msg instanceof HTMLElement) {
    const imgClone = msg.cloneNode(true);
    replyMsg.innerHTML = '';
    replyMsg.append(imgClone);
  } else {
    replyMsg.textContent = msg;
    twemoji.parse(replyMsg, {folder: 'svg', ext: '.svg'});
  };

  replyName.textContent = username;
  replyName.style.color = color;
  replyContent.classList.remove('hide');
}

function printIstyping(typing, user) {
  isTypingBar.textContent = `${user} está digitando...`;
  if (typing) {
    isTypingBar.classList.remove("typeHide");
  } else {
    isTypingBar.classList.add("typeHide");
  }
}

function isTypingDebounce(func, delay) {
  let timerTyping;
  return function() {
    if(!timerTyping) {
      sendIsTyping(true)
    }
    clearTimeout(timerTyping);
    timerTyping = setTimeout(() => {
      sendIsTyping(false);
      timerTyping = null;
    }, delay);
  }
}

function sendIsTyping(value) {
  socket.emit('isTyping', value)
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

function baseToImg(imageBase) {
  const img = new Image(imageBase);
  img.removeAttribute("width");
  img.src = `data:image/jpg;base64,${imageBase}`;
  img.classList.add("img");
  return img;
}

function uploadIMG(result, reply) {
  socket.emit("imageUpload", reply, result, GetTime(), (status) => {});
  imgInput.value = null;
}

function sendMsg() {
  const text = textInput.value.trim();
  if (!text) return;
  socket.emit("chat message", text, GetTime(), replyTarget);

  replyTarget = "";
  textInput.value = "";
  closeReply();
  textInput.focus();
}

function auxSendImg(){
  const image = imgInput.files[0];
  if(!image) return;
  if (image.type === "image/gif") {
    gif(image, replyTarget);
  } else {
    compress(image, replyTarget);
  }
  replyTarget = "";
  imgInput.value = "";
  closeReply();
}

function compress(image, reply) {
  new Compressor(image, {
    quality: options.quality,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    convertSize: options.maxSize,

    success(result) {
      uploadIMG(result, reply);
    },
    error(err) {
      console.log(err.message);
    },
  });
}

function gif(gif, reply) {
  if (gif.size > 1000000) {
    alert("Oh nao, Imagem Muito grande!");
    imgInput.value = "";
    return;
  }
  uploadIMG(gif, reply);
}

// -----------------------Events
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (replyTarget.msg instanceof HTMLElement) {
    replyTarget.msg = replyTarget.msg.getAttribute("data");
  };
  sendMsg();
  auxSendImg();
});

textInput.addEventListener("input", isTypingDebounce(function(){
  console.log('digitando');
}, 1000));

replyCloseBtn.addEventListener("click", () => closeReply());

//-----------------------socket.io events
socket.on("chat message", ({ type, msg, nick, time, color, reply }) => {
  printChat(type, msg, nick, time, color, reply);
});

socket.on("imageUpload", ({ src, type, nick, time, color, reply }) => {
  const img = baseToImg(src);
  printChat(type, img, nick, time, color, reply);
});

socket.on("connected", (msg) => {
  printChat("alert", msg);
});

socket.on("logOut", (msg) => {
  printChat("disconnect", msg);
});

socket.on("isTyping", ({ isTyping, username }) => {
  printIstyping(isTyping, username);
});

socket.on("connect_error", (err) => {
  printError(err.message);
  window.location.replace(`./index.html?err=${err.message}`);
});

// init
socket.auth = { username, color };
socket.connect();

const url = new URL(window.location.href);
url.searchParams.delete("username");
url.searchParams.delete("color");
window.history.replaceState(null, "", url);
