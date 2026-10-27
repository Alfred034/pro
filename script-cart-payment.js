"use strict";

const cart = [];
const cartItemsElement = document.querySelector("#cart-items");
const cartCountElement = document.querySelector("#cart-count");
const cartBadges = document.querySelectorAll(".cart-count-badge");
const wishlist = new Set();
const wishlistBadges = document.querySelectorAll(".wishlist-count-badge");
const cartTotalElement = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-btn");
const cartCanvas = document.querySelector("#offcanvasCart");
const paymentModalElement = document.querySelector("#paymentModal");
const paymentModal = paymentModalElement
  ? bootstrap.Modal.getOrCreateInstance(paymentModalElement)
  : null;
const paymentAmountInput = document.querySelector("#payment-amount");
const paymentTotalElement = document.querySelector("#payment-total");
const paymentFeedback = document.querySelector("#payment-feedback");
const payButton = document.querySelector("#pay-btn");
const imageZoomModalElement = document.querySelector("#imageZoomModal");
const imageZoomModal = imageZoomModalElement
  ? bootstrap.Modal.getOrCreateInstance(imageZoomModalElement)
  : null;
const zoomedProductImage = document.querySelector("#zoomed-product-image");

document.querySelectorAll(".product-item .view-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const product = button.closest(".product-item");
    const image = product?.querySelector(".product-image");
    if (!image || !imageZoomModal || !zoomedProductImage) return;

    zoomedProductImage.src = image.currentSrc || image.src;
    zoomedProductImage.alt = image.alt || "Product image";
    imageZoomModal.show();
  });
});

document.querySelectorAll(".product-item .wishlist-btn").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", "Add to wishlist");

  button.addEventListener("click", (event) => {
    event.preventDefault();

    const product = button.closest(".product-item");
    const image = product?.querySelector(".product-image");
    if (!image) return;

    const productId = new URL(image.getAttribute("src"), document.baseURI).pathname;
    const isLiked = wishlist.has(productId);

    if (isLiked) {
      wishlist.delete(productId);
    } else {
      wishlist.add(productId);
    }

    button.classList.toggle("is-liked", !isLiked);
    button.setAttribute("aria-pressed", String(!isLiked));
    button.setAttribute("aria-label", !isLiked ? "Remove from wishlist" : "Add to wishlist");

    const count = wishlist.size;
    wishlistBadges.forEach((badge) => {
      badge.textContent = count;
    });
    document.querySelectorAll(".wishlist-count-link").forEach((link) => {
      link.setAttribute("aria-label", `Wishlist: ${count} ${count === 1 ? "item" : "items"}`);
    });
  });
});

imageZoomModalElement?.addEventListener("hidden.bs.modal", () => {
  if (zoomedProductImage) {
    zoomedProductImage.removeAttribute("src");
    zoomedProductImage.alt = "";
  }
});

const formatMoney = (amount) => `$${amount.toFixed(2)}`;

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);

  if (cartCountElement) {
    cartCountElement.textContent = count;
    cartCountElement.setAttribute("aria-label", `${count} items in cart`);
  }

  cartBadges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("aria-label", `${count} items in cart`);
  });
}

function makeButton(label, action, className, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.setAttribute("aria-label", ariaLabel);
  button.textContent = label;
  return button;
}

function renderCart() {
  if (!cartItemsElement) return;

  cartItemsElement.replaceChildren();

  if (cart.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "cart-empty list-group-item text-center py-5";
    emptyMessage.textContent = "Your cart is empty. Add a pair you love.";
    cartItemsElement.appendChild(emptyMessage);
  } else {
    cart.forEach((item) => {
      const row = document.createElement("li");
      row.className = "cart-item list-group-item";

      const image = document.createElement("img");
      image.className = "cart-item-image";
      image.src = item.image;
      image.alt = item.name;

      const details = document.createElement("div");
      details.className = "cart-item-details";

      const name = document.createElement("h6");
      name.className = "mb-1";
      name.textContent = item.name;

      const unitPrice = document.createElement("small");
      unitPrice.className = "text-body-secondary";
      unitPrice.textContent = `${formatMoney(item.price)} each`;

      const controls = document.createElement("div");
      controls.className = "cart-quantity";
      controls.append(
        makeButton("−", "decrease", "btn btn-sm btn-outline-dark", `Decrease ${item.name} quantity`),
        Object.assign(document.createElement("span"), {
          className: "quantity-value",
          textContent: item.quantity
        }),
        makeButton("+", "increase", "btn btn-sm btn-outline-dark", `Increase ${item.name} quantity`)
      );
      details.append(name, unitPrice, controls);

      const actions = document.createElement("div");
      actions.className = "cart-item-actions";

      const itemTotal = document.createElement("strong");
      itemTotal.textContent = formatMoney(item.price * item.quantity);
      const removeButton = makeButton(
        "Remove",
        "remove",
        "btn btn-sm btn-link text-danger p-0",
        `Remove ${item.name} from cart`
      );
      actions.append(itemTotal, removeButton);

      row.append(image, details, actions);
      row.dataset.productId = item.id;
      cartItemsElement.appendChild(row);
    });
  }

  const total = getCartTotal();
  if (cartTotalElement) cartTotalElement.textContent = formatMoney(total);
  if (checkoutButton) checkoutButton.disabled = cart.length === 0;
  updateCartCount();
}

