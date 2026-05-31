import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="btn btn-ghost px-2.5 py-2"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.45 1.46l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM17.24 19.16l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 13h3v-2h-3v2zm-8-5a4 4 0 100 8 4 4 0 000-8zm-1 12h2v-3h-2v3zm-7.45-1.45l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 01-4.4 2.26 5.4 5.4 0 01-5.4-5.4c0-1.81.88-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
      )}
    </button>
  );
}
