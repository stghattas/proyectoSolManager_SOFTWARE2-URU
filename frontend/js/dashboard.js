// dashboard.js - Panel con carga de módulos según rol
import { getCurrentUser, logout } from './modules/auth.js';
import { getProducts, apiFetch } from './utils/api.js';

const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const btnLogout = document.getElementById('btnLogout');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const body = document.body;
const btnBack = document.getElementById('btnBack');
const searchGroup = document.getElementById('searchGroup');

const viewHome = document.getElementById('view-home');
const viewCatalog = document.getElementById('view-catalog');
const viewCart = document.getElementById('view-cart');
const viewOrders = document.getElementById('view-orders');
const viewDelivery = document.getElementById('view-delivery');
const viewConfig = document.getElementById('view-config');
const viewAdminProducts = document.getElementById('view-admin-products');
const viewAdminAlmacenes = document.getElementById('view-admin-almacenes');
const viewAdminProveedores = document.getElementById('view-admin-proveedores');
const viewAdminReportes = document.getElementById('view-admin-reportes');
const viewMovements = document.getElementById('view-warehouse-movements');
const viewPurchases = document.getElementById('view-warehouse-purchases');
const viewAdjustments = document.getElementById('view-warehouse-adjustments');
const viewCashierPOS = document.getElementById('view-cashier-pos');
const viewDeliveryList = document.getElementById('view-delivery-list');

const menuHome = document.getElementById('menu-home');
const menuCatalog = document.getElementById('menu-catalog');
const menuCart = document.getElementById('menu-cart');
const menuOrders = document.getElementById('menu-orders');
const menuDelivery = document.getElementById('menu-delivery');
const menuConfig = document.getElementById('menu-config');
const menuAdminProducts = document.getElementById('menu-admin-products');
const menuAdminAlmacenes = document.getElementById('menu-admin-almacenes');
const menuAdminProveedores = document.getElementById('menu-admin-proveedores');
const menuAdminReportes = document.getElementById('menu-admin-reportes');
const menuMovements = document.getElementById('menu-warehouse-movements');
const menuPurchases = document.getElementById('menu-warehouse-purchases');
const menuAdjustments = document.getElementById('menu-warehouse-adjustments');
const menuCashierPOS = document.getElementById('menu-cashier-pos');
const menuDeliveryList = document.getElementById('menu-delivery-list');

let clienteModule = null;
let almacenistaModule = null;
let gerenteModule = null;
let cajeroModule = null;
let repartidorModule = null;

let currentUser = null;
let viewHistory = [];

