import { updateCharts } from './chart-manager.js';

let state = {
    initialBalance: 500,
    items: JSON.parse(localStorage.getItem('k2_ledger_items')) || [],
    editingId: null
};

const elements = {
    initialBalanceInput: document.getElementById('initial-balance'),
    form: document.getElementById('ledger-form'),
    typeSelect: document.getElementById('type'),
    categoryGroup: document.getElementById('category-group'),
    categorySelect: document.getElementById('category'),
    dateInput: document.getElementById('date'),
    weightInput: document.getElementById('weight'),
    hoursInput: document.getElementById('hours'),
    buyPriceInput: document.getElementById('buy-price'),
    buyPriceWrapper: document.getElementById('buy-price-wrapper'),
    sellPriceInput: document.getElementById('sell-price'),
    mainPriceLabel: document.getElementById('main-price-label'),
    itemIdInput: document.getElementById('item-id'),
    descriptionInput: document.getElementById('description'),
    btnSubmit: document.getElementById('btn-submit'),
    rowsContainer: document.getElementById('ledger-rows'),
    totalIncome: document.getElementById('total-income'),
    totalExpenses: document.getElementById('total-expenses'),
    netUtility: document.getElementById('net-utility'),
    currentBalance: document.getElementById('current-balance'),
    lowBalanceAlert: document.getElementById('low-balance-alert')
};

document.addEventListener('DOMContentLoaded', () => {
    const savedInitial = localStorage.getItem('k2_initial_balance');
    if (savedInitial !== null) {
        state.initialBalance = parseFloat(savedInitial);
        elements.initialBalanceInput.value = state.initialBalance;
    }
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    elements.categoryGroup.style.display = 'none';
    
    setupEventListeners();
    render();
});

function setupEventListeners() {
    elements.initialBalanceInput.addEventListener('input', (e) => {
        state.initialBalance = parseFloat(e.target.value) || 0;
        localStorage.setItem('k2_initial_balance', state.initialBalance);
        render();
    });

    elements.typeSelect.addEventListener('change', (e) => {
        const isExpense = e.target.value === 'egreso';
        if (isExpense) {
            elements.categoryGroup.style.display = 'flex';
            elements.buyPriceWrapper.style.display = 'none';
            elements.mainPriceLabel.textContent = 'Costo Total del Gasto';
            elements.buyPriceInput.value = 0;
        } else {
            elements.categoryGroup.style.display = 'none';
            elements.buyPriceWrapper.style.display = 'flex';
            elements.mainPriceLabel.textContent = 'Precio de Venta';
        }
    });

    elements.form.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (!elements.form.checkValidity()) return;

    const type = elements.typeSelect.value;
    const sellPrice = parseFloat(elements.sellPriceInput.value) || 0;
    const buyPrice = parseFloat(elements.buyPriceInput.value) || 0;
    
    let utility = type === 'ingreso' ? (sellPrice - buyPrice) : -sellPrice;
    let category = type === 'ingreso' ? 'Venta' : elements.categorySelect.value;

    const entry = {
        id: state.editingId || crypto.randomUUID(),
        type,
        category,
        date: elements.dateInput.value,
        weight: parseInt(elements.weightInput.value) || 0,
        hours: parseFloat(elements.hoursInput.value) || 0,
        buyPrice: type === 'ingreso' ? buyPrice : 0,
        sellPrice: sellPrice,
        itemId: elements.itemIdInput.value.toUpperCase() || 'K2-STL',
        description: elements.descriptionInput.value,
        utility
    };

    if (state.editingId) {
        state.items = state.items.map(item => item.id === state.editingId ? entry : item);
        state.editingId = null;
        elements.btnSubmit.innerHTML = '<span>Ejecutar Transacción</span>';
    } else {
        state.items.push(entry);
    }

    localStorage.setItem('k2_ledger_items', JSON.stringify(state.items));
    elements.form.reset();
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    elements.categoryGroup.style.display = 'none';
    elements.buyPriceWrapper.style.display = 'flex';
    elements.mainPriceLabel.textContent = 'Precio de Venta';
    
    render();
}

function deleteItem(id) {
    state.items = state.items.filter(item => item.id !== id);
    localStorage.setItem('k2_ledger_items', JSON.stringify(state.items));
    render();
}

