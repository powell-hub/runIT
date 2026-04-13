// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;
let _taskListener = null;

// ===============================
// POPUP SYSTEM (GLOBAL)
// ===============================
function showPopup(message) {
  let popup = document.getElementById("popup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup";
    document.body.appendChild(popup);

    popup.style.position = "fixed";
    popup.style.top = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.background = "#111";
    popup.style.color = "#fff";
    popup.style.padding = "12px 20px";
    popup.style.borderRadius = "10px";
    popup.style.zIndex = "9999";
  }

  popup.innerText = message;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 2000);
}


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
// POST TASK (ESCROW INIT)
// ===============================
async function postTask() {
  const text = document.getElementById("taskInput").value;
  const amount = Number(document.getElementById("amountInput").value);

  if (!firebase.auth().currentUser) {
    return showPopup("Login required");
  }

  if (!text || !amount) {
    return showPopup("Fill all fields");
  }

  try {
    await firebase.firestore().collection("tasks").add({
      text,
      amount,
      status: "pending",
      ownerId: firebase.auth().currentUser.uid,
      workerId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showPopup("Task posted (Escrow locked)");
  } catch (err) {
    console.error(err);
    showPopup("Task failed");
  }
}

// ===============================
// DISPLAY TASKS (ESCROW FLOW)
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  if (_taskListener) _taskListener();

  _taskListener = firebase.firestore()
    .collection("tasks")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {

      taskList.innerHTML = "";

      snapshot.forEach((doc) => {
        const task = doc.data();
        const id = doc.id;

        const userId = currentUser ? currentUser.uid : null;

        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Status: ${task.status}</small><br><br>

            ${task.status === "pending" ? `
              <button onclick="acceptTask('${id}')">Accept Task</button>
            ` : ""}

            ${task.status === "accepted" && task.workerId === userId ? `
              <button onclick="submitTask('${id}')">Submit Work</button>
            ` : ""}

            ${task.status === "submitted" && task.ownerId === userId ? `
              <button onclick="confirmTask('${id}')">Confirm & Pay</button>
            ` : ""}

          </div>
        `;
      });

    });
}

// ===============================
// ACCEPT TASK
// ===============================
async function acceptTask(id) {
  try {
    await firebase.firestore().collection("tasks").doc(id).update({
      status: "accepted",
      workerId: currentUser.uid
    });

    showPopup("Task accepted");
  } catch (err) {
    console.error(err);
    showPopup("Accept failed");
  }
}

// ===============================
// SUBMIT TASK (WORKER DONE)
// ===============================
async function submitTask(id) {
  try {
    await firebase.firestore().collection("tasks").doc(id).update({
      status: "submitted"
    });

    showPopup("Submitted for review");
  } catch (err) {
    console.error(err);
    showPopup("Submit failed");
  }
}

// ===============================
// CONFIRM TASK (OWNER RELEASE ESCROW)
// ===============================
async function confirmTask(id) {
  const ref = firebase.firestore().collection("tasks").doc(id);

  try {
    const doc = await ref.get();
    const task = doc.data();

    if (task.ownerId !== currentUser.uid) {
      return showPopup("Not allowed");
    }

    if (task.status !== "submitted") {
      return showPopup("Not ready");
    }

    const earnings = Math.floor(task.amount * 0.9);

    // mark complete + release escrow
    await ref.update({
      status: "completed"
    });

    showPopup("Escrow released: ₦" + earnings);

  } catch (err) {
    console.error(err);
    showPopup("Confirm failed");
  }
}
