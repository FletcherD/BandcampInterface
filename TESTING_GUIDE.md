# Testing Streaming URLs - Quick Guide

## Step 1: Build the Extension

```bash
cd /home/fletcher/bandcamp_interface
npm run build
```

This creates the `dist/` folder with your extension.

## Step 2: Load the Extension

### Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Click the extension icon to open the app

### Firefox:
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `dist/` folder (e.g., `manifest.json`)
4. Click the extension icon to open the app

## Step 3: Navigate to the Test Page

Once the extension opens, modify the URL in the address bar to go to the test page:

```
chrome-extension://<your-extension-id>/index.html#/streaming-test
```

Or for Firefox:
```
moz-extension://<your-extension-id>/index.html#/streaming-test
```

**Easier way:** Just append `/streaming-test` to the URL after the extension opens.

## Step 4: Test with Your Own Album

### Find Band ID and Tralbum ID:

1. **Go to Bandcamp** and find an album **you own**
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Go to Network tab**
4. **Play a track** on the album page
5. **Look for a request** to `/api/mobile/24/tralbum_details`
6. **Click on the request** and view the "Payload" tab
7. **Copy the values:**
   - `band_id`: (e.g., 2197988008)
   - `tralbum_id`: (e.g., 3616265308)
   - `tralbum_type`: "a" for album, "t" for track

### Alternative Method (from URL):

If you're on an album page like `https://artist.bandcamp.com/album/album-name`:

1. Open browser console (F12)
2. Type: `JSON.parse($('script[data-tralbum]').attr('data-tralbum'))`
3. Look at the output for `id` (tralbum_id) and `band_id`

## Step 5: Run Tests

On the test page:

1. **Enter the IDs** you found
2. **Click "Test Mobile API"**
   - This shows what the mobile API returns
   - Check if `mp3-v0` (HQ) URLs are included
   - Look for the green "✓ YES" next to "Has HQ"

3. **Click "Test Page Scraping"**
   - This scrapes the album page HTML as a fallback
   - Should find both standard and HQ URLs if you own the album

4. **Click "Play" buttons** to actually test the streaming URLs
   - Blue "Play" = standard quality (128kbps)
   - Green "Play HQ" = high quality (mp3-v0)

## What to Look For

### ✅ Success Indicators:

- **Mobile API returns mp3-v0**: Best case! The API already includes HQ URLs
- **Page scraping finds mp3-v0**: Fallback method works
- **Play buttons work**: URLs are valid and stream successfully
- **Console shows detailed logs**: Check for errors or issues

### ⚠️ Troubleshooting:

**No HQ URLs found:**
- Make sure you're logged into Bandcamp in your browser
- Make sure you actually OWN the album (purchased or added to collection)
- Try a different album you definitely own

**"Failed to fetch album page":**
- Check that you're logged in
- Check browser console for CORS errors
- Verify the album URL is correct

**URLs don't play:**
- URLs may have expired - click "Test" button to check validity
- Try refreshing the extension/page
- Check console for detailed error messages

## Example Test Data

Here's the example from your API_ENDPOINTS.md you can use:

```
Band ID: 2197988008
Tralbum ID: 3616265308
Type: Album
```

But note: This will only show HQ URLs if **YOU** own this specific album!

## What You're Testing

1. **Does the mobile API return mp3-v0?**
   - If YES: You can use URLs directly from the API ✅
   - If NO: You need to use the page scraping fallback

2. **Does page scraping work?**
   - Verifies the fallback method can extract HQ URLs from HTML

3. **Are the URLs valid?**
   - Tests if URLs actually work for streaming
   - Checks URL expiration handling

4. **Can you play the audio?**
   - Final verification that everything works end-to-end

## Browser Console

Always keep the browser console open (F12) while testing. It will show:
- Detailed API responses
- Streaming URL values
- Errors if something goes wrong
- Success messages when URLs are found

Look for log messages like:
```
Testing mobile API...
Mobile API Result: { ... }
Using HQ URL from mobile API
Found HQ URL from page scraping
```

## Next Steps After Testing

Once you verify everything works:
1. Check if mobile API includes mp3-v0 for YOUR owned albums
2. Decide if you need the page scraping fallback or if API is sufficient
3. Implement audio player in your actual UI (use the example in STREAMING_EXAMPLE.md)
4. Consider caching streaming URLs (they're valid for several hours)

## Quick Reference: Streaming Quality

- **mp3-128**: 128kbps constant bitrate MP3 (~4MB per 5-minute song)
- **mp3-v0**: VBR MP3, 220-260kbps average (~8MB per 5-minute song)

The mp3-v0 quality is what Bandcamp uses for streaming owned tracks - it's significantly better quality while still being streamable (not FLAC).