async function checkSession() {
  const user = getCurrentUser();
  if (!user) {
    alert('Sesión no válida');
    window.location.href = '/pages/index.html';
    return;
  }
  currentUser = user;
  window.currentUserId = user.id_usuario || 0;
  sidebarUserName.textContent = user.name || user.email;
  sidebarUserRole.textContent = `Rol: ${user.role || 'cliente'}`;

  const role = user.role || 'cliente';
  const allowedViews = {
    cliente: ['home', 'catalog', 'cart', 'orders', 'delivery', 'config'],
    cajero:  ['cashier-pos'],
    almacenista: ['admin-products', 'admin-almacenes', 'admin-proveedores',
                  'warehouse-movements', 'warehouse-purchases', 'warehouse-adjustments'],
    gerente: ['home', 'catalog', 'cart', 'orders', 'delivery', 'config',
              'admin-products', 'admin-almacenes', 'admin-proveedores', 'admin-reportes',
              'warehouse-movements', 'warehouse-purchases', 'warehouse-adjustments'],
    repartidor: ['delivery-list']
  };
  window.allowedViews = allowedViews[role] || allowedViews.cliente;

  const allMenus = [menuHome, menuCatalog, menuCart, menuOrders, menuDelivery, menuConfig,
    menuAdminProducts, menuAdminAlmacenes, menuAdminProveedores, menuAdminReportes,
    menuMovements, menuPurchases, menuAdjustments, menuCashierPOS, menuDeliveryList];
  allMenus.forEach(m => { if (m) m.style.display = 'none'; });
  window.allowedViews.forEach(view => {
    switch(view) {
      case 'home': menuHome.style.display = 'flex'; break;
      case 'catalog': menuCatalog.style.display = 'flex'; break;
      case 'cart': menuCart.style.display = 'flex'; break;
      case 'orders': menuOrders.style.display = 'flex'; break;
      case 'delivery': menuDelivery.style.display = 'flex'; break;
      case 'config': menuConfig.style.display = 'flex'; break;
      case 'admin-products': menuAdminProducts.style.display = 'flex'; break;
      case 'admin-almacenes': menuAdminAlmacenes.style.display = 'flex'; break;
      case 'admin-proveedores': menuAdminProveedores.style.display = 'flex'; break;
      case 'admin-reportes': menuAdminReportes.style.display = 'flex'; break;
      case 'warehouse-movements': menuMovements.style.display = 'flex'; break;
      case 'warehouse-purchases': menuPurchases.style.display = 'flex'; break;
      case 'warehouse-adjustments': menuAdjustments.style.display = 'flex'; break;
      case 'cashier-pos': menuCashierPOS.style.display = 'flex'; break;
      case 'delivery-list': menuDeliveryList.style.display = 'flex'; break;
    }
  });

  if (window.allowedViews.includes('home') || window.allowedViews.includes('catalog')) {
    const module = await import('./modules/cliente.js');
    clienteModule = module;
    module.initCliente({
      elements: {
        productGridContainer: document.getElementById('productGridContainer'),
        catalogProductGrid: document.getElementById('catalogProductGrid'),
        catalogCategories: document.getElementById('catalogCategories'),
        cartTableBody: document.getElementById('cartTableBody'),
        summarySubtotal: document.getElementById('summarySubtotal'),
        summaryTotalUSD: document.getElementById('summaryTotalUSD'),
        summaryTotalVES: document.getElementById('summaryTotalVES'),
        ordersContainer: document.getElementById('ordersContainer'),
        ordersFilter: document.getElementById('ordersFilter'),
        modal: document.getElementById('productDetailModal'),
        closeModal: document.getElementById('closeModal'),
        detailName: document.getElementById('detailName'),
        detailUnit: document.getElementById('detailUnit'),
        detailPrice: document.getElementById('detailPrice'),
        detailAddToCart: document.getElementById('detailAddToCart'),
        btnCheckout: document.getElementById('btnCheckout'),
        catalogSearch: document.getElementById('catalogSearch'),
        catalogSort: document.getElementById('catalogSort'),
        catalogCount: document.getElementById('catalogCount'),
        configElements: {
          configName: document.getElementById('configName'),
          configPhone: document.getElementById('configPhone'),
          configAddress: document.getElementById('configAddress'),
          configNotifOffers: document.getElementById('configNotifOffers'),
          configNotifOrders: document.getElementById('configNotifOrders'),
          configCurrentPassword: document.getElementById('configCurrentPassword'),
          configNewPassword: document.getElementById('configNewPassword'),
          configConfirmPassword: document.getElementById('configConfirmPassword'),
          btnSaveProfile: document.getElementById('btnSaveProfile'),
          btnChangePassword: document.getElementById('btnChangePassword'),
          btnSaveNotifications: document.getElementById('btnSaveNotifications')
        },
        paymentModal: document.getElementById('paymentModal'),
        closePaymentModal: document.getElementById('closePaymentModal'),
        paymentAddress: document.getElementById('paymentAddress'),
        paymentMethodSelect: document.getElementById('paymentMethodSelect'),
        pagoMovilFields: document.getElementById('pagoMovilFields'),
        transferenciaFields: document.getElementById('transferenciaFields'),
        tarjetaFields: document.getElementById('tarjetaFields'),
        pmBanco: document.getElementById('pmBanco'),
        pmTelefono: document.getElementById('pmTelefono'),
        pmCedula: document.getElementById('pmCedula'),
        transfBanco: document.getElementById('transfBanco'),
        transfReferencia: document.getElementById('transfReferencia'),
        tarjetaNumero: document.getElementById('tarjetaNumero'),
        tarjetaTitular: document.getElementById('tarjetaTitular'),
        tarjetaVencimiento: document.getElementById('tarjetaVencimiento'),
        tarjetaCVV: document.getElementById('tarjetaCVV'),
        btnConfirmPayment: document.getElementById('btnConfirmPayment'),
        paymentMsg: document.getElementById('paymentMsg'),
        paymentSummary: document.getElementById('paymentSummary')
      }
    });
  }

  if (window.allowedViews.includes('admin-products') || window.allowedViews.includes('warehouse-movements')) {
    const almacenModule = await import('./modules/almacenista.js');
    almacenistaModule = almacenModule;
    almacenModule.initAlmacenista({
      adminProductGrid: document.getElementById('adminProductGrid'),
      btnAddProduct: document.getElementById('btnAddProduct'),
      adminAlmacenList: document.getElementById('adminAlmacenList'),
      btnAddAlmacen: document.getElementById('btnAddAlmacen'),
      adminProveedorList: document.getElementById('adminProveedorList'),
      btnAddProveedor: document.getElementById('btnAddProveedor'),
      movementsContainer: document.getElementById('movementsContainer'),
      adjustProduct: document.getElementById('adjustProduct'),
      adjustWarehouse: document.getElementById('adjustWarehouse'),
      adjustmentForm: document.getElementById('adjustmentForm'),
      adjustmentResult: document.getElementById('adjustmentResult'),
      purchasesContainer: document.getElementById('purchasesContainer'),
      btnNewPurchase: document.getElementById('btnNewPurchase')
    });
  }

  if (role === 'gerente') {
    const gerenteMod = await import('./modules/gerente.js');
    gerenteModule = gerenteMod;
    gerenteMod.initGerente({ reportesContainer: document.getElementById('reportesContainer') });
  }

  if (role === 'cajero') {
    const cajeroMod = await import('./modules/cajero.js');
    cajeroModule = cajeroMod;
    cajeroMod.initCajero({
      posProductSearch: document.getElementById('posProductSearch'),
      posProductList: document.getElementById('posProductList'),
      posCartBody: document.getElementById('posCartBody'),
      posTotalUSD: document.getElementById('posTotalUSD'),
      posTotalVES: document.getElementById('posTotalVES'),
      btnCheckoutPOS: document.getElementById('btnCheckoutPOS'),
      posOrdersContainer: document.getElementById('posOrdersContainer'),
      posPaymentMethod: document.getElementById('posPaymentMethod'),
      posCashReceived: document.getElementById('posCashReceived'),
      posChangeDue: document.getElementById('posChangeDue')
    });
  }

  if (role === 'repartidor') {
    const repartidorMod = await import('./modules/repartidor.js');
    repartidorModule = repartidorMod;
    repartidorMod.initRepartidor({ deliveriesContainer: document.getElementById('deliveriesContainer') });
  }

  const defaultView = window.allowedViews.includes('home') ? 'home' : window.allowedViews[0];
  showView(defaultView);
}

