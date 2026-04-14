// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;
let _taskListener = null;
let currentChatTaskId = null;
let _chatListener = null;

// ===============================
// POPUP SYSTEM
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
// INIT
// ===============================
function initApp() {
  displayTasks();
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
async function postTask() {
  const text = document.getElementById("taskInput").value;
  const amount = Number(document.getElementById("amountInput").value);

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
        const isOwner = uid && uid === task.ownerId;
        const isWorker = uid && uid === task.workerId;

        taskList.innerHTML += `
          <div class="task">

            <p>${task.text}</p>
            <strong>₦${task.amount}</strong><br>
            <small>Status: ${task.status}</small><br><br>

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
  if (!currentUser) return showPopup("Login required");

  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (!task) return showPopup("Task not found");

  if (task.ownerId === currentUser.uid)
    return showPopup("Cannot accept your own task");

  if (task.status !== "pending")
    return showPopup("Already taken");

  await ref.update({
    status: "accepted",
    workerId: currentUser.uid
  });

  showPopup("Task accepted");
}

// ===============================
// SUBMIT TASK
// ===============================
async function submitTask(id) {
  if (!currentUser) return showPopup("Login required");

  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (!task) return showPopup("Task not found");

  if (task.workerId !== currentUser.uid)
    return showPopup("Not your task");

  await ref.update({
    status: "submitted"
  });

  showPopup("Submitted for review");
}

// ===============================
// CONFIRM TASK (ESCROW RELEASE)
// ===============================
async function confirmTask(id) {
  if (!currentUser) return showPopup("Login required");

  const ref = firebase.firestore().collection("tasks").doc(id);
  const task = (await ref.get()).data();

  if (!task) return showPopup("Task not found");

  if (task.ownerId !== currentUser.uid)
    return showPopup("Only owner can confirm");

  if (task.status !== "submitted")
    return showPopup("Not ready");

  const earnings = Math.floor(task.amount * 0.9);

  await ref.update({
    status: "completed",
    paidAmount: earnings,
    paidAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showPopup("Paid ₦" + earnings);
}

// ===============================
// CHAT SYSTEM (SECURED)
// ===============================
function openChat(taskId) {
  if (!currentUser) return showPopup("Login required");

  firebase.firestore()
    .collection("tasks")
    .doc(taskId)
    .get()
    .then(doc => {
      const task = doc.data();

      if (!task) return showPopup("Task not found");

      if (currentUser.uid !== task.ownerId &&
          currentUser.uid !== task.workerId) {
        return showPopup("Not part of this chat");
      }

      currentChatTaskId = taskId;

      const chatSection = document.getElementById("chatSection");
      const chatBox = document.getElementById("chatBox");

      if (!chatSection || !chatBox)
        return showPopup("Chat UI missing");

      chatSection.style.display = "block";

      loadChat(taskId);
    });
}

// ===============================
function sendCurrentMessage() {
  const input = document.getElementById("chatInput");
  if (!input || !input.value) return;

  firebase.firestore()
    .collection("chats")
    .doc(currentChatTaskId)
    .collection("messages")
    .add({
      senderId: currentUser.uid,
      text: input.value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

  input.value = "";
}

// ===============================
function loadChat(taskId) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  if (_chatListener) _chatListener();

  _chatListener = firebase.firestore()
    .collection("chats")
    .doc(taskId)
    .collection("messages")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {

      chatBox.innerHTML = "";

      snapshot.forEach(doc => {
        const msg = doc.data();
        const me = msg.senderId === currentUser.uid;

        chatBox.innerHTML += `
          <div style="text-align:${me ? "right" : "left"}">
            <span style="
              display:inline-block;
              padding:8px;
              margin:5px;
              border-radius:10px;
              background:${me ? "#6c4cff" : "#eee"};
              color:${me ? "#fff" : "#000"};
            ">
              ${msg.text}
            </span>
          </div>
        `;
      });

    });
}
