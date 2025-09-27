const products = [
  {
    id: "protein",
    name: "FitFuel Whey Protein",
    description: "24g protein içeriğiyle kas gelişimini destekleyen premium whey karışımı.",
    price: 599,
    weight: "2.27 kg",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "dumbbell",
    name: "Hex Dambıl Seti (2x10kg)",
    description: "Ergonomik tutuş, kaymaz yüzey ve sessiz bırakma için kauçuk kaplama.",
    price: 899,
    weight: "2x10 kg",
    image:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "shaker",
    name: "ProMix Shaker 700ml",
    description: "Paslanmaz çelik karıştırıcı topu ve sızdırmaz kapaklı shaker.",
    price: 169,
    weight: "700 ml",
    image:
      "https://images.unsplash.com/photo-1579722821273-0f6c4f3f7b58?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "bcaa",
    name: "BCAA Recovery Blend",
    description: "Antrenman sonrası toparlanmayı hızlandıran 4:1:1 BCAA formülü.",
    price: 349,
    weight: "400 g",
    image:
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "mat",
    name: "GripMat Yoga Matı",
    description: "Kaymaz yüzeye sahip, terlemeye dayanıklı premium yoga matı.",
    price: 299,
    weight: "6 mm",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
  },
];

const productList = document.getElementById("productList");
const cartButton = document.getElementById("cartButton");
const cartModal = document.getElementById("cartModal");
const authModal = document.getElementById("authModal");
const loginButton = document.getElementById("loginButton");
const membershipButton = document.getElementById("membershipButton");
const exploreButton = document.getElementById("exploreButton");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const toastEl = document.getElementById("toast");
const currentYearEl = document.getElementById("currentYear");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabs = document.querySelectorAll(".tab");

const state = {
  cart: JSON.parse(localStorage.getItem("fitfuel_cart") ?? "{}"),
  user: JSON.parse(localStorage.getItem("fitfuel_user") ?? "null"),
};

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

function renderProducts() {
  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div class="product-meta">
        <span>${product.weight}</span>
        <span class="price">${formatter.format(product.price)}</span>
      </div>
      <button class="primary-button full-width" data-add="${product.id}">
        Sepete Ekle
      </button>
    `;

    fragment.appendChild(card);
  });

  productList.appendChild(fragment);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
}

function openModal(modal) {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function toggleAuth(tab) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  loginForm.classList.toggle("hidden", tab !== "login");
  registerForm.classList.toggle("hidden", tab !== "register");
}

function updateCartStorage() {
  localStorage.setItem("fitfuel_cart", JSON.stringify(state.cart));
}

function updateUserStorage() {
  if (state.user) {
    localStorage.setItem("fitfuel_user", JSON.stringify(state.user));
  } else {
    localStorage.removeItem("fitfuel_user");
  }
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  const entries = Object.entries(state.cart);

  if (!entries.length) {
    cartItemsEl.innerHTML = `<p>Sepetin şu anda boş. Ürün eklemeye başla!</p>`;
    cartTotalEl.textContent = formatter.format(0);
    cartCountEl.textContent = "0";
    return;
  }

  let total = 0;

  entries.forEach(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const itemTotal = product.price * quantity;
    total += itemTotal;

    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <div class="cart-item-info">
        <strong>${product.name}</strong>
        <span>${quantity} x ${formatter.format(product.price)}</span>
      </div>
      <div class="cart-item-actions">
        <button class="quantity-button" data-decrease="${product.id}">-</button>
        <span>${quantity}</span>
        <button class="quantity-button" data-increase="${product.id}">+</button>
      </div>
    `;

    cartItemsEl.appendChild(item);
  });

  cartTotalEl.textContent = formatter.format(total);
  cartCountEl.textContent = entries
    .reduce((acc, [, quantity]) => acc + quantity, 0)
    .toString();
}

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] ?? 0) + 1;
  updateCartStorage();
  renderCart();
  showToast("Ürün sepete eklendi");
}

