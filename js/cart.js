/* =============================================
   BRICK — Shopping Cart & Checkout
   ============================================= */

const CART = (() => {
  let items = [];
  let discount = 0;
  let selectedColor = 'Classic Red';
  let quantity = 1;

  const BASE_PRICE = 300000;
  const FINAL_PRICE = 240000;
  const TAX_RATE = 0.05;

  function fmtBDT(n) {
    return '৳' + Number(n).toLocaleString('en-IN');
  }

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
    updateCartUI();
    switchPayment('bkash');

    document.getElementById('cartToggle').addEventListener('click', toggleCart);
    document.getElementById('cartClose').addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', closeCheckout);

    document.getElementById('addToCartBtn').addEventListener('click', addToCart);

    document.getElementById('wishlistBtn').addEventListener('click', toggleWishlist);
    loadWishlistState();

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

    document.querySelectorAll('.payment-method').forEach(function(m) {
      m.addEventListener('click', function() {
        document.querySelectorAll('.payment-method').forEach(function(p) { p.classList.remove('active'); });
        m.classList.add('active');
        m.querySelector('input').checked = true;
        switchPayment(m.dataset.pm);
      });
    });

    document.getElementById('downloadCert').addEventListener('click', downloadCertificate);

    setupCheckoutSteps();

    window.addEventListener('gameComplete', (e) => {
      discount = e.detail.discount;
      updatePricing();
      if (discount > 0) {
        showNotification('Game reward applied!', discount + '% discount on your purchase');
      }
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
    discount = 0;
    updatePricing();
  }

  function updatePricing() {
    const discountedPrice = FINAL_PRICE - (FINAL_PRICE * discount / 100);
    document.getElementById('productPrice').textContent = fmtBDT(discountedPrice);
    document.getElementById('productOriginalPrice').textContent = discount > 0 ? fmtBDT(BASE_PRICE) : '';
    document.getElementById('productOriginalPrice').style.display = discount > 0 ? '' : 'none';
    document.getElementById('productDiscountBadge').textContent = discount > 0 ? '-' + discount + '%' : '';
    document.getElementById('productDiscountBadge').style.display = discount > 0 ? '' : 'none';
    var promo = document.getElementById('gamePromo');
    if (promo) promo.style.display = discount > 0 ? 'none' : 'flex';
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
    cartCount.style.display = totalQty > 0 ? 'flex' : 'none';

    if (items.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon"><i class="fa-solid fa-box-open"></i></div>
          <h4 class="cart-empty-title">Your cart is empty</h4>
          <p class="cart-empty-text">The brick is waiting for someone who dares to own the extraordinary.</p>
          <a href="#product" class="btn btn-primary cart-empty-cta" data-smooth>Browse the Brick <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      `;
      cartSubtotal.textContent = fmtBDT(0);
      cartDiscount.textContent = '-' + fmtBDT(0);
      cartTotal.textContent = fmtBDT(0);
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
            <div class="thumb-brick" style="width:36px;height:20px;background:var(--brick-ancient-dark);border-radius:2px;"></div>
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
              <span class="cart-item-price">${fmtBDT(itemTotal)}</span>
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

    cartSubtotal.textContent = fmtBDT(subtotal);
    cartDiscount.textContent = '-' + fmtBDT(discountAmount);
    cartTotal.textContent = fmtBDT(total);
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
    resetCheckoutSteps();

    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discountAmount = Math.round(subtotal * discount / 100);
    const tax = Math.round((subtotal - discountAmount) * TAX_RATE);
    const total = subtotal - discountAmount + tax;
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    checkoutQty.textContent = totalQty;
    checkoutPrice.textContent = fmtBDT(subtotal);
    checkoutSubtotal.textContent = fmtBDT(subtotal);
    checkoutDiscount.textContent = '-' + fmtBDT(discountAmount);
    checkoutTax.textContent = fmtBDT(tax);
    checkoutTotal.textContent = fmtBDT(total);

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

  var errorElements = [];

  function clearFieldError(input) {
    input.style.borderColor = '';
    input.removeAttribute('aria-invalid');
    var err = input.parentNode.querySelector('.field-error');
    if (err) { err.remove(); }
  }

  function showFieldError(input, message) {
    input.style.borderColor = '#C62828';
    input.setAttribute('aria-invalid', 'true');

    var existing = input.parentNode.querySelector('.field-error');
    if (existing) { existing.textContent = message; return; }

    var err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = message;
    input.parentNode.appendChild(err);
  }

  function clearAllErrors() {
    document.querySelectorAll('.checkout-form .form-input').forEach(clearFieldError);
    document.querySelectorAll('.field-error').forEach(function(e) { e.remove(); });
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return { el: el, val: el ? el.value.trim() : '' };
  }

  function switchPayment(pm) {
    document.getElementById('paymentBkash').style.display = pm === 'bkash' ? '' : 'none';
    document.getElementById('paymentNagad').style.display = pm === 'nagad' ? '' : 'none';
    document.getElementById('paymentCard').style.display = pm === 'card' ? '' : 'none';
    clearAllErrors();
  }

  function validateForm() {
    clearAllErrors();

    var errors = [];
    var selectedPayment = document.querySelector('.payment-method.active input');
    var pm = selectedPayment ? selectedPayment.value : 'bkash';

    if (pm === 'bkash' || pm === 'nagad') {
      var tx = getVal('checkoutTxID');
      if (!tx.val) {
        showFieldError(tx.el, 'Transaction ID is required');
        errors.push(tx.el);
      } else if (!/^[a-zA-Z0-9]{10}$/.test(tx.val)) {
        showFieldError(tx.el, 'Transaction ID must be exactly 10 alphanumeric characters');
        if (!errors.length) errors.push(tx.el);
      }
    }

    if (pm === 'card') {
      var card = getVal('checkoutCard');
      var expiry = getVal('checkoutExpiry');
      var cvc = getVal('checkoutCVC');

      var cardDigits = card.val.replace(/\s/g, '');
      if (!cardDigits) {
        showFieldError(card.el, 'Card number is required');
        errors.push(card.el);
      } else if (!/^\d{13,19}$/.test(cardDigits)) {
        showFieldError(card.el, 'Enter a valid card number (13-19 digits)');
        if (!errors.length) errors.push(card.el);
      }

      if (!expiry.val) {
        showFieldError(expiry.el, 'Expiry date is required');
        if (!errors.length) errors.push(expiry.el);
      } else {
        var expParts = expiry.val.split('/');
        if (expParts.length !== 2) {
          showFieldError(expiry.el, 'Use MM/YY format');
          if (!errors.length) errors.push(expiry.el);
        } else {
          var expMonth = parseInt(expParts[0], 10);
          var expYear = parseInt(expParts[1], 10);
          if (isNaN(expMonth) || isNaN(expYear) || expMonth < 1 || expMonth > 12) {
            showFieldError(expiry.el, 'Enter a valid month (MM)');
            if (!errors.length) errors.push(expiry.el);
          } else {
            var now = new Date();
            var currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
            var currentMonth = now.getMonth() + 1;
            var fullExpYear = 2000 + expYear;
            var expDate = new Date(fullExpYear, expMonth, 0);
            var currentDate = new Date(now.getFullYear(), currentMonth, 0);
            if (expDate < currentDate) {
              showFieldError(expiry.el, 'Card has expired');
              if (!errors.length) errors.push(expiry.el);
            }
          }
        }
      }

      if (!cvc.val) {
        showFieldError(cvc.el, 'CVC is required');
        if (!errors.length) errors.push(cvc.el);
      } else if (!/^\d{3,4}$/.test(cvc.val)) {
        showFieldError(cvc.el, 'CVC must be 3 or 4 digits');
        if (!errors.length) errors.push(cvc.el);
      }
    }

    if (errors.length > 0) {
      errors[0].focus();
      return false;
    }

    var name = getVal('checkoutName');
    var email = getVal('checkoutEmail');
    var phone = getVal('checkoutPhone');
    var city = getVal('checkoutCity');
    var address = getVal('checkoutAddress');

    return {
      name: name.val,
      email: email.val,
      phone: phone.val,
      country: 'BD',
      city: city.val,
      address: address.val,
      payment: pm,
      txID: pm === 'bkash' || pm === 'nagad' ? getVal('checkoutTxID').val : '',
    };
  }

  function completePurchase() {
    var result = validateForm();
    if (!result) return;

    closeCheckout();

    const ownerNum = String(Math.floor(Math.random() * 100) + 1).padStart(3, '0');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const orderNumber = 'BRK-' + dateStr + '-' + seq;

    ownerNumber.textContent = ownerNum;
    certOwner.textContent = result.name;
    certNumber.textContent = '#' + ownerNum;
    certDate.textContent = today;

    document.getElementById('confOrderNumber').textContent = orderNumber;
    document.getElementById('confOrderTotal').textContent =
      document.getElementById('checkoutTotal').textContent;

    setTimeout(() => {
      confirmationModal.classList.add('show');
      confirmationOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      createConfetti();
      items = [];
      updateCartUI();
    }, 600);

    document.querySelectorAll('.checkout-form .form-input').forEach(function(el) {
      if (el.tagName !== 'SELECT' && el.id !== 'checkoutCountry') el.value = '';
    });
    document.querySelectorAll('.field-error').forEach(function(e) { e.remove(); });
  }

  function setupCheckoutSteps() {
    document.querySelectorAll('[data-step-next]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var step = parseInt(btn.dataset.stepNext, 10);
        if (validateStep(step)) goToStep(step + 1);
      });
    });
    document.querySelectorAll('[data-step-prev]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var step = parseInt(btn.dataset.stepPrev, 10);
        goToStep(step - 1);
      });
    });
    document.getElementById('completePurchaseStep').addEventListener('click', completePurchase);
  }

  function goToStep(step) {
    document.querySelectorAll('[data-step-section]').forEach(function(s) { s.style.display = 'none'; });
    var section = document.querySelector('[data-step-section="' + step + '"]');
    if (section) section.style.display = '';

    document.querySelectorAll('.checkout-step').forEach(function(s) { s.classList.remove('active'); });
    var indicator = document.querySelector('.checkout-step[data-step="' + step + '"]');
    if (indicator) indicator.classList.add('active');
    clearAllErrors();
  }

  function resetCheckoutSteps() {
    goToStep(1);
    document.querySelectorAll('.checkout-form .form-input').forEach(function(el) {
      if (el.tagName !== 'SELECT' && el.id !== 'checkoutCountry') el.value = '';
      el.style.borderColor = '';
    });
  }

  function validateStep(step) {
    clearAllErrors();
    var errors = [];
    var stepSection = document.querySelector('[data-step-section="' + step + '"]');
    if (!stepSection) return true;

    if (step === 1) {
      var name = getVal('checkoutName');
      var email = getVal('checkoutEmail');
      var phone = getVal('checkoutPhone');

      if (!name.val) { showFieldError(name.el, 'Full name is required'); errors.push(name.el); }
      else if (name.val.length < 2) { showFieldError(name.el, 'Name must be at least 2 characters'); errors.push(name.el); }
      else if (/[0-9]/.test(name.val)) { showFieldError(name.el, 'Name should not contain numbers'); errors.push(name.el); }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.val) { showFieldError(email.el, 'Email address is required'); if (!errors.length) errors.push(email.el); }
      else if (!emailRegex.test(email.val)) { showFieldError(email.el, 'Enter a valid email address (e.g. name@domain.com)'); if (!errors.length) errors.push(email.el); }

      if (phone.val && !/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8})$/.test(phone.val.replace(/[\s\-]/g, ''))) {
        showFieldError(phone.el, 'Enter a valid Bangladeshi number (e.g. 01XXX-XXXXXX)'); if (!errors.length) errors.push(phone.el);
      }
    }

    if (step === 2) {
      var city = getVal('checkoutCity');
      var address = getVal('checkoutAddress');

      if (!city.val) { showFieldError(city.el, 'City is required'); errors.push(city.el); }
      else if (city.val.length < 2) { showFieldError(city.el, 'City must be at least 2 characters'); if (!errors.length) errors.push(city.el); }
      if (!address.val) { showFieldError(address.el, 'Street address is required'); if (!errors.length) errors.push(address.el); }
      else if (address.val.length < 5) { showFieldError(address.el, 'Please enter a full street address'); if (!errors.length) errors.push(address.el); }
    }

    if (errors.length > 0) {
      errors[0].focus();
      return false;
    }
    return true;
  }

  function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#C62828', '#D4A843', '#ffffff', '#E53935', '#F0D080'];
    const fragment = document.createDocumentFragment();
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
      fragment.appendChild(piece);
    }
    container.appendChild(fragment);
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
    var name = certOwner.textContent;
    var number = certNumber.textContent;
    var date = certDate.textContent;
    var orderNo = document.getElementById('confOrderNumber').textContent;
    if (!name || name === '—') { showNotification('No certificate data', 'Complete a purchase first'); return; }

    showNotification('Generating certificate…', 'Preparing your PDF');

    setTimeout(function() {
      try {
        generateProfessionalPdf(name, number, date, orderNo);
        showNotification('Certificate ready', 'Your PDF has been downloaded');
      } catch(e) {
        showNotification('PDF generation failed', 'Please try again');
      }
    }, 200);
  }

  function generateProfessionalPdf(name, number, date, orderNo) {
    var doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var w = doc.internal.pageSize.getWidth();
    var h = doc.internal.pageSize.getHeight();

    var gold = [212, 168, 67];
    var red = [198, 40, 40];
    var dark = [20, 20, 20];

    // Background
    doc.setFillColor(250, 248, 242);
    doc.rect(0, 0, w, h, 'F');

    // Outer decorative border
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(2);
    doc.rect(8, 8, w - 16, h - 16);

    // Inner border
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, w - 28, h - 28);

    // Corner ornaments (simple diamonds)
    var cSize = 6;
    [18, w - 18].forEach(function(cx) {
      [18, h - 18].forEach(function(cy) {
        doc.setFillColor(gold[0], gold[1], gold[2]);
        doc.circle(cx, cy, cSize, 'F');
      });
    });

    // Top gold divider line
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(1);
    doc.line(50, 42, w - 50, 42);

    // Red seal emblem (centered, above title)
    doc.setFillColor(red[0], red[1], red[2]);
    doc.circle(w / 2, 32, 10, 'F');

    // Title: "CERTIFICATE"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('CERTIFICATE', w / 2, 62, { align: 'center' });

    // Subtitle: "of Authenticity"
    doc.setFont('times', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text('of Authenticity', w / 2, 76, { align: 'center' });

    // Gold separator
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.7);
    doc.line(70, 86, w - 70, 86);

    // "This is to certify that"
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text('This is to certify that', w / 2, 106, { align: 'center' });

    // Owner name
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(name, w / 2, 130, { align: 'center' });

    // "is the exclusive owner of"
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text('is the exclusive owner of', w / 2, 150, { align: 'center' });

    // Product name
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text('The Original Brick', w / 2, 172, { align: 'center' });

    // Description line
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('A limited edition piece crafted by time. Forged by fire.', w / 2, 188, { align: 'center' });

    // Details table - centered layout
    var detailX = w / 2;

    // Order Number row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Order No.', detailX - 55, 215);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(orderNo, detailX + 55, 215, { align: 'right' });

    // Certificate Number row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Certificate No.', detailX - 55, 228);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(number, detailX + 55, 228, { align: 'right' });

    // Date row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Date Issued', detailX - 55, 241);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(date, detailX + 55, 241, { align: 'right' });

    // Edition row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Edition', detailX - 55, 254);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('Limited — 1 of 100', detailX + 55, 254, { align: 'right' });

    // Bottom gold line
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.7);
    doc.line(60, 271, w - 60, 271);

    // Footer motto
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('"The world has enough ordinary things."', w / 2, 287, { align: 'center' });

    // Bottom brand
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('BRICK — Exclusive Limited Edition | Authenticated by BRICK', w / 2, 296, { align: 'center' });

    doc.save('BRICK-Certificate-' + number.replace('#', '') + '.pdf');
  }

  var toastTimer = null;

  function showNotification(title, message) {
    var existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }

    var toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<div class="toast-icon"><i class="fa-solid fa-check-circle" style="color:#4CAF50"></i></div>' +
      '<div class="toast-content">' +
        '<span class="toast-title">' + escapeHtml(title) + '</span>' +
        (message ? '<span class="toast-message">' + escapeHtml(message) + '</span>' : '') +
      '</div>';
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    toastTimer = setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400);
      toastTimer = null;
    }, 3000);
  }

  var wishlist = [];

  function toggleWishlist() {
    var btn = document.getElementById('wishlistBtn');
    var icon = btn.querySelector('i');
    var text = btn.querySelector('span');
    var idx = wishlist.indexOf('original-brick');
    if (idx > -1) {
      wishlist.splice(idx, 1);
      icon.className = 'fa-regular fa-heart';
      text.textContent = 'Wishlist';
    } else {
      wishlist.push('original-brick');
      icon.className = 'fa-solid fa-heart';
      icon.style.color = 'var(--accent-red-bright)';
      text.textContent = 'Saved';
      showNotification('Saved to Wishlist', 'The Original Brick');
    }
    try { localStorage.setItem('brickWishlist', JSON.stringify(wishlist)); } catch(e) {}
  }

  function loadWishlistState() {
    try {
      var saved = localStorage.getItem('brickWishlist');
      if (saved) wishlist = JSON.parse(saved);
      if (wishlist.indexOf('original-brick') > -1) {
        document.getElementById('wishlistBtn').querySelector('i').className = 'fa-solid fa-heart';
        document.getElementById('wishlistBtn').querySelector('i').style.color = 'var(--accent-red-bright)';
        document.getElementById('wishlistBtn').querySelector('span').textContent = 'Saved';
      }
    } catch(e) {}
  }

  function destroy() {
    items = [];
    discount = 0;
    selectedColor = 'Classic Red';
    quantity = 1;
    cartPanel = null;
    cartOverlay = null;
    cartItems = null;
    cartCount = null;
    cartSubtotal = null;
    cartDiscount = null;
    cartTotal = null;
    discountRow = null;
    checkoutPanel = null;
    checkoutOverlay = null;
    checkoutQty = null;
    checkoutPrice = null;
    checkoutSubtotal = null;
    checkoutDiscount = null;
    checkoutTax = null;
    checkoutTotal = null;
    confirmationModal = null;
    confirmationOverlay = null;
    ownerNumber = null;
    certOwner = null;
    certNumber = null;
    certDate = null;
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
  }

  const api = { init, destroy, removeItem, updateItemQty, toggleWishlist };
  window.CART = api;
  return api;
})();
