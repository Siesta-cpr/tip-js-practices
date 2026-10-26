import { Router } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters } from './validation.js';

const KNOWN_PATHS = ['/health', '/categories', '/tasks', '/tasks/:id'];

export function createRouter(store) {
  const router = Router({ caseSensitive: true });
  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    res.status(200).json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    const { searchParams } = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    res.status(200).json({ data, meta: { total: data.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Идентификатор задачи должен быть положительным целым числом.');
    const task = store.getTask(id);
    if (task === null) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    res.status(200).json({ data: task });
  });

  for (const path of KNOWN_PATHS) {
    router.all(path, (req, res, next) => {
      res.set('Allow', 'GET, HEAD, OPTIONS');
      next(new ApiError(405, 'METHOD_NOT_ALLOWED', `Метод ${req.method} не поддерживается для этого пути.`));
    });
  }

  return router;
}
