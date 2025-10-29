// Configuración
const API_BASE_URL = 'http://localhost:3001/api';
let currentPage = 1;
let currentStatusFilter = '';
let ordersData = [];
let currentOrderId = null;
let customersData = [];
let currentWeekOffset = 0; // ← Agrega esta variable


// Elementos DOM
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.sidebar-section a');
const statusFilter = document.getElementById('status-filter');
const ordersTableBody = document.getElementById('orders-table-body');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const currentPageElement = document.getElementById('current-page');
const orderDetailModal = document.getElementById('order-detail-modal');
const closeModalBtn = document.querySelector('.close-modal');
const updateStatusBtn = document.getElementById('update-status-btn');
const orderStatusSelect = document.getElementById('order-status-select');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');

// Agrega esta función de verificación al inicio del archivo
function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (isAuthenticated !== 'true') {
        // Redirige a la página de login si no está autenticado
        window.location.href = 'index.html';
    }
}

// Agregar la función de logout
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Elimina el estado de la sesión
        localStorage.removeItem('adminAuthenticated');
        
        // Redirige a la página de inicio de sesión, que ahora es index.html
        window.location.href = 'index.html';
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Primero, verifica la autenticación
    checkAuthentication();

    // Ahora, continúa con el resto de la inicialización
    // ✅ NUEVO: Registramos el plugin de zoom globalmente
    Chart.register(ChartZoom);
    initTheme();
    initNavigation();
    loadDashboard();
    loadOrders();
    setupEventListeners();
});

// Función para inicializar el tema
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Función para establecer el tema
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Actualizar icono y texto del botón
    const themeIcon = themeToggle.querySelector('i');
    const themeText = themeToggle.querySelector('.theme-text');
    
    if (theme === 'dark') {
        themeIcon.className = 'bx bx-sun';
        themeText.textContent = 'Modo Día';
    } else {
        themeIcon.className = 'bx bx-moon';
        themeText.textContent = 'Modo Noche';
    }

    // 👉 Forzar actualización de gráficos al cambiar tema
    updateChartsTheme();
}


// Forzar actualización de colores de gráficos cuando cambia el tema
function updateChartsTheme() {
    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

    if (window.topProductsChart) {
        window.topProductsChart.options.plugins.title.color = textPrimary;
        window.topProductsChart.options.plugins.legend.labels.color = textPrimary;
        window.topProductsChart.options.scales.x.ticks.color = textSecondary;
        window.topProductsChart.options.scales.x.grid.color = borderColor;
        window.topProductsChart.options.scales.y.ticks.color = textSecondary;
        window.topProductsChart.options.scales.y.grid.color = borderColor;
        window.topProductsChart.update();
    }

    if (window.ordersStatusChart) {
        window.ordersStatusChart.options.plugins.title.color = textPrimary;
        window.ordersStatusChart.options.plugins.legend.labels.color = textPrimary;
        if (window.ordersStatusChart.options.plugins.datalabels) {
            window.ordersStatusChart.options.plugins.datalabels.color = textPrimary;
        }
        window.ordersStatusChart.update();
    }
    
    // ✅ NUEVO: Actualizar el gráfico de ventas semanales
    if (window.weeklySalesChart) {
        window.weeklySalesChart.options.plugins.title.color = textPrimary;
        window.weeklySalesChart.options.plugins.legend.labels.color = textPrimary;
        window.weeklySalesChart.options.scales.x.ticks.color = textSecondary;
        window.weeklySalesChart.options.scales.x.grid.color = borderColor;
        window.weeklySalesChart.options.scales.y.ticks.color = textSecondary;
        window.weeklySalesChart.options.scales.y.grid.color = borderColor;
        window.weeklySalesChart.update();
    }
}

// Alternar entre temas
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Navegación
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Actualizar navegación activa
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Mostrar sección correspondiente
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            // Cargar datos según la sección
            if (targetId === 'dashboard') {
                loadDashboard();
            } else if (targetId === 'orders') {
                loadOrders();
            } else if (targetId === 'products') {
                loadProducts();
            } else if (targetId === 'customers') {
                loadCustomers();
            }
        });
    });
}


