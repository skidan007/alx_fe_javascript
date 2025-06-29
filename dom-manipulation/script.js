let quotes = [];
let selectedCategory = "all"; // <-- Used globally to track filter selection
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Using JSONPlaceholder for simulation
const SYNC_INTERVAL = 60000; // Sync every 60 seconds (for demonstration)

let localChanges = []; // Track changes made locally to be synced to the server
let conflictQueue = []; // Queue for conflicts to be resolved

// === Load from localStorage or use defaults ===
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { id: 'local-1', text: "The best way to predict the future is to create it.", category: "Motivation", lastModified: Date.now() },
    { id: 'local-2', text: "Life is what happens when you're busy making other plans.", category: "Life", lastModified: Date.now() },
    { id: 'local-3', text: "Do not be afraid to give up the good to go for the great.", category: "Success", lastModified: Date.now() }
  ];
  // Assign unique IDs if they don't exist (for initial default quotes)
  quotes.forEach(q => {
    if (!q.id) q.id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (!q.lastModified) q.lastModified = Date.now();
  });
}

// === Save quotes to localStorage ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Save local changes to localStorage ===
function saveLocalChanges() {
  localStorage.setItem("localChanges", JSON.stringify(localChanges));
}

// === Load local changes from localStorage ===
function loadLocalChanges() {
  const storedChanges = localStorage.getItem("localChanges");
  localChanges = storedChanges ? JSON.parse(storedChanges) : [];
}

// === Initialize everything on DOM load ===
function initQuoteApp() {
  loadQuotes();
  loadLocalChanges();
  createAddQuoteForm();
  populateCategories();
  restoreLastFilter();
  showRandomQuote();
  startSyncInterval();

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("syncButton").addEventListener("click", syncQuotes);
}

// === Create dropdown options for both selects ===
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  const categorySelect = document.getElementById("categorySelect");
  const categoryFilter = document.getElementById("categoryFilter");

  categorySelect.innerHTML = `<option value="all">All</option>`;
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  uniqueCategories.forEach(category => {
    const option1 = new Option(category, category);
    const option2 = new Option(category, category);
    categorySelect.appendChild(option1);
    categoryFilter.appendChild(option2);
  });

  // Reapply selected category after repopulation
  categoryFilter.value = selectedCategory;
}

// === Show random quote based on dropdown selection ===
function showRandomQuote() {
  const selected = document.getElementById("categorySelect").value;
  const list = selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);

  const display = document.getElementById("quoteDisplay");
  if (list.length === 0) return display.textContent = "No quotes available.";

  const randomQuote = list[Math.floor(Math.random() * list.length)].text;
  display.textContent = randomQuote;

  sessionStorage.setItem("lastQuote", randomQuote);
}

// === Filter quotes and display based on selectedCategory ===
function filterQuotes() {
  selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastFilter", selectedCategory);

  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  const listEl = document.getElementById("filteredQuotesList");
  listEl.innerHTML = "";

  filtered.forEach(q => {
    const li = document.createElement("li");
    li.textContent = `${q.text} (Category: ${q.category})`;
    listEl.appendChild(li);
  });
}

// === Restore last selected category from localStorage ===
function restoreLastFilter() {
  const saved = localStorage.getItem("lastFilter");
  if (saved) {
    selectedCategory = saved;
    document.getElementById("categoryFilter").value = selectedCategory;
    filterQuotes();
  }
}

// === Dynamically add quote to array and DOM ===
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for local quotes
    text,
    category,
    lastModified: Date.now()
  };

  quotes.push(newQuote);
  localChanges.push({ type: 'add', quote: newQuote }); // Track local addition
  saveQuotes();
  saveLocalChanges();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  showRandomQuote();
  filterQuotes();
  showNotification("New quote added locally. Sync with server to share!", "success");
}

// === Build add-quote form dynamically ===
function createAddQuoteForm() {
  const form = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);

  document.body.insertBefore(form, document.querySelector('h3:last-of-type')); // Insert before "Import/Export" heading
}

// === Export quotes as JSON file ===
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
  showNotification("Quotes exported successfully!", "success");
}

