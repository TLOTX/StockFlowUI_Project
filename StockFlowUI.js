'use strict';

// Shared configuration: browser storage key, available roles, and order stages.
const STORE_KEY = 'stockflowui.demo.v2';
const ROLES = [
  'Customer',
  'Store Clerk',
  'Fulfillment Officer',
  'Dispatch Rider',
  'Administrator'
];
const STAGES = [
  'Received',
  'Stored',
  'Picked',
  'Packed',
  'Out for Delivery',
  'Delivered'
];

// Start with a small catalog that represents the U.I. divisions.
const START_PRODUCTS = [
  {
    id: 'bread',
    name: 'UI Bread',
    division: 'U.I. Bakery and U & I Fast Food',
    price: 900,
    stock: 34,
    unit: 'loaf'
  },
  {
    id: 'pie',
    name: 'Meat Pie',
    division: 'U.I. Bakery and U & I Fast Food',
    price: 700,
    stock: 27,
    unit: 'piece'
  },
  {
    id: 'flyer',
    name: 'A4 Flyers',
    division: 'U.I. Printing Press',
    price: 120,
    stock: 450,
    unit: 'copy'
  },
  {
    id: 'card',
    name: 'Business Cards',
    division: 'U.I. Printing Press',
    price: 3500,
    stock: 79,
    unit: 'pack'
  },
  {
    id: 'water',
    name: 'Bottled Water',
    division: 'U.I. Hotels and Conference Centre',
    price: 500,
    stock: 54,
    unit: 'bottle'
  },
  {
    id: 'fuel',
    name: 'Fuel Request',
    division: 'U.I. Petrol Station',
    price: 1200,
    stock: 100,
    unit: 'litre'
  }
];

// These sample orders make each part of the workflow easy to explore.
const SAMPLE_ORDERS = [
  {
    id: 'SF-2601',
    customer: 'Markpowell Chukwuemeka Chika',
    method: 'Campus delivery',
    location: 'Mellanby Hall',
    items: [
      {
        productId: 'bread',
        name: 'UI Bread',
        division: START_PRODUCTS[0].division,
        quantity: 2,
        unit: 'loaf',
        price: 900
      },
      {
        productId: 'pie',
        name: 'Meat Pie',
        division: START_PRODUCTS[1].division,
        quantity: 3,
        unit: 'piece',
        price: 700
      }
    ],
    total: 3900,
    stage: 'Received',
    created: 'Today, 9:12 AM',
    history: ['Received']
  },
  {
    id: 'SF-2602',
    customer: 'Yusuf Mutiat Adeyemi',
    method: 'Pickup',
    location: 'U.I. Printing Press',
    items: [
      {
        productId: 'flyer',
        name: 'A4 Flyers',
        division: START_PRODUCTS[2].division,
        quantity: 50,
        unit: 'copy',
        price: 120
      }
    ],
    total: 6000,
    stage: 'Stored',
    created: 'Today, 8:48 AM',
    history: ['Received', 'Stored']
  },
  {
    id: 'SF-2603',
    customer: 'Tomi Bello',
    method: 'Campus delivery',
    location: 'Faculty of Science',
    items: [
      {
        productId: 'card',
        name: 'Business Cards',
        division: START_PRODUCTS[3].division,
        quantity: 1,
        unit: 'pack',
        price: 3500
      }
    ],
    total: 3500,
    stage: 'Picked',
    created: 'Today, 8:24 AM',
    history: ['Received', 'Stored', 'Picked']
  },
  {
    id: 'SF-2604',
    customer: 'Chidi Nwosu',
    method: 'Pickup',
    location: 'U.I. Bakery',
    items: [
      {
        productId: 'bread',
        name: 'UI Bread',
        division: START_PRODUCTS[0].division,
        quantity: 4,
        unit: 'loaf',
        price: 900
      }
    ],
    total: 3600,
    stage: 'Packed',
    created: 'Today, 8:06 AM',
    history: ['Received', 'Stored', 'Picked', 'Packed']
  },
  {
    id: 'SF-2605',
    customer: 'Zainab Yusuf',
    method: 'Campus delivery',
    location: 'Queen Idia Hall',
    items: [
      {
        productId: 'water',
        name: 'Bottled Water',
        division: START_PRODUCTS[4].division,
        quantity: 6,
        unit: 'bottle',
        price: 500
      }
    ],
    total: 3000,
    stage: 'Out for Delivery',
    created: 'Today, 7:52 AM',
    history: ['Received', 'Stored', 'Picked', 'Packed', 'Out for Delivery']
  },
  {
    id: 'SF-2606',
    customer: 'Emeka James',
    method: 'Pickup',
    location: 'U.I. Bakery',
    items: [
      {
        productId: 'pie',
        name: 'Meat Pie',
        division: START_PRODUCTS[1].division,
        quantity: 2,
        unit: 'piece',
        price: 700
      }
    ],
    total: 1400,
    stage: 'Delivered',
    created: 'Yesterday, 3:40 PM',
    history: STAGES.slice()
  }
];