function showView(view) {
  if (!window.allowedViews || !window.allowedViews.includes(view)) {
    view = window.allowedViews.includes('home') ? 'home' : window.allowedViews[0];
    if (!view) return;
  }
  if (viewHistory.length === 0 || viewHistory[viewHistory.length-1] !== view) viewHistory.push(view);

  [viewHome, viewCatalog, viewCart, viewOrders, viewDelivery, viewConfig,
   viewAdminProducts, viewAdminAlmacenes, viewAdminProveedores, viewAdminReportes,
   viewMovements, viewPurchases, viewAdjustments, viewCashierPOS, viewDeliveryList].forEach(v => { if (v) v.style.display = 'none'; });

  [menuHome, menuCatalog, menuCart, menuOrders, menuDelivery, menuConfig,
   menuAdminProducts, menuAdminAlmacenes, menuAdminProveedores, menuAdminReportes,
   menuMovements, menuPurchases, menuAdjustments, menuCashierPOS, menuDeliveryList].forEach(m => { if (m) m.classList.remove('active'); });

  switch(view) {
    case 'home': viewHome.style.display = 'block'; menuHome.classList.add('active'); break;
    case 'catalog': viewCatalog.style.display = 'block'; menuCatalog.classList.add('active'); break;
    case 'cart': viewCart.style.display = 'block'; menuCart.classList.add('active'); if (clienteModule) clienteModule.renderCart(); break;
    case 'orders': viewOrders.style.display = 'block'; menuOrders.classList.add('active'); if (clienteModule) clienteModule.renderOrders(); break;
    case 'delivery': viewDelivery.style.display = 'block'; menuDelivery.classList.add('active'); break;
    case 'config': viewConfig.style.display = 'block'; menuConfig.classList.add('active'); break;
    case 'admin-products': viewAdminProducts.style.display = 'block'; menuAdminProducts.classList.add('active'); break;
    case 'admin-almacenes': viewAdminAlmacenes.style.display = 'block'; menuAdminAlmacenes.classList.add('active'); break;
    case 'admin-proveedores': viewAdminProveedores.style.display = 'block'; menuAdminProveedores.classList.add('active'); break;
    case 'admin-reportes': viewAdminReportes.style.display = 'block'; menuAdminReportes.classList.add('active'); break;
    case 'warehouse-movements': viewMovements.style.display = 'block'; menuMovements.classList.add('active'); if (almacenistaModule) almacenistaModule.loadMovements(); break;
    case 'warehouse-purchases': viewPurchases.style.display = 'block'; menuPurchases.classList.add('active'); if (almacenistaModule) almacenistaModule.loadPurchases(); break;
    case 'warehouse-adjustments': viewAdjustments.style.display = 'block'; menuAdjustments.classList.add('active'); break;
    case 'cashier-pos': viewCashierPOS.style.display = 'block'; menuCashierPOS.classList.add('active'); break;
    case 'delivery-list': viewDeliveryList.style.display = 'block'; menuDeliveryList.classList.add('active'); break;
  }

  if (view === 'home') {
    searchGroup.style.display = 'flex'; btnBack.style.display = 'none'; themeToggle.style.display = 'inline-block';
  } else {
    searchGroup.style.display = 'none'; btnBack.style.display = 'inline-block'; themeToggle.style.display = 'inline-block';
  }
}

