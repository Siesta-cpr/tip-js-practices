import { demoTasks, variantNumber, variantTasks } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { createTaskElement, renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";
const initialTasks = useVariant ? variantTasks : demoTasks;

let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyMessageElement = document.querySelector("#empty-message");
const operationMessageElement = document.querySelector("#operation-message");
const filtersElement = document.querySelector("#task-filters");

function restoreTaskFocus(id, action) {
  const button = document.querySelector(
    `li[data-task-id="${id}"] button[data-action="${action}"]`
  );
  if (button) {
    button.focus();
    return;
  }
  const activeFilterButton = filtersElement.querySelector(
    `button[data-filter="${currentFilter}"]`
  );
  if (activeFilterButton) {
    activeFilterButton.focus();
  }
}

function updateActiveFilterButton() {
  const buttons = filtersElement.querySelectorAll("button[data-filter]");
  buttons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(listElement, visibleTasks);
  renderSummary(summaryElement, currentTasks, visibleTasks.length);
  renderEmptyState(emptyMessageElement, currentTasks.length, visibleTasks.length);
  updateActiveFilterButton();
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const rawId = card.dataset.taskId;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    operationMessageElement.textContent = "Некорректный идентификатор задачи.";
    return;
  }

  let result;
  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (task === undefined) {
      operationMessageElement.textContent = "Задача не найдена.";
      return;
    }
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  if (!result.ok) {
    operationMessageElement.textContent = result.error;
    return;
  }

  currentTasks = result.tasks;
  operationMessageElement.textContent = "";
  renderApp();
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filtersElement.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  operationMessageElement.textContent = "";
  renderApp();
}

listElement.addEventListener("click", handleTaskListClick);
filtersElement.addEventListener("click", handleFilterClick);

renderApp();