let quotes = [];
let selectedCategory = "all"; // <-- Used globally to track filter selection

// === Load from localStorage or use defaults ===
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "The best way to predict the future is to create it.", category: "Motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "Do not be afraid to give up the good to go for the great.", category: "Success" }
  ];
}

// === Save quotes to localStorage ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Initialize everything on DOM load ===
function initQuoteApp() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();
  restoreLastFilter();
  showRandomQuote();

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
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
    li.textContent = q.text;
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

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  showRandomQuote();
  filterQuotes();
}

// === Build add-quote form dynamically ===
function createAddQuoteForm() {
  const form = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);

  document.body.appendChild(form);
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
}

// === Import quotes from uploaded JSON file ===
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("File must contain an array of quotes");

      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      filterQuotes();
      showRandomQuote();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import quotes: " + err.message);
    }
  };
  reader.readAsText(event.target.files[0]);
}

document.addEventListener("DOMContentLoaded", initQuoteApp);