btnBack.addEventListener('click', () => {
  if (viewHistory.length > 1) { viewHistory.pop(); showView(viewHistory[viewHistory.length-1]); }
  else showView('home');
});

menuHome?.addEventListener('click', () => showView('home'));
menuCatalog?.addEventListener('click', () => showView('catalog'));
menuCart?.addEventListener('click', () => showView('cart'));
menuOrders?.addEventListener('click', () => showView('orders'));
menuDelivery?.addEventListener('click', () => showView('delivery'));
menuConfig?.addEventListener('click', () => showView('config'));
menuAdminProducts?.addEventListener('click', () => showView('admin-products'));
menuAdminAlmacenes?.addEventListener('click', () => showView('admin-almacenes'));
menuAdminProveedores?.addEventListener('click', () => showView('admin-proveedores'));
menuAdminReportes?.addEventListener('click', () => showView('admin-reportes'));
menuMovements?.addEventListener('click', () => showView('warehouse-movements'));
menuPurchases?.addEventListener('click', () => showView('warehouse-purchases'));
menuAdjustments?.addEventListener('click', () => showView('warehouse-adjustments'));
menuCashierPOS?.addEventListener('click', () => showView('cashier-pos'));
menuDeliveryList?.addEventListener('click', () => showView('delivery-list'));

function handleSearch() {
  const text = searchInput.value.trim().toLowerCase();
  if (clienteModule) {
    const filtered = clienteModule.getProductList().filter(p => p.name.toLowerCase().includes(text));
    clienteModule.renderHomeProducts(filtered);
    showView('home');
  }
}
btnSearch?.addEventListener('click', handleSearch);
searchInput?.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleSearch(); });

btnLogout?.addEventListener('click', logout);

function applyTheme(theme) {
  if (theme === 'dark') { body.classList.add('dark'); themeToggle.textContent = '☀️ Modo claro'; }
  else { body.classList.remove('dark'); themeToggle.textContent = '🌙 Modo oscuro'; }
  localStorage.setItem('solAuthTheme', theme);
}
applyTheme(localStorage.getItem('solAuthTheme') || 'light');
themeToggle?.addEventListener('click', () => applyTheme(body.classList.contains('dark') ? 'light' : 'dark'));

checkSession();