function startEdit(id) {
    const item = state.items.find(item => item.id === id);
    if (!item) return;

    state.editingId = item.id;
    elements.typeSelect.value = item.type;
    elements.dateInput.value = item.date;
    elements.weightInput.value = item.weight;
    elements.hoursInput.value = item.hours;
    elements.itemIdInput.value = item.itemId;
    elements.descriptionInput.value = item.description;

    if (item.type === 'egreso') {
        elements.categoryGroup.style.display = 'flex';
        elements.categorySelect.value = item.category;
        elements.buyPriceWrapper.style.display = 'none';
        elements.sellPriceInput.value = item.sellPrice;
        elements.mainPriceLabel.textContent = 'Costo Total del Gasto';
    } else {
        elements.categoryGroup.style.display = 'none';
        elements.buyPriceWrapper.style.display = 'flex';
        elements.buyPriceInput.value = item.buyPrice;
        elements.sellPriceInput.value = item.sellPrice;
        elements.mainPriceLabel.textContent = 'Precio de Venta';
    }

    elements.btnSubmit.innerHTML = '<span>Actualizar Registro Guardado</span>';
    window.scrollTo({ top: elements.form.offsetTop - 50, behavior: 'smooth' });
}

function render() {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalUtility = 0;

    elements.rowsContainer.innerHTML = '';
    state.items.sort((a, b) => new Date(a.date) - new Date(b.date));

    state.items.forEach(item => {
        if (item.type === 'ingreso') {
            totalIncome += item.sellPrice;
        } else {
            totalExpenses += item.sellPrice;
        }
        totalUtility += item.utility;

        const tr = document.createElement('tr');
        
        const techDetails = item.type === 'ingreso' 
            ? `<div style="font-weight:500; color:var(--cyan)">⚖️ ${item.weight}g</div><div style="font-size:0.75rem; color:var(--text-secondary)">⏱️ ${item.hours}h</div>` 
            : `<div style="font-size:0.8rem; color:var(--amber-orange); font-weight:500;">📂 ${item.category}</div>`;

        let performanceBadge = '';
        if (item.type === 'ingreso' && item.buyPrice > 0) {
            const margin = ((item.sellPrice - item.buyPrice) / item.sellPrice) * 100;
            performanceBadge = `<span style="color:var(--cyan); font-weight:600; font-family:var(--font-heading); background:rgba(6, 182, 212, 0.08); padding: 2px 6px; border-radius:4px;">+${margin.toFixed(0)}% ROI</span>`;
        } else {
            performanceBadge = `<span style="color:var(--text-secondary)">-</span>`;
        }

        tr.innerHTML = `
            <td><span style="color: var(--text-secondary); font-size:0.85rem;">${item.date}</span></td>
            <td><code>${item.itemId}</code></td>
            <td><div style="max-width:200px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.description}">${item.description}</div></td>
            <td>${techDetails}</td>
            <td style="font-weight:700; font-family:var(--font-heading); color:${item.type === 'ingreso' ? 'var(--text-primary)' : 'var(--crimson-red)'}">
                $${item.sellPrice.toFixed(2)}
            </td>
            <td>${performanceBadge}</td>
            <td><span class="ui-badge badge-${item.type}">${item.type === 'ingreso' ? 'Venta' : 'Gasto'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon-action edit-btn" title="Editar">✏️</button>
                    <button class="btn-icon-action delete-btn delete" title="Eliminar">🗑️</button>
                </div>
            </td>
        `;

        tr.querySelector('.edit-btn').addEventListener('click', () => startEdit(item.id));
        tr.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
        elements.rowsContainer.appendChild(tr);
    });

    const currentBalance = state.initialBalance + totalIncome - totalExpenses;
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    elements.totalIncome.textContent = f.format(totalIncome);
    elements.totalExpenses.textContent = f.format(totalExpenses);
    elements.netUtility.textContent = f.format(totalUtility);
    elements.currentBalance.textContent = f.format(currentBalance);

    elements.currentBalance.style.color = currentBalance < 0 ? 'var(--crimson-red)' : 'var(--text-primary)';

    if (currentBalance < (state.initialBalance * 0.10)) {
        elements.lowBalanceAlert.classList.remove('hidden');
    } else {
        elements.lowBalanceAlert.classList.add('hidden');
    }

    updateCharts(state.initialBalance, state.items);
}