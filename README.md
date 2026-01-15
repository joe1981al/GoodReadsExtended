# Goodreads Series Manager

A Chrome extension that enhances Goodreads with series management features, allowing you to add entire book series to your shelves with proper ordering.

## Features

- **Create Series Shelves**: Create dedicated shelves for series with one click from the series title
- **Add Entire Series**: Add all books in a series to your chosen shelf with proper ordering
- **Smart Shelf Naming**: Auto-generates shelf names from series titles with Goodreads normalization
- **Automatic Configuration**: Sets up shelves with manual sorting and recommendation preferences
- **Real-Time Preview**: See exactly how shelf names will be formatted before creating
- **Multiple Shelf Support**: Add to existing shelves or create new ones on the fly
- **Series Detection**: Works on both series pages and individual book pages
- **Rate Limiting**: Built-in delays to respect Goodreads servers

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

## Usage

### Create Series Shelf (Recommended)
1. Navigate to any Goodreads series page
2. Look for the "📚 Create Series Shelf" link next to the series title
3. Enter a shelf name (or use the auto-generated suggestion)
4. Choose settings:
   - Enable manual sorting (recommended for proper book order)
   - Disable recommendations (for cleaner shelf experience)
   - Add all books to shelf immediately
5. Click "Create Shelf" to set up everything automatically

### Add to Existing Shelf
1. Navigate to any Goodreads series page
2. Look for the "📚 Add Series to Shelf" button
3. Select an existing shelf or create a new one
4. Configure shelf settings if creating new
5. Click "Add to Shelf" to add all books with proper ordering

### From Book Pages
1. Navigate to any book page that's part of a series
2. Look for the "📖 Add Full Series" button
3. Click it to be taken to the series page with full functionality

## How It Works

The extension works by:
1. **Detecting Series Pages**: Identifies when you're on Goodreads series or book pages
2. **Extracting Book Data**: Scrapes series information and book ordering from the page
3. **Simulating User Actions**: Uses the exact same endpoints that Goodreads uses when you manually add books
4. **CSRF Protection**: Extracts and uses authenticity tokens required by Goodreads
5. **Rate Limiting**: Adds delays between requests to be respectful to Goodreads servers
6. **Error Handling**: Provides feedback on successes and failures

## Technical Implementation

Based on reverse engineering Goodreads' actual web requests:
- **Exact API Endpoints**: Uses `/shelf/add_to_shelf.json` with the same parameters as the website
- **Proper Authentication**: Handles CSRF tokens via `X-CSRF-Token` header
- **Correct Data Format**: Sends `book_id`, `name`, `a`, and `v=2` parameters exactly as Goodreads does
- **JSON Responses**: Processes JSON responses instead of HTML/JavaScript
- **Shelf Creation**: Uses `/user_shelves` endpoint with proper form encoding
- **Shelf Configuration**: Supports sortable and recommendation flags via `/user_shelves/{id}` updates

## API Details Discovered

**Adding Books to Shelves:**
- Endpoint: `POST /shelf/add_to_shelf.json`
- Parameters: `book_id={id}&name={shelf}&a=&v=2`
- Headers: `X-CSRF-Token`, `X-Requested-With: XMLHttpRequest`
- Response: JSON with success/error status

**Creating New Shelves:**
- Endpoint: `POST /user_shelves`
- Parameters: `utf8=✓&user_shelf[name]={name}&commit=Add`
- Normalization: "My Cool Series!" → "my-cool-series"
- Rules: lowercase, spaces/special chars → hyphens, max 35 chars

**Configuring Shelves:**
- Sortable: `POST /user_shelves/{id}?user_shelf[sortable_flag]=true`
- Recommendations: `POST /user_shelves/{id}?user_shelf[recommend_for]=false`
- Method: Uses `_method=put` in POST body (Rails convention)

## Limitations

- **Login Required**: You must be logged into Goodreads for the extension to work
- **Rate Limited**: Takes time to add large series (2 seconds per book)
- **Page Dependent**: Relies on Goodreads' current page structure and may break with site updates
- **No Undo**: Once books are added, you'll need to remove them manually if needed

## Key Features Explained

### Smart Series Shelf Creation
- **One-Click Setup**: Creates shelf + configures settings + adds books in one action
- **Intelligent Naming**: Auto-generates clean shelf names from series titles
  - "Ender's Saga by Orson Scott Card" → "ender-s-saga"
  - "The Lord of the Rings" → "the-lord-of-the-rings"
- **Real-Time Preview**: Shows exactly how Goodreads will format the shelf name
- **Optimal Settings**: Pre-configures manual sorting and recommendation preferences

### Goodreads Integration
- **Exact API Matching**: Uses identical endpoints and parameters as Goodreads website
- **Proper Authentication**: Handles CSRF tokens and session management
- **Error Handling**: Graceful failure with detailed error messages
- **Rate Limiting**: Respectful 2-second delays between book additions

### User Experience
- **Multiple Entry Points**: Title link, series button, and book page integration
- **Progress Feedback**: Real-time status updates during operations
- **Flexible Options**: Works with existing shelves or creates new ones
- **Series Detection**: Automatically identifies series across different page layouts

## Future Enhancements

- Series progress tracking and reading statistics
- Bulk operations for multiple series at once
- Integration with reading challenges
- Custom sorting options beyond series order
- Export/import shelf configurations
- Series completion notifications

## Files Structure

```
├── manifest.json          # Extension configuration and permissions
├── content.js             # Main functionality injected into Goodreads pages
├── background.js          # Background service worker for settings
├── popup.html            # Extension popup interface
├── styles.css            # Custom styling for injected elements
├── .gitignore            # Git ignore patterns for all platforms
└── README.md            # This documentation
```

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