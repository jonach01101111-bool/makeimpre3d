let lineChartInstance = null;
let pieChartInstance = null;

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
                label: 'Flujo de Caja ($)',
                data: dataPoints,
                borderColor: '#3b82f6', // Neon Blue
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4', // Cyan accent
                pointBorderColor: '#0b0f19',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.2, 
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { backgroundColor: '#141b2d', titleFont: { size: 13 }, bodyFont: { size: 12 } }
            },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', font: { family: 'Space Grotesk' } } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', font: { family: 'Space Grotesk' } } }
            }
        }
    });
}

function renderPieChart(items) {
    const ctx = document.getElementById('expensesPieChart');
    if (!ctx) return;

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

    const dataValues = hasExpenses ? Object.values(categoriesData) : [1, 1, 1, 1];
    
    // Paleta Neon elegante desaturada corporativa
    const colors = hasExpenses 
        ? ['#06b6d4', '#6366f1', '#f59e0b', '#f43f5e'] 
        : ['#1e293b', '#1e293b', '#1e293b', '#1e293b'];

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Filamento', 'Energía', 'Post-Procesado', 'Mantenimiento'],
            datasets: [{
                data: dataValues,
                backgroundColor: colors,
                borderColor: '#141b2d',
                borderWidth: 3,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 15, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: '#141b2d',
                    callbacks: {
                        label: function(context) {
                            if (!hasExpenses) return ' Sin Egreso Registrado';
                            return ` ${context.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            cutout: '70%' // Hace la dona más delgada y elegante
        }
    });
}