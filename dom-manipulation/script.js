let quotes = [];

// === Load quotes and last filter on startup ===
function initQuoteApp() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();
  restoreLastFilter();
  showRandomQuote();

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
}

// === Load from local storage or default set ===
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "The best way to predict the future is to create it.", category: "Motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "Do not be afraid to give up the good to go for the great.", category: "Success" }
  ];
}

// === Save to localStorage ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Display a random quote ===
function showRandomQuote() {
  const selected = document.getElementById("categorySelect").value;
  const list = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  const display = document.getElementById("quoteDisplay");
  if (list.length === 0) return display.textContent = "No quotes available.";

  const chosen = list[Math.floor(Math.random() * list.length)].text;
  display.textContent = chosen;
  sessionStorage.setItem("lastQuote", chosen);
}

// === Create dropdowns from unique categories ===
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  
  const categorySelect = document.getElementById("categorySelect");
  const categoryFilter = document.getElementById("categoryFilter");

  categorySelect.innerHTML = `<option value="all">All</option>`;
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(cat => {
    const opt1 = new Option(cat, cat);
    const opt2 = new Option(cat, cat);
    categorySelect.appendChild(opt1);
    categoryFilter.appendChild(opt2);
  });
}

// === Filter quotes by category & persist choice ===
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastFilter", selected);

  const filtered = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  const listEl = document.getElementById("filteredQuotesList");
  listEl.innerHTML = "";

  filtered.forEach(q => {
    const li = document.createElement("li");
    li.textContent = q.text;
    listEl.appendChild(li);
  });
}

// === Restore last filter from storage ===
function restoreLastFilter() {
  const saved = localStorage.getItem("lastFilter");
  if (saved) {
    document.getElementById("categoryFilter").value = saved;
    filterQuotes();
  }
}

// === Add a new quote dynamically ===
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill in both fields.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  showRandomQuote();
  filterQuotes(); // refresh visible list
}

// === Create add quote form dynamically ===
function createAddQuoteForm() {
  const formDiv = document.createElement("div");

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";

  const catInput = document.createElement("input");
  catInput.id = "newQuoteCategory";
  catInput.placeholder = "Enter quote category";

  const btn = document.createElement("button");
  btn.textContent = "Add Quote";
  btn.onclick = addQuote;

  formDiv.appendChild(textInput);
  formDiv.appendChild(catInput);
  formDiv.appendChild(btn);
  document.body.appendChild(formDiv);
}

// === Export quotes as JSON ===
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// === Import from JSON file ===
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        quotes.push(...data);
        saveQuotes();
        populateCategories();
        filterQuotes();
        showRandomQuote();
        alert("Quotes imported!");
      } else {
        throw new Error("Invalid format: not an array");
      }
    } catch (err) {
      alert("Error importing quotes: " + err.message);
    }
  };
  reader.readAsText(event.target.files[0]);
}

document.addEventListener("DOMContentLoaded", initQuoteApp);
