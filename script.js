// LOAD DATA
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let balance = Number(localStorage.getItem("balance")) || 0;

// SAVE BOTH TASKS + BALANCE
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("balance", balance);
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
    text: text,
    amount: Number(amount),
    status: "pending",
    owner: "poster",
    worker: null
  };

  tasks.push(task);
  saveData();

  showPopup("Task posted successfully!");

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

  if (tasks.length === 0) {
    taskList.innerHTML = "<p>No tasks available</p>";
    return;
  }

  tasks.forEach((task, index) => {

    // FIX OLD TASKS
    if (!task.status) {
      task.status = "pending";
      task.owner = "poster";
      task.worker = null;
    }

    // PENDING TASK
    if (task.status === "pending") {
      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br><br>
          <button onclick="acceptTask(${index})">Accept</button>
        </div>
      `;
    }

    // ACCEPTED TASK (ONLY SHOW BUTTON FOR WORKER)
    if (task.status === "accepted") {
      if (task.worker === "worker") {
        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>In Progress...</small><br><br>
            <button onclick="completeTask(${index})">Mark as Done</button>
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

    // COMPLETED TASK
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
  task.worker = "worker";

  saveData();

  showPopup("Task accepted!");

  displayTasks();
}

//////////////////////////////////////////////////
// COMPLETE TASK
//////////////////////////////////////////////////
function completeTask(index) {
  const task = tasks[index];

  if (task.worker !== "worker") {
    showPopup("Not your task");
    return;
  }

  task.status = "completed";

  // PAY ONLY AFTER COMPLETION
  const earnings = Math.floor(task.amount * 0.9);
  balance += earnings;

  saveData();

  showPopup("Task completed! Earned ₦" + earnings);

  displayTasks();
  updateWallet();
}

//////////////////////////////////////////////////
// UPDATE WALLET
//////////////////////////////////////////////////
function updateWallet() {
  const walletEl = document.getElementById("balance");

  if (walletEl) {
    walletEl.innerText = balance;
  }
}

//////////////////////////////////////////////////
// WITHDRAW
//////////////////////////////////////////////////
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
// POPUP SYSTEM
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
// ON LOAD
//////////////////////////////////////////////////
window.onload = function () {
  displayTasks();
  updateWallet();
};
