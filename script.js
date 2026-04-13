// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;

// ===============================
// AUTH STATE
// ===============================
firebase.auth().onAuthStateChanged((user) => {
  const page = window.location.pathname;

  if (!user &&
    !page.includes("login.html") &&
    !page.includes("signup.html")) {
    window.location.href = "login.html";
    return;
  }

  if (user) {
    currentUser = user;
    initApp();
  }
});

// ===============================
// INIT
// ===============================
function initApp() {
  displayTasks();
  updateWallet();
  setGreeting();
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ===============================
// POST TASK
// ===============================
function postTask() {
  const text = document.getElementById("taskInput").value;
  const amount = Number(document.getElementById("amountInput").value);

  if (!currentUser) return showPopup("Login required");
  if (!text || !amount) return showPopup("Fill all fields");

  firebase.firestore().collection("tasks").add({
    text,
    amount,
    status: "pending",
    ownerId: currentUser.uid,
    workerId: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showPopup("Task posted!");
}

// ===============================
// DISPLAY TASKS (LIVE FIRESTORE)
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  // 🔥 Prevent multiple listeners (THIS FIXES “flash then disappear” bug)
  if (window._taskListener) {
    window._taskListener();
  }

  window._taskListener = firebase.firestore()
    .collection("tasks")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {

      taskList.innerHTML = "";

      snapshot.forEach((doc) => {
        const task = doc.data();
        const id = doc.id;

        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Status: ${task.status}</small><br><br>

            ${task.status === "pending" ? `
              <button onclick="acceptTask('${id}')">Accept</button>
            ` : ""}

            ${task.status === "accepted" && task.workerId === currentUser.uid ? `
              <button onclick="submitTask('${id}')">Submit Work</button>
            ` : ""}

            ${task.status === "submitted" && task.ownerId === currentUser.uid ? `
              <button onclick="confirmTask('${id}')">Confirm & Pay</button>
            ` : ""}

          </div>
        `;
      });

    });
}
