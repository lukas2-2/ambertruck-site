document.addEventListener("DOMContentLoaded", function() {

const CART_KEY = "ambertruck_cart";

function getCart(){
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCounter(){
    const counter = document.getElementById("cart-count");
    if(!counter) return;

    let cart = getCart();
    let total = 0;
    cart.forEach(item => total += item.qty);
    counter.textContent = total;
}

updateCounter();

document.addEventListener("click", function(e){

    const btn = e.target.closest(".buy-btn");
    if(!btn) return;

    const card = btn.closest("tr);
    if(!card) return;

    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const sku = card.dataset.sku;

    let cart = getCart();

    const existing = cart.find(item => item.sku === sku);

    if(existing){
        existing.qty += 1;
    } else {
        cart.push({ name, price, sku, qty:1 });
    }

    saveCart(cart);
    updateCounter();
});

});