let data = loadData();
let cart = {};
let role = 'Customer';
let toastTimer;

// A short helper for finding elements, so repeated DOM lookups stay readable.
const $ = (id) => document.getElementById(id);

// Load saved browser data when it is valid, otherwise use a fresh demo state.
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));

    if (
      saved &&
      Array.isArray(saved.products) &&
      Array.isArray(saved.orders) &&
      Array.isArray(saved.returns)
    ) {
      return saved;
    }
  } catch (error) {
    console.warn('Saved demonstration data could not be read.', error);
  }

  return {
    products: structuredClone(START_PRODUCTS),
    orders: structuredClone(SAMPLE_ORDERS),
    returns: []
  };
}

// Save after each change so the demo stays ready when it is reopened.
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  render();
}

// Keep display-only formatting in one place so prices and values stay consistent.
function money(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount);
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function makeId() {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SF-${timePart}-${randomPart}`;
}

// Dashboard summary numbers are recalculated whenever the demo data changes.
function renderStats() {
  const pendingOrders = data.orders.filter((order) => order.stage !== 'Delivered').length;
  const openReturns = data.returns.filter((item) => item.status === 'Pending review').length;
  const lowStock = data.products.filter((product) => product.stock < 10).length;
  const stats = [
    ['Orders in progress', pendingOrders],
    ['Open returns', openReturns],
    ['Items tracked', data.products.length],
    ['Low stock alerts', lowStock]
  ];

  $('stats').innerHTML = stats.map(([label, value]) => `
    <div class="stat">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  `).join('');
}

function render() {
  renderStats();

  const roleSelect = $('roleSelect');
  if (!roleSelect.options.length) {
    roleSelect.innerHTML = ROLES.map((item) => `<option>${item}</option>`).join('');
    roleSelect.value = role;
  }

  const views = {
    Customer: customerView,
    'Store Clerk': storeView,
    'Fulfillment Officer': fulfillmentView,
    'Dispatch Rider': dispatchView,
    Administrator: adminView
  };

  $('view').innerHTML = views[role]();
}

// Order cards use the stage list to show completed, current, and upcoming steps.
function stageClass(order, stage) {
  const currentIndex = STAGES.indexOf(order.stage);
  const stageIndex = STAGES.indexOf(stage);

  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return '';
}

function stageTrack(order) {
  return `
    <div class="stage-track">
      ${STAGES.map((stage) => `
        <div class="stage ${stageClass(order, stage)}">${safe(stage)}</div>
      `).join('')}
    </div>
  `;
}

function orderCard(order, showActions = true) {
  const statusClass = order.stage === 'Delivered'
    ? 'good'
    : order.stage === 'Out for Delivery'
      ? 'warn'
      : '';
  const itemText = order.items
    .map((item) => `${item.quantity} × ${safe(item.name)}`)
    .join(', ');
  let actionHtml = '';

  if (showActions) {
    const nextStage = STAGES[STAGES.indexOf(order.stage) + 1];
    const canMove = role === 'Administrator' ||
      (role === 'Store Clerk' && order.stage === 'Received') ||
      (role === 'Fulfillment Officer' && ['Stored', 'Picked'].includes(order.stage)) ||
      (role === 'Dispatch Rider' && ['Packed', 'Out for Delivery'].includes(order.stage));

    if (nextStage && canMove) {
      actionHtml += `
        <button class="button primary" data-action="advance" data-id="${order.id}">
          Mark ${safe(nextStage)}
        </button>
      `;
    }

    if (role === 'Customer' && order.stage === 'Delivered') {
      actionHtml += `
        <button class="button light" data-action="return-order" data-id="${order.id}">
          Request a return
        </button>
      `;
    }
  }

  return `
    <article class="order-card">
      <div class="order-title">
        <div>
          <strong>${safe(order.id)}</strong>
          <div class="order-meta">
            ${safe(order.customer)} · ${safe(order.created)} · ${safe(order.method)}
          </div>
        </div>
        <span class="badge ${statusClass}">${safe(order.stage)}</span>
      </div>
      <p class="order-items">${itemText}</p>
      <div class="order-meta">
        <span>${safe(order.location)}</span>
        <span>Total ${money(order.total)}</span>
      </div>
      ${stageTrack(order)}
      ${actionHtml ? `<div class="order-actions">${actionHtml}</div>` : ''}
    </article>
  `;
}

function orderList(orders, showActions = true) {
  if (!orders.length) return '<div class="empty">No orders to show yet.</div>';
  return orders.map((order) => orderCard(order, showActions)).join('');
}

// Customer view: browse products, build a cart, place orders, and request returns.
function customerView() {
  const products = data.products.map((product) => `
    <article class="product">
      <div class="product-top">
        <div>
          <div class="product-name">${safe(product.name)}</div>
          <div class="product-division">${safe(product.division)}</div>
        </div>
        <div class="price">${money(product.price)}</div>
      </div>
      <div class="stock-note">${product.stock} ${safe(product.unit)} available</div>
      <div class="product-actions">
        <input type="number" min="1" max="${product.stock}" value="1"
          id="qty-${product.id}" aria-label="Quantity for ${safe(product.name)}">
        <button class="button primary" data-action="add-cart" data-id="${product.id}"
          ${product.stock < 1 ? 'disabled' : ''}>Add</button>
      </div>
    </article>
  `).join('');

  const cartLines = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => {
      const product = data.products.find((item) => item.id === id);
      if (!product) return '';

      return `
        <div class="cart-line">
          <div>
            <strong>${safe(product.name)}</strong>
            <small>${quantity} ${safe(product.unit)} × ${money(product.price)}</small>
          </div>
          <button class="text-button" data-action="remove-cart" data-id="${id}">Remove</button>
        </div>
      `;
    }).join('');

  const total = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = data.products.find((item) => item.id === id);
    return sum + (product?.price || 0) * quantity;
  }, 0);

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Browse products</h2>
          <p>Choose an item and quantity to create a demonstration order.</p>
        </div>
      </div>
      <div class="catalog">${products}</div>
    </section>

    <div class="split">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Checkout</h2>
            <p>Submit a campus pickup or delivery request.</p>
          </div>
        </div>
        ${cartLines || '<div class="empty">Your cart is empty.</div>'}
        <div class="cart-total"><span>Order total</span><span>${money(total)}</span></div>
        <form id="checkoutForm" class="form-grid" style="margin-top: 16px">
          <div class="field">
            <label for="customerName">Customer name</label>
            <input id="customerName" required maxlength="80" placeholder="Enter a name">
          </div>
          <div class="field">
            <label for="method">Fulfillment method</label>
            <select id="method">
              <option>Campus delivery</option>
              <option>Pickup</option>
            </select>
          </div>
          <div class="field wide">
            <label for="location">Delivery address or pickup point</label>
            <input id="location" required maxlength="120" placeholder="For example, faculty or hall">
          </div>
          <div class="wide">
            <button class="button primary" type="submit" ${total === 0 ? 'disabled' : ''}>
              Place order
            </button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Order tracking</h2>
            <p>Current status of demonstration orders.</p>
          </div>
        </div>
        ${orderList(data.orders, false)}
      </section>
    </div>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Request a return</h2>
          <p>Available after an order has been delivered.</p>
        </div>
      </div>
      ${returnForm()}
    </section>

    <section class="panel">
      <div class="panel-head"><div><h2>Return requests</h2></div></div>
      ${returnList(data.returns, false)}
    </section>
  `;
}

