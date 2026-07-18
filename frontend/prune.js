const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const filesConfig = {
  'gerente.html': {
    menus: ['menu-admin-products', 'menu-admin-almacenes', 'menu-admin-proveedores', 'menu-admin-reportes', 'menu-admin-users', 'menu-admin-devoluciones', 'menu-config'],
    views: ['view-admin-products', 'view-admin-almacenes', 'view-admin-proveedores', 'view-admin-reportes', 'view-admin-users', 'view-admin-devoluciones', 'view-config'],
    modalsToRemove: ['productDetailModal', 'paymentModal', 'modalPerson', 'chatModal']
  },
  'pos.html': {
    menus: ['menu-cashier-pos', 'menu-cashier-clients', 'menu-config'],
    views: ['view-cashier-pos', 'view-cashier-clients', 'view-config'],
    modalsToRemove: ['productDetailModal', 'paymentModal', 'modalUser', 'chatModal']
  },
  'almacen.html': {
    menus: ['menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments', 'menu-warehouse-alerts', 'menu-config'],
    views: ['view-warehouse-movements', 'view-warehouse-purchases', 'view-warehouse-adjustments', 'view-warehouse-alerts', 'view-config'],
    modalsToRemove: ['productDetailModal', 'paymentModal', 'modalUser', 'modalPerson', 'chatModal']
  },
  'repartidor.html': {
    menus: ['menu-delivery-list', 'menu-config'],
    views: ['view-delivery-list', 'view-config'],
    modalsToRemove: ['productDetailModal', 'paymentModal', 'modalUser', 'modalPerson']
  },
  'cliente.html': {
    menus: ['menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery', 'menu-returns', 'menu-config'],
    views: ['view-home', 'view-catalog', 'view-cart', 'view-orders', 'view-delivery', 'view-returns', 'view-config'],
    modalsToRemove: ['modalUser', 'modalPerson']
  }
};

const allMenus = [
  'menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery', 'menu-returns', 'menu-config',
  'menu-cashier-pos', 'menu-cashier-clients',
  'menu-delivery-list',
  'menu-admin-products', 'menu-admin-almacenes', 'menu-admin-proveedores', 'menu-admin-reportes', 'menu-admin-users', 'menu-admin-devoluciones',
  'menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments', 'menu-warehouse-alerts'
];

const allViews = [
  'view-home', 'view-catalog', 'view-cart', 'view-orders', 'view-returns', 'view-delivery', 'view-config',
  'view-cashier-pos', 'view-cashier-clients',
  'view-delivery-list',
  'view-admin-products', 'view-admin-almacenes', 'view-admin-proveedores', 'view-admin-reportes', 'view-admin-users', 'view-admin-devoluciones',
  'view-warehouse-movements', 'view-warehouse-purchases', 'view-warehouse-adjustments', 'view-warehouse-alerts'
];

for (const [filename, config] of Object.entries(filesConfig)) {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Eliminar menus no correspondientes
    allMenus.forEach(menuId => {
      if (!config.menus.includes(menuId)) {
        $(`#${menuId}`).remove();
      }
    });

    // Eliminar vistas no correspondientes
    allViews.forEach(viewId => {
      if (!config.views.includes(viewId)) {
        $(`#${viewId}`).remove();
      }
    });

    // Eliminar modales
    config.modalsToRemove.forEach(modalId => {
      $(`#${modalId}`).remove();
    });

    // Quitar "display: none" de la primera vista del rol para que sea la vista por defecto
    if (config.views.length > 0) {
      $(`#${config.views[0]}`).css('display', 'block');
    }

    // Quitar la clase "active" de todos los menús y asignarla al primero
    $('.menu-btn').removeClass('active');
    if (config.menus.length > 0) {
      $(`#${config.menus[0]}`).addClass('active');
    }

    fs.writeFileSync(filePath, $.html());
    console.log(`✅ ${filename} procesado.`);
  } else {
    console.log(`❌ ${filename} no existe.`);
  }
}
