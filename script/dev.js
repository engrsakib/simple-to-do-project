document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById("loginContainer");
    const createAdminContainer = document.getElementById(
      "createAdminContainer"
    );
    const todoContainer = document.getElementById("todoContainer");
    const loginBtn = document.getElementById("loginBtn");
    const createAdminBtn = document.getElementById("createAdminBtn");
    const showCreateAdminBtn =
      document.getElementById("showCreateAdminBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");
    const loginMessage = document.getElementById("loginMessage");
    const createAdminMessage =
      document.getElementById("createAdminMessage");
    const taskInput = document.getElementById("taskInput");
    const taskDateTime = document.getElementById("taskDateTime");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const taskList = document.getElementById("taskList");
    const searchInput = document.getElementById("searchInput");

    let currentAdmin = null;

    // Load tasks from localStorage and display them
    const loadTasks = () => {
      if (!currentAdmin) return;

      const tasks =
        JSON.parse(localStorage.getItem(`tasks_${currentAdmin}`)) || [];
      tasks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort tasks by timestamp
      return tasks;
    };

    // Display tasks in the table
    const displayTasks = (tasks) => {
      taskList.innerHTML = ""; // Clear existing tasks
      tasks.forEach((task, index) => {
        addTaskToTable(
          task.text,
          task.completed,
          task.timestamp,
          task.author,
          index + 1
        );
      });
    };

    // Filter tasks based on search input
    const filterTasks = () => {
      const searchQuery = searchInput.value.toLowerCase();
      const tasks = loadTasks();
      const filteredTasks = tasks.filter((task) =>
        task.text.toLowerCase().includes(searchQuery)
      );
      displayTasks(filteredTasks);
    };

    // Save tasks to localStorage
    const saveTasks = (tasks) => {
      if (currentAdmin) {
        localStorage.setItem(
          `tasks_${currentAdmin}`,
          JSON.stringify(tasks)
        );
      }
    };

    // Initialize with a default admin if not present
    if (!localStorage.getItem("admins")) {
      const defaultAdmins = [
        { username: "admin", password: "password", name: "Admin" },
      ];
      localStorage.setItem("admins", JSON.stringify(defaultAdmins));
    }

    // Show create admin form
    showCreateAdminBtn.addEventListener("click", () => {
      loginContainer.classList.add("hidden");
      createAdminContainer.classList.remove("hidden");
    });

    // Show login form
    showLoginBtn.addEventListener("click", () => {
      createAdminContainer.classList.add("hidden");
      loginContainer.classList.remove("hidden");
    });

    // Handle login
    loginBtn.addEventListener("click", () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const admins = JSON.parse(localStorage.getItem("admins")) || [];

      const admin = admins.find(
        (admin) =>
          admin.username === username && admin.password === password
      );

      if (admin) {
        currentAdmin = admin.username;
        loginContainer.classList.add("hidden");
        todoContainer.classList.remove("hidden");
        displayTasks(loadTasks()); // Load tasks for the logged-in admin
      } else {
        loginMessage.textContent = "Invalid username or password";
      }
    });

    // Create admin button click event
    createAdminBtn.addEventListener("click", () => {
      const newUsername = document.getElementById("newUsername").value;
      const newPassword = document.getElementById("newPassword").value;

      if (newUsername && newPassword) {
        const admins = JSON.parse(localStorage.getItem("admins")) || [];
        const existingAdmin = admins.find(
          (admin) => admin.username === newUsername
        );

        if (existingAdmin) {
          createAdminMessage.textContent = "Username already exists";
        } else {
          admins.push({
            username: newUsername,
            password: newPassword,
            name: newUsername,
          });
          localStorage.setItem("admins", JSON.stringify(admins));
          createAdminContainer.classList.add("hidden");
          loginContainer.classList.remove("hidden");
        }
      } else {
        createAdminMessage.textContent = "Please fill in both fields";
      }
    });

    // Add task button click event
    addTaskBtn.addEventListener("click", () => {
      const taskText = taskInput.value;
      const taskDate = taskDateTime.value;

      if (taskText && taskDate) {
        const timestamp = new Date(taskDate).toISOString(); // Set date and time
        const tasks = loadTasks();
        const newTask = {
          text: taskText,
          completed: false,
          timestamp: timestamp,
          author: currentAdmin,
        };
        tasks.push(newTask);
        saveTasks(tasks);
        displayTasks(loadTasks()); // Update the table
        taskInput.value = "";
        taskDateTime.value = "";
      }
    });

    // Task list click event
    taskList.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        if (!currentAdmin) return;

        const timestamp = e.target.dataset.timestamp;
        let tasks = loadTasks();
        tasks = tasks.filter((t) => t.timestamp !== timestamp);
        saveTasks(tasks);
        displayTasks(loadTasks()); // Update the table
      } else if (e.target.classList.contains("edit-btn")) {
        if (!currentAdmin) return;

        const row = e.target.closest("tr");
        const taskCell = row.querySelector(".task");
        const newTaskText = prompt("Edit Task:", taskCell.textContent);
        if (newTaskText !== null) {
          const timestamp = e.target.dataset.timestamp;
          let tasks = loadTasks();
          const task = tasks.find((t) => t.timestamp === timestamp);
          if (task) {
            task.text = newTaskText;
            saveTasks(tasks);
            displayTasks(loadTasks()); // Update the table
          }
        }
      }
    });

    // Function to add a task to the table
    function addTaskToTable(
      text,
      completed = false,
      timestamp,
      author,
      serialNo
    ) {
      const tr = document.createElement("tr");
      if (completed) {
        tr.classList.add("completed");
      }
      tr.innerHTML = `
                <td class="p-2 border text-center">${serialNo}</td>
                <td class="p-2 border task">${text}</td>
                <td class="p-2 border">${new Date(
                  timestamp
                ).toLocaleString()}</td>
                <td class="p-2 border">${author}</td>
                <td class="p-2 border action-buttons">
                    <button class="edit-btn py-1 px-2 text-white rounded-md hover:bg-blue-600" data-timestamp="${timestamp}">Edit</button>
                    <button class="delete-btn py-1 px-2 text-white rounded-md hover:bg-red-600" data-timestamp="${timestamp}">Delete</button>
                </td>
            `;
      taskList.appendChild(tr);
    }

    // Function to download table as PDF
    downloadBtn.addEventListener("click", () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Table header
      const headers = ["SL No.", "Task", "Time", "Author", "Actions"];
      const rows = [];
      const table = document.querySelector("table");
      const trs = table.querySelectorAll("tbody tr");

      trs.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        rows.push([
          tds[0].innerText,
          tds[1].innerText,
          tds[2].innerText,
          tds[3].innerText,
          tds[4].innerText,
        ]);
      });

      doc.autoTable({
        head: [headers],
        body: rows,
      });

      doc.save("todo-list.pdf");
    });

    // Attach search input event listener
    searchInput.addEventListener("input", filterTasks);
  });

  //right click
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
      e.preventDefault();
    }
  });

  function detectDevTools() {
    const threshold = 160;
    let isDevToolsOpen = false;
    const element = document.createElement("div");

    Object.defineProperty(element, "style", {
      get: function () {
        isDevToolsOpen = true;
        return {};
      },
    });

    setInterval(function () {
      if (isDevToolsOpen) {
        alert("DevTools is open!");
        // Optionally, you could take actions here
      }
    }, threshold);
  }

  window.onload = detectDevTools;