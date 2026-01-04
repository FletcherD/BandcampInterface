# Bandcamp Interface

An alternative interface for Bandcamp, built as a browser extension. Browse your collection, wishlist, and discover music with a modern, clean interface featuring high-quality audio streaming and persistent playback.

## Features

### 🎵 Audio Player
- **High-Quality Streaming**: MP3 V0 (~245kbps) for owned tracks
- **Persistent Playback**: Music continues playing as you browse
- **Full Controls**: Play/pause, next/previous, seek bar with time display
- **Auto-play**: Automatically plays the next track when one finishes
- **Quality Indicators**: Visual badges showing HQ vs standard quality

### 📚 Collection Management
- **Auto-loads your entire collection** with progress indicator
- **Dual view modes**: Grid view (visual cards) or Table view (sortable list)
- **Sort by**: Title, Artist, Release Date, or Date Added
- **Background enrichment**: Release dates loaded progressively
- **Persistent caching**: Fast navigation with IndexedDB storage

### 💙 Wishlist
- Same features as Collection page
- Track items you want to purchase
- Sort and browse with the same dual-view interface

### 🔍 Unified Search
- **Search across three sources simultaneously**:
  - Your Collection (items you own)
  - Your Wishlist (items you want)
  - All of Bandcamp (global search)
- **Smart prioritization**: Results grouped by source (Owned → Wishlist → Bandcamp)
- **Real-time search**: Debounced search as you type
- **Auto-deduplication**: No duplicate results across sources

### 🎨 Bandcamp Theme Toggle
- Switch between clean default styling and authentic Bandcamp themes
- Each album's theme extracted from the artist's custom page styling
- Preserves unique colors, backgrounds, and aesthetics
- Theme preference saved across sessions

### 📀 Album & Artist Pages
- **Detailed album pages** with artwork, tracklist, and metadata
- **Compilation support**: Shows multiple artists on compilations
- **Clickable navigation**: Jump to artist pages from albums
- **Complete discography** for each artist/label
- **Rich metadata**: Tags, credits, release dates, descriptions

## Installation

### Option 1: Download Pre-Built Release (Easiest)

**Recommended for most users** - No build tools required!

1. Go to the [Releases page](https://github.com/FletcherD/BandcampInterface/releases)
2. Download the latest release:
   - **Chrome**: Download `bandcamp-interface-chrome.zip`
   - **Firefox**: Download `bandcamp-interface-firefox.zip`
3. Unzip the downloaded file

**Chrome:**
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the unzipped folder
5. The Bandcamp Interface icon will appear in your extensions toolbar

**Firefox:**
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the unzipped folder and select `manifest.json`
4. The extension will be loaded temporarily (until you restart Firefox)

**Note**: For permanent installation in Firefox, the extension would need to be signed by Mozilla.

### Option 2: Build from Source

**For developers** who want to modify the code or build the latest version:

**Chrome & Firefox:**

1. Clone this repository:
   ```bash
   git clone https://github.com/FletcherD/BandcampInterface.git
   cd BandcampInterface
   ```

2. Build the extension:
   ```bash
   npm install
   npm run build
   ```

3. Follow the same loading instructions as Option 1, but select the `dist/` folder instead of the unzipped folder

## Usage

### First Time Setup

1. **Log into Bandcamp** in your browser before using the extension
2. Click the Bandcamp Interface extension icon in your toolbar
3. The app will open in a new tab and automatically detect your account
4. Start browsing your collection!

### Navigation

- **Collection**: View all albums and tracks you own
- **Wishlist**: Browse items you've wishlisted
- **Search**: Search across your collection, wishlist, and all of Bandcamp
- Click any album to view details and play tracks
- Click artist names to view their full discography
- Use the theme toggle (top-right) to switch between default and Bandcamp styling

### Playback

- Click the play button (▶️) next to any track to start playback
- **Green buttons** = High quality available
- **Blue buttons** = Standard quality
- **Red buttons** = Currently playing (click to pause)
- Use the playback controls at the bottom to control playback
- Music continues playing as you navigate between pages

### View Options

- Switch between **Grid View** (visual cards) and **Table View** (sortable list)
- In Table View, click column headers to sort
- Sort by Title, Artist, Release Date, or Date Added
- View preference is saved automatically

## Privacy & Data

### What This Extension Accesses

- **Bandcamp Cookies**: Required to authenticate with Bandcamp's API and access your collection
- **Bandcamp API**: Fetches your collection, wishlist, and album data
- **Local Storage**: Caches album data in IndexedDB for faster browsing (stored locally only)

### What This Extension Does NOT Do

- ❌ Does not send your data to any third-party servers
- ❌ Does not track your listening habits
- ❌ Does not modify or write any data to Bandcamp
- ❌ Does not access data from other websites
- ✅ All data stays on your device

This is a **read-only** extension that simply provides an alternative interface to view your Bandcamp data.

## Technology

Built with modern web technologies:
- **React 18** with TypeScript
- **Vite 6** for fast builds
- **Tailwind CSS v4** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **IndexedDB** for persistent caching
- **Manifest V3** for future-proof compatibility

## Important Disclaimer

⚠️ **This extension uses unofficial Bandcamp API endpoints**. While these are the same endpoints used by Bandcamp's mobile apps, they are not officially documented or supported for third-party use.

- This extension is **not affiliated with or endorsed by Bandcamp**
- API endpoints may change without notice
- Use respectfully and be aware of rate limits
- For official Bandcamp experience, visit [bandcamp.com](https://bandcamp.com)

This is a fan project built to enhance the Bandcamp browsing experience. Please support artists by purchasing music on Bandcamp!

## Development

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
# Install dependencies
npm install

# Development mode (UI testing only, API calls will fail due to CORS)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Project Structure
See [CLAUDE.md](CLAUDE.md) for comprehensive developer documentation including:
- Architecture details
- API endpoints
- Component structure
- React Query setup
- Caching strategy
- And more...

## Troubleshooting

### "Not logged in" error
- Make sure you're logged into Bandcamp in the same browser
- Try logging out and back into Bandcamp, then restart the extension

### Streaming not working
- Ensure you own the album (HQ streaming only works for purchased items)
- Check that you're logged into Bandcamp
- Streaming URLs expire after several hours - reload the album page

### Collection not loading
- Check browser console for errors
- Try clearing the extension cache: DevTools → Application → IndexedDB → Delete `keyval-store`
- Reload the extension

### Extension not appearing
- Make sure you selected the `dist/` folder (not the project root)
- Check that "Developer mode" is enabled in Chrome
- Try rebuilding: `npm run build`

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Before Contributing
1. Read [CLAUDE.md](CLAUDE.md) for development documentation
2. Follow the existing code style
3. Test your changes in both Chrome and Firefox
4. Update documentation if adding new features

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Bandcamp community
- Thanks to Bandcamp for creating an amazing platform for independent music
- Uses Bandcamp's internal mobile API endpoints

---

**Enjoy your music!** 🎵

If you encounter issues or have suggestions, please [open an issue](https://github.com/FletcherD/BandcampInterface/issues).
