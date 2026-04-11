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
    alert("Fill all fields");
    return;
  }

 const task = {
  text: text,
  amount: Number(amount),
  status: "pending",
  owner: "poster",   // temporary user
  worker: null
};
  
  tasks.push(task);
  saveData();

  showPopup("Task posted successfully!");
  
  // Clear inputs
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
      task.owner = "user1";
      task.worker = null;
    }

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
      taskList.innerHTML += `
        <div class="task" style="opacity:0.6;">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>In Progress...</small>
        </div>
      `;
    }

  });
}
//////////////////////////////////////////////////
// ACCEPT TASK (EARN MONEY)
//////////////////////////////////////////////////
function acceptTask(index) {
  const task = tasks[index];

  // Prevent accepting your own task
  if (task.owner === "user1") {
    alert("You cannot accept your own task");
 return;
  }

  // Prevent re-accepting
  if (task.status !== "pending") {
    alert("Task already taken");
    return;
  }

  // Update task instead of deleting
  task.status = "accepted";
  task.worker = "worker";

  // Earnings
  const earnings = Math.floor(task.amount * 0.9);
  balance += earnings;

  saveData();

  alert("Task accepted! You earned ₦" + earnings);

  displayTasks();
  updateWallet();
}
//////////////////////////////////////////////////
// UPDATE WALLET DISPLAY
//////////////////////////////////////////////////
function updateWallet() {
  const walletEl = document.getElementById("balance");

  if (walletEl) {
    walletEl.innerText = balance;
  }
}

//////////////////////////////////////////////////
// WITHDRAW FUNCTION
//////////////////////////////////////////////////
function withdraw() {
  if (balance < 1000) {
    alert("Minimum withdrawal is ₦1000");
    return;
  }

  alert("Withdrawal successful!");

  balance = 0;

  saveData();
  updateWallet();
}

//////////////////////////////////////////////////
// RUN ON PAGE LOAD
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
window.onload = function () {
  displayTasks();
  updateWallet();
};