function updateQuantity(productId, delta) {
  const current = state.cart[productId] ?? 0;
  const nextValue = current + delta;
  if (nextValue <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = nextValue;
  }
  updateCartStorage();
  renderCart();
}

function handleAuthSuccess(user) {
  state.user = user;
  updateUserStorage();
  loginButton.textContent = `${user.name.split(" ")[0]} (Çıkış)`;
  showToast(`Hoş geldin ${user.name.split(" ")[0]}!`);
}

function resetAuthButton() {
  state.user = null;
  updateUserStorage();
  loginButton.textContent = "Giriş Yap";
}

function initAuthButton() {
  if (state.user) {
    loginButton.textContent = `${state.user.name.split(" ")[0]} (Çıkış)`;
  }

  loginButton.addEventListener("click", () => {
    if (state.user) {
      resetAuthButton();
      showToast("Çıkış yapıldı");
    } else {
      openModal(authModal);
      toggleAuth("login");
    }
  });
}

function initModals() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;

    if (target.matches("[data-close]")) {
      closeModal(target.closest(".modal"));
    }

    if (target === cartModal) {
      closeModal(cartModal);
    }

    if (target === authModal) {
      closeModal(authModal);
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => toggleAuth(tab.dataset.tab));
  });

  cartButton.addEventListener("click", () => {
    renderCart();
    openModal(cartModal);
  });

  membershipButton.addEventListener("click", () => {
    openModal(authModal);
    toggleAuth("register");
  });

  exploreButton.addEventListener("click", () => {
    document.getElementById("urunler").scrollIntoView({ behavior: "smooth" });
  });
}

function initForms() {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get("email").toString();
    const password = formData.get("password").toString();

    if (!email.includes("@")) {
      showToast("Geçerli bir e-posta giriniz");
      return;
    }

    if (password.length < 6) {
      showToast("Şifre en az 6 karakter olmalı");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("fitfuel_user") ?? "null");
    if (!storedUser || storedUser.email !== email) {
      showToast("Kullanıcı bulunamadı, lütfen kayıt olun");
      return;
    }

    closeModal(authModal);
    handleAuthSuccess(storedUser);
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const name = formData.get("name").toString().trim();
    const email = formData.get("email").toString();
    const password = formData.get("password").toString();

    if (!name || name.split(" ").length < 2) {
      showToast("Lütfen ad soyad girin");
      return;
    }

    if (!email.includes("@")) {
      showToast("Geçerli bir e-posta giriniz");
      return;
    }

    if (password.length < 6) {
      showToast("Şifre en az 6 karakter olmalı");
      return;
    }

    const user = { name, email };
    handleAuthSuccess(user);
    updateUserStorage();
    closeModal(authModal);
    registerForm.reset();
  });

  document.getElementById("contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    event.target.reset();
    showToast("Mesajın başarıyla gönderildi. En kısa sürede dönüş yapacağız.");
  });
}

function initCartActions() {
  productList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
  });

  cartItemsEl.addEventListener("click", (event) => {
    const increaseBtn = event.target.closest("[data-increase]");
    const decreaseBtn = event.target.closest("[data-decrease]");

    if (increaseBtn) {
      updateQuantity(increaseBtn.dataset.increase, 1);
    }

    if (decreaseBtn) {
      updateQuantity(decreaseBtn.dataset.decrease, -1);
    }
  });

  document.getElementById("checkoutButton").addEventListener("click", () => {
    if (!Object.keys(state.cart).length) {
      showToast("Sepetin boş, önce ürün ekle");
      return;
    }

    showToast("Siparişin alındı! Teşekkürler.");
    state.cart = {};
    updateCartStorage();
    renderCart();
  });
}

function init() {
  currentYearEl.textContent = new Date().getFullYear().toString();
  renderProducts();
  renderCart();
  initAuthButton();
  initModals();
  initForms();
  initCartActions();
}

document.addEventListener("DOMContentLoaded", init);
