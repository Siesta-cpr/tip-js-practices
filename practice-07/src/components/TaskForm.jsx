import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(initialTask, categories) {
  if (initialTask) {
    return {
      title: initialTask.title,
      priority: initialTask.priority,
      categoryId: String(initialTask.categoryId),
    };
  }
  return { title: '', priority: 'medium', categoryId: categories.length > 0 ? String(categories[0].id) : '' };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const isEditing = initialTask !== null;

  function handleChange(event) {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    setSaveError('');
    if (!result.valid) return;

    const saved = onSave(result.value);
    if (!saved) {
      setSaveError('Не удалось сохранить задачу: запись не найдена.');
      return;
    }
    if (!isEditing) setDraft(createDraft(null, categories));
  }

  function fieldProps(name) {
    return {
      id: `task-${name}`,
      name,
      value: draft[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `task-${name}-error` : undefined,
    };
  }

  return (
    <section aria-label="Форма задачи">
      <h2>{isEditing ? `Редактирование задачи ${initialTask.id}` : 'Новая задача'}</h2>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="task-title">Название</label>
        <input type="text" {...fieldProps('title')} />
        {errors.title && <p id="task-title-error" className="error">{errors.title}</p>}

        <label htmlFor="task-priority">Приоритет</label>
        <select {...fieldProps('priority')}>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        {errors.priority && <p id="task-priority-error" className="error">{errors.priority}</p>}

        <label htmlFor="task-categoryId">Категория</label>
        <select {...fieldProps('categoryId')}>
          {categories.map(category => (
            <option key={category.id} value={String(category.id)}>{category.name}</option>
          ))}
        </select>
        {errors.categoryId && <p id="task-categoryId-error" className="error">{errors.categoryId}</p>}

        <div className="actions">
          <button type="submit">{isEditing ? 'Сохранить изменения' : 'Добавить задачу'}</button>
          {isEditing && <button type="button" onClick={onCancel}>Отменить</button>}
        </div>
      </form>
      {saveError && <p role="alert">{saveError}</p>}
    </section>
  );
}
