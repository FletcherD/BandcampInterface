import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  styleLoading: boolean;
  styleError: boolean;
}

export function ThemeToggle({ styleLoading, styleError }: ThemeToggleProps) {
  const { theme, toggleTheme, bandcampStyle } = useTheme();

  // Determine if button should be disabled
  // Only disable if trying to switch TO Bandcamp theme and the style failed to load
  const isDisabled = theme === 'default' && styleError && !bandcampStyle;

  // Show loading indicator if style is still loading
  const isStyleLoading = theme === 'default' && styleLoading;

  const handleClick = () => {
    // If switching to Bandcamp theme but style failed to load, show error
    if (theme === 'default' && styleError && !bandcampStyle) {
      console.warn('Cannot switch to Bandcamp theme: styles not available for this album');
      alert('Bandcamp styling not available for this album. This may be due to a custom domain or CORS restriction.');
      return;
    }

    // Allow toggle even if style is loading - it will apply when ready
    toggleTheme();
  };

  const getButtonText = () => {
    if (theme === 'bandcamp') {
      return '↩ Use Default Style';
    }
    if (isStyleLoading) {
      return '⏳ Loading Style...';
    }
    return '🎨 Use Bandcamp Style';
  };

  const getTitle = () => {
    if (theme === 'bandcamp') {
      return 'Switch to Default theme';
    }
    if (isStyleLoading) {
      return 'Loading Bandcamp styling...';
    }
    if (isDisabled) {
      return 'Bandcamp styling not available for this album';
    }
    return 'Switch to Bandcamp theme';
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 right-4 z-50 px-4 py-2 text-sm font-medium rounded-lg shadow-lg transition-colors ${
        isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
      }`}
      title={getTitle()}
      disabled={isDisabled}
    >
      {getButtonText()}
    </button>
  );
}
