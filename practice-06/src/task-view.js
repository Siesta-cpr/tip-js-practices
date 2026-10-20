const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;
  button.append(span);
  return button;
}

// Пользовательские и серверные строки добавляются только через textContent.
export function createTaskElement(task, category) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = String(task.id);
  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? "";

  const categoryName = document.createElement("span");
  categoryName.className = "task-category";
  categoryName.textContent = category?.name ?? "Без категории";

  meta.append(status, priority, categoryName);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = createActionButton("toggle", "Выполнена");
  toggleButton.setAttribute("aria-pressed", task.completed ? "true" : "false");

  actions.append(
    toggleButton,
    createActionButton("edit", "Изменить"),
    createActionButton("delete", "Удалить"),
  );
  li.append(title, meta, actions);

  return li;
}

export function renderTaskList(list, tasks, categories) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const cards = tasks.map((task) => createTaskElement(task, categoriesById.get(task.categoryId)));
  list.replaceChildren(...cards);
}
