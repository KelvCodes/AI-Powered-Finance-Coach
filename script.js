st userName = localStorage.getItem('userName') || 'Guest';
  document.getElementById('user-greeting').textContent = userName;

  const expenseForm = document.getElementById('expense-form');
  const budgetForm = document.getElementById('budget-form');
  const expenseList = document.getElementById('expenses');
  const budgetAlert = document.getElementById('budget-alert');
  const currencyInput = document.getElementById('currency');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const exportCsvBtn = document.getElementById('export-csv');
  const ctx = document.getElementById('spendingChart').getContext('2d');

  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  let budgets = JSON.parse(localStorage.getItem('budgets')) || { food: 0, transport: 0, entertainment: 0, utilities: 0, other: 0 };
  let currency = localStorage.getItem('currency') || 'USD';
  let spendingChart;

  currencyInput.value = currency;

  // Dark Mode
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });

  // Currency Conversion (Real-time API)
  async function convertCurrency(amount, fromCurrency) {
    if (fromCurrency === currency) return amount;
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    return amount * (data.rates[currency] || 1);
  }

  currencyInput.addEventListener('change', () => {
    currency = currencyInput.value.trim().toUpperCase();
    localStorage.setItem('currency', currency);
    renderExpenses();
  });

  // Render Expenses
  async function renderExpenses() {
    expenseList.innerHTML = '';
    let totalByCategory = {};
    for (const expense of expenses) {
      const convertedAmount = await convertCurrency(expense.amount, 'USD');
      totalByCategory[expense.category] = (totalByCategory[expense.category] || 0) + convertedAmount;

      const li = document.createElement('li');
      li.innerHTML = `
        ${expense.name} - ${currency} ${convertedAmount.toFixed(2)} (${expense.category})
        <span onclick="deleteExpense(${expenses.indexOf(expense)})">❌</span>
      `;
      expenseList.appendChild(li);
    }
    checkBudgetAlerts(totalByCategory);
    updateChart();
  }

  // Add Expense
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    expenses.push({ name, amount, category });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    await renderExpenses();
    expenseForm.reset();
  });

  // Set Budget
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);

    budgets[category] = amount;
    localStorage.setItem('budgets', JSON.stringify(budgets));
    budgetForm.reset();
    renderExpenses();
  });

  // Delete Expense
  window.deleteExpense = async (index) => {
    expenses.splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    await renderExpenses();
  };

  // Budget Alerts
  function checkBudgetAlerts(totalByCategory) {
    budgetAlert.classList.add('hidden');
    for (const [category, total] of Object.entries(totalByCategory)) {
      if (budgets[category] && total > budgets[category]) {
        budgetAlert.textContent = `Warning: You've exceeded your ${category} budget (${currency} ${budgets[category]})!`;
        budgetAlert.classList.remove('hidden');
        budgetAlert.classList.add('warning');
        break;
      }
    }
  }

  // Update Chart
  function updateChart() {
    const categories = ['food', 'transport', 'entertainment', 'utilities', 'other'];
    const data = categories.map(cat => expenses.reduce((sum, exp) => exp.category === cat ? sum + exp.amount : sum, 0));

    if (spendingChart) spendingChart.destroy();
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
        plugins: { legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333' } } }
      }
    });
  }

  // Export to CSV
  exportCsvBtn.addEventListener('click', () => {
    const csv = ['Name,Amount,Category'];
    expenses.forEach(exp => csv.push(`${exp.name},${exp.amount},${exp.category}`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  renderExpenses();
});

// PWA Service Worker (add this in a separate `service-worker.js` file)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
