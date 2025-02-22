// Homepage Script
document.addEventListener('DOMContentLoaded', () => {
    const nameForm = document.getElementById('name-form');
  
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = document.getElementById('user-name').value.trim();
      if (userName) {
        localStorage.setItem('userName', userName);
        window.location.href = 'app.html'; // Redirect to the main app
      }
    });
  });
  
  // Main App Script
  document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    if (userName) {
      document.getElementById('user-greeting').textContent = userName;
    }
  
    const expenseForm = document.getElementById('expense-form');
    const budgetForm = document.getElementById('budget-form');
    const expenseList = document.getElementById('expenses');
    const ctx = document.getElementById('spendingChart').getContext('2d');
    const currencyInput = document.getElementById('currency');
  
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let budgets = JSON.parse(localStorage.getItem('budgets')) || { food: 0, transport: 0, entertainment: 0, utilities: 0, other: 0 };
    let currency = localStorage.getItem('currency') || 'USD';
  
    // Set initial currency
    currencyInput.value = currency;
  
    // Update currency
    currencyInput.addEventListener('input', () => {
      currency = currencyInput.value.trim().toUpperCase();
      localStorage.setItem('currency', currency);
      renderExpenses();
    });
  
    // Render expenses
    function renderExpenses() {
      expenseList.innerHTML = '';
      expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          ${expense.name} - ${currency} ${expense.amount} (${expense.category})
          <span onclick="deleteExpense(${index})">❌</span>
        `;
        expenseList.appendChild(li);
      });
      updateChart();
    }
  
    // Add expense
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('expense-name').value;
      const amount = parseFloat(document.getElementById('expense-amount').value);
      const category = document.getElementById('expense-category').value;
  
      expenses.push({ name, amount, category });
      localStorage.setItem('expenses', JSON.stringify(expenses));
      renderExpenses();
      expenseForm.reset();
    });
  
    // Set budget
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('budget-category').value;
      const amount = parseFloat(document.getElementById('budget-amount').value);
  
      budgets[category] = amount;
      localStorage.setItem('budgets', JSON.stringify(budgets));
      budgetForm.reset();
      updateChart();
    });
  
    // Delete expense
    window.deleteExpense = (index) => {
      expenses.splice(index, 1);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      renderExpenses();
    };
  
    // Chart.js
    let spendingChart;
  
    function updateChart() {
      const categories = ['food', 'transport', 'entertainment', 'utilities', 'other'];
      const data = categories.map(category => {
        return expenses.reduce((total, expense) => {
          return expense.category === category ? total + expense.amount : total;
        }, 0);
      });
  
      if (spendingChart) {
        spendingChart.destroy();
      }
  
      spendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [{
            label: 'Spending by Category',
            data: data,
            backgroundColor: ['#6a11cb', '#2575fc', '#2ecc71', '#e67e22', '#e74c3c'],
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  
    renderExpenses();
  });