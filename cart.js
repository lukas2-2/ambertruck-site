// Global cart for AmberTruck site (GitHub Pages friendly)
// One cart for all pages: index.html, engine.html, etc.
document.addEventListener("DOMContentLoaded", function () {
  const KEY_MAIN = "ambertruck_cart";      // array format used by cart.html
  const KEY_OLD_OBJ = "ambertruck_cart_v1"; // old object format (engine template)

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  // --- migrate old format -> new format (runs once if needed) ---
  function migrateIfNeeded() {
    const main = safeParse(localStorage.getItem(KEY_MAIN), null);
    if (Array.isArray(main)) return; // ok already

    const oldObj = safeParse(localStorage.getItem(KEY_OLD_OBJ), null);
    if (oldObj && typeof oldObj === "object") {
      const arr = Object.values(oldObj).map(it => ({
        name: it.name || it.sku || "",
        sku: it.sku || (it.name || "") + "__" + (it.price ?? ""),
        price: Number(it.price) || 0,
        qty: Number(it.qty) || 1
      })).filter(it => it.name && Number.isFinite(it.price));
      localStorage.setItem(KEY_MAIN, JSON.stringify(arr));
      // keep old key for safety, but you can remove it if you want:
      // localStorage.removeItem(KEY_OLD_OBJ);
    } else {
      // ensure it exists
      localStorage.setItem(KEY_MAIN, JSON.stringify([]));
    }
  }

  migrateIfNeeded();

  function getCart() {
    const cart = safeParse(localStorage.getItem(KEY_MAIN), []);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCart(cart) {
    localStorage.setItem(KEY_MAIN, JSON.stringify(cart));
  }

  function countItems(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  }

  function updateCounters() {
    const cart = getCart();
    const total = countItems(cart);

    // Support different counters across pages
    const nodes = [
      ...document.querySelectorAll("#cart-count, #cartCount, #cart-count-badge, .cart-count")
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
    const carrier =
      btn.closest("[data-name][data-price]") ||
      btn.closest("tr[data-price]") ||
      btn.closest(".product-card[data-price]");
    if (carrier) {
      name = name || carrier.dataset.name;
      sku = sku || carrier.dataset.sku;
      if (!Number.isFinite(price)) price = normalizePrice(carrier.dataset.price);
    }

    // Fallback: read from visible text
    if (!name) {
      const nameEl =
        btn.closest(".product-card")?.querySelector(".product-name") ||
        btn.closest("tr")?.querySelector(".col-name") ||
        btn.closest(".product-card")?.querySelector("h3");
      name = nameEl ? nameEl.textContent.trim() : "";
    }

    if (!Number.isFinite(price)) {
      const priceEl =
        btn.closest(".product-card")?.querySelector(".product-price") ||
        btn.closest("tr")?.querySelector(".col-price");
      price = priceEl ? normalizePrice(priceEl.textContent) : NaN;
    }

    if (!sku) {
      const skuEl =
        btn.closest(".product-card")?.querySelector(".product-article") ||
        btn.closest("tr")?.querySelector(".col-sku");
      sku = skuEl ? skuEl.textContent.replace(/Артикул\s*:\s*/i, "").trim() : "";
    }

    // If still no sku, build a stable one from name+price
    if (!sku) sku = (name + "__" + price).replace(/\s+/g, "_");

    return { name, sku, price };
  }

  function addItemToCart(data) {
    if (!data.name || !Number.isFinite(data.price)) return false;

    const cart = getCart();
    const existing = cart.find(item => item.sku === data.sku);

    if (existing) existing.qty = (Number(existing.qty) || 1) + 1;
    else cart.push({ name: data.name, price: data.price, sku: data.sku, qty: 1 });

    saveCart(cart);
    updateCounters();
    return true;
  }

  // Provide global function for old inline onclick="addToCart(...)"
  // addToCart(name, article, price, img) -> adds to the same cart
  window.addToCart = function (name, article, price) {
    const data = {
      name: String(name || "").trim(),
      sku: (String(name || "") + "__" + String(price ?? "")).replace(/\s+/g, "_"),
      price: normalizePrice(price)
    };
    const ok = addItemToCart(data);
    if (!ok) alert("Не удалось добавить товар: нет названия или цены.");
  };

  // Global click handler (buttons with class .buy-btn)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".buy-btn");
    if (!btn) return;

    // don't block links like "Корзина" etc.
    e.preventDefault();

    const data = findProductData(btn);
    const ok = addItemToCart(data);
    if (!ok) {
      console.warn("Cart: missing product data", data);
      alert("Не удалось добавить товар: нет названия или цены.");
    }
  });

  // initial
  updateCounters();
});
