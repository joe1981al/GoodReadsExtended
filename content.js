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
      const seriesData = await this.extractSeriesData();
      if (!seriesData.books.length) {
        this.showMessage('No books found in this series', 'error');
        return;
      }

      this.showShelfSelector(seriesData);
    } catch (error) {
      console.error('Error handling series:', error);
      this.showMessage('Error processing series', 'error');
    }
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
    const bookElements = document.querySelectorAll('.bookBox, .elementList');
    
    bookElements.forEach((element, index) => {
      const titleElement = element.querySelector('a[href*="/book/show/"]');
      const bookNumberElement = element.querySelector('.bookNumber, .seriesBookNumber');
      
      if (titleElement) {
        const bookUrl = titleElement.href;
        const bookId = this.extractBookId(bookUrl);
        const title = titleElement.textContent.trim();
        const bookNumber = bookNumberElement ? 
          parseFloat(bookNumberElement.textContent.replace(/[^\d.]/g, '')) : 
          index + 1;

        books.push({
          id: bookId,
          title: title,
          url: bookUrl,
          seriesOrder: bookNumber
        });
      }
    });

    // Sort by series order
    return books.sort((a, b) => a.seriesOrder - b.seriesOrder);
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

    modal.querySelector('#addToShelf').addEventListener('click', () => {
      const selectedShelf = modal.querySelector('#shelfSelect').value;
      this.addBooksToShelf(seriesData.books, selectedShelf);
      document.body.removeChild(modal);
    });

    return modal;
  }

  async addBooksToShelf(books, shelfName) {
    this.showMessage(`Adding ${books.length} books to ${shelfName}...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;

    for (const book of books) {
      try {
        await this.addSingleBookToShelf(book.id, shelfName);
        successCount++;
        await this.delay(1000); // Rate limiting
      } catch (error) {
        console.error(`Error adding book ${book.title}:`, error);
        errorCount++;
      }
    }

    const message = `Added ${successCount} books successfully` + 
                   (errorCount > 0 ? `, ${errorCount} failed` : '');
    this.showMessage(message, errorCount > 0 ? 'warning' : 'success');
  }

  async addSingleBookToShelf(bookId, shelfName) {
    // This would need to interact with Goodreads API or simulate form submission
    // For now, we'll simulate the action
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Added book ${bookId} to ${shelfName}`);
        resolve();
      }, 500);
    });
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