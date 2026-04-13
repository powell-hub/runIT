// ===============================
// FIREBASE INIT (REQUIRED)
// ===============================
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// ===============================
// AUTH STATE
// ===============================
auth.onAuthStateChanged(async (user) => {
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
    const userRef = db.collection("users").doc(user.uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      await userRef.set({
        email: user.email,
        balance: 0
      });
    }

    initApp();
  }
});

// ===============================
// INIT APP
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
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ===============================
// POST TASK (ESCROW START)
// ===============================
function postTask() {
  const text = document.getElementById("taskInput").value;
  const amount = Number(document.getElementById("amountInput").value);

  if (!text || !amount) {
    showPopup("Fill all fields");
    return;
  }

  db.collection("tasks").add({
    text,
    amount,
    ownerId: currentUser.uid,
    workerId: null,
    status: "pending",
    escrowHeld: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showPopup("Task created (escrow active)");
}

// ===============================
// DISPLAY TASKS (REALTIME)
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  db.collection("tasks").onSnapshot((snapshot) => {
    taskList.innerHTML = "";

    snapshot.forEach((doc) => {
      const task = doc.data();
      const id = doc.id;

      let buttons = "";

      // PENDING
      if (task.status === "pending") {
        buttons = `<button onclick="acceptTask('${id}')">Accept</button>`;
      }

      // ACCEPTED (worker)
      if (task.status === "accepted" && task.workerId === currentUser.uid) {
        buttons = `<button onclick="submitTask('${id}')">Submit Work</button>`;
      }

      // REVIEW (owner)
      if (task.status === "reviewed" && task.ownerId === currentUser.uid) {
        buttons = `
          <button onclick="confirmTask('${id}', ${task.amount}, '${task.workerId}')">
            Confirm & Pay
          </button>
          <button onclick="rejectTask('${id}')">Reject</button>
        `;
      }

      taskList.innerHTML += `
        <div class="task">
          <p>${task.text}</p>
          <strong>₦${task.amount}</strong><br>
          <small>${task.status}</small><br><br>
          ${buttons}
        </div>
      `;
    });
  });
}

// ===============================
// TASK ACTIONS
// ===============================
function acceptTask(taskId) {
  db.collection("tasks").doc(taskId).update({
    status: "accepted",
    workerId: currentUser.uid
  });

  showPopup("Task accepted");
}

function submitTask(taskId) {
  db.collection("tasks").doc(taskId).update({
    status: "reviewed"
  });

  showPopup("Submitted for review");
}

// 🔥 ESCROW RELEASE
function confirmTask(taskId, amount, workerId) {
  const earnings = Math.floor(amount * 0.9);

  // PAY WORKER
  db.collection("users").doc(workerId).update({
    balance: firebase.firestore.FieldValue.increment(earnings)
  });

  // COMPLETE TASK
  db.collection("tasks").doc(taskId).update({
    status: "completed",
    escrowHeld: false
  });

  showPopup("Payment released ₦" + earnings);
}

function rejectTask(taskId) {
  db.collection("tasks").doc(taskId).update({
    status: "accepted"
  });

  showPopup("Returned to worker");
}

// ===============================
// WALLET (REAL)
// ===============================
function updateWallet() {
  const el = document.getElementById("balance");
  if (!el) return;

  db.collection("users").doc(currentUser.uid)
    .onSnapshot((doc) => {
      const data = doc.data();
      el.innerText = data.balance || 0;
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
  if (el && currentUser) {
    el.innerText = "Hello " + currentUser.email;
  }
}