// Dashboard
async function loadDashboard() {
    try {
        console.log("Cargando dashboard...");
        
        const [statsResponse, productsResponse, weeklySalesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/orders/stats`),
            fetch(`${API_BASE_URL}/orders/top-products`),
            // ✅ Obtener los datos de ventas semanales con el offset actual
            fetch(`${API_BASE_URL}/orders/weekly-sales?week_offset=${currentWeekOffset}`).catch(error => {
                console.error("Error fetching weekly sales:", error);
                return { ok: false };
            })
        ]);
        
        // Verificar cada respuesta individualmente
        if (!statsResponse.ok) {
            console.error('Error en statsResponse:', statsResponse.status, statsResponse.statusText);
        }
        
        if (!productsResponse.ok) {
            console.error('Error en productsResponse:', productsResponse.status, productsResponse.statusText);
        }
        
        let weeklySales = [];
        if (weeklySalesResponse.ok) {
            weeklySales = await weeklySalesResponse.json();
            console.log("Datos de ventas semanales recibidos:", weeklySales);
        } else {
            console.warn("No se pudieron obtener los datos de ventas semanales, usando datos vacíos");
        }
        
        const stats = await statsResponse.json();
        const topProducts = await productsResponse.json();
        
        updateStats(stats);
        renderTopProductsChart(topProducts);
        renderOrdersStatusChart(stats);
        // ✅ Llamar a la función para renderizar el gráfico de ventas semanales
        renderWeeklySalesChart(weeklySales);

         // Al final de la función, después de renderizar los gráficos:
        updateWeekDisplay();

    } catch (error) {
        console.error('Error cargando dashboard:', error);
        // Intentar renderizar con datos vacíos
        renderWeeklySalesChart([]);
        alert('Error cargando el dashboard. Algunos datos pueden no mostrarse correctamente.');
    }
}

function updateStats(stats) {
    document.getElementById('total-orders').textContent = stats.total_orders;
    document.getElementById('total-revenue').textContent = `$${parseFloat(stats.total_revenue || 0).toFixed(2)}`;
    document.getElementById('avg-order').textContent = `$${parseFloat(stats.average_order_value || 0).toFixed(2)}`;
    document.getElementById('pending-orders').textContent = stats.pending_orders;
}

// FUNCIONES DE GRÁFICOS CON COLORES INTENSOS
function renderTopProductsChart(products) {
    const ctx = document.getElementById('top-products-chart');
    
    if (!ctx) {
        console.error('Elemento canvas no encontrado para top-products-chart');
        return;
    }

    // Debug: ver lo que llega del backend
    console.log("📊 Datos recibidos para Top Products:", products);

    // Debug: verificar etiquetas y valores
    console.log("➡️ Labels:", products.map(p => p.product_name));
    console.log("➡️ Valores:", products.map(p => p.total_sold));

    // Destruir gráfico existente si hay uno
    if (window.topProductsChart) {
        window.topProductsChart.destroy();
    }
    
    // Colores vibrantes para el gráfico de barras
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#FF7700';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#E05D00';
    const hoverBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || '#FF9A40';
    
    window.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: products.map(p => p.product_name),  // <-- corregido
            datasets: [{
                label: 'Cantidad Vendida',
                data: products.map(p => p.total_sold),   // <-- corregido
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: hoverBackgroundColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Productos Más Vendidos',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e0e0e0'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444',
                        font: {
                            weight: 'bold'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e0e0e0'
                    }
                }
            }
        }
    });
}


function renderOrdersStatusChart(stats) {
    const ctx = document.getElementById('orders-status-chart');
    
    if (!ctx) {
        console.error('Elemento canvas no encontrado para orders-status-chart');
        return;
    }
    
    // Destruir gráfico existente si hay uno
    if (window.ordersStatusChart) {
        window.ordersStatusChart.destroy();
    }
    
    // Colores vibrantes para el gráfico de doughnut
    const backgroundColors = [
        '#FF9F0D', // Pendientes - Naranja intenso
        '#3498DB', // Procesando - Azul intenso
        '#2ECC71', // Enviados - Verde intenso
        '#9B59B6', // Entregados - Púrpura intenso
        '#E74C3C'  // Cancelados - Rojo intenso
    ];
    
    const borderColors = [
        '#E67E22', // Pendientes - Naranja oscuro
        '#2980B9', // Procesando - Azul oscuro
        '#27AE60', // Enviados - Verde oscuro
        '#8E44AD', // Entregados - Púrpura oscuro
        '#C0392B'  // Cancelados - Rojo oscuro
    ];
    
    const hoverBackgroundColors = [
        '#FFB143', // Pendientes - Naranja claro
        '#5DADE2', // Procesando - Azul claro
        '#58D68D', // Enviados - Verde claro
        '#BB8FCE', // Entregados - Púrpura claro
        '#F1948A'  // Cancelados - Rojo claro
    ];
    
    window.ordersStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Procesando', 'Enviados', 'Entregados', 'Cancelados'],
            datasets: [{
                data: [
                    stats.pending_orders || 0,
                    stats.processing_orders || 0,
                    stats.shipped_orders || 0,
                    stats.delivered_orders || 0,
                    stats.cancelled_orders || 0
                ],
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverBackgroundColor: hoverBackgroundColors
            }]
        },
        options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
                font: {
                    size: 12,
                    weight: 'bold'
                }
            }
        },
        title: {
            display: true,
            text: 'Estados de Pedidos',
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
            font: {
                size: 16,
                weight: 'bold'
            }
        },
        // Añadir etiquetas de datos con mejor contraste
        datalabels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
            font: {
                weight: 'bold',
                size: 12
            },
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.map(data => {
                    sum += data;
                });
                let percentage = (value*100 / sum).toFixed(2)+"%";
                return percentage;
            }
        }
    }
}
    });
}



// ✅ FUNCIÓN CORREGIDA: Gráfico de ventas con navegación por periodos
function renderWeeklySalesChart(salesData) {
    console.log("Renderizando gráfico de ventas semanales con datos:", salesData);
    
    const ctx = document.getElementById('weekly-sales-chart');
    
    if (!ctx) {
        console.error('Elemento canvas no encontrado para weekly-sales-chart');
        return;
    }

    // Destruir gráfico existente si hay uno
    if (window.weeklySalesChart) {
        window.weeklySalesChart.destroy();
    }
    
    // Si no hay datos o el array está vacío, usar datos de ejemplo
    if (!salesData || salesData.length === 0 || !Array.isArray(salesData)) {
        console.warn("No se recibieron datos válidos del backend, usando datos de ejemplo");
        
        // Crear datos de ejemplo basados en los últimos 7 días
        const today = new Date();
        salesData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNumber = date.getDate();
            const month = date.toLocaleDateString('es-ES', { month: 'short' });
            
            salesData.push({
                day: `${dayName} ${dayNumber} ${month}`,
                sales: Math.floor(Math.random() * 100) + 50 // Valor aleatorio entre 50 y 150
            });
        }
    }
    
    // CORRECCIÓN: Verificar que los datos tengan el formato correcto
    // Ahora permite que sales sea 0 (que es un valor válido)
    if (!salesData[0].day || typeof salesData[0].sales === 'undefined' || salesData[0].sales === null) {
        console.error("Los datos no tienen el formato esperado:", salesData);
        ctx.parentElement.innerHTML = '<p class="no-data">Formato de datos incorrecto</p>';
        return;
    }
    
    // Preparar los datos y etiquetas para Chart.js
    const labels = salesData.map(d => d.day);
    const data = salesData.map(d => d.sales);

    window.weeklySalesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas',
                data: data,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#FF7700',
                backgroundColor: 'rgba(255, 119, 0, 0.2)',
                tension: 0.4,
                pointBackgroundColor: data.map(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#E05D00'
),

                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#E05D00',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 20, // Espacio adicional para las etiquetas
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Ventas por Fecha',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#222',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `Ventas: $${context.raw}`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444',
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: 'Ventas ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444',
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 10
                        },
                        padding: 5,
                        callback: function(value, index, values) {
                            // Acortar etiquetas largas
                            const label = this.getLabelForValue(value);
                            if (label.length > 8) {
                                return label.substring(0, 8) + '...';
                            }
                            return label;
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: 'Fechas',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#444',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });

    // =====================
    // Parpadeo en día actual
    // =====================
    // Construir el formato de hoy EXACTAMENTE como lo manda el backend
    const today = new Date();
    const dayName = today.toLocaleDateString('es-ES', { weekday: 'short' });
    const dayNumber = today.toLocaleDateString('es-ES', { day: '2-digit' });
    const month = today.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    
    // Asegurar mayúscula inicial en el día y mes
    const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    
    // Formato final: "Mar 16 Sep"
    const todayLabel = `${formattedDay} ${parseInt(dayNumber)} ${formattedMonth}`;
    
    console.log("Labels recibidas:", labels);
    console.log("Hoy formateado según backend:", todayLabel);
    
    // Buscar índice en labels
    const todayIndex = labels.findIndex(label => label.startsWith(formattedDay));
    
    console.log("Índice encontrado:", todayIndex);
    
    if (todayIndex !== -1) {
      setInterval(() => {
        if (!window.weeklySalesChart) return;
        const dataset = window.weeklySalesChart.data.datasets[0];
        const initialColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#E05D00';
        const highlightColor = '#fff';
    
        dataset.pointBackgroundColor[todayIndex] =
          dataset.pointBackgroundColor[todayIndex] === initialColor
            ? highlightColor
            : initialColor;
    
        window.weeklySalesChart.update();
      }, 500);
    } else {
      console.warn("⚠️ No se encontró índice para el día actual en labels.");
    }
    // =====================
    // Parpadeo en día actual
    // =====================


    // ✅ Añadir event listeners para el pan sin modifierKey (SOLO UNA VEZ)
    let isMouseDown = false;
    let startX, startY;
    
    ctx.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.clientX;
        startY = e.clientY;
    });
    
    window.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isMouseDown || !window.weeklySalesChart) return;
        
        const deltaX = e.clientX - startX;
        // Solo hacer pan horizontal si el movimiento es principalmente horizontal
        if (Math.abs(deltaX) > Math.abs(e.clientY - startY)) {
            window.weeklySalesChart.pan({x: -deltaX * 2});
            startX = e.clientX;
            startY = e.clientY;
        }
    });

    // ✅ Soporte para dispositivos táctiles (SOLO UNA VEZ)
    ctx.addEventListener('touchstart', (e) => {
        isMouseDown = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    ctx.addEventListener('touchmove', (e) => {
        if (!isMouseDown || !window.weeklySalesChart) return;
        
        const deltaX = e.touches[0].clientX - startX;
        window.weeklySalesChart.pan({x: -deltaX * 2});
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    ctx.addEventListener('touchend', () => {
        isMouseDown = false;
    });
    
    console.log("Gráfico de ventas semanales renderizado correctamente");
} 
// FIN de la función - NO agregar más código aquí

//-------------------------------------------------------
// Funciones para navegación de semanas (agrega esto después de las otras funciones)
// Funciones para navegación de semanas
function changeWeek(offset) {
    currentWeekOffset += offset;
    loadDashboard();
}

function updateWeekDisplay() {
    const weekDisplay = document.getElementById('week-display');
    if (!weekDisplay) return;
    
    if (currentWeekOffset === 0) {
        weekDisplay.textContent = "Semana actual";
    } else if (currentWeekOffset === -1) {
        weekDisplay.textContent = "Semana anterior";
    } else if (currentWeekOffset === 1) {
        weekDisplay.textContent = "Semana siguiente";
    } else if (currentWeekOffset < 0) {
        weekDisplay.textContent = `Hace ${Math.abs(currentWeekOffset)} semanas`;
    } else {
        weekDisplay.textContent = `En ${currentWeekOffset} semanas`;
    }
}
//---------------------------------------------------------

// Gestión de Pedidos
async function loadOrders(page = 1, status = '') {
    try {
        const url = new URL(`${API_BASE_URL}/orders`);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', 10);
        if (status) url.searchParams.append('status', status);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error cargando pedidos');
        
        const data = await response.json();
        ordersData = data.orders;
        
        renderOrdersTable(ordersData);
        updatePaginationControls(data.pagination);
    } catch (error) {
        console.error('Error:', error);
        alert('Error cargando pedidos');
    }
}

function renderOrdersTable(orders) {
    ordersTableBody.innerHTML = '';
    
    if (orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    No hay pedidos para mostrar
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>
                <div><strong>${order.customer_name}</strong></div>
                <div>${order.customer_email}</div>
            </td>
            <td>${order.items.length} producto(s)</td>
            <td>$${order.total}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary btn-sm view-order" data-id="${order.id}">
                    Ver
                </button>
            </td>
        `;
        
        ordersTableBody.appendChild(row);
    });
    
    // Agregar event listeners a los botones de ver
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            showOrderDetails(orderId);
        });
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    
    return statusMap[status] || status;
}

