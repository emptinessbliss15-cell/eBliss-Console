export default function ListsView() {
  const listsUrl = (import.meta.env.VITE_LISTS_URL as string | undefined) || 'https://eb-lists.emptinessbliss15.workers.dev/';

  return (
    <section className="lists-view" style={{ width: '100%', maxWidth: '1200px' }}>
      <iframe
        title="eB Lists"
        src={listsUrl}
        style={{
          display: 'block',
          width: '100%',
          minHeight: 'calc(100vh - 110px)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          background: 'var(--surface)',
        }}
      />
    </section>
  );
}
