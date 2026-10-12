
/* ==========================================
   TASKNEST — PRODUCTIVITY APP
   JavaScript + Local Storage
   ========================================== */

"use strict";

// 1. SELECT HTML ELEMENTS

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskImportant = document.getElementById("taskImportant");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyText = document.getElementById("emptyText");

const searchInput = document.getElementById("searchInput");
const openFormBtn = document.getElementById("openFormBtn");
const openTaskBtn = document.getElementById("openTaskBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelBtn = document.getElementById("cancelBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

const formTitle = document.getElementById("formTitle");
const toast = document.getElementById("toast");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const themeBtn = document.getElementById("themeBtn");


// 2. APPLICATION STATE

const STORAGE_KEY = "tasknest_tasks_v1";
const THEME_KEY = "tasknest_theme_v1";

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;
let toastTimer = null;


// 3. LOAD AND SAVE TASKS

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        // Ignore malformed task entries.
        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Unable to load tasks:", error);
        return [];
    }
}


function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);
        showToast("Unable to save tasks in this browser.");
        return false;
    }
}


// 4. HELPER FUNCTIONS

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
    if (!dateString) {
        return "No due date";
    }

    // Parse a local calendar date without UTC timezone shifts.
    const parts = dateString.split("-").map(Number);

    if (
        parts.length !== 3 ||
        !parts.every(Number.isFinite)
    ) {
        return "No due date";
    }

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    if (
        date.getFullYear() !== parts[0] ||
        date.getMonth() !== parts[1] - 1 ||
        date.getDate() !== parts[2]
    ) {
        return "No due date";
    }

    if (dateString === getToday()) {
        return "Today";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


// 5. DISPLAY CURRENT DATE AND GREETING

function updateDateAndGreeting() {
    const currentDate = document.getElementById("currentDate");
    const footerYear = document.getElementById("footerYear");
    const greeting = document.getElementById("greeting");

    const now = new Date();

    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    if (footerYear) {
        footerYear.textContent = now.getFullYear();
    }

    if (greeting) {
        const hour = now.getHours();

        let message = "Make today";

        if (hour < 12) {
            message = "Good morning!";
        } else if (hour < 17) {
            message = "Good afternoon!";
        } else {
            message = "Good evening!";
        }

        greeting.innerHTML =
            `${message} <span>count.</span> <span aria-hidden="true">✨</span>`;
    }
}


// 6. OPEN AND CLOSE TASK FORM

function openTaskForm(task = null) {
    editingTaskId = task ? task.id : null;

    taskForm.hidden = false;

    formTitle.textContent = task
        ? "Edit Your Task"
        : "Create a New Task";

    saveTaskBtn.innerHTML = task
        ? '<i class="fa-solid fa-check"></i> Update Task'
        : '<i class="fa-solid fa-check"></i> Save Task';

    taskTitle.value = task ? task.title : "";
    taskDescription.value = task ? task.description || "" : "";
    taskDate.value = task ? task.dueDate || "" : "";
    taskPriority.value = task ? task.priority || "medium" : "medium";
    taskImportant.checked = task ? Boolean(task.important) : false;

    document.getElementById("taskForm").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    taskTitle.focus();
}


function closeTaskForm() {
    taskForm.hidden = true;
    taskForm.reset();
    editingTaskId = null;

    formTitle.textContent = "Create a New Task";

    saveTaskBtn.innerHTML =
        '<i class="fa-solid fa-check"></i> Save Task';
}


openFormBtn.addEventListener("click", () => openTaskForm());

openTaskBtn.addEventListener("click", () => openTaskForm());

emptyAddBtn.addEventListener("click", () => openTaskForm());

closeFormBtn.addEventListener("click", closeTaskForm);

cancelBtn.addEventListener("click", closeTaskForm);


// 7. ADD AND EDIT TASKS

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const dueDate = taskDate.value;
    const priority = taskPriority.value;
    const important = taskImportant.checked;

    if (!title) {
        showToast("Please enter a task name.");
        taskTitle.focus();
        return;
    }

    if (dueDate && dueDate < "1000-01-01") {
        showToast("Please enter a valid due date.");
        return;
    }

    if (!["low", "medium", "high"].includes(priority)) {
        showToast("Please select a valid priority.");
        return;
    }

    if (editingTaskId) {
        const existingTask = tasks.find(
            task => task.id === editingTaskId
        );

        if (!existingTask) {
            showToast("Task not found. Please try again.");
            closeTaskForm();
            return;
        }

        existingTask.title = title;
        existingTask.description = description;
        existingTask.dueDate = dueDate;
        existingTask.priority = priority;
        existingTask.important = important;

        if (!saveTasks()) {
            return;
        }

        closeTaskForm();
        renderTasks();
        showToast("Task updated successfully! ✨");

    } else {
        const newTask = {
            id: createTaskId(),
            title,
            description,
            dueDate,
            priority,
            important,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);

        if (!saveTasks()) {
            tasks.shift();
            return;
        }

        closeTaskForm();

        // Show the newly created task immediately.
        currentFilter = "all";
        searchInput.value = "";

        renderTasks();

        showToast("Your new task has been created! 🎉");
    }
});


