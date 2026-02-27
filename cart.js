// cart.js — единая корзина для всех страниц сайта (GitHub Pages)

(function () {
  const CART_KEY = "ambertruck_cart_v1";

  // ---------- helpers ----------
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCartModal();
  }

  function money(x) {
    const n = Number(x) || 0;
    // формат 500000 -> 500 000
    return n.toLocaleString("ru-RU");
  }

  function getTotal(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  }

  function ensureId(item) {
    // стабильный id (чтобы удалять/увеличивать)
    if (item.id) return item.id;
    return `${item.name}__${item.price}`.replace(/\s+/g, "_");
  }

  // ---------- UI refs ----------
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  // ---------- count ----------
  function updateCartCount() {
    const cart = readCart();
    const count = cart.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);

    // поддержка: #cart-count или .cart-count
    const el = qs("#cart-count") || qs(".cart-count");
    if (el) el.textContent = String(count);
  }

  // ---------- modal open/close ----------
  function openCart() {
    const modal = qs("#cart-modal");
    if (!modal) return;
    modal.classList.add("open");
    document.documentElement.classList.add("cart-lock");
    document.body.classList.add("cart-lock");
    renderCartModal();
  }

  function closeCart() {
    const modal = qs("#cart-modal");
    if (!modal) return;
    modal.classList.remove("open");
    document.documentElement.classList.remove("cart-lock");
    document.body.classList.remove("cart-lock");
  }

  // ---------- render ----------
  function renderCartModal() {
    const modal = qs("#cart-modal");
    if (!modal) return;

    const list = qs("#cart-items");
    const totalEl = qs("#cart-total");
    const emptyEl = qs("#cart-empty");

    if (!list || !totalEl || !emptyEl) return;

    const cart = readCart();
    list.innerHTML = "";

    if (cart.length === 0) {
      emptyEl.style.display = "block";
    } else {
      emptyEl.style.display = "none";
    }

    cart.forEach((item) => {
      const id = ensureId(item);
      const qty = Number(item.qty) || 1;

      const row = document.createElement("div");
      row.className = "cart-row";
      row.dataset.id = id;

      row.innerHTML = `
        <div class="cart-row__main">
          <div class="cart-row__name">${item.name}</div>
          <div class="cart-row__meta">${money(item.price)} ₽ × ${qty}</div>
        </div>
        <div class="cart-row__actions">
          <button class="cart-mini" data-act="dec" aria-label="Уменьшить">−</button>
          <span class="cart-qty">${qty}</span>
          <button class="cart-mini" data-act="inc" aria-label="Увеличить">+</button>
          <button class="cart-remove" data-act="remove">Удалить</button>
        </div>
      `;
      list.appendChild(row);
    });

    totalEl.textContent = money(getTotal(cart)) + " ₽";
  }

  // ---------- add / update ----------
  function addToCart(name, price) {
    const cart = readCart();
    const id = ensureId({ name, price });

    const existing = cart.find((x) => ensureId(x) === id);
    if (existing) existing.qty = (Number(existing.qty) || 1) + 1;
    else cart.push({ id, name, price: Number(price) || 0, qty: 1 });

    saveCart(cart);
  }

  function setQty(id, delta) {
    const cart = readCart();
    const item = cart.find((x) => ensureId(x) === id);
    if (!item) return;

    item.qty = (Number(item.qty) || 1) + delta;

    if (item.qty <= 0) {
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
    saveCart(cart);
  }

  function removeItem(id) {
    const cart = readCart().filter((x) => ensureId(x) !== id);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  // ---------- checkout (пока заглушка) ----------
  function checkout() {
    const cart = readCart();
    if (cart.length === 0) {
      alert("Корзина пустая");
      return;
    }

    const total = getTotal(cart);
    const lines = cart.map((x) => `• ${x.name} — ${money(x.price)} ₽ × ${x.qty}`).join("\n");

    const msg = `Заказ AmberTruck JM 93:\n${lines}\n\nИтого: ${money(total)} ₽`;
    alert(msg);

    // следующий шаг: отправка в Telegram/WhatsApp
  }

  // ---------- global click handler ----------
  document.addEventListener("click", (e) => {
    const t = e.target;

    // открыть корзину
    if (t.closest("#cart-btn") || t.closest(".cart-btn")) {
      e.preventDefault();
      openCart();
      return;
    }

    // закрыть по крестику/фону
    if (t.matches("[data-cart-close]") || t.closest("[data-cart-close]")) {
      e.preventDefault();
      closeCart();
      return;
    }

    // кнопка купить (на карточках)
    const buy = t.closest(".buy-btn");
    if (buy) {
      e.preventDefault();
      const name = buy.dataset.name;
      const price = buy.dataset.price;
      if (!name || !price) {
        alert("У кнопки 'Купить' нет data-name / data-price");
        return;
      }
      addToCart(name, price);

      // приятное: показать корзину сразу (можно убрать, если не хочешь)
      openCart();
      return;
    }

    // действия внутри корзины
    const row = t.closest(".cart-row");
    if (row && t.dataset.act) {
      const id = row.dataset.id;
      if (t.dataset.act === "inc") setQty(id, +1);
      if (t.dataset.act === "dec") setQty(id, -1);
      if (t.dataset.act === "remove") removeItem(id);
      return;
    }

    // очистить корзину
    if (t.matches("#cart-clear")) {
      e.preventDefault();
      clearCart();
      return;
    }

    // оформить
    if (t.matches("#cart-checkout")) {
      e.preventDefault();
      checkout();
      return;
    }
  });

  // закрытие ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  // init
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderCartModal();
  });

  // если страница подгружается без DOMContentLoaded (редко)
  updateCartCount();
})();
