// ZenBudget Finance Tracker - State Management & Data Persistence

// Application State
let transactions = [];
let filteredTransactions = [];

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionNameInput = document.getElementById('name');
const transactionAmountInput = document.getElementById('amount');
const transactionCategoryInput = document.getElementById('category');
const transactionsList = document.getElementById('transactions-list');
const totalBalanceElement = document.getElementById('total-balance');
const totalIncomeElement = document.getElementById('total-income');
const totalExpenseElement = document.getElementById('total-expense');
const searchInput = document.getElementById('search-transactions');
const clearAllButton = document.getElementById('clear-all-btn');
const confirmationModal = document.getElementById('confirmation-modal');
const closeModalButton = document.getElementById('close-modal');
const cancelClearButton = document.getElementById('cancel-clear');
const confirmClearButton = document.getElementById('confirm-clear');
const categoryBarsContainer = document.getElementById('category-bars');
const emptyListText = document.getElementById('empty-list-text');
const emptySummaryText = document.getElementById('empty-summary-text');

// Initialize the application
function init() {
    // Load transactions from localStorage
    loadTransactions();
    
    // Render initial data
    renderTransactions();
    updateBalance();
    updateSpendingSummary();
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Set up event listeners
    setupEventListeners();
}

// Load transactions from localStorage
function loadTransactions() {
    const storedTransactions = localStorage.getItem('zenbudget_transactions');
    
    if (storedTransactions) {
        try {
            transactions = JSON.parse(storedTransactions);
            filteredTransactions = [...transactions];
        } catch (e) {
            console.error('Error loading transactions from localStorage:', e);
            transactions = [];
            filteredTransactions = [];
        }
    }
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem('zenbudget_transactions', JSON.stringify(transactions));
    } catch (e) {
        console.error('Error saving transactions to localStorage:', e);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Form submission
    transactionForm.addEventListener('submit', addTransaction);
    
    // Search functionality
    searchInput.addEventListener('input', filterTransactions);
    
    // Clear all button
    clearAllButton.addEventListener('click', () => {
        confirmationModal.classList.add('active');
    });
    
    // Modal controls
    closeModalButton.addEventListener('click', closeModal);
    cancelClearButton.addEventListener('click', closeModal);
    
    // Confirm clear all
    confirmClearButton.addEventListener('click', clearAllTransactions);
    
    // Close modal when clicking outside
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            closeModal();
        }
    });
}

// Close confirmation modal
function closeModal() {
    confirmationModal.classList.remove('active');
}

// Add a new transaction
function addTransaction(e) {
    e.preventDefault();
    
    const name = transactionNameInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const category = transactionCategoryInput.value;
    
    // Validate inputs
    if (!name || isNaN(amount) || !category) {
        alert('Please fill in all fields correctly.');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: Date.now(), // Simple unique ID
        name,
        amount,
        category,
        date: new Date().toISOString(),
        type: amount >= 0 ? 'income' : 'expense'
    };
    
    // Add to transactions array
    transactions.unshift(transaction);
    filteredTransactions = [...transactions];
    
    // Save to localStorage
    saveTransactions();
    
    // Update UI
    renderTransactions();
    updateBalance();
    updateSpendingSummary();
    
    // Reset form
    transactionForm.reset();
    
    // Show visual feedback
    transactionNameInput.focus();
}

// Filter transactions based on search input
function filterTransactions() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredTransactions = [...transactions];
    } else {
        filteredTransactions = transactions.filter(transaction => 
            transaction.name.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm) ||
            transaction.type.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTransactions();
}

// Render transactions list
function renderTransactions() {
    // Clear the list
    transactionsList.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        emptyListText.style.display = 'block';
        transactionsList.appendChild(emptyListText);
        return;
    }
    
    emptyListText.style.display = 'none';
    
    // Create transaction items
    filteredTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction);
        transactionsList.appendChild(transactionElement);
    });
}

