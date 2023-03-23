const userInput = document.querySelector("#iUsername");
const userForm = document.querySelector("#userForm");
const errorBox = document.querySelector(".error-box");

const color = generateColor();
const username = "";
const socket = io({ autoConnect: false });

const url = new URL(window.location.href);
const urlParams = new URLSearchParams(window.location.search);
const err = urlParams.get("err");

userForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const invalidUser = usernameValidation(userInput.value);

  if (invalidUser) {
    userInput.value = "";
    return printError(invalidUser);
  }

  window.location.href = `./chat.html?username=${getUsername()}&color=${color}`;
});

function generateColor() {
  let color = "";
  const hue = Math.round(Math.random() * 360);
  if (hue > 220 && hue < 360) color = `hsl(${hue}deg 100% 26%)`;
  else color = `hsl(${hue}deg 100% 18.5%)`;
  return color;
}

function getUsername() {
  return userInput.value;
}

function usernameValidation(username) {
  if (!username) {
    return "Apelido invalido";
  }
  if (username.length < 3) {
    return "Apelido muito curtinho";
  }
  if (username.length > 18) {
    return "Apelido muito looongo";
  }

  return null;
}

function printError(err) {
  errorBox.textContent = err;
  errorBox.classList.remove("hide");
  userInput.classList.add("err-input");

  setTimeout(() => {
    errorBox.classList.add("hide");
    userInput.classList.remove("err-input");
  }, 4000);
}

if (err) {
  printError(err);
  url.searchParams.delete("err");
  window.history.replaceState(null, "", url);
}