function returnForm() {
  const deliveredOrders = data.orders.filter((order) => order.stage === 'Delivered');
  if (!deliveredOrders.length) {
    return '<div class="empty">Delivered orders will appear here.</div>';
  }

  return `
    <form id="returnForm" class="form-grid">
      <div class="field">
        <label for="returnOrder">Delivered order</label>
        <select id="returnOrder">
          ${deliveredOrders.map((order) => `
            <option value="${order.id}">${safe(order.id)} · ${safe(order.customer)}</option>
          `).join('')}
        </select>
      </div>
      <div class="field">
        <label for="returnItem">Item to return</label>
        <select id="returnItem"></select>
      </div>
      <div class="field">
        <label for="returnQuantity">Quantity</label>
        <input id="returnQuantity" type="number" min="1" value="1" required>
      </div>
      <div class="field">
        <label for="returnCondition">Item condition</label>
        <select id="returnCondition">
          <option>Usable</option>
          <option>Damaged</option>
        </select>
      </div>
      <div class="field wide">
        <label for="returnReason">Reason for return</label>
        <textarea id="returnReason" required maxlength="300" placeholder="Describe the issue"></textarea>
      </div>
      <div class="wide">
        <button class="button primary">Submit return request</button>
      </div>
    </form>
  `;
}

