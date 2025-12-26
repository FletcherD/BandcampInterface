import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme, bandcampStyle } = useTheme();

  const handleClick = () => {
    // If switching to Bandcamp theme but no style available, show message
    if (theme === 'default' && !bandcampStyle) {
      console.warn('Cannot switch to Bandcamp theme: styles not available for this album');
      alert('Bandcamp styling not available for this album. This may be due to a custom domain or CORS restriction.');
      return;
    }
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 right-4 z-50 px-4 py-2 text-sm font-medium rounded-lg shadow-lg transition-colors ${
        theme === 'default' && !bandcampStyle
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
      }`}
      title={
        theme === 'default' && !bandcampStyle
          ? 'Bandcamp styling not available for this album'
          : `Switch to ${theme === 'default' ? 'Bandcamp' : 'Default'} theme`
      }
      disabled={theme === 'default' && !bandcampStyle}
    >
      {theme === 'default' ? '🎨 Use Bandcamp Style' : '↩ Use Default Style'}
    </button>
  );
}
