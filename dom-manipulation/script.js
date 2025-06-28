// Array to store quotes
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do not be afraid to give up the good to go for the great.", category: "Success" }
];

// Initialize the application
function initQuoteApp() {
  createCategoryDropdown();
  createAddQuoteForm();
  showRandomQuote();

  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
}

// Create the category dropdown dynamically
function createCategoryDropdown() {
  const categorySelect = document.getElementById("categorySelect");
  categorySelect.innerHTML = '<option value="all">All</option>';

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Display a random quote based on selected category
function showRandomQuote() {
  const selectedCategory = document.getElementById("categorySelect").value;
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  const display = document.getElementById("quoteDisplay");

  if (filtered.length === 0) {
    display.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  display.textContent = filtered[randomIndex].text;
}

// Create the form dynamically to add new quotes
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// Add a new quote from form input
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Both quote and category are required.");
    return;
  }

  quotes.push({ text, category });

  // Clear inputs
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  createCategoryDropdown(); // Update dropdown with new category if needed
  showRandomQuote();
}

// Start the app after DOM loads
document.addEventListener("DOMContentLoaded", initQuoteApp);
