import { useState } from 'react';

export default function Counter({ step = 1 }) {
  const [count, setCount] = useState(0);
  return (
    <section>
      <p>Счётчик: {count}</p>
      <button type="button" onClick={() => setCount(previous => previous + step)}>
        Увеличить на {step}
      </button>
    </section>
  );
}
