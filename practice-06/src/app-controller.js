import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
const VIEW_METHODS = [
  "setListState",
  "setTasks",
  "setCategories",
  "setTotal",
  "setFormTask",
  "showFormErrors",
  "setMutationPending",
  "notify",
];

const API_METHODS = [
  "loadInitialData",
  "getTasks",
  "createTask",
  "updateTask",
  "setTaskCompleted",
  "deleteTask",
  "resetDemoData",
];

function requireMethods(value, names, label) {
  if (!value || names.some((name) => typeof value[name] !== "function")) {
    throw new TypeError(`${label} не содержит обязательных методов.`);
  }
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, API_METHODS, "api");
  requireMethods(view, VIEW_METHODS, "view");

  let tasks = [];
  let categories = null;
  let filters = {};
  let editingId = null;
  let activeLoad = null;
  let loadSequence = 0;

  // Загрузка с текущими фильтрами. Пока категории не получены,
  // используется loadInitialData, затем только getTasks.
  async function loadCurrentTasks() {
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    const sequence = ++loadSequence;
    const options = { signal: controller.signal };

    view.setListState("loading");
    try {
      let result;
      if (categories === null) {
        result = await api.loadInitialData({ ...filters }, options);
        if (sequence !== loadSequence) return;
        categories = result.categories;
        view.setCategories(categories);
      } else {
        result = await api.getTasks({ ...filters }, options);
        if (sequence !== loadSequence) return;
      }

      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta?.total ?? tasks.length);
      view.setListState(tasks.length > 0 ? "ready" : "empty");
    } catch (error) {
      // Устаревший запрос и отмена не являются ошибкой для пользователя.
      if (sequence !== loadSequence) return;
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    } finally {
      if (activeLoad === controller) activeLoad = null;
    }
  }

  // Общая схема мутации: блокировка, запрос, сообщение, повторный GET, разблокировка.
  async function runMutation(action, successMessage) {
    view.setMutationPending(true);
    try {
      await action();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
    } catch (error) {
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  function findTask(id) {
    return tasks.find((task) => task.id === id);
  }

  function start(initialFilters = {}) {
    filters = { ...initialFilters };
    return loadCurrentTasks();
  }

  function applyFilters(nextFilters = {}) {
    filters = { ...nextFilters };
    return loadCurrentTasks();
  }

  function refresh() {
    return loadCurrentTasks();
  }

  function cancelEdit() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  function beginEdit(id) {
    const task = findTask(id);
    if (task === undefined) {
      view.notify("Задача не найдена в текущем списке.", "error");
      return;
    }
    editingId = id;
    view.showFormErrors({});
    view.setFormTask(task);
  }

  async function submit(draft) {
    const result = validateDraft(draft, categories ?? []);
    if (!result.valid) {
      view.showFormErrors(result.errors);
      return;
    }
    view.showFormErrors({});

    const id = editingId;
    await runMutation(async () => {
      if (id === null) {
        await api.createTask(result.value);
      } else {
        await api.updateTask(id, result.value);
      }
      cancelEdit();
    }, id === null ? "Задача создана." : "Изменения сохранены.");
  }

  async function toggleTask(id) {
    const task = findTask(id);
    if (task === undefined) {
      view.notify("Задача не найдена в текущем списке.", "error");
      return;
    }
    await runMutation(
      () => api.setTaskCompleted(id, !task.completed),
      "Статус задачи изменён.",
    );
  }

  async function deleteTask(id) {
    await runMutation(() => api.deleteTask(id), "Задача удалена.");
  }

  async function resetData() {
    await runMutation(() => api.resetDemoData(), "Учебные данные восстановлены.");
  }

  function destroy() {
    loadSequence += 1;
    activeLoad?.abort();
    activeLoad = null;
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
  };
}
