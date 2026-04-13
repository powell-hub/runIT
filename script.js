// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let services = JSON.parse(localStorage.getItem("services")) || [];
let balances = JSON.parse(localStorage.getItem("balances")) || {};

// ===============================
// AUTH STATE (CRITICAL FIX)
// ===============================
firebase.auth().onAuthStateChanged(user => {
  const page = window.location.pathname;

  if (!user &&
      !page.includes("login.html") &&
      !page.includes("signup.html")) {
    window.location.href = "login.html";
    return;
  }

  if (user) {
    currentUser = user.email;
    initApp();
  }
});

// ===============================
// INIT APP (RUN ONLY AFTER LOGIN)
// ===============================
function initApp() {
  displayTasks();
  updateWallet();
  displayServices();
  setGreeting();
}

// ===============================
// LOGOUT (FIXED)
// ===============================
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ===============================
// SAVE DATA
// ===============================
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("services", JSON.stringify(services));
  localStorage.setItem("balances", JSON.stringify(balances));
}

// ===============================
// BALANCE
// ===============================
function getBalance() {
  if (!currentUser) return 0;

  if (!balances[currentUser]) balances[currentUser] = 0;
  return balances[currentUser];
}

function updateBalance(amount) {
  if (!currentUser) return;

  if (!balances[currentUser]) balances[currentUser] = 0;
  balances[currentUser] += amount;

  saveData();
}

// ===============================
// POST TASK (FIXED)
// ===============================
function postTask() {
  if (!currentUser) {
    showPopup("Login required");
    return;
  }

  const text = document.getElementById("taskInput");
  const amount = document.getElementById("amountInput");

  if (!text || !amount || !text.value || !amount.value) {
    showPopup("Fill all fields");
    return;
  }

  const task = {
    text: text.value,
    amount: Number(amount.value),
    status: "pending",
    owner: currentUser,
    worker: null
  };

  tasks.push(task);
  saveData();

  showPopup("Task posted!");

  text.value = "";
  amount.value = "";

  displayTasks();
}

// ===============================
// DISPLAY TASKS
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {

    const status = (task.status || "pending").toLowerCase();

    if (status === "pending") {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Available</small><br><br>
          <button onclick="acceptTask(${index})">Accept</button>
        </div>
      `;
    }

    if (status === "accepted" && task.worker === currentUser) {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>In Progress...</small><br><br>
          <button onclick="submitTask(${index})">Submit Work</button>
        </div>
      `;
    }

    if (status === "submitted" && task.owner === currentUser) {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Pending approval</small><br><br>
          <button onclick="approveTask(${index})">Approve & Pay</button>
        </div>
      `;
    }

    if (status === "completed") {
      taskList.innerHTML += `
        <div class="task" style="opacity:0.6;">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Completed ✅</small>
        </div>
      `;
    }

  });
}
// ===============================
// TASK ACTIONS
// ===============================
function acceptTask(index) {
  const task = tasks[index];

  if (task.status !== "pending") {
    showPopup("Task already taken");
    return;
  }

  task.status = "accepted";
  task.worker = currentUser;

  saveData();
  showPopup("Task accepted!");

  displayTasks();
}

function submitTask(index) {
  const task = tasks[index];

  if (task.worker !== currentUser) {
    showPopup("Not your task");
    return;
  }

  task.status = "submitted";

  saveData();
  showPopup("Task submitted");

  displayTasks();
}

function approveTask(index) {
  const task = tasks[index];

  if (task.owner !== currentUser) {
    showPopup("Not allowed");
    return;
  }

  task.status = "completed";

  const earnings = Math.floor(task.amount * 0.9);

  updateBalance(earnings);

  saveData();

  showPopup("Paid ₦" + earnings);

  displayTasks();
  updateWallet();
}

// ===============================
// WALLET
// ===============================
function updateWallet() {
  const el = document.getElementById("balance");
  if (el) el.innerText = getBalance();
}

// ===============================
// SERVICES
// ===============================
function addService() {
  const name = document.getElementById("serviceName");
  const desc = document.getElementById("serviceDesc");

  if (!name || !desc || !name.value || !desc.value) {
    showPopup("Fill all fields");
    return;
  }

  services.push({
    name: name.value,
    desc: desc.value,
    owner: currentUser
  });

  saveData();

  showPopup("Service added!");

  name.value = "";
  desc.value = "";
}

function displayServices() {
  const list = document.getElementById("serviceList");
  if (!list) return;

  list.innerHTML = "";

  services.forEach(service => {
    list.innerHTML += `
      <div class="task">
        <p><strong>${service.name}</strong></p>
        <p>${service.desc}</p>
        <small>By ${service.owner}</small>
      </div>
    `;
  });
}

// ===============================
// POPUP
// ===============================
function showPopup(message) {
  const popup = document.getElementById("popup");
  if (!popup) return;

  popup.innerText = message;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 2000);
}

// ===============================
// GREETING
// ===============================
function setGreeting() {
  const el = document.getElementById("greeting");
  if (!el || !currentUser) return;

  el.innerText = "Hello " + currentUser;
}
