import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function hasUniqueIds(items) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function requireId(id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("id задачи должен быть положительным целым числом.");
  }
}

function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом.");
  }

  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;

    if (name === "completed" && typeof value !== "boolean") {
      throw new TypeError("Фильтр completed должен быть true или false.");
    }
    if (name === "priority" && !ALLOWED_PRIORITIES.has(value)) {
      throw new TypeError("Фильтр priority должен быть low, medium или high.");
    }
    if (name === "categoryId" && !isPositiveSafeInteger(value)) {
      throw new TypeError("Фильтр categoryId должен быть положительным целым числом.");
    }
    if (name === "q") {
      if (typeof value !== "string" || value.trim().length > 100) {
        throw new TypeError("Фильтр q должен быть строкой длиной до 100 символов.");
      }
      query.q = value.trim();
      continue;
    }
    query[name] = value;
  }
  return query;
}

function pickFields(source, names) {
  if (source === null || typeof source !== "object") {
    throw new TypeError("Данные задачи должны быть объектом.");
  }
  const body = {};
  for (const name of names) {
    if (source[name] !== undefined) body[name] = source[name];
  }
  return body;
}


export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Нужен клиент с методом requestJson.");
  }


  function readCollection(payload, isItem, name) {
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
      throw invalidResponse(`Ответ ${name} не содержит массив data.`);
    }
    if (!payload.data.every(isItem)) {
      throw invalidResponse(`Ответ ${name} содержит запись, не соответствующую схеме.`);
    }
    if (!hasUniqueIds(payload.data)) {
      throw invalidResponse(`Ответ ${name} содержит повторяющиеся id.`);
    }
    if (!payload.meta || payload.meta.total !== payload.data.length) {
      throw invalidResponse(`meta.total ответа ${name} не совпадает с длиной data.`);
    }
    return payload.data;
  }

  function readTask(payload) {
    if (!payload || !isTask(payload.data)) {
      throw invalidResponse("Ответ не содержит корректную задачу.");
    }
    return payload.data;
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    const tasks = readCollection(payload, isTask, "задач");
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, { signal } = {}) {
    requireId(id);
    return readTask(await client.requestJson(`/tasks/${id}`, { signal }));
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return readCollection(payload, isCategory, "категорий");
  }


  async function loadInitialData(filters = {}, options = {}) {
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  async function createTask(draft, { signal } = {}) {
    const body = pickFields(draft, ["title", "priority", "categoryId"]);
    return readTask(await client.requestJson("/tasks", { method: "POST", body, signal }));
  }

  async function updateTask(id, changes, { signal } = {}) {
    requireId(id);
    const body = pickFields(changes, ["title", "priority", "categoryId", "completed"]);
    return readTask(await client.requestJson(`/tasks/${id}`, { method: "PATCH", body, signal }));
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    requireId(id);
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть true или false.");
    }
    return readTask(await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { completed },
      signal,
    }));
  }

  async function deleteTask(id, { signal } = {}) {
    requireId(id);
    const payload = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    if (payload !== null) {
      throw invalidResponse("Ожидался пустой ответ 204 на удаление.");
    }
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = payload?.data;
    if (!data || data.reset !== true || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw invalidResponse("Сервер не подтвердил восстановление данных.");
    }
    return data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