// Create a transaction element
function createTransactionElement(transaction) {
    const transactionElement = document.createElement('div');
    transactionElement.className = `transaction-item ${transaction.type}`;
    
    // Format date
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Format amount with proper color
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));
    const amountClass = transaction.type === 'income' ? 'income' : 'expense';
    const amountSign = transaction.type === 'income' ? '+' : '-';
    
    transactionElement.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-name">${transaction.name}</div>
            <div class="transaction-category">
                <i class="fas fa-tag"></i> ${transaction.category}
            </div>
            <div class="transaction-date">${formattedDate}</div>
        </div>
        <div class="transaction-amount ${amountClass}">
            ${amountSign}${formattedAmount}
        </div>
    `;
    
    return transactionElement;
}

// Update balance and totals
function updateBalance() {
    // Calculate totals using reduce()
    const totals = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expense += Math.abs(transaction.amount);
        }
        return acc;
    }, { income: 0, expense: 0 });
    
    const totalBalance = totals.income - totals.expense;
    
    // Update DOM elements
    totalBalanceElement.textContent = formatCurrency(totalBalance);
    totalIncomeElement.textContent = formatCurrency(totals.income);
    totalExpenseElement.textContent = formatCurrency(totals.expense);
    
    // Add color class to balance based on value
    totalBalanceElement.className = 'balance-amount';
    if (totalBalance > 0) {
        totalBalanceElement.classList.add('positive');
    } else if (totalBalance < 0) {
        totalBalanceElement.classList.add('negative');
    }
}

// Update spending summary with progress bars
function updateSpendingSummary() {
    // Clear the summary
    categoryBarsContainer.innerHTML = '';
    
    // Get expense transactions only
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) {
        emptySummaryText.style.display = 'block';
        categoryBarsContainer.appendChild(emptySummaryText);
        return;
    }
    
    emptySummaryText.style.display = 'none';
    
    // Calculate total expenses
    const totalExpenses = expenseTransactions.reduce((sum, transaction) => {
        return sum + Math.abs(transaction.amount);
    }, 0);
    
    // Group expenses by category
    const categories = {};
    expenseTransactions.forEach(transaction => {
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);
        
        if (!categories[category]) {
            categories[category] = 0;
        }
        
        categories[category] += amount;
    });
    
    // Create progress bars for each category
    Object.entries(categories).forEach(([category, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        
        // Assign color based on category
        const color = getCategoryColor(category);
        
        categoryElement.innerHTML = `
            <div class="category-header">
                <div class="category-name">
                    <i class="fas fa-${getCategoryIcon(category)}"></i>
                    ${category}
                </div>
                <div class="category-amount">${formatCurrency(amount)}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%; background: ${color};"></div>
                <span class="category-percentage">${percentage.toFixed(1)}%</span>
            </div>
        `;
        
        categoryBarsContainer.appendChild(categoryElement);
    });
}

// Get color for a category
function getCategoryColor(category) {
    const colors = {
        'Food': '#10b981',
        'Rent': '#6366f1',
        'Fun': '#8b5cf6',
        'Income': '#06b6d4',
        'Other': '#f59e0b'
    };
    
    return colors[category] || '#94a3b8';
}

// Get icon for a category
function getCategoryIcon(category) {
    const icons = {
        'Food': 'utensils',
        'Rent': 'home',
        'Fun': 'gamepad',
        'Income': 'money-bill-wave',
        'Other': 'shopping-bag'
    };
    
    return icons[category] || 'tag';
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Clear all transactions
function clearAllTransactions() {
    // Clear transactions array
    transactions = [];
    filteredTransactions = [];
    
    // Save to localStorage
    saveTransactions();
    
    // Update UI
    renderTransactions();
    updateBalance();
    updateSpendingSummary();
    
    // Close modal
    closeModal();
    
    // Show confirmation message
    showNotification('All transactions have been cleared.');
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
        padding: 15px 25px;
        border-radius: var(--radius-md);
        box-shadow: var(--glass-shadow);
        z-index: 1001;
        transform: translateX(150%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Stress test: Add sample data
function addSampleData() {
    // Only add if no transactions exist
    if (transactions.length > 0) return;
    
    const sampleTransactions = [
        { name: 'Salary', amount: 3500, category: 'Income', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Rent', amount: -1200, category: 'Rent', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Groceries', amount: -150, category: 'Food', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Concert Tickets', amount: -85, category: 'Fun', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Freelance Work', amount: 800, category: 'Income', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Restaurant', amount: -65, category: 'Food', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Netflix Subscription', amount: -15.99, category: 'Fun', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Coffee Shop', amount: -12.5, category: 'Food', date: new Date().toISOString() }
    ];
    
    sampleTransactions.forEach(transaction => {
        transaction.id = Date.now() + Math.random();
        transaction.type = transaction.amount >= 0 ? 'income' : 'expense';
    });
    
    transactions = sampleTransactions;
    filteredTransactions = [...transactions];
    
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateSpendingSummary();
    
    showNotification('Sample data loaded. Try the search and clear features!');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Add sample data for stress testing (uncomment to enable)
    // setTimeout(addSampleData, 1000);
});