// script.js

/* ---------------------------
   Utility & UI helpers
   --------------------------- */

const booksGrid = document.getElementById('booksGrid');
const totalBooksEl = document.getElementById('totalBooks');
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmBtn = document.getElementById('confirmBtn');

let bookIdToDelete = null;

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.className = 'toast', 3000);
}

function openModal(message, onConfirm) {
  confirmMessage.textContent = message;
  confirmModal.style.display = 'flex';
  confirmBtn.onclick = () => {
    onConfirm();
    closeModal();
  };
}

function closeModal() {
  confirmModal.style.display = 'none';
}

/* Tab switching */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
  });
});

/* ---------------------------
   Render & load functions
   --------------------------- */

function renderBooks(books) {
  booksGrid.innerHTML = '';
  if (!books || books.length === 0) {
    booksGrid.innerHTML = '<div class="no-results"><i class="fas fa-book-dead"></i><p>No books yet. Add one!</p></div>';
    totalBooksEl.innerText = 0;
    return;
  }
  totalBooksEl.innerText = books.length;
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="book-header">
        <div>
          <div class="book-title">${escapeHtml(book.title)}</div>
          <div class="book-author">By ${escapeHtml(book.author)}</div>
        </div>
        <div>
          <div class="copies-badge ${book.availableCopies === 0 ? 'out' : book.availableCopies <= 2 ? 'low' : ''}">${book.availableCopies} copies</div>
        </div>
      </div>
      <div class="book-info">
        <div class="info-item"><i class="fas fa-tags"></i> ${escapeHtml(book.genre || '—')}</div>
        <div class="info-item"><i class="fas fa-calendar"></i> ${book.publishedYear || '—'}</div>
      </div>
      <div class="book-actions">
        <button class="btn btn-small btn-secondary" onclick='editBook("${book._id}")'><i class="fas fa-edit"></i> Edit</button>
        <button class="btn btn-small btn-danger" onclick='confirmDelete("${book._id}", "${escapeJs(book.title)}")'><i class="fas fa-trash"></i> Delete</button>
      </div>
    `;
    booksGrid.appendChild(card);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;'})[s]);
}
function escapeJs(text) {
  if (!text) return '';
  return String(text).replace(/"/g, '\\"').replace(/'/g, "\\'");
}

async function loadBooks() {
  loadingEl.style.display = 'block';
  try {
    const res = await fetch('/api/books');
    const j = await res.json();
    if (j.success) renderBooks(j.data);
    else showToast('Could not load books', 'error');
  } catch (e) {
    console.error(e);
    showToast('Network error while loading books', 'error');
  } finally {
    loadingEl.style.display = 'none';
  }
}

/* ---------------------------
   Add Book form
   --------------------------- */

const addBookForm = document.getElementById('addBookForm');
addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    title: addBookForm.title.value.trim(),
    author: addBookForm.author.value.trim(),
    genre: addBookForm.genre.value.trim(),
    availableCopies: Number(addBookForm.availableCopies.value || 1),
    isbn: addBookForm.isbn.value.trim(),
    publishedYear: addBookForm.publishedYear.value ? Number(addBookForm.publishedYear.value) : undefined
  };
  if (!data.title || !data.author) return showToast('Title and Author required', 'warning');

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const j = await res.json();
    if (j.success) {
      showToast('Book added ✅', 'success');
      addBookForm.reset();
      loadBooks();
      // switch to view tab
      document.querySelector('[data-tab="view"]').click();
    } else {
      showToast(j.message || 'Could not add book', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error while adding book', 'error');
  }
});

/* ---------------------------
   Edit book (simple inline flow)
   --------------------------- */

async function editBook(id) {
  try {
    const res = await fetch(`/api/books/${id}`);
    const j = await res.json();
    if (!j.success) return showToast('Book not found', 'error');
    const b = j.data;

    // populate form and switch to add tab (we'll change button to "Update")
    document.querySelector('[data-tab="add"]').click();
    addBookForm.title.value = b.title;
    addBookForm.author.value = b.author;
    addBookForm.genre.value = b.genre || '';
    addBookForm.availableCopies.value = b.availableCopies || 1;
    addBookForm.isbn.value = b.isbn || '';
    addBookForm.publishedYear.value = b.publishedYear || '';

    const submitBtn = addBookForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Book';

    // set a one-time submit handler for update
    const onUpdate = async (ev) => {
      ev.preventDefault();
      const payload = {
        title: addBookForm.title.value.trim(),
        author: addBookForm.author.value.trim(),
        genre: addBookForm.genre.value.trim(),
        availableCopies: Number(addBookForm.availableCopies.value || 1),
        isbn: addBookForm.isbn.value.trim(),
        publishedYear: addBookForm.publishedYear.value ? Number(addBookForm.publishedYear.value) : undefined
      };
      try {
        const r = await fetch(`/api/books/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const jr = await r.json();
        if (jr.success) {
          showToast('Book updated', 'success');
          addBookForm.reset();
          submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Book';
          loadBooks();
          document.querySelector('[data-tab="view"]').click();
        } else {
          showToast(jr.message || 'Update failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error on update', 'error');
      } finally {
        // clean up handler
        addBookForm.removeEventListener('submit', onUpdate);
        // reattach default handler
        addBookForm.addEventListener('submit', defaultAddHandler);
      }
    };

    // replace handlers: remove default and attach update
    addBookForm.removeEventListener('submit', defaultAddHandler);
    addBookForm.addEventListener('submit', onUpdate);

  } catch (err) {
    console.error(err);
    showToast('Error fetching book', 'error');
  }
}

