export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика">
      <h2>Статистика</h2>
      <dl className="stats">
        <div><dt>Всего</dt><dd>{stats.total}</dd></div>
        <div><dt>Выполнено</dt><dd>{stats.completed}</dd></div>
        <div><dt>В работе</dt><dd>{stats.active}</dd></div>
      </dl>
    </section>
  );
}
