// Реализация прикладных функций. console.log(), prompt(), document
// и чтение внешнего состояния здесь не используются.
 
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}
 
function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }
  return { ok: true, title: trimmed };
}
 
function isValidPriority(priority) {
  return priority === "low" || priority === "medium" || priority === "high";
}
 
export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом" };
  }
 
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }
 
  if (!isValidPriority(priority)) {
    return { ok: false, error: "Приоритет должен быть одним из: low, medium, high" };
  }
 
  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}
 
export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}
 
export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}
 
export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}
 
export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
 
  return { total, completed, pending, progress };
}
 
export function addTask(tasks, id, title, priority = "medium") {
  const existing = findTaskById(tasks, id);
  if (existing !== undefined) {
    return { ok: false, error: "Задача с таким идентификатором уже существует" };
  }
 
  const createResult = createTask(id, title, priority);
  if (!createResult.ok) {
    return createResult;
  }
 
  return { ok: true, tasks: [...tasks, createResult.task] };
}
 
export function setTaskCompleted(tasks, id, completed) {
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Признак выполнения должен быть true или false" };
  }
 
  const existing = findTaskById(tasks, id);
  if (existing === undefined) {
    return { ok: false, error: "Задача с таким идентификатором не найдена" };
  }
 
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );
 
  return { ok: true, tasks: updatedTasks };
}
 
export function renameTask(tasks, id, title) {
  const existing = findTaskById(tasks, id);
  if (existing === undefined) {
    return { ok: false, error: "Задача с таким идентификатором не найдена" };
  }
 
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }
 
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, title: titleResult.title } : task
  );
 
  return { ok: true, tasks: updatedTasks };
}
 
export function removeTask(tasks, id) {
  const existing = findTaskById(tasks, id);
  if (existing === undefined) {
    return { ok: false, error: "Задача с таким идентификатором не найдена" };
  }
 
  const updatedTasks = tasks.filter((task) => task.id !== id);
 
  return { ok: true, tasks: updatedTasks };
}