// 8. FILTER TASKS

function getFilteredTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const today = getToday();

    return tasks.filter(task => {
        let matchesFilter = true;

        switch (currentFilter) {
            case "today":
                matchesFilter =
                    task.dueDate === today &&
                    !task.completed;
                break;

            case "important":
                matchesFilter = Boolean(task.important);
                break;

            case "completed":
                matchesFilter = task.completed;
                break;

            case "all":
            default:
                matchesFilter = true;
        }

        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description || "").toLowerCase().includes(searchTerm);

        return matchesFilter && matchesSearch;
    });
}


function setFilter(filter) {
    const validFilters = [
        "all",
        "today",
        "important",
        "completed"
    ];

    if (!validFilters.includes(filter)) {
        return;
    }

    currentFilter = filter;

    // Keep sidebar and task board filters synchronized.
    document.querySelectorAll("[data-filter]").forEach(button => {
        const isActive = button.dataset.filter === filter;

        button.classList.toggle("active", isActive);

        if (button.classList.contains("nav-item")) {
            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        }
    });

    renderTasks();
}


document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);

        if (sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    });
});


searchInput.addEventListener("input", renderTasks);


// 9. RENDER TASK CARDS

function renderTasks() {
    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = "";

    filteredTasks.forEach(task => {
        const card = document.createElement("article");

        card.className = `task-card${task.completed ? " is-complete" : ""}`;
        card.dataset.id = task.id;

        const safeTitle = escapeHTML(task.title);
        const safeDescription = escapeHTML(task.description || "");
        const safeDate = escapeHTML(formatDate(task.dueDate));

        const priorityNames = {
            low: "Low",
            medium: "Medium",
            high: "High"
        };

        const priority = priorityNames[task.priority] || "Medium";

        const priorityClass = task.completed
            ? "completed"
            : (priority.toLowerCase());

        const priorityText = task.completed
            ? "Completed"
            : priority;

        card.innerHTML = `
            <input
                class="check-task"
                type="checkbox"
                aria-label="Mark ${safeTitle} as completed"
                ${task.completed ? "checked" : ""}>

            <div class="task-info">
                <div class="task-title-row">
                    <h3 class="task-title">${safeTitle}</h3>

                    ${
                        task.important
                            ? '<i class="fa-solid fa-star star-mark" title="Important task"></i>'
                            : ""
                    }
                </div>

                ${
                    safeDescription
                        ? `<p class="task-description">${safeDescription}</p>`
                        : ""
                }
            </div>

            <span class="task-date">
                <i class="fa-regular fa-calendar"></i>
                ${safeDate}
            </span>

            <span class="priority ${priorityClass}">
                ${priorityText}
            </span>

            <div class="task-actions">

                <button
                    type="button"
                    class="icon-btn"
                    data-action="important"
                    aria-label="${task.important ? "Remove importance" : "Mark important"}"
                    title="${task.important ? "Remove importance" : "Mark important"}">

                    <i class="${task.important ? "fa-solid" : "fa-regular"} fa-star"></i>
                </button>

                <button
                    type="button"
                    class="icon-btn"
                    data-action="edit"
                    aria-label="Edit ${safeTitle}"
                    title="Edit task">

                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    type="button"
                    class="icon-btn delete"
                    data-action="delete"
                    aria-label="Delete ${safeTitle}"
                    title="Delete task">

                    <i class="fa-regular fa-trash-can"></i>
                </button>

            </div>
        `;

        taskList.appendChild(card);
    });

    // Empty state and search results.
    const isEmpty = filteredTasks.length === 0;

    emptyState.hidden = !isEmpty;
    taskList.hidden = isEmpty;

    if (isEmpty) {
        if (searchInput.value.trim()) {
            emptyTitle.textContent = "No Tasks Found";
            emptyText.textContent =
                "Try another search term to find your tasks.";
        } else if (currentFilter === "completed") {
            emptyTitle.textContent = "Nothing Completed Yet";
            emptyText.textContent =
                "Complete a task and your achievements will appear here.";
        } else if (currentFilter === "today") {
            emptyTitle.textContent = "Your Day Is Clear!";
            emptyText.textContent =
                "You have no pending tasks due today.";
        } else if (currentFilter === "important") {
            emptyTitle.textContent = "Nothing Important Yet";
            emptyText.textContent =
                "Star a task to keep your priorities in one place.";
        } else {
            emptyTitle.textContent = "A Fresh Start!";
            emptyText.textContent =
                "Your task board is ready. Add your first task to begin.";
        }
    }

    updateStatistics();
}


