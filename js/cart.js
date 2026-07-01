/* =============================================
   BRICK — Shopping Cart & Checkout
   ============================================= */

const CART = (() => {
  let items = [];
  let discount = 0;
  let selectedColor = 'Classic Red';
  let quantity = 1;

  const BASE_PRICE = 2499;
  const FINAL_PRICE = 1999;
  const TAX_RATE = 0.08;

  let cartPanel, cartOverlay, cartItems, cartCount;
  let cartSubtotal, cartDiscount, cartTotal, discountRow;
  let checkoutPanel, checkoutOverlay;
  let checkoutQty, checkoutPrice, checkoutSubtotal, checkoutDiscount, checkoutTax, checkoutTotal;
  let confirmationModal, confirmationOverlay;
  let ownerNumber, certOwner, certNumber, certDate;

  function init() {
    cartPanel = document.getElementById('cartPanel');
    cartOverlay = document.getElementById('cartOverlay');
    cartItems = document.getElementById('cartItems');
    cartCount = document.getElementById('cartCount');
    cartSubtotal = document.getElementById('cartSubtotal');
    cartDiscount = document.getElementById('cartDiscount');
    cartTotal = document.getElementById('cartTotal');
    discountRow = document.getElementById('discountRow');

    checkoutPanel = document.getElementById('checkoutPanel');
    checkoutOverlay = document.getElementById('checkoutOverlay');
    checkoutQty = document.getElementById('checkoutQty');
    checkoutPrice = document.getElementById('checkoutPrice');
    checkoutSubtotal = document.getElementById('checkoutSubtotal');
    checkoutDiscount = document.getElementById('checkoutDiscount');
    checkoutTax = document.getElementById('checkoutTax');
    checkoutTotal = document.getElementById('checkoutTotal');

    confirmationModal = document.getElementById('confirmationModal');
    confirmationOverlay = document.getElementById('confirmationOverlay');
    ownerNumber = document.getElementById('ownerNumber');
    certOwner = document.getElementById('certOwner');
    certNumber = document.getElementById('certNumber');
    certDate = document.getElementById('certDate');

    loadDiscount();

    document.getElementById('cartToggle').addEventListener('click', toggleCart);
    document.getElementById('cartClose').addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', closeCheckout);

    document.getElementById('addToCartBtn').addEventListener('click', addToCart);

    document.getElementById('qtyIncrease').addEventListener('click', () => {
      quantity = Math.min(quantity + 1, 5);
      updateQuantityUI();
    });
    document.getElementById('qtyDecrease').addEventListener('click', () => {
      quantity = Math.max(quantity - 1, 1);
      updateQuantityUI();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    document.getElementById('wishlistBtn').addEventListener('click', toggleWishlist);

    document.querySelectorAll('.payment-method').forEach(m => {
      m.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('active'));
        m.classList.add('active');
        m.querySelector('input').checked = true;
      });
    });

    document.getElementById('completePurchase').addEventListener('click', completePurchase);
    document.getElementById('downloadCert').addEventListener('click', downloadCertificate);

    window.addEventListener('gameComplete', (e) => {
      discount = e.detail.discount;
      updatePricing();
    });

    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    updatePricing();
  }

  function loadDiscount() {
    const saved = localStorage.getItem('brickDiscount');
    discount = saved ? parseInt(saved) : 0;
    if (discount > 0) {
      document.getElementById('productDiscountBadge').textContent = '-' + discount + '%';
      document.getElementById('productDiscountBadge').style.display = '';
    }
  }

  function updatePricing() {
    const discountedPrice = FINAL_PRICE - (FINAL_PRICE * discount / 100);
    document.getElementById('productPrice').textContent = '$' + discountedPrice.toLocaleString();
    document.getElementById('productOriginalPrice').textContent = discount > 0 ? '$' + FINAL_PRICE.toLocaleString() : '';
    document.getElementById('productOriginalPrice').style.display = discount > 0 ? '' : 'none';
    document.getElementById('productDiscountBadge').textContent = discount > 0 ? '-' + discount + '%' : '';
    document.getElementById('productDiscountBadge').style.display = discount > 0 ? '' : 'none';
  }

  function updateQuantityUI() {
    document.getElementById('qtyValue').textContent = quantity;
  }

  function addToCart() {
    const existing = items.find(i => i.color === selectedColor);
    if (existing) {
      existing.qty += quantity;
    } else {
      items.push({
        id: Date.now() + Math.random(),
        name: 'The Original Brick',
        color: selectedColor,
        qty: quantity,
        price: FINAL_PRICE,
      });
    }
    updateCartUI();
    showNotification('Added to cart', 'The Original Brick - ' + selectedColor);
    if (!cartPanel.classList.contains('show')) {
      toggleCart();
    }
  }

  function removeItem(id) {
    items = items.filter(i => i.id !== id);
    updateCartUI();
    if (items.length === 0) toggleCart();
  }

  function updateItemQty(id, delta) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    item.qty = newQty;
    updateCartUI();
  }

  function updateCartUI() {
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    cartCount.textContent = totalQty;

    if (items.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <i class="fa-regular fa-box-open"></i>
          <p>Your cart is empty</p>
          <span>The brick is waiting for you.</span>
        </div>
      `;
      cartSubtotal.textContent = '$0';
      cartDiscount.textContent = '-$0';
      cartTotal.textContent = '$0';
      discountRow.style.display = 'none';
      return;
    }

    discountRow.style.display = discount > 0 ? 'flex' : 'none';
    let html = '';
    let subtotal = 0;

    items.forEach(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      html += `
        <div class="cart-item">
          <div class="cart-item-image">
            <div class="thumb-brick" style="width:36px;height:20px;background:var(--accent-red-dark);border-radius:3px;"></div>
          </div>
          <div class="cart-item-details">
            <span class="cart-item-name">${escapeHtml(item.name)}</span>
            <span class="cart-item-variant">${escapeHtml(item.color)}</span>
            <div class="cart-item-bottom">
              <div class="cart-item-qty">
                <button data-cart-dec="${item.id}" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
                <span>${item.qty}</span>
                <button data-cart-inc="${item.id}" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
              </div>
              <span class="cart-item-price">$${itemTotal.toLocaleString()}</span>
            </div>
            <button class="cart-item-remove" data-cart-remove="${item.id}">Remove</button>
          </div>
        </div>
      `;
    });

    cartItems.innerHTML = html;

    cartItems.querySelectorAll('[data-cart-dec]').forEach(btn => {
      btn.addEventListener('click', () => updateItemQty(parseFloat(btn.dataset.cartDec), -1));
    });
    cartItems.querySelectorAll('[data-cart-inc]').forEach(btn => {
      btn.addEventListener('click', () => updateItemQty(parseFloat(btn.dataset.cartInc), 1));
    });
    cartItems.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => removeItem(parseFloat(btn.dataset.cartRemove)));
    });

    const discountAmount = Math.round(subtotal * discount / 100);
    const total = subtotal - discountAmount;

    cartSubtotal.textContent = '$' + subtotal.toLocaleString();
    cartDiscount.textContent = '-$' + discountAmount.toLocaleString();
    cartTotal.textContent = '$' + total.toLocaleString();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function toggleCart() {
    const show = !cartPanel.classList.contains('show');
    cartPanel.classList.toggle('show');
    cartOverlay.classList.toggle('show');
    document.body.style.overflow = show ? 'hidden' : '';
    if (!show && checkoutPanel.classList.contains('show')) {
      document.body.style.overflow = 'hidden';
    }
  }

  function openCheckout() {
    if (items.length === 0) return;
    toggleCart();

    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discountAmount = Math.round(subtotal * discount / 100);
    const tax = Math.round((subtotal - discountAmount) * TAX_RATE);
    const total = subtotal - discountAmount + tax;
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    checkoutQty.textContent = totalQty;
    checkoutPrice.textContent = '$' + subtotal.toLocaleString();
    checkoutSubtotal.textContent = '$' + subtotal.toLocaleString();
    checkoutDiscount.textContent = '-$' + discountAmount.toLocaleString();
    checkoutTax.textContent = '$' + tax.toLocaleString();
    checkoutTotal.textContent = '$' + total.toLocaleString();

    checkoutPanel.classList.add('show');
    checkoutOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutPanel.classList.remove('show');
    checkoutOverlay.classList.remove('show');
    if (!cartPanel.classList.contains('show')) {
      document.body.style.overflow = '';
    }
  }

  function validateForm() {
    const name = document.getElementById('checkoutName');
    const email = document.getElementById('checkoutEmail');
    const nameVal = name.value.trim();
    const emailVal = email.value.trim();

    clearErrors();

    if (!nameVal) {
      showFieldError(name, 'Name is required');
      name.focus();
      return false;
    }
    if (!emailVal || !emailVal.includes('@')) {
      showFieldError(email, 'Valid email is required');
      if (!emailVal) email.focus();
      return false;
    }
    return { name: nameVal, email: emailVal };
  }

  function showFieldError(input, message) {
    input.style.borderColor = '#C62828';
    input.setAttribute('aria-invalid', 'true');
  }

  function clearErrors() {
    document.querySelectorAll('.checkout-form .form-input').forEach(el => {
      el.style.borderColor = '';
      el.removeAttribute('aria-invalid');
    });
  }

  function completePurchase() {
    const result = validateForm();
    if (!result) return;

    closeCheckout();

    const ownerNum = String(Math.floor(Math.random() * 100) + 1).padStart(3, '0');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    ownerNumber.textContent = ownerNum;
    certOwner.textContent = result.name;
    certNumber.textContent = '#' + ownerNum;
    certDate.textContent = today;

    setTimeout(() => {
      confirmationModal.classList.add('show');
      confirmationOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      createConfetti();
      items = [];
      updateCartUI();
    }, 600);

    document.querySelector('.checkout-form .form-input').value = '';
  }

  function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#C62828', '#D4A843', '#ffffff', '#E53935', '#F0D080'];
    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 6 + 4) + 'px';
      piece.style.height = (Math.random() * 6 + 4) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.setProperty('--duration', (Math.random() * 2 + 2) + 's');
      piece.style.setProperty('--delay', (Math.random() * 1.5) + 's');
      container.appendChild(piece);
    }
  }

  function toggleWishlist() {
    const btn = document.getElementById('wishlistBtn');
    const icon = btn.querySelector('i');
    const isFilled = icon.classList.contains('fa-solid');
    icon.className = isFilled ? 'fa-regular fa-heart' : 'fa-solid fa-heart';
    btn.style.color = isFilled ? '' : '#C62828';
    showNotification(isFilled ? 'Removed from wishlist' : 'Added to wishlist', '');
  }

  function downloadCertificate() {
    const cert = document.getElementById('certificate');
    if (!cert) return;

    showNotification('Certificate ready', 'Your certificate of authenticity has been generated');

    const certData = {
      owner: certOwner.textContent,
      number: certNumber.textContent,
      product: 'The Original Brick',
      date: certDate.textContent,
    };

    try {
      const blob = new Blob([
        'BRICK — Certificate of Authenticity\n',
        'Owner: ' + certData.owner + '\n',
        'Number: ' + certData.number + '\n',
        'Product: ' + certData.product + '\n',
        'Date: ' + certData.date + '\n',
        '\n' + 'The world has enough ordinary things.'
      ], { type: 'text/plain' });
      const link = document.createElement('a');
      link.download = 'BRICK-Certificate-' + certData.number + '.txt';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      // Silent fallback
    }

    // Also try canvas approach
    if (typeof html2canvas !== 'undefined') {
      html2canvas(cert).then(canvas => {
        const link = document.createElement('a');
        link.download = 'BRICK-Certificate-' + certNumber.textContent + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(() => {});
    }
  }

  function showNotification(title, message) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid fa-check-circle" style="color:#4CAF50"></i></div>
      <div class="toast-content">
        <span class="toast-title" style="display:block;font-weight:500">${escapeHtml(title)}</span>
        ${message ? `<span class="toast-message" style="display:block;font-size:12px;color:rgba(255,255,255,0.6)">${escapeHtml(message)}</span>` : ''}
      </div>
    `;
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 16px 24px;
      display: flex; align-items: center; gap: 12px;
      z-index: 10000; opacity: 0;
      transition: all 0.4s ease;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  const api = { init, removeItem, updateItemQty };
  window.CART = api;
  return api;
})();
