export function selectTasks(tasks, filters) {
  const query = filters.q.toLocaleLowerCase('ru-RU');
  return tasks.filter(task =>
    (filters.completed === null || task.completed === filters.completed) &&
    (filters.priority === null || task.priority === filters.priority) &&
    (filters.categoryId === null || task.categoryId === filters.categoryId) &&
    (query === '' || task.title.toLocaleLowerCase('ru-RU').includes(query))
  );
}

export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}
