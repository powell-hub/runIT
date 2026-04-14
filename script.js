// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;
let _taskListener = null;
let _chatListener = null;

// ===============================
// POPUP
// ===============================
function showPopup(message) {
  let popup = document.getElementById("popup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup";
    document.body.appendChild(popup);

    Object.assign(popup.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#111",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "10px",
      zIndex: "9999"
    });
  }

  popup.innerText = message;
  popup.style.display = "block";
  setTimeout(() => popup.style.display = "none", 2000);
}

// ===============================
// AUTH
// ===============================
firebase.auth().onAuthStateChanged((user) => {
  const page = window.location.pathname;

  if (!user &&
    !page.includes("login.html") &&
    !page.includes("signup.html")) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user || null;

  if (user) initApp();
});

// ===============================
function initApp() {
  displayTasks();
}

// ===============================
// POST TASK
// ===============================
async function postTask() {
  const text = document.getElementById("taskInput")?.value;
  const amount = Number(document.getElementById("amountInput")?.value);

  if (!currentUser) return showPopup("Login required");
  if (!text || !amount) return showPopup("Fill all fields");

  await firebase.firestore().collection("tasks").add({
    text,
    amount,
    status: "pending",
    ownerId: currentUser.uid,
    workerId: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showPopup("Task posted");
}

// ===============================
// DISPLAY TASKS
// ===============================
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  if (_taskListener) _taskListener();

  _taskListener = firebase.firestore()
    .collection("tasks")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      taskList.innerHTML = "";

      snapshot.forEach(doc => {
        const task = doc.data();
        const id = doc.id;

        if (task.status === "completed") return;

        const uid = currentUser?.uid;
        const isOwner = uid === task.ownerId;
        const isWorker = uid === task.workerId;

        taskList.innerHTML += `
          <div class="task">
            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>${task.status}</small><br><br>

            ${task.status === "pending" && !isOwner ? `
              <button onclick="acceptTask('${id}')">Accept</button>
            ` : ""}

            ${task.status === "accepted" && isWorker ? `
              <button onclick="submitTask('${id}')">Submit</button>
            ` : ""}

            ${task.status === "submitted" && isOwner ? `
              <button onclick="confirmTask('${id}')">Confirm & Pay</button>
            ` : ""}

            ${(isOwner || isWorker) ? `
              <button onclick="openChat('${id}')">Chat</button>
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
  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (!currentUser) return showPopup("Login required");
  if (task.ownerId === currentUser.uid) return showPopup("Cannot accept own task");
  if (task.status !== "pending") return showPopup("Already taken");

  await ref.update({
    status: "accepted",
    workerId: currentUser.uid
  });

  showPopup("Accepted");
}

// ===============================
// SUBMIT TASK
// ===============================
async function submitTask(id) {
  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (task.workerId !== currentUser.uid)
    return showPopup("Not your task");

  await ref.update({
    status: "submitted"
  });

  showPopup("Submitted");
}

// ===============================
// CONFIRM TASK
// ===============================
async function confirmTask(id) {
  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (task.ownerId !== currentUser.uid)
    return showPopup("Only owner can confirm");

  if (task.status !== "submitted")
    return showPopup("Not ready");

  const earnings = Math.floor(task.amount * 0.9);

  await ref.update({
    status: "completed",
    paidAmount: earnings
  });

  showPopup("Paid ₦" + earnings);
}

// ===============================
// CHAT NAVIGATION
// ===============================
function openChat(taskId) {
  window.location.href = `chat.html?taskId=${taskId}`;
}
