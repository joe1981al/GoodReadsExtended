# Goodreads Series Manager

A Chrome extension that enhances Goodreads with series management features, allowing you to add entire book series to your shelves with proper ordering.

## Features

- **Add Entire Series**: Add all books in a series to your chosen shelf with one click
- **Automatic Ordering**: Books are automatically sorted by their series order
- **Multiple Shelf Support**: Add to Want to Read, Currently Reading, or Read shelves
- **Series Detection**: Works on both series pages and individual book pages
- **Rate Limiting**: Built-in delays to respect Goodreads servers

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

## Usage

### On Series Pages
1. Navigate to any Goodreads series page
2. Look for the "📚 Add Series to Shelf" button
3. Click it to see all books in the series
4. Select your desired shelf and click "Add to Shelf"

### On Book Pages
1. Navigate to any book page that's part of a series
2. Look for the "📖 Add Full Series" button
3. Click it to be taken to the series page with the add functionality

## How It Works

The extension:
1. Detects when you're on Goodreads series or book pages
2. Extracts series information and book ordering
3. Provides a clean interface to select your target shelf
4. Adds books one by one with proper rate limiting
5. Shows progress and completion status

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension format
- **Content Script**: Injects functionality into Goodreads pages
- **Background Script**: Handles API interactions and settings
- **Local Storage**: Saves user preferences and settings

## Files Structure

```
├── manifest.json          # Extension configuration
├── content.js             # Main functionality injected into pages
├── background.js          # Background service worker
├── popup.html            # Extension popup interface
├── styles.css            # Custom styling for injected elements
└── README.md            # This file
```

## Limitations

- Currently simulates API calls (would need actual Goodreads API integration)
- Rate limited to prevent overwhelming Goodreads servers
- Requires manual navigation to series pages for book-to-series detection

## Future Enhancements

- Direct API integration with Goodreads
- Custom shelf creation
- Series progress tracking
- Bulk operations for multiple series
- Reading list recommendations

## Development

To modify the extension:
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on Goodreads

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.