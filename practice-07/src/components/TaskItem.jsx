const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li>
      <h3>{task.title}</h3>
      <p>
        Статус: {task.completed ? 'Выполнена' : 'В работе'} · Приоритет: {PRIORITY_LABELS[task.priority]} ·
        Категория: {categoryName}
      </p>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Завершить'}
        </button>
        <button type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
        <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}
