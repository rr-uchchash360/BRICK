/* =============================================
   BRICK — Shopping Cart & Checkout
   ============================================= */

const CART = (() => {
  let items = [];
  let discount = 0;
  let quantity = 1;

  const BASE_PRICE = 10000;
  const FINAL_PRICE = 10000;
  const TAX_RATE = 0.15;
  const TOTAL_STOCK = 100;

  function getRemainingStock() {
    var val = localStorage.getItem('brickStock');
    if (val === null) {
      var init = Math.floor(Math.random() * 13) + 1;
      localStorage.setItem('brickStock', String(init));
      return init;
    }
    return parseInt(val, 10);
  }
  function setRemainingStock(n) {
    localStorage.setItem('brickStock', String(n));
  }
  function updateStockDisplay() {
    var el = document.getElementById('stockCount');
    if (el) el.textContent = getRemainingStock();
  }

  function fmtBDT(n) {
    return '৳' + Number(n).toLocaleString('en-IN');
  }

  let cartPanel, cartOverlay, cartItems, cartCount;
  let cartSubtotal, cartDiscount, cartTotal, discountRow;
  let checkoutPanel, checkoutOverlay;
  let checkoutQty, checkoutPrice, checkoutSubtotal, checkoutDiscount, checkoutTax, checkoutTotal;
  let confirmationModal, confirmationOverlay;
  let ownerNumber;

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

    loadDiscount();
    updateCartUI();
    updateStockDisplay();
    switchPayment('bkash');

    var toggle = document.getElementById('cartToggle');
    if (toggle) toggle.addEventListener('click', toggleCart);
    document.getElementById('cartClose').addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    var checkout = document.getElementById('checkoutBtn');
    if (checkout) checkout.addEventListener('click', openCheckout);
    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', closeCheckout);

    var addBtn = document.getElementById('addToCartBtn');
    if (addBtn) addBtn.addEventListener('click', addToCart);



    document.getElementById('qtyIncrease').addEventListener('click', () => {
      quantity = Math.min(quantity + 1, 5);
      updateQuantityUI();
    });
    document.getElementById('qtyDecrease').addEventListener('click', () => {
      quantity = Math.max(quantity - 1, 1);
      updateQuantityUI();
    });

    document.querySelectorAll('.payment-method').forEach(function(m) {
      m.addEventListener('click', function() {
        document.querySelectorAll('.payment-method').forEach(function(p) { p.classList.remove('active'); });
        m.classList.add('active');
        m.querySelector('input').checked = true;
        switchPayment(m.dataset.pm);
      });
    });

    var cert = document.getElementById('downloadCert');
    if (cert) cert.addEventListener('click', downloadCertificate);

    setupCheckoutSteps();

    window.addEventListener('gameComplete', (e) => {
      discount = e.detail.discount;
    updatePricing();
      if (discount > 0) {
        showNotification('Game reward applied!', discount + '% discount on your purchase');
      }
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
    const existing = items.find(i => i.name === 'The Original Brick');
    if (existing) {
      existing.qty += quantity;
    } else {
      items.push({
        id: Date.now() + Math.random(),
        name: 'The Original Brick',
        qty: quantity,
        price: FINAL_PRICE,
      });
    }
    updateCartUI();
    showNotification('Added to cart', 'The Original Brick');
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
    var show = !cartPanel.classList.contains('show');
    cartPanel.classList.toggle('show');
    cartOverlay.classList.toggle('show');
    if (show) {
      if (typeof lockBodyScroll === 'function') lockBodyScroll();
    } else {
      if (typeof unlockBodyScroll === 'function' && !checkoutPanel.classList.contains('show')) unlockBodyScroll();
    }
  }

  function openCheckout() {
    if (items.length === 0) return;
    cartPanel.classList.remove('show');
    cartOverlay.classList.remove('show');
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
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
  }

  function closeCheckout() {
    checkoutPanel.classList.remove('show');
    checkoutOverlay.classList.remove('show');
    if (!cartPanel.classList.contains('show') && typeof unlockBodyScroll === 'function') {
      unlockBodyScroll();
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
    input.style.borderColor = '#B83A1A';
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
      var txEl = document.querySelector('#paymentBkash:not([style*="display: none"]) .txid-input, #paymentNagad:not([style*="display: none"]) .txid-input');
      var tx = { el: txEl, val: txEl ? txEl.value.trim() : '' };
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
      txID: pm === 'bkash' || pm === 'nagad' ? (document.querySelector('#paymentBkash:not([style*="display: none"]) .txid-input, #paymentNagad:not([style*="display: none"]) .txid-input') || {}).value || '' : '',
    };
  }

  function completePurchase() {
    var result = validateForm();
    if (!result) return;

    var formSection = document.querySelector('[data-step-section="3"]');
    var stepButtons = formSection.querySelectorAll('.step-nav');
    var processingEl = document.getElementById('paymentProcessing');

    if (formSection) formSection.style.display = 'none';
    if (processingEl) processingEl.style.display = 'flex';

    var steps = document.querySelectorAll('.proc-step');
    var stepIdx = 0;

    function advanceProcStep() {
      if (stepIdx < steps.length) {
        steps[stepIdx].classList.add('active');
        stepIdx++;
        setTimeout(advanceProcStep, stepIdx === 1 ? 600 : stepIdx === 2 ? 800 : 500);
      } else {
        finishPurchase();
      }
    }

    setTimeout(advanceProcStep, 400);
  }

  function finishPurchase() {
    var result = validateForm();
    var processingEl = document.getElementById('paymentProcessing');

    closeCheckout();

    var remaining = getRemainingStock();
    var orderSeq = TOTAL_STOCK - remaining;
    setRemainingStock(Math.max(0, remaining - 1));
    updateStockDisplay();

    const ownerNum = String(orderSeq).padStart(3, '0');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const orderNumber = 'BRK-' + dateStr + '-' + String(orderSeq).padStart(3, '0');

    ownerNumber.textContent = ownerNum;
    var certBtn = document.getElementById('downloadCert');
    if (certBtn) {
      certBtn.dataset.certName = result.name;
      certBtn.dataset.certNumber = dateStr + '-' + ownerNum;
      certBtn.dataset.certDate = today;
      certBtn.dataset.certOrder = orderNumber;
    }

    document.getElementById('tlConfirmed').textContent = 'Today at ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('confOrderNumber').textContent = orderNumber;
    document.getElementById('confOrderTotal').textContent =
      document.getElementById('checkoutTotal').textContent;

    setTimeout(function () {
      confirmationModal.classList.add('show');
      confirmationOverlay.classList.add('show');

      if (typeof lockBodyScroll === 'function') lockBodyScroll();

      createConfetti();
      items = [];
      updateCartUI();

      var content = confirmationModal.querySelector('.confirmation-content');

      if (typeof gsap !== 'undefined') {
        var els = content ? content.children : [];
        var animEls = [];
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.classList.contains('confirmation-close')) continue;
          if (el.classList.contains('confirmation-box')) continue;
          if (el.classList.contains('confirmation-details')) {
            var details = el;
            var kids = details.children;
            for (var j = 0; j < kids.length; j++) {
              animEls.push(kids[j]);
            }
            break;
          }
        }

        var tl = gsap.timeline();
        tl.fromTo('.confirmation-content', { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0);

        animEls.forEach(function (el, idx) {
          tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.3 + idx * 0.12);
        });
      } else if (content) {
        content.style.opacity = '1';
      }
    }, 200);

    document.querySelectorAll('.checkout-form .form-input').forEach(function(el) {
      if (el.tagName !== 'SELECT' && el.id !== 'checkoutCountry') el.value = '';
    });
    document.querySelectorAll('.field-error').forEach(function(e) { e.remove(); });

    if (processingEl) processingEl.style.display = 'none';
    var formSection = document.querySelector('[data-step-section="3"]');
    if (formSection) formSection.style.display = '';
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

      if (phone.val && !/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8})$/.test(phone.val.replace(/[\s\-]/g, '')) && phone.val.length > 0) {
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
    var ct = window.DEVICE_TIER || 'high';
    if (ct === 'low') return;
    var count = ct === 'mid' ? 40 : 100;
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#B83A1A', '#D4A843', '#ffffff', '#D44A2A', '#E8C870'];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 5 + 3) + 'px';
      piece.style.height = (Math.random() * 5 + 3) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.setProperty('--duration', (Math.random() * 2 + 2) + 's');
      piece.style.setProperty('--delay', (Math.random() * 1.5) + 's');
      fragment.appendChild(piece);
    }
    container.appendChild(fragment);
  }

  function loadJsPdf() {
    return new Promise(function(resolve, reject) {
      if (typeof jspdf !== 'undefined') { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function downloadCertificate() {
    var btn = document.getElementById('downloadCert');
    if (!btn) return;
    var name = btn.dataset.certName || '';
    var number = btn.dataset.certNumber || '';
    var date = btn.dataset.certDate || '';
    var orderNo = btn.dataset.certOrder || '';
    if (!name || !number) { showNotification('No certificate data', 'Complete a purchase first'); return; }

    showNotification('Generating certificate…', 'Preparing your PDF');

    loadJsPdf().then(function() {
      try {
        generateProfessionalPdf(name, number, date, orderNo);
        showNotification('Certificate ready', 'Your PDF has been downloaded');
      } catch(e) {
        showNotification('PDF generation failed', 'Please try again');
      }
    }).catch(function() {
      showNotification('PDF library failed to load', 'Check your internet connection');
    });
  }

  function generateProfessionalPdf(name, number, date, orderNo) {
    var doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var w = doc.internal.pageSize.getWidth();
    var h = doc.internal.pageSize.getHeight();
    var c = [184, 58, 26];

    // Background
    doc.setFillColor(240, 216, 206);
    doc.rect(0, 0, w, h, 'F');

    // Frame
    var pad = 8;
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.5);
    doc.rect(pad, pad, w - pad * 2, h - pad * 2);
    doc.setLineWidth(1);
    var cl = 12, off = 6;
    doc.line(off, off + cl, off, off); doc.line(off, off, off + cl, off);
    doc.line(w - off - cl, off, w - off, off); doc.line(w - off, off, w - off, off + cl);
    doc.line(off, h - off - cl, off, h - off); doc.line(off, h - off, off + cl, h - off);
    doc.line(w - off - cl, h - off, w - off, h - off); doc.line(w - off, h - off, w - off, h - off - cl);

    // --- Content (vertically centered as a group) ---
    // BRICK
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text('BRICK', w / 2, 40, { align: 'center' });

    // Main divider
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.8);
    doc.line(w / 2 - 20, 46, w / 2 + 20, 46);

    // Title
    doc.setFont('times', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(42, 37, 32);
    doc.text('Certificate of Authenticity', w / 2, 56, { align: 'center' });
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - 14, 61, w / 2 + 14, 61);

    // "This is to certify that"
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(122, 112, 104);
    doc.text('This is to certify that', w / 2, 76, { align: 'center' });

    // Owner name
    var nameStr = name || '';
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(26, 21, 16);
    var nw = doc.getTextWidth(nameStr);
    var nBoxW = Math.min(Math.max(nw + 24, 70), 220);
    var ny = 92;
    doc.setFillColor(244, 221, 212);
    doc.rect(w / 2 - nBoxW / 2, ny - 7, nBoxW, 18, 'F');
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.4);
    doc.line(w / 2 - nBoxW / 2, ny - 7, w / 2 + nBoxW / 2, ny - 7);
    doc.line(w / 2 - nBoxW / 2, ny + 11, w / 2 + nBoxW / 2, ny + 11);
    doc.text(nameStr, w / 2, ny + 7, { align: 'center' });

    // "is the rightful owner of"
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(122, 112, 104);
    doc.text('is the rightful owner of', w / 2, 116, { align: 'center' });

    // Product
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(42, 37, 32);
    doc.text('The Original Brick', w / 2, 133, { align: 'center' });

    // Limited edition
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(154, 144, 136);
    doc.text('Limited edition of 100', w / 2, 140, { align: 'center' });

    // --- Bottom separator (close after content) ---
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.3);
    doc.line(45, 151, w - 45, 151);

    // --- Bottom section ---
    var bY = 161;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(154, 144, 136);
    doc.text('Certificate Number', 40, bY - 1, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(74, 69, 64);
    doc.text(number || '', 40, bY + 5, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(154, 144, 136);
    doc.text('Date', w - 40, bY - 1, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(74, 69, 64);
    doc.text(date || '', w - 40, bY + 5, { align: 'center' });

    doc.save('BRICK-Certificate-' + (number || '') + '.pdf');
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

  function destroy() {
    items = [];
    discount = 0;
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
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
  }

  const api = { init, destroy, removeItem, updateItemQty };
  window.CART = api;
  return api;
})();
