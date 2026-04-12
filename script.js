// LOAD DATA
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let services = JSON.parse(localStorage.getItem("services")) || [];
let balances = JSON.parse(localStorage.getItem("balances")) || {};

// USER SYSTEM
let currentUser = localStorage.getItem("currentUser");

const page = window.location.pathname;

if (!currentUser &&
    !page.includes("login.html") &&
    !page.includes("signup.html")) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// SAVE DATA
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("services", JSON.stringify(services));
  localStorage.setItem("balances", JSON.stringify(balances));
}

// BALANCE HELPERS
function getBalance(user) {
  if (!balances[user]) balances[user] = 0;
  return balances[user];
}

function updateBalance(user, amount) {
  if (!balances[user]) balances[user] = 0;
  balances[user] += amount;
  saveData();
}

//////////////////////////////////////////////////
// POST TASK
//////////////////////////////////////////////////
function postTask() {
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
}

//////////////////////////////////////////////////
// DISPLAY TASKS
//////////////////////////////////////////////////
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {

    // 🟡 PENDING
    if (task.status === "pending") {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Available</small><br><br>
          <button onclick="acceptTask(${index})">Accept</button>
        </div>
      `;
    }

    // 🔵 ACCEPTED (WORKER WORKING)
    if (task.status === "accepted") {
      if (task.worker === currentUser) {
        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>In Progress...</small><br><br>
            <button onclick="submitTask(${index})">Submit Work</button>
          </div>
        `;
      } else {
        taskList.innerHTML += `
          <div class="task" style="opacity:0.6;">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Someone is working on this</small>
          </div>
        `;
      }
    }

    // 🟠 SUBMITTED (WAITING FOR POSTER)
    if (task.status === "submitted") {
      if (task.owner === currentUser) {
        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Pending your approval</small><br><br>
            <button onclick="approveTask(${index})">Approve & Pay</button>
          </div>
        `;
      } else {
        taskList.innerHTML += `
          <div class="task" style="opacity:0.6;">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Waiting for approval...</small>
          </div>
        `;
      }
    }

    // 🟢 COMPLETED
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
}//////////////////////////////////////////////////
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
// APPROVE TASK
//////////////////////////////////////////////////
function approveTask(index) {
  const task = tasks[index];

  if (task.owner !== currentUser) {
    showPopup("Not allowed");
    return;
  }

  task.status = "completed";

  const earnings = Math.floor(task.amount * 0.9);

  updateBalance(task.worker, earnings);

  saveData();

  showPopup("Paid ₦" + earnings);

  displayTasks();
  updateWallet();
}

//////////////////////////////////////////////////
// WALLET
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
// POPUP
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

//////////////////////////////////////////////////
// LOAD
//////////////////////////////////////////////////
window.onload = function () {
  if (!currentUser) return;

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
