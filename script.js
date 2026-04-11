let services = JSON.parse(localStorage.getItem("services")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// USER SYSTEM
let currentUser = localStorage.getItem("currentUser");

if (!currentUser && !window.location.pathname.includes("login.html")) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// PER-USER WALLET (NEW FIX)
let balances = JSON.parse(localStorage.getItem("balances")) || {};

function getBalance(user) {
  if (!balances[user]) balances[user] = 0;
  return balances[user];
}

function updateBalance(user, amount) {
  if (!balances[user]) balances[user] = 0;
  balances[user] += amount;
  localStorage.setItem("balances", JSON.stringify(balances));
}

// SAVE DATA
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("services", JSON.stringify(services));
  localStorage.setItem("balances", JSON.stringify(balances));
}

//////////////////////////////////////////////////
// POST TASK
//////////////////////////////////////////////////
function postTask() {
  const text = document.getElementById("taskInput").value;
  const amount = document.getElementById("amountInput").value;

  if (!text || !amount) {
    showPopup("Fill all fields");
    return;
  }

  const task = {
    text,
    amount: Number(amount),
    status: "pending",
    owner: currentUser,
    worker: null
  };

  tasks.push(task);
  saveData();

  showPopup("Task posted!");

  document.getElementById("taskInput").value = "";
  document.getElementById("amountInput").value = "";
}

//////////////////////////////////////////////////
// DISPLAY TASKS
//////////////////////////////////////////////////
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {

    if (task.status === "pending") {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br><br>
          <button onclick="acceptTask(${index})">Accept</button>
        </div>
      `;
    }

    if (task.status === "accepted") {
      if (task.worker === currentUser) {
        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <button onclick="submitTask(${index})">Mark as Done</button>
          </div>
        `;
      }
    }

    if (task.status === "submitted") {
      if (task.owner === currentUser) {
        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <button onclick="approveTask(${index})">Confirm & Pay</button>
          </div>
        `;
      }
    }

    if (task.status === "completed") {
      taskList.innerHTML += `
        <div class="task" style="opacity:0.5;">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Completed ✅</small>
        </div>
      `;
    }
  });
}

//////////////////////////////////////////////////
// ACCEPT TASK
//////////////////////////////////////////////////
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

//////////////////////////////////////////////////
// SUBMIT TASK
//////////////////////////////////////////////////
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

//////////////////////////////////////////////////
// APPROVE TASK (PAYMENT SYSTEM FIXED)
//////////////////////////////////////////////////
function approveTask(index) {
  const task = tasks[index];

  if (task.owner !== currentUser) {
    showPopup("Not allowed");
    return;
  }

  task.status = "completed";

  const earnings = Math.floor(task.amount * 0.9);

  updateBalance(task.worker, earnings); // 👈 PAY WORKER ONLY

  saveData();

  showPopup("Paid ₦" + earnings);

  displayTasks();
  updateWallet();
}

//////////////////////////////////////////////////
// WALLET (PER USER FIXED)
//////////////////////////////////////////////////
function updateWallet() {
  const el = document.getElementById("balance");
  if (el) el.innerText = getBalance(currentUser);
}

function withdraw() {
  if (getBalance(currentUser) < 1000) {
    showPopup("Minimum withdrawal is ₦1000");
    return;
  }

  balances[currentUser] = 0;
  saveData();
  updateWallet();

  showPopup("Withdrawal successful!");
}

//////////////////////////////////////////////////
// POPUP SYSTEM (ONLY FEEDBACK METHOD)
//////////////////////////////////////////////////
function showPopup(message) {
  const popup = document.getElementById("popup");
  if (!popup) return;

  popup.innerText = message;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 2000);
}

//////////////////////////////////////////////////
// SERVICES
//////////////////////////////////////////////////
function addService() {
  const name = document.getElementById("serviceName").value;
  const desc = document.getElementById("serviceDesc").value;
  const phone = document.getElementById("servicePhone").value;

  if (!name || !desc || !phone) {
    showPopup("Fill all fields");
    return;
  }

  const service = {
    name,
    desc,
    phone,
    owner: currentUser
  };

  services.push(service);
  saveData();

  showPopup("Service added!");

  document.getElementById("serviceName").value = "";
  document.getElementById("serviceDesc").value = "";
  document.getElementById("servicePhone").value = "";
}
//////////////////////////////////////////////////
// LOAD
//////////////////////////////////////////////////
window.onload = function () {
  displayTasks();
  updateWallet();
  displayServices();
  setGreeting();
};

function setGreeting() {
  const el = document.getElementById("greeting");
  if (!el) return;

  el.innerText = "Hello " + currentUser;
}
