// ===============================
// GLOBAL STATE (SAFE VERSION)
// ===============================
let currentUser = null;
let tasks = [];
let services = [];
let balances = {};

// ===============================
// LOAD DATA FROM STORAGE
// ===============================
function loadData() {
  tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  services = JSON.parse(localStorage.getItem("services")) || [];
  balances = JSON.parse(localStorage.getItem("balances")) || {};
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
// AUTH STATE
// ===============================
firebase.auth().onAuthStateChanged(async (user) => {

  const page = window.location.pathname;

  if (!user &&
      !page.includes("login.html") &&
      !page.includes("signup.html")) {
    window.location.href = "login.html";
    return;
  }

  if (user) {
    currentUser = user;

    // 🔥 CREATE USER IN FIRESTORE IF NOT EXISTS
    const userRef = firebase.firestore().collection("users").doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email: user.email,
        balance: 0
      });
    }

    initApp();
  }
});

// ===============================
// INIT APP (CRITICAL FIX)
// ===============================
function initApp() {
  loadData();          // 🔥 ALWAYS SYNC STORAGE FIRST
  displayTasks();
  updateWallet();
  displayServices();
  setGreeting();
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}

// ===============================
// TASK POST
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

  loadData(); // 🔥 sync before write

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
// DISPLAY TASKS (FIXED)
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  loadData(); // always sync latest

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {

    const status = (task.status || "pending").toLowerCase();

    // =========================
    // PENDING TASKS
    // =========================
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

    // =========================
    // ACCEPTED (WORKER VIEW)
    // =========================
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

    // =========================
    // REVIEWED (OWNER VIEW)
    // =========================
    if (status === "reviewed" && task.owner === currentUser) {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>Worker has submitted work</small><br><br>

          <button onclick="confirmTask(${index})">
            Confirm & Pay
          </button>

          <button onclick="rejectTask(${index})" style="background:red; color:white;">
            Reject
          </button>
        </div>
      `;
    }

    // =========================
    // COMPLETED
    // =========================
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
// TASK ACTIONS (SYNC FIXED)
// ===============================
function acceptTask(index) {
  loadData();

  const task = tasks[index];

  if (task.status !== "pending") {
    showPopup("Task already taken");
    return;
  }

  task.status = "accepted";
  task.worker = currentUser;

  saveData();
  displayTasks();
}

function submitTask(index) {
  loadData();

  const task = tasks[index];

  if (task.worker !== currentUser) {
    showPopup("Not your task");
    return;
  }

  // 🔥 NEW FLOW: goes to REVIEW instead of direct submit
  task.status = "reviewed";

  saveData();
  displayTasks();
}

function confirmTask(index) {
  loadData();

  const task = tasks[index];

  if (task.owner !== currentUser) {
    showPopup("Not allowed");
    return;
  }

  if (task.status !== "reviewed") {
    showPopup("Nothing to confirm");
    return;
  }

  task.status = "completed";

  const earnings = Math.floor(task.amount * 0.9);

  if (!balances[task.worker]) balances[task.worker] = 0;
  balances[task.worker] += earnings;

  saveData();

  showPopup("Payment released ₦" + earnings);

  displayTasks();
  updateWallet();
}

function rejectTask(index) {
  loadData();

  const task = tasks[index];

  if (task.owner !== currentUser) {
    showPopup("Not allowed");
    return;
  }

  if (task.status !== "reviewed") {
    showPopup("Cannot reject this task");
    return;
  }

  task.status = "accepted"; // sends back to worker

  saveData();
  displayTasks();

  showPopup("Task sent back to worker");
}

function approveTask(index) {
  // optional legacy safety redirect
  confirmTask(index);
}

// ===============================
// WALLET
// ===============================
function updateWallet() {
  const el = document.getElementById("balance");
  if (el && currentUser) {
    el.innerText = balances[currentUser] || 0;
  }
}

// ===============================
// SERVICES
// ===============================
function addService() {
  loadData();

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
  if (el && currentUser) {
    el.innerText = "Hello " + currentUser;
  }
}