function updatePaginationControls(pagination) {
    currentPage = pagination.currentPage;
    currentPageElement.textContent = `Página ${currentPage} de ${pagination.totalPages}`;
    
    prevPageBtn.disabled = !pagination.hasPrev;
    nextPageBtn.disabled = !pagination.hasNext;
}

// FUNCIONES DE PRODUCTOS Y CLIENTES
async function loadProducts() {
    try {
        // 1. Obtener el token del localStorage
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('No se encontró el token de autenticación. Redirigiendo...');
            window.location.href = 'index.html';
            return;
        }

        // 2. Hacer la petición con el encabezado de autorización
        const response = await fetch(`${API_BASE_URL}/admin/products`, {
            headers: {
                'Authorization': `Bearer ${token}` // <-- ¡ESTO ES LO QUE FALTA!
            }
        });

        if (!response.ok) {
            throw new Error('Error cargando productos');
        }
        
        const products = await response.json();
        renderProductsGrid(products);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('products-grid').innerHTML = `
            <div class="error-message">
                Error cargando productos: ${error.message}
            </div>
        `;
    }
}

// Gestión de Clientes (CÓDIGO CORREGIDO)
async function loadCustomers() {
    try {
        // 1. Obtener el token del localStorage
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('No se encontró el token de autenticación. Redirigiendo...');
            window.location.href = 'index.html';
            return;
        }

        // 2. Hacer la petición con el encabezado de autorización
        const response = await fetch(`${API_BASE_URL}/admin/customers`, {
            headers: {
                'Authorization': `Bearer ${token}` // <-- ¡ESTO ES LO QUE FALTA!
            }
        });

        if (!response.ok) {
            throw new Error('Error cargando clientes');
        }
        
        customersData = await response.json();
        renderCustomersTable(customersData);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('customers-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    Error cargando clientes: ${error.message}
                </td>
            </tr>
        `;
    }
}

function renderProductsGrid(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p class="no-data">No hay productos registrados</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-header">
                <h3>${product.name}</h3>
                <span class="product-price">$${product.price}</span>
            </div>
            <div class="product-stats">
                <div class="stat">
                    <span class="stat-label">Stock:</span>
                    <span class="stat-value">${product.stock}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Vendidos:</span>
                    <span class="stat-value highlight">${product.sold_count}</span>
                </div>
            </div>
            <div class="product-footer">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((product.sold_count / product.stock) * 100, 100)}%"></div>
                </div>
                <span class="sales-ratio">${Math.round((product.sold_count / product.stock) * 100)}% vendido</span>
            </div>
        </div>
    `).join('');
}

