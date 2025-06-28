// Initial quotes array with categories
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do not be afraid to give up the good to go for the great.", category: "Success" }
];

// Populate category select dropdown
function populateCategories() {
  const categorySelect = document.getElementById("categorySelect");
  // Clear previous options except "All"
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '<option value="all">All</option>';
  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Show a random quote based on selected category
function showRandomQuote() {
  const selectedCategory = document.getElementById("categorySelect").value;
  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  document.getElementById("quoteDisplay").textContent = filteredQuotes[randomIndex].text;
}

// Add new quote to array and update DOM
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text === "" || category === "") {
    alert("Please enter both a quote and category.");
    return;
  }

  quotes.push({ text, category });

  // Clear input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  // Update category dropdown and show a new quote
  populateCategories();
  showRandomQuote();
}

// Event listener for new quote button
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Initial setup
populateCategories();
showRandomQuote();
