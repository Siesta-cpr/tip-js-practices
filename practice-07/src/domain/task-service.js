const PRIORITIES = ['low', 'medium', 'high'];

function parseCategoryId(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim());
  return NaN;
}

export function validateTaskDraft(draft, categories) {
  const errors = {};

  let title = '';
  if (typeof draft?.title !== 'string') {
    errors.title = 'Название должно быть строкой.';
  } else {
    title = draft.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = 'Название должно содержать от 1 до 100 символов без учёта пробелов по краям.';
    }
  }

  const priority = draft?.priority;
  if (!PRIORITIES.includes(priority)) {
    errors.priority = 'Выберите приоритет: низкий, средний или высокий.';
  }

  const categoryId = parseCategoryId(draft?.categoryId);
  if (!Number.isInteger(categoryId) || !categories.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, value: { title, priority, categoryId }, errors };
}

export function selectTasks(tasks, filters) {
  const query = filters.q.trim().toLowerCase();
  return tasks.filter(task =>
    (query === '' || task.title.toLowerCase().includes(query)) &&
    (filters.completed === '' || task.completed === (filters.completed === 'true')) &&
    (filters.priority === '' || task.priority === filters.priority) &&
    (filters.categoryId === '' || task.categoryId === Number(filters.categoryId))
  );
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, value, id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Идентификатор должен быть положительным целым числом.');
  }
  if (tasks.some(task => task.id === id)) {
    throw new Error(`Задача с идентификатором ${id} уже существует.`);
  }
  const task = {
    id,
    title: value.title,
    priority: value.priority,
    categoryId: value.categoryId,
    completed: false,
  };
  return [...tasks, task];
}

export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id
    ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
    : task);
}

export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.filter(task => task.id !== id);
}