/* Keep a reference to default handler so we can remove/restore it when editing */
function defaultAddHandler(e) {
  // placeholder: actual handler added earlier via addEventListener; this is used for remove/restore only
}
 // ensure default handler pointer exists (we already attached one above)
 // no-op here

/* ---------------------------
   Delete flow
   --------------------------- */

function confirmDelete(id, title) {
  openModal(`Delete "${title}"? This cannot be undone.`, async () => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) {
        showToast('Book deleted', 'success');
        loadBooks();
      } else {
        showToast(j.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while deleting', 'error');
    }
  });
}

/* ---------------------------
   Searching (3 modes)
   - callback: XMLHttpRequest with callback
   - promise: fetch (promise)
   - mongodb: explicitly hit /api/books/search (same as promise but demonstrates server search)
   --------------------------- */

function getSelectedSearchType() {
  const v = document.querySelector('input[name="searchType"]:checked').value;
  return v;
}

function searchBooks() {
  const query = document.getElementById('searchInput').value.trim();
  const resultsEl = document.getElementById('searchResults');
  resultsEl.innerHTML = '';
  if (!query) {
    resultsEl.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Enter a search term.</p></div>';
    return;
  }

  const type = getSelectedSearchType();
  if (type === 'callback') {
    // XMLHttpRequest with callback
    resultsEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching (callback)...</div>';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/books/search?q=${encodeURIComponent(query)}`, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        const j = JSON.parse(xhr.responseText);
        renderSearchResults(j.data);
      } else {
        resultsEl.innerHTML = '<div class="no-results">Search error</div>';
      }
    };
    xhr.send();
  } else if (type === 'promise') {
    // fetch-based promise
    resultsEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching (promise)...</div>';
    fetch(`/api/books?q=${encodeURIComponent(query)}&searchHint=client`)
      .then(r => r.json())
      .then(j => {
        // For demonstration: client-side filter of all books using promise
        if (!j.success) { resultsEl.innerHTML = '<div class="no-results">Search error</div>'; return; }
        const matches = j.data.filter(b => {
          const s = `${b.title} ${b.author} ${b.genre}`.toLowerCase();
          return query.toLowerCase().split(/\s+/).every(t => s.includes(t));
        });
        renderSearchResults(matches);
      })
      .catch(err => {
        console.error(err);
        resultsEl.innerHTML = '<div class="no-results">Network error</div>';
      });
  } else {
    // mongodb: hit server-side search route (text/regex search)
    resultsEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching DB...</div>';
    fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) renderSearchResults(j.data);
        else resultsEl.innerHTML = '<div class="no-results">Search error</div>';
      })
      .catch(err => {
        console.error(err);
        resultsEl.innerHTML = '<div class="no-results">Network error</div>';
      });
  }

  function renderSearchResults(arr) {
    if (!arr || arr.length === 0) {
      resultsEl.innerHTML = '<div class="no-results"><i class="fas fa-book-dead"></i><p>No matches found</p></div>';
      return;
    }
    resultsEl.innerHTML = '';
    arr.forEach(b => {
      const card = document.createElement('div');
      card.className = 'search-result-card';
      card.style.marginBottom = '15px';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-size:1.05rem">${escapeHtml(b.title)}</div>
            <div style="opacity:0.9">By ${escapeHtml(b.author)} • ${b.genre || '—'}</div>
          </div>
          <div style="text-align:right">
            <div class="copies-badge ${b.availableCopies === 0 ? 'out' : b.availableCopies <= 2 ? 'low' : ''}">${b.availableCopies} copies</div>
            <div style="margin-top:8px"><button class="btn btn-small btn-primary" onclick='editBook("${b._id}")'>Edit</button></div>
          </div>
        </div>
      `;
      resultsEl.appendChild(card);
    });
  }
}

/* ---------------------------
   Init
   --------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  loadBooks();

  // close modal on background click
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeModal();
  });
});
