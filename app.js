import { updateChart } from './chart-manager.js';

// --- ESTADO DE LA APLICACIÓN (STATE) ---
let state = {
    initialBalance: 1000,
    items: JSON.parse(localStorage.getItem('ledger_items')) || [],
    editingId: null
};

// --- SELECTORES DEL DOM ---
const elements = {
    initialBalanceInput: document.getElementById('initial-balance'),
    form: document.getElementById('ledger-form'),
    typeSelect: document.getElementById('type'),
    dateInput: document.getElementById('date'),
    buyPriceInput: document.getElementById('buy-price'),
    sellPriceInput: document.getElementById('sell-price'),
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

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar saldo inicial guardado o por defecto
    const savedInitial = localStorage.getItem('ledger_initial_balance');
    if (savedInitial !== null) {
        state.initialBalance = parseFloat(savedInitial);
        elements.initialBalanceInput.value = state.initialBalance;
    }
    
    // Setear fecha por defecto de hoy
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    
    setupEventListeners();
    render();
});

// --- LISTENERS ---
function setupEventListeners() {
    elements.initialBalanceInput.addEventListener('input', (e) => {
        state.initialBalance = parseFloat(e.target.value) || 0;
        localStorage.setItem('ledger_initial_balance', state.initialBalance);
        render();
    });

    elements.form.addEventListener('submit', handleFormSubmit);

    // Cambio dinámico visual según tipo de movimiento
    elements.typeSelect.addEventListener('change', (e) => {
        const isExpense = e.target.value === 'egreso';
        elements.buyPriceInput.disabled = isExpense;
        if (isExpense) elements.buyPriceInput.value = 0;
    });
}

// --- MANIPULACIÓN DEL CRUD ---
function handleFormSubmit(e) {
    e.preventDefault();

    // Validación básica nativa
    if (!elements.form.checkValidity()) {
        alert('Por favor, completa correctamente todos los campos obligatorios.');
        return;
    }

    const type = elements.typeSelect.value;
    const buyPrice = parseFloat(elements.buyPriceInput.value) || 0;
    const sellPrice = parseFloat(elements.sellPriceInput.value) || 0;
    
    // Lógica senior: Si es egreso, la utilidad es negativa (pérdida directa por el valor del gasto)
    // Si es ingreso, utilidad = Venta - Costo de compra.
    const utility = type === 'ingreso' ? (sellPrice - buyPrice) : -sellPrice;

    const entryData = {
        id: state.editingId || Crypto.randomUUID(), // Identificador moderno único
        type,
        date: elements.dateInput.value,
        buyPrice: type === 'ingreso' ? buyPrice : 0,
        sellPrice,
        itemId: elements.itemIdInput.value || 'N/A',
        description: elements.descriptionInput.value,
        utility
    };

    if (state.editingId) {
        // Modo Edición
        state.items = state.items.map(item => item.id === state.editingId ? entryData : item);
        state.editingId = null;
        elements.btnSubmit.textContent = 'Guardar Registro';
        elements.btnSubmit.classList.remove('btn-edit');
    } else {
        // Nuevo Registro
        state.items.push(entryData);
    }

    // Persistir y renderizar
    localStorage.setItem('ledger_items', JSON.stringify(state.items));
    elements.form.reset();
    elements.dateInput.value = new Date().toISOString().split('T')[0];
    elements.buyPriceInput.disabled = false;
    
    render();
}

function deleteItem(id) {
    state.items = state.items.filter(item => item.id !== id);
    localStorage.setItem('ledger_items', JSON.stringify(state.items));
    render();
}

function startEdit(id) {
    const item = state.items.find(item => item.id === id);
    if (!item) return;

    state.editingId = item.id;
    
    // Poblar formulario
    elements.typeSelect.value = item.type;
    elements.dateInput.value = item.date;
    elements.buyPriceInput.value = item.buyPrice;
    elements.sellPriceInput.value = item.sellPrice;
    elements.itemIdInput.value = item.itemId === 'N/A' ? '' : item.itemId;
    elements.descriptionInput.value = item.description;

    elements.buyPriceInput.disabled = item.type === 'egreso';

    elements.btnSubmit.textContent = 'Actualizar Registro Seleccionado';
    window.scrollTo({ top: elements.form.offsetTop, behavior: 'smooth' });
}

// --- MOTOR DE REDEFINICIÓN Y RECALCULO DE LA VISTA (RENDER) ---
function render() {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalUtility = 0;

    // Limpiar tabla de forma eficiente
    elements.rowsContainer.innerHTML = '';

    // Ordenar elementos por fecha cronológica para presentación y gráfico
    state.items.sort((a, b) => new Date(a.date) - new Date(b.date));

    state.items.forEach(item => {
        if (item.type === 'ingreso') {
            totalIncome += item.sellPrice;
        } else {
            totalExpenses += item.sellPrice;
        }
        totalUtility += item.utility;

        // Inyección controlada en el DOM
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td><code style="color:var(--primary); font-weight:600;">${item.itemId}</code></td>
            <td>${item.description}</td>
            <td>${item.type === 'ingreso' ? `$${item.buyPrice.toFixed(2)}` : '-'}</td>
            <td>$${item.sellPrice.toFixed(2)}</td>
            <td style="color: ${item.utility >= 0 ? 'var(--income)' : 'var(--expense)'}; font-weight:600;">
                $${item.utility.toFixed(2)}
            </td>
            <td><span class="badge badge-${item.type}">${item.type}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit-trigger" title="Editar">✏️</button>
                    <button class="btn-action delete-trigger" title="Eliminar">🗑️</button>
                </div>
            </td>
        `;

        // Asignación de handlers precisos evitando inline JS execution
        tr.querySelector('.edit-trigger').addEventListener('click', () => startEdit(item.id));
        tr.querySelector('.delete-trigger').addEventListener('click', () => deleteItem(item.id));

        elements.rowsContainer.appendChild(tr);
    });

    // Lógica Financiera Global
    const currentBalance = state.initialBalance + totalIncome - totalExpenses;

    // Actualización de Widgets con formato de moneda internacional
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    elements.totalIncome.textContent = formatter.format(totalIncome);
    elements.totalExpenses.textContent = formatter.format(totalExpenses);
    elements.netUtility.textContent = formatter.format(totalUtility);
    elements.currentBalance.textContent = formatter.format(currentBalance);

    // Estilo condicional para el balance general si es negativo
    elements.currentBalance.style.color = currentBalance < 0 ? 'var(--expense)' : 'var(--text-main)';

    // CONTROL DE ALERTA DE PRESUPUESTO CRÍTICO (< 10%)
    const limitCondition = state.initialBalance * 0.10;
    if (currentBalance < limitCondition) {
        elements.lowBalanceAlert.classList.remove('hidden');
    } else {
        elements.lowBalanceAlert.classList.add('hidden');
    }

    // ACTUALIZACIÓN DEL GRÁFICO EN OTRO MÓDULO SÍNCRONO
    updateChart(state.initialBalance, state.items);
}