document.querySelectorAll(".cart-link").forEach((link) => {
  const product = link.closest(".product-item");
  const status = product?.querySelector(".bg-light.text-dark");

  if (status?.textContent.trim().toLowerCase() === "sold") {
    link.setAttribute("aria-disabled", "true");
    link.tabIndex = -1;
    link.title = "This item is sold out";
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (link.getAttribute("aria-disabled") === "true") {
      link.setAttribute("aria-disabled", "true");
      return;
    }

    const product = link.closest(".product-item");
    if (!product) return;

    const name = product.querySelector(".product-title a")?.textContent.trim();
    const priceText = product.querySelector(".product-detail p")?.textContent ?? "";
    const price = Number(priceText.replace(/[^\d.]/g, ""));
    const image = product.querySelector(".product-image")?.getAttribute("src");

    if (!name || !Number.isFinite(price) || price < 0 || !image) {
      console.error("Unable to add this product: its name, price, or image is missing.");
      return;
    }

    const id = new URL(image, document.baseURI).pathname;
    const existingItem = cart.find((item) => item.id === id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, image, quantity: 1 });
    }

    renderCart();
  });
});

cartItemsElement?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest("[data-product-id]");
  const itemIndex = cart.findIndex((item) => item.id === row?.dataset.productId);
  if (itemIndex < 0) return;

  switch (button.dataset.action) {
    case "increase":
      cart[itemIndex].quantity += 1;
      break;
    case "decrease":
      cart[itemIndex].quantity -= 1;
      if (cart[itemIndex].quantity === 0) cart.splice(itemIndex, 1);
      break;
    case "remove":
      cart.splice(itemIndex, 1);
      break;
    default:
      return;
  }

  renderCart();
});

checkoutButton?.addEventListener("click", () => {
  if (cart.length === 0 || !paymentModal || !cartCanvas) return;

  const total = getCartTotal();
  if (paymentTotalElement) paymentTotalElement.textContent = formatMoney(total);
  if (paymentAmountInput) paymentAmountInput.value = "";
  if (paymentFeedback) {
    paymentFeedback.hidden = true;
    paymentFeedback.textContent = "";
    paymentFeedback.className = "mt-3 mb-0";
  }
  if (payButton) payButton.disabled = false;

  cartCanvas.addEventListener("hidden.bs.offcanvas", () => paymentModal.show(), { once: true });
  bootstrap.Offcanvas.getOrCreateInstance(cartCanvas).hide();
});

payButton?.addEventListener("click", () => {
  if (!paymentAmountInput || !paymentFeedback || cart.length === 0) return;

  if (!paymentAmountInput.reportValidity()) return;

  const enteredAmount = Number(paymentAmountInput.value);
  const enteredCents = Math.round(enteredAmount * 100);
  const totalCents = Math.round(getCartTotal() * 100);
  paymentFeedback.hidden = false;

  if (!Number.isFinite(enteredAmount) || enteredCents !== totalCents) {
    paymentFeedback.textContent = `Enter the exact total of ${formatMoney(totalCents / 100)} to complete this test payment.`;
    paymentFeedback.className = "mt-3 mb-0 text-danger";
    return;
  }

  cart.splice(0, cart.length);
  renderCart();
  paymentFeedback.textContent = "Test payment successful. Thank you for your order.";
  paymentFeedback.className = "mt-3 mb-0 payment-success";
  payButton.disabled = true;
});

paymentModalElement?.addEventListener("hidden.bs.modal", () => {
  if (paymentAmountInput) paymentAmountInput.value = "";
  if (paymentFeedback) {
    paymentFeedback.hidden = true;
    paymentFeedback.textContent = "";
  }
});

renderCart();

if (typeof Swiper !== "undefined" && document.querySelector(".slideshow")) {
  new Swiper(".slideshow", {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination-slideshow",
      clickable: true
    }
  });
}
