// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
  // ======================
  // HOMEPAGE LOGIC SECTION
  // ======================
  const nameForm = document.getElementById('name-form');
  if (nameForm) {
    // Handle form submission for username entry
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent default form submission behavior
      const userName = document.getElementById('user-name').value.trim();
      
      // If username is provided, store it and redirect to app page
      if (userName) {
        localStorage.setItem('userName', userName);
        window.location.href = 'app.html';
      }
    });
    return; // Exit early if this is the homepage
  }

  // ==================
  // APP LOGIC SECTION
  // ==================
  
  // Get username from localStorage or default to 'Guest'
  const userName = localStorage.getItem('userName') || 'Guest';
  document.getElementById('user-greeting').textContent = userName;

  // DOM Element References
  const expenseForm = document.getElementById('expense-form');
  const budgetForm = document.getElementById('budget-form');
  const expenseList = document.getElementById('expenses');
  const budgetAlert = document.getElementById('budget-alert');
  const currencyInput = document.getElementById('currency');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const exportCsvBtn = document.getElementById('export-csv');
  const ctx = document.getElementById('spendingChart').getContext('2d');

  // Initialize data from localStorage or set defaults
  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  let budgets = JSON.parse(localStorage.getItem('budgets')) || { 
    food: 0, transport: 0, entertainment: 0, utilities: 0, other: 0 
  };
  let currency = localStorage.getItem('currency') || 'USD';
  let spendingChart; // Will hold the Chart.js instance

  // Set the currency input to the stored value
  currencyInput.value = currency;

  // ==================
  // DARK MODE HANDLING
  // ==================
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    // Store dark mode preference
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    // Toggle emoji icon
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });

  // ========================
  // CURRENCY CONVERSION LOGIC
  // ========================
  async function convertCurrency(amount, fromCurrency) {
    // No conversion needed if currencies match
    if (fromCurrency === currency) return amount;
    
    // Fetch conversion rates from API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    return amount * (data.rates[currency] || 1); // Fallback to 1 if rate not found
  }

  // Handle currency change
  currencyInput.addEventListener('change', () => {
    currency = currencyInput.value.trim().toUpperCase();
    localStorage.setItem('currency', currency);
    renderExpenses(); // Re-render with new currency
  });

  // ===================
  // EXPENSE RENDERING
  // ===================
  async function renderExpenses() {
    expenseList.innerHTML = ''; // Clear current list
    let totalByCategory = {}; // Track totals per category
    
    // Process each expense
    for (const expense of expenses) {
      // Convert amount to selected currency
      const convertedAmount = await convertCurrency(expense.amount, 'USD');
      // Accumulate category totals
      totalByCategory[expense.category] = (totalByCategory[expense.category] || 0) + convertedAmount;

      // Create list item for expense
      const li = document.createElement('li');
      li.innerHTML = `
        ${expense.name} - ${currency} ${convertedAmount.toFixed(2)} (${expense.category})
        <span onclick="deleteExpense(${expenses.indexOf(expense)})">❌</span>
      `;
      expenseList.appendChild(li);
    }
    
    // Check for budget overages and update chart
    checkBudgetAlerts(totalByCategory);
    updateChart();
  }

  // =================
  // ADD EXPENSE LOGIC
  // =================
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Get form values
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    // Add new expense and save
    expenses.push({ name, amount, category });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    await renderExpenses(); // Refresh display
    expenseForm.reset(); // Clear form
  });

  // =================
  // SET BUDGET LOGIC
  // =================
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Get form values
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);

    // Update budget and save
    budgets[category] = amount;
    localStorage.setItem('budgets', JSON.stringify(budgets));
    budgetForm.reset(); // Clear form
    renderExpenses(); // Refresh display
  });

  // ===================
  // DELETE EXPENSE LOGIC
  // ===================
  window.deleteExpense = async (index) => {
    expenses.splice(index, 1); // Remove expense
    localStorage.setItem('expenses', JSON.stringify(expenses));
    await renderExpenses(); // Refresh display
  };

  // ======================
  // BUDGET ALERT HANDLING
  // ======================
  function checkBudgetAlerts(totalByCategory) {
    budgetAlert.classList.add('hidden'); // Reset alert
    
    // Check each category for budget overage
    for (const [category, total] of Object.entries(totalByCategory)) {
      if (budgets[category] && total > budgets[category]) {
        budgetAlert.textContent = `Warning: You've exceeded your ${category} budget (${currency} ${budgets[category]})!`;
        budgetAlert.classList.remove('hidden');
        budgetAlert.classList.add('warning');
        break; // Show only the first over-budget warning
      }
    }
  }

  // =================
  // CHART MANAGEMENT
  // =================
  function updateChart() {
    const categories = ['food', 'transport', 'entertainment', 'utilities', 'other'];
    // Calculate totals for each category
    const data = categories.map(cat => 
      expenses.reduce((sum, exp) => exp.category === cat ? sum + exp.amount : sum, 0)
    );

    // Destroy existing chart if it exists
    if (spendingChart) spendingChart.destroy();
    
    // Create new chart
    spendingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Spending by Category',
          data: data,
          backgroundColor: ['#6a11cb', '#2575fc', '#2ecc71', '#e67e22', '#e74c3c'],
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { 
          legend: { 
            labels: { 
              color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333' 
            } 
          } 
        }
      }
    });
  }

  // =================
  // CSV EXPORT LOGIC
  // =================
  exportCsvBtn.addEventListener('click', () => {
    // Create CSV content
    const csv = ['Name,Amount,Category']; // Header row
    expenses.forEach(exp => csv.push(`${exp.name},${exp.amount},${exp.category}`));
    
    // Create and trigger download
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url); // Clean up
  });

  // Initial render
  renderExpenses();
});

// ========================
// PWA SERVICE WORKER SETUP
// ========================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
