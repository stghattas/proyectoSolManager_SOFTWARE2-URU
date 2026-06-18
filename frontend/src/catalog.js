// ==========================================================================
// LÓGICA COMPONENTE: CATALOG.JS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Capturamos las 5 tarjetas de categorías
  const categoryCards = document.querySelectorAll('.category-btn-card');

  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const categorySelected = card.getAttribute('data-category');
      // Por ahora dejamos el aviso simulado como acordamos, sin funciones complejas
      alert(`Abriste la categoría: ${categorySelected} (Aquí se listarán los productos en el futuro)`);
    });
  });
});