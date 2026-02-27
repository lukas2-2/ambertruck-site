/* AmberTruck JM93 — shared cart (works across all category pages)
   Storage key: ambertruck_cart_v1
*/
(() => {
  const STORAGE_KEY = "ambertruck_cart_v1";

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function money(n) {
    const num = Number(n) || 0;
    return num.toLocaleString("ru-RU");
  }

  function ensureCartUI() {
    // If modal already exists, don't duplicate
    if (document.getElementById("cartModal")) return;

    const modal = document.createElement("div");
    modal.id = "cartModal";
    modal.innerHTML = `
      <div class="cart__panel" role="dialog" aria-modal="true" aria-label="Корзина">
        <div class="cart__header">
          <div class="cart__title">Корзина</div>
          <button class="cart__close" type="button" aria-label="Закрыть">✕</button>
        </div>

        <div class="cart__body">
          <div id="cartItems" class="cart__items"></div>

          <div class="cart__summary">
            <div class="cart__sumrow">
              <span>Итого</span>
              <strong><span id="cartTotal">0</span> ₽</strong>
            </div>
            <div class="cart__small">Корзина сохраняется на этом устройстве.</div>
          </div>

          <div class="cart__checkout">
            <div class="cart__grid">
              <input id="customerName" class="cart__input" type="text" placeholder="Ваше имя" autocomplete="name">
              <input id="customerPhone" class="cart__input" type="tel" placeholder="Телефон" autocomplete="tel">
            </div>
            <textarea id="customerComment" class="cart__input cart__textarea" placeholder="Комментарий (город, доставка, VIN...)"></textarea>

            <div class="cart__grid">
              <button id="checkoutWhatsApp" class="cart__btn cart__btn--wa" type="button">Отправить в WhatsApp</button>
              <button id="checkoutTelegram" class="cart__btn cart__btn--tg" type="button">Отправить в Telegram</button>
            </div>

            <button id="clearCart" class="cart__btn cart__btn--ghost" type="button">Очистить корзину</button>
          </div>
        </div>
      </div>
      <div class="cart__backdrop" aria-hidden="true"></div>
    `;
    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector(".cart__close").addEventListener("click", closeCart);
    modal.querySelector(".cart__backdrop").addEventListener("click", closeCart);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCart();
    });
  }

  function openCart() {
    ensureCartUI();
    document.getElementById("cartModal").classList.add("cart--open");
    renderCart();
  }

  function closeCart() {
    const modal = document.getElementById("cartModal");
    if (modal) modal.classList.remove("cart--open");
  }

  function setCartCount(cart) {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const count = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    el.textContent = String(count);
  }

  function upsertItem(cart, item) {
    const idx = cart.findIndex(i => i.sku === item.sku);
    if (idx >= 0) {
      cart[idx].qty += item.qty;
    } else {
      cart.push(item);
    }
  }

  function addToCart({ name, sku, price, qty = 1 }) {
    const cart = loadCart();
    upsertItem(cart, { name, sku, price: Number(price) || 0, qty: Number(qty) || 1 });
    saveCart(cart);
    setCartCount(cart);
    // Tiny feedback
    try {
      const toast = document.createElement("div");
      toast.className = "cart__toast";
      toast.textContent = `Добавлено: ${name}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("cart__toast--show"), 10);
      setTimeout(() => {
        toast.classList.remove("cart__toast--show");
        setTimeout(() => toast.remove(), 250);
      }, 1200);
    } catch {}
  }

  function removeItemBySku(sku) {
    const cart = loadCart().filter(i => i.sku !== sku);
    saveCart(cart);
    setCartCount(cart);
    renderCart();
  }

  function changeQty(sku, delta) {
    const cart = loadCart();
    const item = cart.find(i => i.sku === sku);
    if (!item) return;
    item.qty = Math.max(1, (Number(item.qty) || 1) + delta);
    saveCart(cart);
    setCartCount(cart);
    renderCart();
  }

  function clearCart() {
    saveCart([]);
    setCartCount([]);
    renderCart();
  }

  function buildOrderMessage(cart) {
    const name = (document.getElementById("customerName")?.value || "").trim();
    const phone = (document.getElementById("customerPhone")?.value || "").trim();
    const comment = (document.getElementById("customerComment")?.value || "").trim();

    let msg = "Заказ AmberTruck JM93\n\n";
    cart.forEach((i, idx) => {
      const line = `${idx + 1}) ${i.name} (арт. ${i.sku}) — ${i.qty} шт × ${money(i.price)} ₽ = ${money(i.price * i.qty)} ₽`;
      msg += line + "\n";
    });

    const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    msg += `\nИТОГО: ${money(total)} ₽\n\n`;

    if (name) msg += `Имя: ${name}\n`;
    if (phone) msg += `Телефон: ${phone}\n`;
    if (comment) msg += `Комментарий: ${comment}\n`;

    msg += "\n(Сообщение сформировано автоматически с сайта)";
    return { msg, name, phone };
  }

  function checkoutWhatsApp() {
    const cart = loadCart();
    if (!cart.length) { alert("Корзина пустая"); return; }
    const { msg, name, phone } = buildOrderMessage(cart);
    if (!name || !phone) { alert("Введите имя и телефон"); return; }
    const url = "https://wa.me/?text=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function checkoutTelegram() {
    const cart = loadCart();
    if (!cart.length) { alert("Корзина пустая"); return; }
    const { msg, name, phone } = buildOrderMessage(cart);
    if (!name || !phone) { alert("Введите имя и телефон"); return; }
    // Share sheet URL (works without bot/server)
    const url = "https://t.me/share/url?url=" + encodeURIComponent(location.href) + "&text=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderCart() {
    ensureCartUI();
    const cart = loadCart();

    const itemsEl = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    if (!itemsEl || !totalEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = `<div class="cart__empty">Корзина пуста. Добавьте товары из таблицы.</div>`;
      totalEl.textContent = "0";
      setCartCount(cart);
      return;
    }

    itemsEl.innerHTML = cart.map(i => `
      <div class="cart__item">
        <div class="cart__item-main">
          <div class="cart__item-name">${escapeHtml(i.name)}</div>
          <div class="cart__item-meta">арт. ${escapeHtml(i.sku)} · ${money(i.price)} ₽</div>
        </div>
        <div class="cart__item-controls">
          <button class="cart__qty" data-act="minus" data-sku="${escapeAttr(i.sku)}" type="button">−</button>
          <div class="cart__qtyval">${i.qty}</div>
          <button class="cart__qty" data-act="plus" data-sku="${escapeAttr(i.sku)}" type="button">+</button>
          <button class="cart__remove" data-act="remove" data-sku="${escapeAttr(i.sku)}" type="button">Удалить</button>
        </div>
        <div class="cart__item-sum">${money(i.price * i.qty)} ₽</div>
      </div>
    `).join("");

    const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    totalEl.textContent = money(total);

    // Bind action buttons
    itemsEl.querySelectorAll("button[data-act]").forEach(btn => {
      const act = btn.getAttribute("data-act");
      const sku = btn.getAttribute("data-sku");
      btn.addEventListener("click", () => {
        if (act === "minus") changeQty(sku, -1);
        if (act === "plus") changeQty(sku, +1);
        if (act === "remove") removeItemBySku(sku);
      });
    });

    setCartCount(cart);

    // Checkout bindings (only once per render is OK)
    document.getElementById("checkoutWhatsApp")?.addEventListener("click", checkoutWhatsApp);
    document.getElementById("checkoutTelegram")?.addEventListener("click", checkoutTelegram);
    document.getElementById("clearCart")?.addEventListener("click", () => {
      if (confirm("Очистить корзину?")) clearCart();
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  function escapeAttr(s) { return escapeHtml(s).replaceAll("`", "&#96;"); }

  function bindAddButtons() {
    document.querySelectorAll(".buy-btn").forEach(btn => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        addToCart({
          name: btn.getAttribute("data-name") || "Товар",
          sku: btn.getAttribute("data-sku") || (btn.getAttribute("data-name") || "").slice(0, 24),
          price: Number(btn.getAttribute("data-price")) || 0,
          qty: 1,
        });
      });
    });
  }

  function init() {
    // Ensure icon exists
    const icon = document.getElementById("cartIcon");
    if (icon) icon.addEventListener("click", openCart);

    // Initial count + bindings
    setCartCount(loadCart());
    bindAddButtons();

    // Re-bind if table re-renders
    const obs = new MutationObserver(() => bindAddButtons());
    obs.observe(document.body, { childList: true, subtree: true });

    // Expose for debugging if needed
    window.AmberCart = { openCart, closeCart, addToCart, renderCart };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();