const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};

  let title;
  if (typeof draft?.title !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = draft.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов.";
    }
  }

  if (!ALLOWED_PRIORITIES.has(draft?.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  // Значение select приходит строкой; пустая строка не превращается в 0.
  const rawCategoryId = draft?.categoryId;
  const categoryId = rawCategoryId === "" || rawCategoryId == null ? NaN : Number(rawCategoryId);
  const knownCategories = Array.isArray(categories) ? categories : [];
  if (!Number.isSafeInteger(categoryId) || !knownCategories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите категорию из списка.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }
  return { valid: true, value: { title, priority: draft.priority, categoryId }, errors: {} };
}