// === Import quotes from uploaded JSON file ===
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("File must contain an array of quotes");

      imported.forEach(q => {
        if (!q.id) q.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!q.lastModified) q.lastModified = Date.now();
      });

      // Simple merge: add new quotes, update existing ones if imported is newer
      imported.forEach(importedQuote => {
        const existingIndex = quotes.findIndex(q => q.id === importedQuote.id);
        if (existingIndex > -1) {
          // If imported quote is newer, update it
          if (importedQuote.lastModified > quotes[existingIndex].lastModified) {
            quotes[existingIndex] = importedQuote;
            localChanges.push({ type: 'update', quote: importedQuote }); // Track local update
          }
        } else {
          quotes.push(importedQuote);
          localChanges.push({ type: 'add', quote: importedQuote }); // Track local addition
        }
      });

      saveQuotes();
      saveLocalChanges();
      populateCategories();
      filterQuotes();
      showRandomQuote();
      showNotification("Quotes imported successfully! Sync with server to share.", "success");
    } catch (err) {
      showNotification("Failed to import quotes: " + err.message, "error");
    }
  };
  reader.readAsText(event.target.files[0]);
}

// --- Server Sync Logic ---

// === Simulate fetching data from server ===
async function fetchQuotesFromServer() {
  try {
    showNotification("Fetching quotes from server...", "info");
    // JSONPlaceholder doesn't support custom properties like 'category' or 'lastModified'
    // So, we'll simulate these by just fetching posts and mapping them to our quote structure.
    // In a real app, your server would return data in the correct format.
    const response = await fetch(`${SERVER_URL}?_limit=10`); // Fetch a limited number of posts
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const serverPosts = await response.json();

    // Simulate server quotes with categories and lastModified
    const serverQuotes = serverPosts.map((post, index) => ({
      id: `server-${post.id}`, // Use a distinct ID for server quotes
      text: post.title, // Map post title to quote text
      category: `ServerCategory-${(index % 3) + 1}`, // Assign a dummy category
      lastModified: Date.now() - (1000 * index) // Simulate different last modified times
    }));
    showNotification("Quotes fetched from server.", "success");
    return serverQuotes;
  } catch (error) {
    showNotification(`Error fetching quotes from server: ${error.message}`, "error");
    return [];
  }
}

// === Simulate pushing data to server ===
async function pushQuotesToServer(data) {
  try {
    showNotification("Pushing local changes to server...", "info");
    // JSONPlaceholder doesn't support PUT/PATCH for existing resources that well for complex objects,
    // and for new posts, it just returns the posted data.
    // For a real backend, you'd send specific ADD/UPDATE/DELETE requests.
    // Here, we'll simulate pushing all local changes.
    for (const change of data) {
      if (change.type === 'add') {
        // Simulate adding a new quote
        await fetch(SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: change.quote.text, body: change.quote.category, userId: 1 }),
        });
      }
      // For 'update' or 'delete' in a real scenario, you'd send PUT/DELETE to specific endpoints
      // For this simulation, we'll just acknowledge the attempt.
    }
    showNotification("Local changes pushed to server (simulated).", "success");
    return true;
  } catch (error) {
    showNotification(`Error pushing quotes to server: ${error.message}`, "error");
    return false;
  }
}

// === Data Syncing Logic ===
async function syncQuotes() {
  showNotification("Initiating sync...", "info");

  // Step 1: Push local changes to server
  const pushSuccess = await pushQuotesToServer(localChanges);
  if (pushSuccess) {
    localChanges = []; // Clear local changes after (simulated) successful push
    saveLocalChanges();
  }

  // Step 2: Fetch server data
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) {
    showNotification("No new quotes to sync from server.", "info");
    return;
  }

  const updatedQuotes = [...quotes]; // Create a mutable copy

  serverQuotes.forEach(serverQuote => {
    const localIndex = updatedQuotes.findIndex(q => q.id === serverQuote.id);

    if (localIndex === -1) {
      // Quote exists on server but not locally, add it
      updatedQuotes.push(serverQuote);
      showNotification(`Added new quote from server: "${serverQuote.text}"`, "info");
    } else {
      const localQuote = updatedQuotes[localIndex];
      // Conflict resolution: Server's data takes precedence if newer
      if (serverQuote.lastModified > localQuote.lastModified) {
        // If there are unpushed local changes for this specific quote, queue a conflict
        const hasUnpushedLocalChange = localChanges.some(change =>
          (change.type === 'add' || change.type === 'update') && change.quote.id === localQuote.id
        );

        if (hasUnpushedLocalChange) {
          // Add to conflict queue for manual resolution
          conflictQueue.push({ local: localQuote, server: serverQuote });
          showNotification(`Conflict detected for quote: "${localQuote.text}". Please resolve manually.`, "warning");
        } else {
          // No unpushed local changes, server version takes precedence
          updatedQuotes[localIndex] = serverQuote;
          showNotification(`Updated quote from server: "${serverQuote.text}"`, "info");
        }
      }
      // If serverQuote.lastModified <= localQuote.lastModified, local version is newer or same, do nothing (local takes precedence in this simple strategy)
    }
  });

  quotes = updatedQuotes;
  saveQuotes();
  populateCategories();
  filterQuotes(); // Re-filter to show updated list
  showRandomQuote();

  if (conflictQueue.length > 0) {
    displayConflicts();
  } else {
    // This is the new line you requested:
    showNotification("Quotes synced with server!", "success");
  }
}

