import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mountedRef = useRef(false);
  const mutationRef = useRef(null);

  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mutationRef.current?.abort();
      mutationRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const result = await api.loadInitialData({ q, completed, priority, categoryId }, { signal: controller.signal });
        if (!active) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setError(loadError);
        setStatus('error');
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    setRevision(previous => previous + 1);
  }

  async function mutate(operation) {
    if (!mountedRef.current || mutationRef.current !== null) return false;
    const controller = new AbortController();
    mutationRef.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return false;
      setRevision(previous => previous + 1);
      return true;
    } catch (operationError) {
      if (!mountedRef.current || controller.signal.aborted) return false;
      setMutationError(operationError);
      return false;
    } finally {
      if (mutationRef.current === controller) mutationRef.current = null;
      if (mountedRef.current) setPending(false);
    }
  }

  return {
    snapshot, status, error, mutationError, pending,
    refresh,
    saveTask: (id, value) => mutate(signal => id === null
      ? api.createTask(value, { signal })
      : api.updateTask(id, value, { signal })),
    toggleTask: task => mutate(signal => api.setTaskCompleted(task.id, !task.completed, { signal })),
    deleteTask: id => mutate(signal => api.deleteTask(id, { signal })),
    resetData: () => mutate(signal => api.resetDemoData({ signal })),
  };
}
