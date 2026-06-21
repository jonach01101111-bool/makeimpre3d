// Variable privada dentro del alcance del módulo para retener la instancia de ChartJS
let financialChartInstance = null;

/**
 * Reconstruye o actualiza el gráfico lineal financiero dinámicamente.
 * @param {number} initialBalance 
 * @param {Array} items 
 */
export function updateChart(initialBalance, items) {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;

    // --- PROCESAMIENTO DE DATOS EN MATRIZ TEMPORAL ---
    // El gráfico requiere reflejar la evolución del dinero cronológicamente.
    let runningBalance = initialBalance;
    
    // Etiqueta inicial base
    const labels = ['Saldo Inicial'];
    const dataPoints = [initialBalance];

    items.forEach((item) => {
        if (item.type === 'ingreso') {
            runningBalance += item.sellPrice;
        } else {
            runningBalance -= item.sellPrice;
        }
        // Construimos los puntos del gráfico combinando fecha y descripción resumida
        labels.push(`${item.date} (${item.itemId})`);
        dataPoints.push(runningBalance);
    });

    // --- SISTEMA DE CONTROL DE DESTRUCCIÓN/CREACIÓN DE INSTANCIAS (CHART.JS) ---
    if (financialChartInstance) {
        financialChartInstance.destroy();
    }

    // Configuración moderna y estética adaptada al Dark Mode
    financialChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Flujo de Caja Real ($)',
                data: dataPoints,
                borderColor: '#6366f1', // Primary Neon Color
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4',
                pointBorderColor: '#ffffff',
                pointHoverRadius: 7,
                tension: 0.3, // Curvatura suave de líneas estilizadas modernas
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    
                    // Crear un gradiente de desvanecimiento muy atractivo en el fondo
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#f8fafc',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    padding: 12,
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif" } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif" } }
                }
            }
        }
    });
}