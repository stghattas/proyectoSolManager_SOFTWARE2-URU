const database = {
  "products": [
    { "id": 1, "name": "Guineo", "unit": "1 bulto ≈ 20 kg", "priceUSD": 12.50, "priceVES": 531.25, "icon": "🍌" },
    { "id": 2, "name": "Carne de res", "unit": "kg", "priceUSD": 7.50, "priceVES": 318.75, "icon": "🥩" },
    { "id": 3, "name": "Leche evaporada", "unit": "lata", "priceUSD": 1.53, "priceVES": 65.03, "icon": "🥫" },
    { "id": 4, "name": "Harina PAN", "unit": "1 bulto (10kg)", "priceUSD": 15.00, "priceVES": 637.50, "icon": "🌽" },
    { "id": 5, "name": "Queso blanco", "unit": "kg", "priceUSD": 4.50, "priceVES": 191.25, "icon": "🧀" },
    { "id": 6, "name": "Pollo entero", "unit": "kg", "priceUSD": 3.20, "priceVES": 136.00, "icon": "🍗" }
  ]
};

// Elementos del DOM Existentes
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const adminPanelArea = document.getElementById('adminPanelArea');
const productGridContainer = document.getElementById('productGridContainer');
const btnLogout = document.getElementById('btnLogout');
const themeToggleBtn = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const body = document.body;

// Elementos de Navegación del Menú y Vistas
const btnHome = document.getElementById('menu-home');
const btnCart = document.getElementById('menu-cart');
const btnCatalog = document.getElementById('menu-catalog');

const viewHome = document.getElementById('view-home');
const viewCart = document.getElementById('view-cart');
const viewCatalog = document.getElementById('view-catalog');

let currentUser = null;

// ==========================================================================
// 1. CONTROLADOR DE CAMBIO DE VISTAS (SPA)
// ==========================================================================
function showView(targetView) {
  // Ocultar todas las vistas primero
  viewHome.style.display = 'none';
  viewCart.style.display = 'none';
  viewCatalog.style.display = 'none';

  // Desactivar todos los botones del menú
  btnHome.classList.remove('active');
  btnCart.classList.remove('active');
  btnCatalog.classList.remove('active');

  // Activar solo la seleccionada
  if (targetView === 'home') {
    viewHome.style.display = 'block';
    btnHome.classList.add('active');
  } else if (targetView === 'cart') {
    viewCart.style.display = 'block';
    btnCart.classList.add('active');
  } else if (targetView === 'catalog') {
    viewCatalog.style.display = 'block';
    btnCatalog.classList.add('active');
  }
}

// Asignar los eventos de clic a las pestañas del Sidebar
btnHome.addEventListener('click', () => showView('home'));
btnCart.addEventListener('click', () => showView('cart'));
btnCatalog.addEventListener('click', () => showView('catalog'));

// ==========================================================================
// 2. Verificar Sesión al cargar la página
// ==========================================================================
function checkSession() {
  const sessionData = localStorage.getItem('solUserSession');
  
  if (!sessionData) {
    alert('No has iniciado sesión. Redirigiendo...');
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = JSON.parse(sessionData);
  
  sidebarUserName.textContent = currentUser.name || currentUser.email;
  sidebarUserRole.textContent = `Rol: ${currentUser.role || 'cliente'}`;
  
  if (currentUser.role === 'admin') {
    adminPanelArea.style.display = 'flex';
  }
  
  renderProducts(database.products);
}

// ==========================================================================
// 3. Renderizar los Productos dinámicamente según el Rol
// ==========================================================================
function renderProducts(productsList) {
  productGridContainer.innerHTML = '';
  
  if (productsList.length === 0) {
    productGridContainer.innerHTML = '<p style="color: var(--color-text-light); grid-column: 1/-1; text-align: center; padding: 2rem;">No se encontraron productos.</p>';
    return;
  }

  productsList.forEach(product => {
    let actionButtonsHTML = '';
    
    if (currentUser && currentUser.role === 'admin') {
      actionButtonsHTML = `
        <div class="admin-card-buttons">
          <button class="btn-action-card btn-admin-edit" onclick="alert('Editar ${product.name}')">Editar</button>
          <button class="btn-action-card btn-admin-delete" onclick="alert('Borrar ${product.name}')">Borrar</button>
        </div>
      `;
    } else {
      actionButtonsHTML = `
        <button class="btn-action-card btn-add-cart" onclick="alert('¡Añadido al carrito: ${product.name}!')">
          ➕ Agregar al carrito
        </button>
      `;
    }

    const cardHTML = `
      <div class="product-card">
        <div class="product-image-placeholder">
          ${product.icon}
        </div>
        <div class="product-info">
          <div class="product-title">${product.name}</div>
          <div class="product-unit">📦 ${product.unit}</div>
          <div class="product-prices">
            <div class="price-usd">$${product.priceUSD.toFixed(2)} USD</div>
            <div class="price-ves">Bs. ${product.priceVES.toFixed(2)} VES</div>
          </div>
        </div>
        ${actionButtonsHTML}
      </div>
    `;
    
    productGridContainer.innerHTML += cardHTML;
  });
}

// ==========================================================================
// 4. Lógica de Búsqueda / Filtro de Productos
// ==========================================================================
function handleSearch() {
  showView('home'); // Al buscar, regresa automáticamente al home
  const text = searchInput.value.trim().toLowerCase();
  const filtered = database.products.filter(p => p.name.toLowerCase().includes(text));
  renderProducts(filtered);
}

btnSearch.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ==========================================================================
// 5. Gestión del Cierre de Sesión
// ==========================================================================
btnLogout.addEventListener('click', () => {
  localStorage.removeItem('solUserSession');
  window.location.href = 'index.html';
});

// ==========================================================================
// 6. Sincronización del Modo Oscuro/Claro
// ==========================================================================
function applyTheme(theme) {
  if (theme === 'dark') {
    body.classList.add('dark');
    themeToggleBtn.innerHTML = 'Modo claro';
  } else {
    body.classList.remove('dark');
    themeToggleBtn.innerHTML = 'Modo oscuro';
  }
  localStorage.setItem('solAuthTheme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(newTheme);
});

// Inicialización general
const savedTheme = localStorage.getItem('solAuthTheme') || 'light';
applyTheme(savedTheme);
checkSession();