// === Periodically sync with server ===
function startSyncInterval() {
  setInterval(syncQuotes, SYNC_INTERVAL);
  showNotification(`Automatic sync enabled every ${SYNC_INTERVAL / 1000} seconds.`, "info");
}

// --- Conflict Resolution UI ---
function displayConflicts() {
  const conflictArea = document.getElementById("conflictResolution");
  const conflictOptions = document.getElementById("conflictOptions");
  conflictOptions.innerHTML = "";

  if (conflictQueue.length > 0) {
    const currentConflict = conflictQueue[0]; // Process one conflict at a time

    const localDiv = document.createElement("div");
    localDiv.innerHTML = `<input type="radio" name="conflictChoice" value="local" id="localChoice"> <label for="localChoice"><strong>Local Version:</strong> "${currentConflict.local.text}" (Category: ${currentConflict.local.category}, Last Modified: ${new Date(currentConflict.local.lastModified).toLocaleString()})</label>`;
    conflictOptions.appendChild(localDiv);

    const serverDiv = document.createElement("div");
    serverDiv.innerHTML = `<input type="radio" name="conflictChoice" value="server" id="serverChoice"> <label for="serverChoice"><strong>Server Version:</strong> "${currentConflict.server.text}" (Category: ${currentConflict.server.category}, Last Modified: ${new Date(currentConflict.server.lastModified).toLocaleString()})</label>`;
    conflictOptions.appendChild(serverDiv);

    conflictArea.style.display = "block";
    showNotification("Manual conflict resolution required. Please choose a version.", "warning error"); // Add error class for visual emphasis
  } else {
    conflictArea.style.display = "none";
  }
}

function resolveConflict() {
  const selectedChoice = document.querySelector('input[name="conflictChoice"]:checked');
  if (!selectedChoice) {
    alert("Please select a version to keep.");
    return;
  }

  const currentConflict = conflictQueue.shift(); // Remove the current conflict

  const resolution = selectedChoice.value;
  const quoteToKeep = resolution === "local" ? currentConflict.local : currentConflict.server;

  // Update the main quotes array
  const existingIndex = quotes.findIndex(q => q.id === quoteToKeep.id);
  if (existingIndex > -1) {
    quotes[existingIndex] = quoteToKeep;
  } else {
    quotes.push(quoteToKeep);
  }

  // Remove any conflicting local changes for this quote
  localChanges = localChanges.filter(change => change.quote.id !== quoteToKeep.id);

  saveQuotes();
  saveLocalChanges();
  populateCategories();
  filterQuotes();
  showRandomQuote();
  showNotification(`Conflict resolved. Keeping the ${resolution} version.`, "success");

  // If there are more conflicts, display the next one
  if (conflictQueue.length > 0) {
    displayConflicts();
  } else {
    document.getElementById("conflictResolution").style.display = "none";
    showNotification("All conflicts resolved. Sync complete.", "success");
  }
}

// --- Notification System ---
function showNotification(message, type = "info") {
  const notificationArea = document.getElementById("notificationArea");
  const notificationDiv = document.createElement("div");
  notificationDiv.textContent = message;
  notificationDiv.classList.add("notification");
  if (type === "success") {
    notificationDiv.style.backgroundColor = "#d4edda";
    notificationDiv.style.color = "#155724";
    notificationDiv.style.borderColor = "#c3e6cb";
  } else if (type === "error") {
    notificationDiv.style.backgroundColor = "#f8d7da";
    notificationDiv.style.color = "#721c24";
    notificationDiv.style.borderColor = "#f5c6cb";
  } else if (type === "warning") {
    notificationDiv.style.backgroundColor = "#fff3cd";
    notificationDiv.style.color = "#856404";
    notificationDiv.style.borderColor = "#ffeeba";
  } else { // info
    notificationDiv.style.backgroundColor = "#cfe2ff";
    notificationDiv.style.color = "#055160";
    notificationDiv.style.borderColor = "#b6d4fe";
  }

  notificationArea.prepend(notificationDiv); // Add to the top
  // Remove after 5 seconds
  setTimeout(() => {
    notificationDiv.remove();
  }, 5000);
}


document.addEventListener("DOMContentLoaded", initQuoteApp);