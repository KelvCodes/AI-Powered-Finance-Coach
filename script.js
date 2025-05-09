e: 'bar',
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
