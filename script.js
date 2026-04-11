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
    amount: Number(amount)
  };

  tasks.push(task);
  saveData();

  alert("Task posted!");

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
   taskList.innerHTML += `
  <div class="task">
    <p>${task.text}</p>
    <strong>₦${task.amount}</strong><br><br>
    <button onclick="acceptTask(${index})">Accept</button>
  </div>
`;
  });
}

//////////////////////////////////////////////////
// ACCEPT TASK (EARN MONEY)
//////////////////////////////////////////////////
function acceptTask(index) {
  const task = tasks[index];

  // User earns 90%
  const earnings = Math.floor(task.amount * 0.9);

  balance += earnings;

  // Remove task
  tasks.splice(index, 1);

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
window.onload = function () {
  displayTasks();
  updateWallet();
};