// 10. TASK CARD ACTIONS

taskList.addEventListener("change", function (event) {
    if (!event.target.classList.contains("check-task")) {
        return;
    }

    const card = event.target.closest(".task-card");

    if (!card) {
        return;
    }

    const task = tasks.find(item => item.id === card.dataset.id);

    if (!task) {
        return;
    }

    task.completed = event.target.checked;

    if (!saveTasks()) {
        task.completed = !event.target.checked;
        renderTasks();
        return;
    }

    renderTasks();

    showToast(
        task.completed
            ? "Great job! Task completed. 🎉"
            : "Task moved back to pending."
    );
});


taskList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const card = button.closest(".task-card");

    if (!card) {
        return;
    }

    const task = tasks.find(item => item.id === card.dataset.id);

    if (!task) {
        return;
    }

    const action = button.dataset.action;

    if (action === "edit") {
        openTaskForm(task);
        return;
    }

    if (action === "important") {
        task.important = !task.important;

        if (!saveTasks()) {
            task.important = !task.important;
            return;
        }

        renderTasks();

        showToast(
            task.important
                ? "Task added to Important ⭐"
                : "Task removed from Important."
        );

        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${task.title}"?`
        );

        if (!confirmed) {
            return;
        }

        const originalIndex = tasks.findIndex(
            item => item.id === task.id
        );

        if (originalIndex === -1) {
            return;
        }

        const removedTask = tasks.splice(originalIndex, 1)[0];

        if (!saveTasks()) {
            tasks.splice(originalIndex, 0, removedTask);
            return;
        }

        renderTasks();
        showToast("Task deleted successfully.");
    }
});


// 11. UPDATE STATISTICS

function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    const important = tasks.filter(
        task => task.important
    ).length;

    const today = tasks.filter(
        task => task.dueDate === getToday() && !task.completed
    ).length;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalStat").textContent = total;
    document.getElementById("doneStat").textContent = completed;
    document.getElementById("pendingStat").textContent = pending;
    document.getElementById("progressStat").textContent = `${progress}%`;

    document.getElementById("progressBar").style.width = `${progress}%`;

    document.getElementById("allCount").textContent = total;
    document.getElementById("todayCount").textContent = today;
    document.getElementById("importantCount").textContent = important;
    document.getElementById("completedCount").textContent = completed;

    clearCompletedBtn.disabled = completed === 0;

    document.getElementById("taskSummary").textContent =
        `${getFilteredTasks().length} of ${total} task${total === 1 ? "" : "s"}`;
}


// 12. CLEAR COMPLETED TASKS

clearCompletedBtn.addEventListener("click", function () {
    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        showToast("There are no completed tasks to clear.");
        return;
    }

    const confirmed = window.confirm(
        `Delete all ${completedTasks.length} completed task(s)?`
    );

    if (!confirmed) {
        return;
    }

    const previousTasks = tasks;

    tasks = tasks.filter(task => !task.completed);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
    showToast("Completed tasks cleared successfully.");
});


// 13. DARK MODE

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark", isDark);

    themeBtn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-regular fa-moon"></i>';

    themeBtn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeBtn.title = isDark ? "Light mode" : "Dark mode";
}


function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) === "dark"
            ? "dark"
            : "light";
    } catch (error) {
        return "light";
    }
}


applyTheme(loadTheme());


themeBtn.addEventListener("click", function () {
    const isDark = document.body.classList.contains("dark");

    const newTheme = isDark ? "light" : "dark";

    applyTheme(newTheme);

    try {
        localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
        console.error("Unable to save theme:", error);
    }

    showToast(
        newTheme === "dark"
            ? "Dark mode enabled 🌙"
            : "Light mode enabled ☀️"
    );
});


// 14. MOBILE SIDEBAR

menuBtn.addEventListener("click", function () {
    const isOpen = sidebar.classList.toggle("open");

    menuBtn.setAttribute("aria-expanded", String(isOpen));
});


// 15. KEYBOARD SHORTCUTS

document.addEventListener("keydown", function (event) {
    const target = event.target;

    const isTyping =
        target instanceof HTMLElement &&
        (
            target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        );

    // Escape closes the task form or mobile navigation.
    if (event.key === "Escape") {
        if (!taskForm.hidden) {
            closeTaskForm();
        }

        sidebar.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
    }

    // Ctrl/Cmd + K focuses the search bar.
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();
        searchInput.focus();
    }

    // N creates a task when not typing in a field.
    if (
        event.key.toLowerCase() === "n" &&
        !isTyping &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
    ) {
        openTaskForm();
    }
});


// 16. INITIALIZE APPLICATION

updateDateAndGreeting();
setFilter("all");

console.log("TaskNest initialized successfully!");

