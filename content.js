// Goodreads Series Manager - Content Script
class GoodreadsSeriesManager {
  constructor() {
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.addSeriesButtons());
    } else {
      this.addSeriesButtons();
    }
  }

  addSeriesButtons() {
    // Check if we're on a series page
    if (this.isSeriesPage()) {
      this.addSeriesShelfButton();
    }
    
    // Check if we're on a book page that's part of a series
    if (this.isBookPage() && this.hasSeriesInfo()) {
      this.addBookSeriesButton();
    }
  }

  isSeriesPage() {
    return window.location.pathname.includes('/series/') || 
           document.querySelector('.seriesHeader') !== null;
  }

  isBookPage() {
    return window.location.pathname.includes('/book/show/') ||
           document.querySelector('#bookTitle') !== null;
  }

  hasSeriesInfo() {
    return document.querySelector('a[href*="/series/"]') !== null;
  }

  addSeriesShelfButton() {
    const seriesHeader = document.querySelector('.seriesHeader') || 
                        document.querySelector('h1');
    
    if (!seriesHeader || document.querySelector('.series-manager-btn')) return;

    // Add the main button below the header
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'series-manager-container';
    buttonContainer.innerHTML = `
      <button class="series-manager-btn" id="addSeriesToShelf">
        📚 Add Series to Shelf
      </button>
    `;

    seriesHeader.parentNode.insertBefore(buttonContainer, seriesHeader.nextSibling);
    
    document.getElementById('addSeriesToShelf').addEventListener('click', () => {
      this.handleAddSeriesToShelf();
    });

    // Add "Create Series Shelf" link next to the title
    this.addCreateSeriesShelfLink();
  }

  addCreateSeriesShelfLink() {
    // Look for the series title - it could be in different locations
    const titleSelectors = [
      'h1[data-testid="seriesTitle"]',  // New React component
      '.seriesHeader h1',               // Classic layout
      'h1',                            // Fallback
      '.series-title'                  // Alternative
    ];

    let titleElement = null;
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement) break;
    }

    if (!titleElement || document.querySelector('.create-series-shelf-link')) return;

    // Create the link element
    const createShelfLink = document.createElement('a');
    createShelfLink.href = '#';
    createShelfLink.className = 'create-series-shelf-link';
    createShelfLink.innerHTML = '📚 Create Series Shelf';
    createShelfLink.title = 'Create a new shelf for this series with proper ordering';
    
    // Style the link to look integrated
    createShelfLink.style.cssText = `
      margin-left: 15px;
      font-size: 0.7em;
      color: #00635D;
      text-decoration: none;
      font-weight: normal;
      vertical-align: middle;
      padding: 4px 8px;
      border: 1px solid #00635D;
      border-radius: 3px;
      background: rgba(0, 99, 93, 0.1);
      transition: all 0.2s ease;
    `;

    // Add hover effect
    createShelfLink.addEventListener('mouseenter', () => {
      createShelfLink.style.background = '#00635D';
      createShelfLink.style.color = 'white';
    });

    createShelfLink.addEventListener('mouseleave', () => {
      createShelfLink.style.background = 'rgba(0, 99, 93, 0.1)';
      createShelfLink.style.color = '#00635D';
    });

    // Add click handler
    createShelfLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleCreateSeriesShelf();
    });

    // Insert the link after the title text
    titleElement.appendChild(createShelfLink);
  }

  async handleCreateSeriesShelf() {
    try {
      // Check if user is logged in
      if (!this.isUserLoggedIn()) {
        this.showMessage('Please log in to Goodreads to create shelves', 'error');
        return;
      }

      const seriesData = await this.extractSeriesData();
      if (!seriesData.books.length) {
        this.showMessage('No books found in this series. Try refreshing the page.', 'error');
        return;
      }

      // Show a simplified modal focused on creating a series shelf
      this.showCreateSeriesShelfModal(seriesData);
    } catch (error) {
      console.error('Error handling create series shelf:', error);
      this.showMessage('Error processing series. Please try again.', 'error');
    }
  }

  showCreateSeriesShelfModal(seriesData) {
    const modal = this.createCreateSeriesShelfModal(seriesData);
    document.body.appendChild(modal);
  }

  createCreateSeriesShelfModal(seriesData) {
    // Generate a suggested shelf name based on the series title
    const suggestedName = this.generateShelfName(seriesData.title);

    const modal = document.createElement('div');
    modal.className = 'series-modal-overlay';
    modal.innerHTML = `
      <div class="series-modal">
        <div class="series-modal-header">
          <h3>Create Shelf for "${seriesData.title}"</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="series-modal-content">
          <p>Create a dedicated shelf for this ${seriesData.books.length}-book series with proper ordering and settings.</p>
          
          <div class="shelf-creation-form">
            <label for="newSeriesShelfName">Shelf Name:</label>
            <input type="text" id="newSeriesShelfName" value="${suggestedName}" maxlength="35" placeholder="Enter shelf name">
            <div class="shelf-name-preview">
              <small>Shelf URL will be: <span id="shelfNamePreview">${this.normalizeShelfName(suggestedName)}</span></small>
            </div>
            
            <div class="shelf-settings">
              <label>
                <input type="checkbox" id="enableSeriesSort" checked> Enable manual sorting (recommended for series)
              </label>
              <label>
                <input type="checkbox" id="disableSeriesRecommendations" checked> Disable recommendations for this shelf
              </label>
              <label>
                <input type="checkbox" id="addBooksToShelf" checked> Add all ${seriesData.books.length} books to this shelf
              </label>
            </div>
          </div>

          <div class="book-preview">
            <h4>Books in this series:</h4>
            <div class="book-list-compact">
              ${seriesData.books.slice(0, 5).map((book, index) => `
                <div class="book-item-compact">
                  <span class="book-order">${book.seriesOrder}</span>
                  <span class="book-title-compact">${book.title}</span>
                </div>
              `).join('')}
              ${seriesData.books.length > 5 ? `<div class="book-item-compact">... and ${seriesData.books.length - 5} more books</div>` : ''}
            </div>
          </div>

          <div class="modal-actions">
            <button id="createSeriesShelf" class="primary-btn">Create Shelf</button>
            <button id="cancelCreateShelf" class="secondary-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#cancelCreateShelf').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Update shelf name preview as user types
    modal.querySelector('#newSeriesShelfName').addEventListener('input', (e) => {
      const previewElement = modal.querySelector('#shelfNamePreview');
      const normalizedName = this.normalizeShelfName(e.target.value) || 'my-series';
      previewElement.textContent = normalizedName;
    });

    modal.querySelector('#createSeriesShelf').addEventListener('click', async () => {
      const shelfName = modal.querySelector('#newSeriesShelfName').value.trim();
      if (!shelfName) {
        this.showMessage('Please enter a shelf name', 'error');
        return;
      }

      const enableSort = modal.querySelector('#enableSeriesSort').checked;
      const disableRecs = modal.querySelector('#disableSeriesRecommendations').checked;
      const addBooks = modal.querySelector('#addBooksToShelf').checked;

      try {
        this.showMessage('Creating shelf...', 'info');
        
        // Create the shelf
        const createdShelf = await this.createNewShelf(shelfName);
        
        // Configure shelf settings
        if (createdShelf.id && (enableSort || disableRecs)) {
          await this.configureShelf(createdShelf.id, enableSort, disableRecs);
        }

        document.body.removeChild(modal);
        
        if (addBooks) {
          // Add all books to the new shelf
          this.addBooksToShelf(seriesData.books, createdShelf.name);
        } else {
          this.showMessage(`Shelf "${createdShelf.name}" created successfully!`, 'success');
        }
        
      } catch (error) {
        console.error('Error creating series shelf:', error);
        this.showMessage('Error creating shelf. Please try again.', 'error');
      }
    });

    return modal;
  }

  generateShelfName(seriesTitle) {
    // Clean up the series title to create a good shelf name
    let shelfName = seriesTitle
      .replace(/\s+by\s+.*$/i, '')  // Remove "by Author Name"
      .replace(/\s+series$/i, '')   // Remove "Series" suffix
      .trim();

    // Apply Goodreads' normalization rules:
    // 1. Convert to lowercase
    // 2. Replace all spaces and special characters with hyphens
    // 3. Remove consecutive hyphens
    // 4. Remove leading/trailing hyphens
    shelfName = shelfName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens

    // Limit length and ensure it's not empty
    if (shelfName.length > 30) {
      shelfName = shelfName.substring(0, 30).replace(/-$/, ''); // Remove trailing hyphen if cut off
    }
    
    return shelfName || 'my-series';
  }

  normalizeShelfName(name) {
    // Apply the same normalization that Goodreads uses
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  }

  addBookSeriesButton() {
    const bookActions = document.querySelector('.bookActions') || 
                       document.querySelector('.wtrButtonContainer');
    
    if (!bookActions || document.querySelector('.book-series-btn')) return;

    const seriesLink = document.querySelector('a[href*="/series/"]');
    if (!seriesLink) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'book-series-container';
    buttonContainer.innerHTML = `
      <button class="book-series-btn" id="addBookSeries">
        📖 Add Full Series
      </button>
    `;

    bookActions.appendChild(buttonContainer);
    
    document.getElementById('addBookSeries').addEventListener('click', () => {
      const seriesUrl = seriesLink.href;
      this.handleAddSeriesFromBook(seriesUrl);
    });
  }

  async handleAddSeriesToShelf() {
    try {
      // Check if user is logged in
      if (!this.isUserLoggedIn()) {
        this.showMessage('Please log in to Goodreads to add books to shelves', 'error');
        return;
      }

      const seriesData = await this.extractSeriesData();
      if (!seriesData.books.length) {
        this.showMessage('No books found in this series. Try refreshing the page.', 'error');
        return;
      }

      this.showShelfSelector(seriesData);
    } catch (error) {
      console.error('Error handling series:', error);
      this.showMessage('Error processing series. Please try again.', 'error');
    }
  }

  isUserLoggedIn() {
    // Check for signs that user is logged in
    return document.querySelector('.siteHeader__personal') !== null ||
           document.querySelector('.headerPersonalNav') !== null ||
           document.querySelector('a[href*="/user/sign_out"]') !== null ||
           document.querySelector('.dropdown__menu--profileMenu') !== null;
  }

  async handleAddSeriesFromBook(seriesUrl) {
    try {
      const seriesData = await this.fetchSeriesData(seriesUrl);
      this.showShelfSelector(seriesData);
    } catch (error) {
      console.error('Error fetching series:', error);
      this.showMessage('Error fetching series data', 'error');
    }
  }

  async extractSeriesData() {
    const seriesTitle = this.getSeriesTitle();
    const books = this.extractBooksFromPage();
    
    return {
      title: seriesTitle,
      books: books
    };
  }

  getSeriesTitle() {
    const titleElement = document.querySelector('.seriesHeader h1') ||
                        document.querySelector('h1') ||
                        document.querySelector('.series-title');
    return titleElement ? titleElement.textContent.trim() : 'Unknown Series';
  }

  extractBooksFromPage() {
    const books = [];
    
    // Try different selectors for different page layouts
    const bookSelectors = [
      '.bookBox',           // Series page layout
      '.elementList',       // Alternative series layout
      '.bookTitle',         // Individual book entries
      '.gr-book',          // General book containers
      'tr[itemtype*="Book"]' // Table row format
    ];

    let bookElements = [];
    for (const selector of bookSelectors) {
      bookElements = document.querySelectorAll(selector);
      if (bookElements.length > 0) break;
    }

    bookElements.forEach((element, index) => {
      // Look for book links with various patterns
      const titleElement = element.querySelector('a[href*="/book/show/"]') ||
                          element.querySelector('a[href*="/book/"]') ||
                          element.querySelector('.bookTitle a');
      
      if (titleElement) {
        const bookUrl = titleElement.href;
        const bookId = this.extractBookId(bookUrl);
        const title = this.cleanTitle(titleElement.textContent || titleElement.title);
        
        // Try to find series order number
        let bookNumber = index + 1; // Default fallback
        
        // Look for series number in various formats
        const numberSelectors = [
          '.bookNumber',
          '.seriesBookNumber', 
          '.listWithDividers__item:first-child',
          '.greyText'
        ];
        
        for (const selector of numberSelectors) {
          const numberElement = element.querySelector(selector);
          if (numberElement) {
            const numberText = numberElement.textContent;
            const match = numberText.match(/(?:book\s*)?(\d+(?:\.\d+)?)/i);
            if (match) {
              bookNumber = parseFloat(match[1]);
              break;
            }
          }
        }

        // Also check if the number is in the title or nearby text
        if (bookNumber === index + 1) {
          const parentText = element.textContent;
          const titleMatch = parentText.match(/(?:book\s*|#\s*)?(\d+(?:\.\d+)?)/i);
          if (titleMatch) {
            bookNumber = parseFloat(titleMatch[1]);
          }
        }

        if (bookId && title) {
          books.push({
            id: bookId,
            title: title,
            url: bookUrl,
            seriesOrder: bookNumber
          });
        }
      }
    });

    // Sort by series order
    return books.sort((a, b) => a.seriesOrder - b.seriesOrder);
  }

  cleanTitle(title) {
    return title.replace(/^\s*\d+\.\s*/, '') // Remove leading numbers
                .replace(/\s*\(.*?\)\s*$/, '') // Remove parenthetical info at end
                .trim();
  }

  extractBookId(url) {
    const match = url.match(/\/book\/show\/(\d+)/);
    return match ? match[1] : null;
  }

  async fetchSeriesData(seriesUrl) {
    // This would need to fetch the series page and extract data
    // For now, redirect to series page
    window.location.href = seriesUrl;
    return null;
  }

  showShelfSelector(seriesData) {
    const modal = this.createShelfModal(seriesData);
    document.body.appendChild(modal);
  }

  createShelfModal(seriesData) {
    const modal = document.createElement('div');
    modal.className = 'series-modal-overlay';
    modal.innerHTML = `
      <div class="series-modal">
        <div class="series-modal-header">
          <h3>Add "${seriesData.title}" to Shelf</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="series-modal-content">
          <p>Found ${seriesData.books.length} books in this series</p>
          <div class="shelf-selection">
            <label for="shelfSelect">Select shelf:</label>
            <select id="shelfSelect">
              <option value="to-read">Want to Read</option>
              <option value="currently-reading">Currently Reading</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div class="shelf-options">
            <label>
              <input type="checkbox" id="createNewShelf"> Create new shelf for this series
            </label>
            <div id="newShelfOptions" style="display: none; margin-top: 10px;">
              <input type="text" id="newShelfName" placeholder="Enter shelf name" maxlength="35">
              <label style="display: block; margin-top: 5px;">
                <input type="checkbox" id="enableSort" checked> Enable manual sorting
              </label>
              <label style="display: block;">
                <input type="checkbox" id="disableRecommendations"> Disable recommendations for this shelf
              </label>
            </div>
          </div>
          <div class="book-list">
            ${seriesData.books.map((book, index) => `
              <div class="book-item">
                <span class="book-order">${book.seriesOrder}</span>
                <span class="book-title">${book.title}</span>
              </div>
            `).join('')}
          </div>
          <div class="modal-actions">
            <button id="addToShelf" class="primary-btn">Add to Shelf</button>
            <button id="cancelAdd" class="secondary-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#cancelAdd').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#createNewShelf').addEventListener('change', (e) => {
      const newShelfOptions = modal.querySelector('#newShelfOptions');
      const shelfSelect = modal.querySelector('#shelfSelect');
      if (e.target.checked) {
        newShelfOptions.style.display = 'block';
        shelfSelect.disabled = true;
      } else {
        newShelfOptions.style.display = 'none';
        shelfSelect.disabled = false;
      }
    });

    modal.querySelector('#addToShelf').addEventListener('click', async () => {
      const createNew = modal.querySelector('#createNewShelf').checked;
      let shelfName;
      
      if (createNew) {
        const newShelfName = modal.querySelector('#newShelfName').value.trim();
        if (!newShelfName) {
          this.showMessage('Please enter a shelf name', 'error');
          return;
        }
        
        try {
          // Create the new shelf first
          const createdShelf = await this.createNewShelf(newShelfName);
          shelfName = createdShelf.name;
          
          // Configure shelf settings if needed
          const enableSort = modal.querySelector('#enableSort').checked;
          const disableRecs = modal.querySelector('#disableRecommendations').checked;
          
          if (enableSort || disableRecs) {
            await this.configureShelf(createdShelf.id, enableSort, disableRecs);
          }
          
        } catch (error) {
          console.error('Error creating shelf:', error);
          this.showMessage('Error creating shelf. Please try again.', 'error');
          return;
        }
      } else {
        shelfName = modal.querySelector('#shelfSelect').value;
      }
      
      document.body.removeChild(modal);
      this.addBooksToShelf(seriesData.books, shelfName);
    });

    return modal;
  }

  async createNewShelf(shelfName) {
    try {
      const token = this.getAuthenticityToken();
      if (!token) {
        throw new Error('Could not find authenticity token');
      }

      // Use URL-encoded form data like in the HAR file
      const formData = new URLSearchParams();
      formData.append('utf8', '✓');
      formData.append('user_shelf[name]', shelfName);
      formData.append('commit', 'Add');

      const response = await fetch('/user_shelves', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': token,
          'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Check if the response indicates an error
      if (responseText.includes('error') || responseText.includes('Error')) {
        throw new Error('Shelf creation failed - name may be invalid or duplicate');
      }

      // Parse the shelf ID from the response if possible
      // The response typically contains JavaScript that updates the page
      const shelfIdMatch = responseText.match(/shelf_(\d+)/);
      const shelfId = shelfIdMatch ? shelfIdMatch[1] : null;
      
      // Apply Goodreads' exact normalization rules
      const normalizedName = this.normalizeShelfName(shelfName);
      
      return {
        name: normalizedName,
        id: shelfId,
        originalName: shelfName
      };
    } catch (error) {
      console.error('Error creating shelf:', error);
      throw error;
    }
  }

  async configureShelf(shelfId, enableSort, disableRecommendations) {
    try {
      const token = this.getAuthenticityToken();
      if (!token) {
        throw new Error('Could not find authenticity token');
      }

      // Configure sortable flag if needed
      if (enableSort) {
        await this.updateShelfSetting(shelfId, 'sortable_flag', 'true', token);
      }

      // Configure recommendation flag if needed  
      if (disableRecommendations) {
        await this.updateShelfSetting(shelfId, 'recommend_for', 'false', token);
      }

    } catch (error) {
      console.error('Error configuring shelf:', error);
      throw error;
    }
  }

  async updateShelfSetting(shelfId, setting, value, token) {
    const formData = new FormData();
    formData.append('authenticity_token', token);
    formData.append('_method', 'put');

    const url = `/user_shelves/${shelfId}?user_shelf%5B${setting}%5D=${value}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': token,
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async addBooksToShelf(books, shelfName) {
    this.showMessage(`Adding ${books.length} books to ${shelfName}...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      try {
        // Show progress
        this.showMessage(`Adding book ${i + 1}/${books.length}: ${book.title}`, 'info');
        
        await this.addSingleBookToShelf(book.id, shelfName);
        successCount++;
        
        // Rate limiting - be respectful to Goodreads servers
        if (i < books.length - 1) {
          await this.delay(2000); // 2 second delay between requests
        }
      } catch (error) {
        console.error(`Error adding book ${book.title}:`, error);
        errorCount++;
        errors.push({ book: book.title, error: error.message });
        
        // Continue with other books even if one fails
        await this.delay(1000);
      }
    }

    // Show final result
    let message = `Added ${successCount} books successfully`;
    if (errorCount > 0) {
      message += `, ${errorCount} failed`;
      console.log('Failed books:', errors);
    }
    
    this.showMessage(message, errorCount > 0 ? 'warning' : 'success');
    
    // Show detailed errors if any
    if (errors.length > 0 && errors.length <= 3) {
      setTimeout(() => {
        const errorMsg = `Failed: ${errors.map(e => e.book).join(', ')}`;
        this.showMessage(errorMsg, 'error');
      }, 3000);
    }
  }

  async addSingleBookToShelf(bookId, shelfName) {
    try {
      // Get the authenticity token from the page (required for Rails CSRF protection)
      const token = this.getAuthenticityToken();
      if (!token) {
        throw new Error('Could not find authenticity token');
      }

      // Goodreads uses different shelf names internally
      const shelfMapping = {
        'to-read': 'to-read',
        'currently-reading': 'currently-reading', 
        'read': 'read'
      };

      const mappedShelf = shelfMapping[shelfName] || shelfName;

      // Use the exact format from the HAR file
      const formData = new FormData();
      formData.append('book_id', bookId);
      formData.append('name', mappedShelf);
      formData.append('a', ''); // Empty 'a' parameter as seen in HAR
      formData.append('v', '2'); // Version parameter

      const response = await fetch('/shelf/add_to_shelf.json', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': token,
          'Accept': '*/*'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // The response is JSON, not JavaScript
      const responseData = await response.json();
      
      // Check if the response indicates success
      if (responseData.error || responseData.errors) {
        throw new Error(responseData.error || 'Goodreads returned an error');
      }

      return { success: true, bookId, shelfName: mappedShelf, response: responseData };
    } catch (error) {
      console.error(`Error adding book ${bookId} to ${shelfName}:`, error);
      throw error;
    }
  }

  getAuthenticityToken() {
    // Look for the CSRF token in various places Goodreads might store it
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (tokenMeta) {
      return tokenMeta.getAttribute('content');
    }

    const tokenInput = document.querySelector('input[name="authenticity_token"]');
    if (tokenInput) {
      return tokenInput.value;
    }

    // Sometimes it's in a script tag or data attribute
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const match = script.textContent.match(/authenticity_token["']?\s*:\s*["']([^"']+)["']/);
      if (match) {
        return match[1];
      }
    }

    // Check for React props that might contain the token
    const reactElements = document.querySelectorAll('[data-react-props]');
    for (const element of reactElements) {
      try {
        const props = JSON.parse(element.getAttribute('data-react-props'));
        if (props.authenticityToken) {
          return props.authenticityToken;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `series-message series-message-${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 5000);
  }
}

// Initialize the extension
new GoodreadsSeriesManager();