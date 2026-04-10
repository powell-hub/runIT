let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
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
  saveTasks();

  alert("Task posted!");

  document.getElementById("taskInput").value = "";
  document.getElementById("amountInput").value = "";
}
function displayTasks() {
  const taskList = document.getElementById("taskList");

  if (!taskList) return;

  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    taskList.innerHTML += `
      <div style="margin:10px; padding:10px; border:1px solid white;">
        <p>${task.text}</p>
        <strong>₦${task.amount}</strong><br><br>
        <button onclick="acceptTask(${index})">Accept</button>
      </div>
    `;
  });
}
function acceptTask(index) {
  tasks.splice(index, 1);
  saveTasks();

  alert("Task accepted!");
  displayTasks();
}
window.onload = function() {
  displayTasks();
};
