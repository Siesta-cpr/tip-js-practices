const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function parseId(rawId) {
  if (typeof rawId === "string" && rawId.trim() === "") return NaN;
  if (typeof rawId !== "string" && typeof rawId !== "number") return NaN;
  return Number(rawId);
}

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;

  if (editingId === null) {
    id = parseId(draft.id);
    if (!isValidId(id)) {
      errors.id = "Идентификатор должен быть положительным целым числом.";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = "Задача с таким идентификатором уже существует.";
    }
  } else {
    id = editingId;
    if (!isValidId(id) || !tasks.some((task) => task.id === id)) {
      errors.id = "Редактируемая задача не найдена.";
    }
  }

  let title;
  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = draft.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов без учёта пробелов по краям.";
    }
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { id, title, priority: draft.priority } };
}
