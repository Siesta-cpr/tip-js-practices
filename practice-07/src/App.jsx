import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { selectTasks, getTaskStats, addTask, updateTask, toggleTask, removeTask } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

function getNextId(tasks) {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(task => task.id)) + 1;
}

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = editingId === null ? null : tasks.find(task => task.id === editingId) ?? null;

  function handleSave(value) {
    if (editingId === null) {
      setTasks(previous => addTask(previous, value, getNextId(previous)));
      setMessage(`Задача «${value.title}» создана.`);
      return true;
    }
    if (!tasks.some(task => task.id === editingId)) return false;
    setTasks(previous => updateTask(previous, editingId, value));
    setMessage(`Задача ${editingId} изменена.`);
    setEditingId(null);
    return true;
  }

  function handleToggle(id) {
    setTasks(previous => toggleTask(previous, id));
    setMessage(`Статус задачи ${id} изменён.`);
  }

  function handleEdit(id) {
    setEditingId(id);
    setMessage('');
  }

  function handleCancel() {
    setEditingId(null);
    setMessage('Редактирование отменено.');
  }

  function handleDelete(id) {
    const task = tasks.find(item => item.id === id);
    if (!task || !window.confirm(`Удалить задачу «${task.title}»?`)) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
    setMessage(`Задача ${id} удалена.`);
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <p role="status">{message}</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskForm
        key={editingId ?? 'new'}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <TaskList
        tasks={visibleTasks}
        categories={categories}
        totalCount={tasks.length}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