function viewCustomer(email) {
    const customer = customersData.find(c => c.email === email);
    
    if (!customer) {
        alert('Cliente no encontrado');
        return;
    }
    
    const modalHtml = `
        <div class="modal" id="customer-detail-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalles del Cliente</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="customer-detail-section">
                        <h3>Información Personal</h3>
                        <p><strong>Nombre:</strong> ${customer.name}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Teléfono:</strong> ${customer.phone || 'No proporcionado'}</p>
                    </div>
                    
                    <div class="customer-detail-section">
                        <h3>Estadísticas de Compras</h3>
                        <p><strong>Total de pedidos:</strong> ${customer.order_count}</p>
                        <p><strong>Total gastado:</strong> $${parseFloat(customer.total_spent || 0).toFixed(2)}</p>
                        <p><strong>Ticket promedio:</strong> $${parseFloat((customer.total_spent || 0) / customer.order_count).toFixed(2)}</p>
                    </div>
                    
                    <div class="customer-detail-section">
                        <h3>Acciones</h3>
                        <button class="btn btn-primary view-orders-btn" data-email="${customer.email}">Ver historial de pedidos</button>
                        <button class="btn contact-btn" data-email="${customer.email}">Contactar cliente</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('customer-detail-modal');
    modal.classList.add('show');
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    const viewOrdersBtn = modal.querySelector('.view-orders-btn');
    const contactBtn = modal.querySelector('.contact-btn');
    
    viewOrdersBtn.addEventListener('click', function() {
        const customerEmail = this.getAttribute('data-email');
        viewCustomerOrders(customerEmail);
    });
    
    contactBtn.addEventListener('click', function() {
        const customerEmail = this.getAttribute('data-email');
        contactCustomer(customerEmail);
    });
}

function viewCustomerOrders(email) {
    alert(`Mostrar pedidos del cliente: ${email}`);
}

function contactCustomer(email) {
    alert(`Contactar al cliente: ${email}`);
}

function renderCustomersTable(customers) {
    const customersTableBody = document.getElementById('customers-table-body');
    
    if (!customers || customers.length === 0) {
        customersTableBody.innerHTML = `
            <tr>
                <td colspan="6">No hay clientes registrados</td>
            </tr>
        `;
        return;
    }
    
    customersTableBody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'No proporcionado'}</td>
            <td>${customer.order_count}</td>
            <td>$${customer.total_spent || 0}</td>
            <td>
                <button class="btn btn-sm btn-view" data-email="${customer.email}">
                    <i class='bx bx-show'></i> Ver
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal de Detalles de Pedido
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('Error cargando detalles del pedido');
        
        const order = await response.json();
        currentOrderId = orderId;
        
        // Actualizar modal con datos del pedido
        document.getElementById('modal-order-id').textContent = orderId;
        
        // Información del cliente
        document.getElementById('customer-details').innerHTML = `
            <p><strong>Nombre:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email}</p>
            <p><strong>Teléfono:</strong> ${order.customer_phone}</p>
            <p><strong>Dirección:</strong> ${order.customer_address}, ${order.customer_city}, ${order.customer_postal_code}</p>
        `;
        
        // Productos del pedido
        const itemsHtml = order.items.map(item => `
            <div class="order-item-detail">
                <p><strong>${item.quantity}x ${item.name}</strong> - $${item.price} c/u</p>
                <p>Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `).join('');
        
        document.getElementById('order-items-details').innerHTML = itemsHtml;
        
        // Estado actual
        orderStatusSelect.value = order.status;
        
        // Mostrar modal
        orderDetailModal.classList.add('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Error cargando detalles del pedido');
    }
}

async function updateOrderStatus() {
    try {
        const newStatus = orderStatusSelect.value;
        
        const response = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Error actualizando estado');
        
        const updatedOrder = await response.json();
        
        // Actualizar UI
        alert('Estado actualizado correctamente');
        orderDetailModal.classList.remove('show');
        loadOrders(currentPage, currentStatusFilter);
        
        // Si estamos en el dashboard, actualizarlo también
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error actualizando estado del pedido');
    }
}

// Event Listeners
function setupEventListeners() {

    // Toggle del tema
    themeToggle.addEventListener('click', toggleTheme);

    // Filtro de estado
    statusFilter.addEventListener('change', () => {
        currentStatusFilter = statusFilter.value;
        loadOrders(1, currentStatusFilter);
    });
    
    // Paginación
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadOrders(currentPage - 1, currentStatusFilter);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        loadOrders(currentPage + 1, currentStatusFilter);
    });
    
    // Modal
    closeModalBtn.addEventListener('click', () => {
        orderDetailModal.classList.remove('show');
    });
    
    orderDetailModal.addEventListener('click', (e) => {
        if (e.target === orderDetailModal) {
            orderDetailModal.classList.remove('show');
        }
    });

    // Event delegation para botones de ver cliente
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view') || e.target.closest('.btn-view')) {
            const btn = e.target.classList.contains('btn-view') ? e.target : e.target.closest('.btn-view');
            const email = btn.getAttribute('data-email');
            viewCustomer(email);
        }
    });
    
    // Actualizar estado
    updateStatusBtn.addEventListener('click', updateOrderStatus);

    // Cerrar sesión
    logoutBtn.addEventListener('click', logout);

    // En la función setupEventListeners(), agrega:
    document.getElementById('prev-week')?.addEventListener('click', () => {
        changeWeek(-1);
    });

    document.getElementById('next-week')?.addEventListener('click', () => {
        changeWeek(1);
    });
    
}