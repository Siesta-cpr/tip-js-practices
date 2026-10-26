import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, totalCount, onToggle, onEdit, onDelete }) {
  function getCategoryName(categoryId) {
    return categories.find(category => category.id === categoryId)?.name ?? 'Без категории';
  }

  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: {tasks.length}</p>
      {tasks.length === 0 ? (
        <p>{totalCount === 0 ? 'Список задач пуст.' : 'Нет задач, подходящих под фильтры.'}</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={getCategoryName(task.categoryId)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
