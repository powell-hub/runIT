let services = JSON.parse(localStorage.getItem("services")) || [];

// USER SYSTEM
let currentUser = localStorage.getItem("currentUser");

// ONLY redirect if NOT on login page
if (!currentUser && !window.location.pathname.includes("login.html")) {
  window.location.href = "login.html";
}


function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

// LOAD DATA
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let balance = Number(localStorage.getItem("balance")) || 0;

// SAVE DATA
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("balance", balance);
  localStorage.setItem("services", JSON.stringify(services));
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
    owner: "currentUser",
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

    // FIX OLD TASKS
    if (!task.status) {
      task.status = "pending";
      task.owner = "poster";
      task.worker = null;
    }

    // 🟡 PENDING
    if (task.status === "pending") {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br><br>
          <button onclick="acceptTask(${index})">Accept</button>
        </div>
      `;
    }

    // 🔵 ACCEPTED → WORKER SUBMITS
   if (task.status === "accepted") {
  if (task.worker === currentUser) {
    taskList.innerHTML += `
      <div class="task">
        <p>${task.text}</p>
        <strong>₦${task.amount}</strong><br>
        <small>In Progress...</small><br><br>
        <button onclick="submitTask(${index})">Mark as Done</button>
      </div>
    `;
  } else {
    taskList.innerHTML += `
      <div class="task" style="opacity:0.6;">
        <p>${task.text}</p>
        <strong>₦${task.amount}</strong><br>
        <small>In Progress...</small>
      </div>
    `;
  }
}
    // 🟠 SUBMITTED → POSTER CONFIRMS
   if (task.status === "submitted") {
  if (task.owner === currentUser) {
    taskList.innerHTML += `
      <div class="task">
        <p>${task.text}</p>
        <strong>₦${task.amount}</strong><br>
        <small>Awaiting confirmation...</small><br><br>
        <button onclick="approveTask(${index})">Confirm & Pay</button>
      </div>
    `;
  } else {
    taskList.innerHTML += `
      <div class="task" style="opacity:0.6;">
        <p>${task.text}</p>
        <strong>₦${task.amount}</strong><br>
        <small>Waiting for poster approval...</small>
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
  task.worker = "currentUser";

  saveData();
  showPopup("Task accepted!");

  displayTasks();
}

//////////////////////////////////////////////////
// WORKER SUBMITS TASK
//////////////////////////////////////////////////
function submitTask(index) {
  const task = tasks[index];

  if (task.status !== "accepted") {
    showPopup("Invalid action");
    return;
  }

  task.status = "submitted";

  saveData();
  showPopup("Task submitted for approval");

  displayTasks();
}

//////////////////////////////////////////////////
// POSTER APPROVES & PAYS
//////////////////////////////////////////////////
function approveTask(index) {
  const task = tasks[index];

  if (task.status !== "submitted") {
    showPopup("Invalid action");
    return;
  }

  task.status = "completed";

  const earnings = Math.floor(task.amount * 0.9);
  balance += earnings;

  saveData();

  showPopup("Task approved! ₦" + earnings + " paid");

  displayTasks();
  updateWallet();
}

//////////////////////////////////////////////////
// WALLET
//////////////////////////////////////////////////
function updateWallet() {
  const el = document.getElementById("balance");
  if (el) el.innerText = balance;
}

function withdraw() {
  if (balance < 1000) {
    showPopup("Minimum withdrawal is ₦1000");
    return;
  }

  balance = 0;
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
// LOAD
//////////////////////////////////////////////////
window.onload = function () {
  displayTasks();
  updateWallet();
};

if (!currentUser) {
  window.location.href = "login.html";
}
