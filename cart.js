// Global cart for AmberTruck site (GitHub Pages friendly)
document.addEventListener("DOMContentLoaded", function () {
  const CART_KEY = "ambertruck_cart";

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function countItems(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  }

  function updateCounters() {
    const cart = getCart();
    const total = countItems(cart);

    // Support different counters across pages
    const nodes = [
      ...document.querySelectorAll("#cart-count, #cartCount, .cart-count")
    ];
    nodes.forEach(n => { n.textContent = String(total); });
  }

  function normalizePrice(value) {
    if (value == null) return NaN;
    // Accept numbers, "6720", "6720.00", "6 720 ₽"
    const s = String(value).replace(/\s+/g, "").replace("₽", "").replace(",", ".");
    const num = Number(s);
    return Number.isFinite(num) ? num : NaN;
  }

  function findProductData(btn) {
    // Priority: button dataset
    let name = btn.dataset.name;
    let sku = btn.dataset.sku;
    let price = normalizePrice(btn.dataset.price);

    // Then nearest element with data-name/data-price (tr, card etc.)
    const carrier = btn.closest("[data-name][data-price]") || btn.closest("tr[data-price]") || btn.closest(".product-card[data-price]");
    if (carrier) {
      name = name || carrier.dataset.name;
      sku = sku || carrier.dataset.sku;
      if (!Number.isFinite(price)) price = normalizePrice(carrier.dataset.price);
    }

    // Fallback: read from visible text
    if (!name) {
      const nameEl = btn.closest(".product-card")?.querySelector(".product-name")
        || btn.closest("tr")?.querySelector(".col-name")
        || btn.closest(".product-card")?.querySelector("h3");
      name = nameEl ? nameEl.textContent.trim() : "";
    }

    if (!Number.isFinite(price)) {
      const priceEl = btn.closest(".product-card")?.querySelector(".product-price")
        || btn.closest("tr")?.querySelector(".col-price");
      price = priceEl ? normalizePrice(priceEl.textContent) : NaN;
    }

    if (!sku) {
      const skuEl = btn.closest(".product-card")?.querySelector(".product-article")
        || btn.closest("tr")?.querySelector(".col-sku");
      sku = skuEl ? skuEl.textContent.replace(/Артикул\s*:\s*/i, "").trim() : "";
    }

    // If still no sku, build a stable one from name+price
    if (!sku) sku = (name + "__" + price).replace(/\s+/g, "_");

    return { name, sku, price };
  }

  function addToCart(data) {
    if (!data.name || !Number.isFinite(data.price)) return false;

    const cart = getCart();
    const existing = cart.find(item => item.sku === data.sku);

    if (existing) existing.qty = (Number(existing.qty) || 1) + 1;
    else cart.push({ name: data.name, price: data.price, sku: data.sku, qty: 1 });

    saveCart(cart);
    updateCounters();
    return true;
  }

  // Global click handler
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".buy-btn");
    if (!btn) return;

    e.preventDefault();
    const data = findProductData(btn);

    const ok = addToCart(data);
    if (!ok) {
      console.warn("Cart: missing product data", data);
      alert("Не удалось добавить товар: нет названия или цены.");
    }
  });

  // initial
  updateCounters();
});
