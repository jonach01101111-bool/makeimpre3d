let lineChartInstance = null;
let pieChartInstance = null;

/**
 * Orquesta la actualización en paralelo de los dos gráficos analíticos.
 */
export function updateCharts(initialBalance, items) {
    renderLineChart(initialBalance, items);
    renderPieChart(items);
}

function renderLineChart(initialBalance, items) {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;

    let runningBalance = initialBalance;
    const labels = ['Inicio'];
    const dataPoints = [initialBalance];

    items.forEach(item => {
        if (item.type === 'ingreso') {
            runningBalance += item.sellPrice;
        } else {
            runningBalance -= item.sellPrice;
        }
        labels.push(`${item.date}`);
        dataPoints.push(runningBalance);
    });

    if (lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Flujo de Caja Real ($)',
                data: dataPoints,
                borderColor: '#6366f1',
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4',
                tension: 0.25,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderPieChart(items) {
    const ctx = document.getElementById('expensesPieChart');
    if (!ctx) return;

    // Reducir ítems agrupando costos de egresos por su categoría
    const categoriesData = {
        'Filamento': 0,
        'Energia': 0,
        'Post-Procesado': 0,
        'Mantenimiento': 0
    };

    let hasExpenses = false;
    items.forEach(item => {
        if (item.type === 'egreso' && categoriesData[item.category] !== undefined) {
            categoriesData[item.category] += item.sellPrice;
            hasExpenses = true;
        }
    });

    if (pieChartInstance) pieChartInstance.destroy();

    // Si no hay gastos registrados, mostramos gráfico vacío estético informativo
    const dataValues = hasExpenses ? Object.values(categoriesData) : [1, 1, 1, 1];
    const borderColors = hasExpenses ? ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] : ['#334155','#334155','#334155','#334155'];

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoriesData),
            datasets: [{
                data: dataValues,
                backgroundColor: hasExpenses 
                    ? ['rgba(16, 185, 129, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)']
                    : ['rgba(51, 65, 85, 0.2)', 'rgba(51, 65, 85, 0.2)', 'rgba(51, 65, 85, 0.2)', 'rgba(51, 65, 85, 0.2)'],
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (!hasExpenses) return ' Sin registros de gastos';
                            return ` ${context.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}