function returnList(returns, showControls) {
  if (!returns.length) return '<div class="empty">No return requests yet.</div>';

  return returns.map((item) => `
    <div class="return-line">
      <div>
        <strong>${safe(item.orderId)}
          <span class="return-item">${safe(item.quantity || 1)} × ${safe(item.itemName || 'order item')}</span>
        </strong>
        <small>${safe(item.reason)} · ${safe(item.condition)} item · ${safe(item.created)}</small>
      </div>
      <span class="badge ${returnStatusClass(item.status)}">${safe(item.status)}</span>
      ${showControls && item.status === 'Pending review' ? `
        <div class="order-actions">
          <button class="button primary" data-action="approve-return" data-id="${item.id}">Approve</button>
          <button class="button light" data-action="decline-return" data-id="${item.id}">Decline</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function returnStatusClass(status) {
  if (status === 'Approved') return 'good';
  if (status === 'Declined') return 'bad';
  return 'warn';
}

// Store view: maintain inventory, prepare received orders, and review returns.
function storeView() {
  const inventoryRows = data.products.map((product) => `
    <tr>
      <td>${safe(product.name)}</td>
      <td>${safe(product.division)}</td>
      <td>${product.stock} ${safe(product.unit)}</td>
      <td>
        <input type="number" min="1" id="restock-${product.id}" value="1">
        <button class="text-button" data-action="restock" data-id="${product.id}">Add</button>
      </td>
    </tr>
  `).join('');

  const ordersToStore = data.orders.filter((order) => ['Received', 'Stored'].includes(order.stage));

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Inventory and storage</h2>
          <p>Update stock quantities and review orders ready for storage.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Item</th><th>Division</th><th>Current stock</th><th>Add stock</th></tr></thead>
          <tbody>${inventoryRows}</tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div><h2>Orders to store</h2><p>Move received orders to Stored when items have been allocated.</p></div>
      </div>
      ${orderList(ordersToStore)}
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>Returns for review</h2></div></div>
      ${returnList(data.returns, true)}
    </section>
  `;
}

// Fulfillment view: move stored orders through picking and packing.
function fulfillmentView() {
  const activeOrders = data.orders.filter((order) => ['Stored', 'Picked'].includes(order.stage));
  return `
    <section class="panel">
      <div class="panel-head">
        <div><h2>Picking and packing</h2><p>Advance each order after checking the items and package.</p></div>
      </div>
      ${orderList(activeOrders)}
    </section>
  `;
}

// Dispatch view: manage packed orders and their delivery handoff.
function dispatchView() {
  const deliveryOrders = data.orders.filter((order) => ['Packed', 'Out for Delivery'].includes(order.stage));
  return `
    <section class="panel">
      <div class="panel-head">
        <div><h2>Delivery queue</h2><p>Confirm dispatch and handover for campus orders.</p></div>
      </div>
      ${orderList(deliveryOrders)}
    </section>
  `;
}

// Administrator view: gives a broad overview of orders, returns, and divisions.
function adminView() {
  const deliveredCount = data.orders.filter((order) => order.stage === 'Delivered').length;

  return `
    <section class="panel">
      <div class="panel-head">
        <div><h2>Operations overview</h2><p>All divisions and order stages in this browser demonstration.</p></div>
      </div>
      <div class="notice warning">
        This prototype stores data in this browser only. It is not connected to a shared server or live payment and delivery services.
      </div>
      <div class="form-grid">
        <div class="stat"><div class="stat-label">Delivered orders</div><div class="stat-value">${deliveredCount}</div></div>
        <div class="stat"><div class="stat-label">Return requests</div><div class="stat-value">${data.returns.length}</div></div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>All orders</h2></div></div>
      ${orderList(data.orders)}
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>Returns</h2></div></div>
      ${returnList(data.returns, true)}
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>Divisions</h2></div></div>
      <div class="notice">
        U.I. Bakery and U & I Fast Food · U.I. Printing Press · U.I. Hotels and Conference Centre · U.I. Petrol Station
      </div>
    </section>
  `;
}

// Checkout: turn the current cart into a new received order and reduce stock.
function placeOrder() {
  const items = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => {
      const product = data.products.find((item) => item.id === id);
      if (!product) return null;

      return {
        productId: product.id,
        name: product.name,
        division: product.division,
        quantity,
        unit: product.unit,
        price: product.price
      };
    })
    .filter(Boolean);

  if (!items.length) {
    showToast('Add an item before placing an order.');
    return;
  }

  // Check every item before reducing stock so a failed checkout changes nothing.
  for (const item of items) {
    const product = data.products.find((entry) => entry.id === item.productId);
    if (item.quantity > product.stock) {
      showToast(`Not enough stock for ${product.name}.`);
      return;
    }
  }

  for (const item of items) {
    const product = data.products.find((entry) => entry.id === item.productId);
    product.stock -= item.quantity;
  }

  const order = {
    id: makeId(),
    customer: $('customerName').value.trim(),
    method: $('method').value,
    location: $('location').value.trim(),
    items,
    total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    stage: 'Received',
    created: new Date().toLocaleString(),
    history: ['Received']
  };

  data.orders.unshift(order);
  cart = {};
  save();
  showToast(`Order ${order.id} received.`);
}

// Advance an order only if the selected role is allowed to act at its current stage.
function advanceOrder(id) {
  const order = data.orders.find((item) => item.id === id);
  if (!order) return;

  const stageIndex = STAGES.indexOf(order.stage);
  if (stageIndex < 0 || stageIndex >= STAGES.length - 1) return;

  if (role === 'Store Clerk' && order.stage !== 'Received') return;
  if (role === 'Fulfillment Officer' && !['Stored', 'Picked'].includes(order.stage)) return;
  if (role === 'Dispatch Rider' && !['Packed', 'Out for Delivery'].includes(order.stage)) return;

  const nextStage = STAGES[stageIndex + 1];
  order.stage = nextStage;
  order.history.push(nextStage);
  save();
  showToast(`${order.id} updated to ${nextStage}.`);
}

// Create a pending return request for an item from a delivered order.
function submitReturn() {
  const order = data.orders.find((item) => item.id === $('returnOrder').value);
  if (!order || order.stage !== 'Delivered') {
    showToast('Choose a delivered order.');
    return;
  }

  const returnedProduct = order.items.find((item) => item.productId === $('returnItem').value);
  const quantity = Math.floor(Number($('returnQuantity').value));
  if (!returnedProduct || quantity < 1 || quantity > returnedProduct.quantity) {
    showToast('Choose a valid item quantity.');
    return;
  }

  data.returns.unshift({
    id: makeId(),
    orderId: order.id,
    productId: returnedProduct.productId,
    itemName: returnedProduct.name,
    quantity,
    reason: $('returnReason').value.trim(),
    condition: $('returnCondition').value,
    status: 'Pending review',
    created: new Date().toLocaleString()
  });

  save();
  updateReturnItems();
  showToast('Return request recorded.');
}

// Review a return: damaged items stay out of stock; usable items are restored.
function handleReturn(id, approve) {
  const request = data.returns.find((item) => item.id === id);
  if (!request || request.status !== 'Pending review') return;

  request.status = approve ? 'Approved' : 'Declined';

  // Only usable returned items go back into available stock.
  if (approve && request.condition === 'Usable') {
    const product = data.products.find((item) => item.id === request.productId);
    if (product) product.stock += request.quantity;
  }

  save();
  showToast(approve
    ? request.condition === 'Usable' ? 'Return approved and stock restored.' : 'Return approved as damaged.'
    : 'Return declined.');
}

// Route button clicks to the matching cart, order, stock, or return action.
function handleAction(button) {
  const { id, action } = button.dataset;

  if (action === 'add-cart') {
    const product = data.products.find((item) => item.id === id);
    const quantity = Math.floor(Number($(`qty-${id}`).value));
    if (!product || !Number.isFinite(quantity) || quantity < 1) return;

    if ((cart[id] || 0) + quantity > product.stock) {
      showToast('Quantity is higher than available stock.');
      return;
    }

    cart[id] = (cart[id] || 0) + quantity;
    render();
    showToast(`${product.name} added to the cart.`);
  }

  if (action === 'remove-cart') {
    delete cart[id];
    render();
  }

  if (action === 'advance') advanceOrder(id);

  if (action === 'restock') {
    const product = data.products.find((item) => item.id === id);
    const quantity = Math.floor(Number($(`restock-${id}`).value));
    if (product && quantity > 0) {
      product.stock += quantity;
      save();
      showToast('Stock quantity updated.');
    }
  }

  if (action === 'approve-return') handleReturn(id, true);
  if (action === 'decline-return') handleReturn(id, false);

  if (action === 'return-order') {
    role = 'Customer';
    $('roleSelect').value = role;
    render();
    $('returnForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Keep the item and quantity selectors in the return form in sync.
function updateReturnItems() {
  const order = data.orders.find((item) => item.id === $('returnOrder')?.value);
  const itemSelect = $('returnItem');
  const quantityInput = $('returnQuantity');
  if (!order || !itemSelect || !quantityInput) return;

  itemSelect.innerHTML = order.items.map((item) => `
    <option value="${safe(item.productId)}" data-quantity="${item.quantity}">
      ${safe(item.name)} · ${item.quantity} ${safe(item.unit)} purchased
    </option>
  `).join('');

  quantityInput.max = order.items[0]?.quantity || 1;
  quantityInput.value = '1';
}

// Export a copy of the live demonstration data as a JSON file.
function exportData() {
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'stockflowui-demonstration-data.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Data export downloaded.');
}

// Shared event handling for dynamically rendered buttons and forms.
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (button) handleAction(button);
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'checkoutForm') placeOrder();
  if (event.target.id === 'returnForm') submitReturn();
});

document.addEventListener('change', (event) => {
  if (event.target.id === 'returnOrder') updateReturnItems();

  if (event.target.id === 'returnItem') {
    const option = event.target.selectedOptions[0];
    const quantityInput = $('returnQuantity');
    if (!quantityInput) return;

    quantityInput.max = option?.dataset.quantity || 1;
    quantityInput.value = '1';
  }
});

// Switching roles changes the whole view and clears role-specific cart state.
$('roleSelect').addEventListener('change', (event) => {
  role = event.target.value;
  cart = {};
  render();
});

// Toolbar actions: export the current state or reset it after confirmation.
$('exportButton').addEventListener('click', exportData);
// Reset is the only destructive action in the demo, so it always asks first.
$('resetButton').addEventListener('click', () => {
  const shouldReset = confirm('Reset all StockFlowUI demonstration orders, returns, and stock changes in this browser?');
  if (!shouldReset) return;

  localStorage.removeItem(STORE_KEY);
  data = {
    products: structuredClone(START_PRODUCTS),
    orders: structuredClone(SAMPLE_ORDERS),
    returns: []
  };
  cart = {};
  role = 'Customer';
  $('roleSelect').value = role;
  render();
  updateReturnItems();
  showToast('Demonstration data reset.');
});

render();
updateReturnItems();
