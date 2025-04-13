export default function SessionSettings() {
  const isMobileConsoleEnabled = () => localStorage.getItem('active-eruda') === 'true';

  return <>
    <main class="= p-4">
      <button onClick={() => {
        localStorage.setItem('active-eruda', isMobileConsoleEnabled() ? '' : 'true');
        location.reload();
      }}>
        Toggle mobile console
      </button>
    </main>
  </>;
}