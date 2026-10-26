import { ApiError } from './errors.js';

const ALLOWED_PARAMS = ['completed', 'priority', 'categoryId', 'q'];
const PRIORITIES = ['low', 'medium', 'high'];

export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function invalidQuery(message) {
  return new ApiError(400, 'INVALID_QUERY', message);
}

export function parseFilters(searchParams) {
  for (const name of searchParams.keys()) {
    if (!ALLOWED_PARAMS.includes(name)) throw invalidQuery(`Неизвестный параметр: ${name}.`);
  }
  for (const name of ALLOWED_PARAMS) {
    if (searchParams.getAll(name).length > 1) throw invalidQuery(`Параметр ${name} указан несколько раз.`);
  }

  const filters = { completed: null, priority: null, categoryId: null, q: '' };

  const completed = searchParams.get('completed');
  if (completed !== null) {
    if (completed !== 'true' && completed !== 'false') {
      throw invalidQuery('Параметр completed должен быть true или false.');
    }
    filters.completed = completed === 'true';
  }

  const priority = searchParams.get('priority');
  if (priority !== null) {
    if (!PRIORITIES.includes(priority)) throw invalidQuery('Параметр priority должен быть low, medium или high.');
    filters.priority = priority;
  }

  const categoryId = searchParams.get('categoryId');
  if (categoryId !== null) {
    const parsed = parsePositiveId(categoryId);
    if (parsed === null) throw invalidQuery('Параметр categoryId должен быть положительным целым числом.');
    filters.categoryId = parsed;
  }

  const q = searchParams.get('q');
  if (q !== null) {
    const trimmed = q.trim();
    if (trimmed.length > 100) throw invalidQuery('Параметр q должен быть не длиннее 100 символов.');
    filters.q = trimmed;
  }

  return filters;
}
