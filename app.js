const REQUESTS_KEY = "pecas-transporte-solicitacoes-v4";
const SESSION_KEY = "pecas-transporte-sessao";
const THEME_KEY = "pecas-transporte-tema";
const USERS_KEY = "pecas-transporte-usuarios";
const DELETED_USERS_KEY = "pecas-transporte-usuarios-excluidos";
const NOTIFICATION_READ_KEY = "pecas-transporte-notificacoes-lidas";
const CUSTOM_PARTS_KEY = "pecas-transporte-pecas-cadastradas";
const PART_REGISTRATIONS_KEY = "pecas-transporte-cadastros-pecas";
const supabaseClient = window.manuPecasSupabase || null;

const partsCatalog = Array.isArray(globalThis.PARTS_CATALOG) ? globalThis.PARTS_CATALOG : [];
const wmsLocations = globalThis.WMS_LOCATIONS && typeof globalThis.WMS_LOCATIONS === "object" ? globalThis.WMS_LOCATIONS : {};
const cdWmsLocations = globalThis.CD_WMS_LOCATIONS && typeof globalThis.CD_WMS_LOCATIONS === "object" ? globalThis.CD_WMS_LOCATIONS : {};

const accounts = {
  "erik.lima": { password: "1234", role: "admin", label: "Admin", name: "ERIK.LIMA" },
  "bruno.medici": { password: "1234", role: "admin", label: "Admin", name: "BRUNO.MEDICI" },
  "caio.silveira": { password: "1234", role: "admin", label: "Admin", name: "CAIO.SILVEIRA" },
  "rodrigo.silva": { password: "1234", role: "manager", label: "Gerente", name: "RODRIGO.SILVA" },
  "carla.alves": { password: "1234", role: "cd", label: "CD", name: "CARLA.ALVES" },
  "jessica.lopes": { password: "1234", role: "almox", label: "Almoxarifado", name: "JESSICA.LOPES" },
  "marcio.ferreira": { password: "1234", role: "compras", label: "Compras", name: "MARCIO.FERREIRA" },
  "matheus.campos": { password: "1234", role: "pcm", label: "PCM", name: "MATHEUS.CAMPOS" },
};

const emailAliases = {
  erik: "erik.lima",
  bruno: "bruno.medici",
  caio: "caio.silveira",
  rodrigo: "rodrigo.silva",
  carla: "carla.alves",
  jessica: "jessica.lopes",
  marcio: "marcio.ferreira",
  matheus: "matheus.campos",
};

const statusText = {
  solicitacao: "Pendente atendimento do Almoxarifado",
  cd: "Pendente atendimento do CD",
  atendimento: "Retirada liberada para o PCM",
  aprovacao: "Aguardando aprovação de compra",
  compra: "Compra SAP pendente",
  recebimento: "Pendente entrada e recebimento pelo Almoxarifado",
  reprovado: "Compra não aprovada",
  retirado: "Item retirado pelo PCM",
};

const seedRequests = [];

let requests = loadRequests();
let managedUsers = loadManagedUsers();
let deletedUsers = loadDeletedUsers();
let customParts = loadCustomParts();
let partRegistrations = loadPartRegistrations();
let currentUser = loadSession();
let currentFilter = "solicitacao";
let currentPage = "request";

const body = document.body;
const loginForm = document.querySelector("#login-form");
const sessionLabel = document.querySelector("#session-label");
const userGreeting = document.querySelector("#user-greeting");
const notificationButton = document.querySelector("#notification-button");
const notificationCount = document.querySelector("#notification-count");
const notificationPopover = document.querySelector("#notification-popover");
const notificationList = document.querySelector("#notification-list");
const notificationMarkAll = document.querySelector("#notification-mark-all");
const logoutButton = document.querySelector("#logout-button");
const themeToggle = document.querySelector("#theme-toggle");
const changePasswordButton = document.querySelector("#change-password-button");
const passwordDialog = document.querySelector("#password-dialog");
const passwordForm = document.querySelector("#password-form");
const passwordClose = document.querySelector("#password-close");
const passwordMessage = document.querySelector("#password-message");
const form = document.querySelector("#request-form");
const list = document.querySelector("#request-list");
const requestTemplate = document.querySelector("#request-card-template");
const itemTemplate = document.querySelector("#item-line-template");
const itemLines = document.querySelector("#item-lines");
const addItemButton = document.querySelector("#add-item-button");
const requestPartRegistrationButton = document.querySelector("#request-part-registration-button");
const partRegistrationDialog = document.querySelector("#part-registration-dialog");
const partRegistrationForm = document.querySelector("#part-registration-form");
const partRegistrationClose = document.querySelector("#part-registration-close");
const partRegistrationMessage = document.querySelector("#part-registration-message");
const tabButtons = document.querySelectorAll(".tab-button");
const pages = document.querySelectorAll(".page");
const filterButtons = document.querySelectorAll(".filter-button");
const queueEyebrow = document.querySelector("#queue-eyebrow");
const queueTitle = document.querySelector("#queue-title");
const queueSubtitle = document.querySelector("#queue-subtitle");
const managerPendingItems = document.querySelector("#manager-pending-items");
const managerBuyItems = document.querySelector("#manager-buy-items");
const managerServiceRate = document.querySelector("#manager-service-rate");
const historyFilter = document.querySelector("#history-filter");
const historyDateFrom = document.querySelector("#history-date-from");
const historyDateTo = document.querySelector("#history-date-to");
const historyList = document.querySelector("#history-list");
const approvalList = document.querySelector("#approval-list");
const purchaseOverviewList = document.querySelector("#purchase-overview-list");
const userForm = document.querySelector("#user-form");
const userList = document.querySelector("#user-list");
const partRegistrationList = document.querySelector("#part-registration-list");
const slaRequest = document.querySelector("#sla-request");
const slaService = document.querySelector("#sla-service");
const slaBuy = document.querySelector("#sla-buy");

applyTheme(localStorage.getItem(THEME_KEY) || "light");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const rawEmail = loginForm.elements.email.value.trim().toLowerCase();
  const email = emailAliases[rawEmail] || rawEmail;
  const password = loginForm.elements.password.value;
  const account = getAllAccounts()[email];

  if (!account || account.password !== password) {
    loginForm.classList.add("has-error");
    return;
  }

  currentUser = { email, role: account.role, label: roleLabel(account.role), name: account.name };
  if (loginForm.elements.remember.checked) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }

  loginForm.reset();
  loginForm.classList.remove("has-error");
  startApp();
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  body.dataset.view = "login";
  body.dataset.role = "";
});

themeToggle.addEventListener("click", () => {
  const nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

notificationButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const open = notificationPopover.hidden;
  notificationPopover.hidden = !open;
  notificationButton.setAttribute("aria-expanded", String(open));
  if (open) renderNotifications();
});

notificationMarkAll.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const ids = getUserNotifications().map((item) => item.id);
  saveReadNotifications(new Set([...getReadNotifications(), ...ids]));
  notificationButton.classList.remove("has-unread");
  renderNotifications();
});

changePasswordButton.addEventListener("click", () => {
  passwordForm.reset();
  passwordMessage.textContent = "";
  passwordMessage.className = "password-message";
  passwordDialog.showModal();
});

passwordClose.addEventListener("click", () => {
  passwordDialog.close();
});

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  changeOwnPassword(new FormData(passwordForm));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const items = collectItems();

  if (items.length === 0) {
    addItemLine();
    return;
  }

  const request = {
    id: makeCode(),
    bus: data.get("bus").trim(),
    items,
    priority: data.get("priority"),
    reason: data.get("reason").trim(),
    status: "solicitacao",
    response: "",
    createdAt: new Date().toISOString(),
    requestedBy: currentUser.name || currentUser.label,
    requestedByEmail: currentUser.email,
    almoxBy: "",
    almoxByEmail: "",
  };

  requests = [request, ...requests];
  saveRequests();

  openEmailDraft(request, "");

  form.reset();
  resetItemLines();
  currentFilter = "solicitacao";
  syncFilterButtons();
  setPage("pending");
  render();
});

addItemButton.addEventListener("click", () => addItemLine());

requestPartRegistrationButton.addEventListener("click", () => openPartRegistrationDialog());

partRegistrationClose.addEventListener("click", () => {
  partRegistrationDialog.close();
});

partRegistrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createPartRegistration(new FormData(partRegistrationForm));
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setPage(button.dataset.page));
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    syncFilterButtons();
    render();
  });
});

historyFilter.addEventListener("input", () => renderHistory());
historyDateFrom.addEventListener("change", () => renderHistory());
historyDateTo.addEventListener("change", () => renderHistory());
userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(userForm);
  const email = data.get("email").trim().toLowerCase();
  const role = data.get("role");
  const user = {
    email,
    password: data.get("password").trim() || "1234",
    role,
    label: roleLabel(role),
    name: data.get("name").trim(),
  };

  managedUsers = managedUsers.filter((item) => item.email !== email);
  managedUsers.push(user);
  deletedUsers = deletedUsers.filter((item) => item !== email);
  saveManagedUsers();
  saveDeletedUsers();
  userForm.reset();
  userForm.elements.password.value = "1234";
  renderUsers();
});

userList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-user-action]");
  if (!button) return;

  const row = button.closest(".user-row");
  const email = row?.dataset.email;
  if (!email) return;

  if (button.dataset.userAction === "save-password") {
    updateUserAccess(email, row.querySelector(".user-password").value, row.querySelector(".user-role").value);
  }

  if (button.dataset.userAction === "delete-user") {
    deleteUser(email);
  }
});

partRegistrationList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-part-action]");
  if (!button) return;

  const row = button.closest(".part-registration-row");
  const id = row?.dataset.id;
  if (!id) return;

  if (button.dataset.partAction === "save") {
    completePartRegistration(id, row.querySelector(".created-part-code").value);
  }

  if (button.dataset.partAction === "delete") {
    deletePartRegistration(id);
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".part-search")) {
    document.querySelectorAll(".suggestions").forEach((box) => box.classList.remove("open"));
  }
  if (!event.target.closest(".notification-wrap")) {
    notificationPopover.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});

if (currentUser) {
  startApp();
} else {
  body.dataset.view = "login";
}

async function startApp() {
  body.dataset.view = "app";
  body.dataset.role = currentUser.role;
  sessionLabel.textContent = `${currentUser.label} | ${currentUser.email}`;
  userGreeting.textContent = getUserGreeting(currentUser);
  currentPage = currentUser.role === "pcm" ? "request" : currentUser.role === "compras" ? "purchase" : "pending";
  currentFilter = currentUser.role === "cd" ? "cd" : "solicitacao";
  resetItemLines();
  await syncFromSupabase();
  setPage(currentPage);
  render();
}

function getUserGreeting(user) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return `${period}, ${getFirstName(user)}`;
}

function getFirstName(user) {
  const rawName = user.name || user.email || "";
  const first = String(rawName).split(/[.\s_]+/).filter(Boolean)[0] || "usuario";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function setPage(page) {
  currentPage = page;
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.page === page));
  pages.forEach((section) => section.classList.toggle("active", section.id === `page-${page}`));
  if (page === "history") renderHistory();
  if (page === "approval") renderApprovalQueue();
  if (page === "purchase") renderPurchaseOverview();
  if (page === "admin") renderUsers();
}

function goToWorkQueue(filter) {
  currentFilter = filter;
  syncFilterButtons();
  setPage("pending");
  render();
}

function getReadNotifications() {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || "{}");
    return new Set(all[currentUser?.email] || []);
  } catch {
    return new Set();
  }
}

function saveReadNotifications(readSet) {
  const all = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || "{}");
  all[currentUser.email] = [...readSet];
  localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(all));
}

function getUserNotifications() {
  if (!currentUser) return [];
  const notifications = [];
  const push = (request, type, title, filter, page = "pending") => {
    const items = getNotificationItemCount(request, filter);
    notifications.push({
      id: `${request.id}:${type}:${request.status}:${items}`,
      requestId: request.id,
      title,
      description: `${request.id} | Prefixo ${request.bus} | ${items} item(ns)`,
      filter,
      page,
      items,
    });
  };

  requests.forEach((request) => {
    const isMine = request.requestedByEmail === currentUser.email || request.requestedBy === currentUser.name;
    if (currentUser.role === "pcm" && isMine && hasPickupPending(request)) {
      push(request, "retirada", "Item liberado para retirada", "atendimento");
    }
    if (currentUser.role === "almox") {
      if (request.status === "solicitacao") push(request, "almox", "Pendente atendimento do Almoxarifado", "solicitacao");
      if (request.status === "recebimento") push(request, "recebimento", "Pendente entrada e recebimento", "recebimento");
      if (hasPickupPending(request)) push(request, "retirada", "Retirada PCM pendente", "atendimento");
    }
    if (currentUser.role === "cd" && request.status === "cd") {
      push(request, "cd", "Pendente atendimento do CD", "cd");
    }
    if (currentUser.role === "compras" && request.status === "compra" && getPurchasePendingQtySum(request) > 0) {
      push(request, "compra", "Pendente pedido de compra", "compra", "purchase");
    }
    if ((currentUser.role === "manager" || currentUser.role === "admin") && request.status === "aprovacao") {
      push(request, "aprovacao", "Compra aguardando aprovação", "compra", "approval");
    }
  });

  return notifications;
}

function getNotificationItemCount(request, filter) {
  if (filter === "atendimento") return request.items.filter(isPickupItemPending).length;
  if (filter === "recebimento") return request.items.filter((item) => getPurchasePendingQty(item) > 0 || Number(item.cdQty) > 0).length;
  if (filter === "compra") return request.items.filter((item) => getPurchasePendingQty(item) > 0).length;
  if (filter === "cd") return request.items.filter((item) => getCdPendingQty(item) > 0).length;
  return request.items.length;
}

function updateNotificationBadge() {
  const read = getReadNotifications();
  const notifications = getUserNotifications();
  const unread = notifications.filter((item) => !read.has(item.id));
  const pendingItems = notifications.reduce((sum, item) => sum + item.items, 0);
  notificationCount.textContent = pendingItems;
  notificationButton.classList.toggle("has-unread", unread.length > 0);
  notificationButton.title = `${pendingItems} item(ns) pendente(s) para você`;
  if (!notificationPopover.hidden) renderNotifications();
}

function renderNotifications() {
  const read = getReadNotifications();
  const notifications = getUserNotifications();
  if (notifications.length === 0) {
    notificationList.innerHTML = '<div class="notification-empty">Nenhuma pendência para você.</div>';
    notificationCount.textContent = "0";
    notificationButton.classList.remove("has-unread");
    return;
  }
  notificationList.innerHTML = notifications.map((item) => `
    <button class="notification-item ${read.has(item.id) ? "read" : "unread"}" type="button" data-id="${item.id}" data-filter="${item.filter}" data-page="${item.page}">
      <strong>${item.title}</strong>
      <span>${item.description}</span>
    </button>
  `).join("");
  notificationList.querySelectorAll(".notification-item").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const nextRead = getReadNotifications();
      nextRead.add(button.dataset.id);
      saveReadNotifications(nextRead);
      notificationPopover.hidden = true;
      notificationButton.setAttribute("aria-expanded", "false");
      navigateFromNotification(button.dataset.page, button.dataset.filter);
      updateNotificationBadge();
    });
  });
}

function navigateFromNotification(page, filter) {
  if (page === "purchase") {
    setPage("purchase");
    return;
  }
  if (page === "approval") {
    setPage("approval");
    return;
  }
  goToWorkQueue(filter);
}

function loadRequests() {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (!stored) return seedRequests;

  try {
    return JSON.parse(stored).map(normalizeRequest);
  } catch {
    return seedRequests;
  }
}

function normalizeRequest(request) {
  const normalizedStatus = normalizeStatus(request.status, request.items || []);
  if (request.items) {
    return {
      ...request,
      status: normalizedStatus || calculateStatus(request.items),
      purchaseOrder: request.purchaseOrder || "",
      deliveryDate: request.deliveryDate || "",
      purchaseArrivedDate: request.purchaseArrivedDate || "",
      purchaseArrivedAt: request.purchaseArrivedAt || "",
      receiptNumber: request.receiptNumber || "",
      receiptAt: request.receiptAt || request.purchaseArrivedAt || "",
      receiptBy: request.receiptBy || "",
      receiptByEmail: request.receiptByEmail || "",
      purchaseApprovalRequestedAt: request.purchaseApprovalRequestedAt || "",
      purchaseApprovedAt: request.purchaseApprovedAt || "",
      purchaseApprovedBy: request.purchaseApprovedBy || "",
      attendedAt: request.attendedAt || request.answeredAt || "",
      purchaseAt: request.purchaseAt || "",
      pickupAt: request.pickupAt || "",
      withdrawnAt: request.withdrawnAt || "",
      requestedBy: request.requestedBy || "PCM",
      requestedByEmail: request.requestedByEmail || "",
      almoxBy: request.almoxBy || "",
      almoxByEmail: request.almoxByEmail || "",
      cdBy: request.cdBy || "",
      cdByEmail: request.cdByEmail || "",
      cdAt: request.cdAt || "",
      transferInvoiceName: request.transferInvoiceName || "",
      transferInvoiceDataUrl: request.transferInvoiceDataUrl || "",
      receiptInvoiceName: request.receiptInvoiceName || "",
      receiptInvoiceDataUrl: request.receiptInvoiceDataUrl || "",
      items: request.items.map((item) => normalizeItem(item, normalizedStatus)),
    };
  }
  return {
    ...request,
    status: normalizedStatus,
    purchaseOrder: request.purchaseOrder || "",
    deliveryDate: request.deliveryDate || "",
    purchaseArrivedDate: request.purchaseArrivedDate || "",
    purchaseArrivedAt: request.purchaseArrivedAt || "",
    receiptNumber: request.receiptNumber || "",
    receiptAt: request.receiptAt || request.purchaseArrivedAt || "",
    receiptBy: request.receiptBy || "",
    receiptByEmail: request.receiptByEmail || "",
    purchaseApprovalRequestedAt: request.purchaseApprovalRequestedAt || "",
    purchaseApprovedAt: request.purchaseApprovedAt || "",
    purchaseApprovedBy: request.purchaseApprovedBy || "",
    attendedAt: request.attendedAt || "",
    purchaseAt: request.purchaseAt || "",
    pickupAt: request.pickupAt || "",
    withdrawnAt: request.withdrawnAt || "",
    requestedBy: request.requestedBy || "PCM",
    requestedByEmail: request.requestedByEmail || "",
    almoxBy: request.almoxBy || "",
    almoxByEmail: request.almoxByEmail || "",
    cdBy: request.cdBy || "",
    cdByEmail: request.cdByEmail || "",
    cdAt: request.cdAt || "",
    transferInvoiceName: request.transferInvoiceName || "",
    transferInvoiceDataUrl: request.transferInvoiceDataUrl || "",
    receiptInvoiceName: request.receiptInvoiceName || "",
    receiptInvoiceDataUrl: request.receiptInvoiceDataUrl || "",
    items: [normalizeItem({ code: "", description: request.part || "Peça sem descrição", quantity: request.quantity || 1 }, normalizedStatus)],
  };
}

function normalizeStatus(status, items = []) {
  if (status === "solicitacao" || status === "cd" || status === "atendimento" || status === "aprovacao" || status === "compra" || status === "recebimento" || status === "reprovado" || status === "retirado") return status;
  if (status === "pendente") return "solicitacao";
  if (status === "estoque" || status === "atendida") return "atendimento";
  if (status === "compra" || status === "parcial") return "compra";
  return calculateStatus(items);
}

function normalizeItem(item, requestStatus = "solicitacao") {
  const quantity = Number(item.quantity) || 1;
  if (Number.isFinite(Number(item.availableQty)) && Number.isFinite(Number(item.purchaseQty))) {
    return { ...item, quantity, availableQty: Number(item.availableQty), cdQty: Number(item.cdQty) || 0, purchaseQty: Number(item.purchaseQty), withdrawnQty: Number(item.withdrawnQty) || 0, purchaseApproval: item.purchaseApproval || "" };
  }

  if (requestStatus === "atendimento" || requestStatus === "retirado") {
    return { ...item, quantity, availableQty: quantity, cdQty: 0, purchaseQty: 0, withdrawnQty: requestStatus === "retirado" ? quantity : 0, purchaseApproval: item.purchaseApproval || "" };
  }

  if (requestStatus === "compra") {
    return { ...item, quantity, availableQty: 0, cdQty: 0, purchaseQty: quantity, withdrawnQty: 0, purchaseApproval: item.purchaseApproval || "approved" };
  }

  return { ...item, quantity, availableQty: 0, cdQty: 0, purchaseQty: 0, withdrawnQty: 0, purchaseApproval: item.purchaseApproval || "" };
}

async function syncFromSupabase() {
  if (!supabaseClient) return;

  try {
    const [remoteRequests, remoteUsers, remoteDeletedUsers, remoteCustomParts, remotePartRegistrations] = await Promise.all([
      loadSupabaseRows("manupecas_requests", "id"),
      loadSupabaseRows("manupecas_users", "email"),
      loadSupabaseDeletedUsers(),
      loadSupabaseRows("manupecas_custom_parts", "code"),
      loadSupabaseRows("manupecas_part_registrations", "id"),
    ]);

    if (remoteRequests) {
      requests = remoteRequests.map(normalizeRequest).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    }
    if (remoteUsers) {
      managedUsers = remoteUsers;
      localStorage.setItem(USERS_KEY, JSON.stringify(managedUsers));
    }
    if (remoteDeletedUsers) {
      deletedUsers = remoteDeletedUsers;
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deletedUsers));
    }
    if (remoteCustomParts) {
      customParts = remoteCustomParts;
      localStorage.setItem(CUSTOM_PARTS_KEY, JSON.stringify(customParts));
    }
    if (remotePartRegistrations) {
      partRegistrations = remotePartRegistrations;
      localStorage.setItem(PART_REGISTRATIONS_KEY, JSON.stringify(partRegistrations));
    }
  } catch (error) {
    console.warn("Supabase indisponível. Usando dados locais.", error);
  }
}

async function loadSupabaseRows(table, keyField) {
  const { data, error } = await supabaseClient.from(table).select(`${keyField}, data`);
  if (error) {
    console.warn(`Erro ao carregar ${table}:`, error.message);
    return null;
  }
  return (data || []).map((row) => row.data).filter(Boolean);
}

async function loadSupabaseDeletedUsers() {
  const { data, error } = await supabaseClient.from("manupecas_deleted_users").select("email");
  if (error) {
    console.warn("Erro ao carregar usuários excluídos:", error.message);
    return null;
  }
  return (data || []).map((row) => row.email).filter(Boolean);
}

function upsertSupabaseRows(table, keyField, rows) {
  if (!supabaseClient) return;
  const payload = rows.map((row) => ({ [keyField]: row[keyField], data: row, updated_at: new Date().toISOString() }));
  supabaseClient.from(table).upsert(payload, { onConflict: keyField }).then(({ error }) => {
    if (error) console.warn(`Erro ao salvar ${table}:`, error.message);
  });
}

function replaceSupabaseDeletedUsers() {
  if (!supabaseClient) return;
  supabaseClient.from("manupecas_deleted_users").delete().neq("email", "__never__").then(({ error }) => {
    if (error) {
      console.warn("Erro ao limpar usuários excluídos:", error.message);
      return;
    }
    if (deletedUsers.length === 0) return;
    supabaseClient.from("manupecas_deleted_users").upsert(deletedUsers.map((email) => ({ email, updated_at: new Date().toISOString() })), { onConflict: "email" });
  });
}

function deleteSupabaseRow(table, keyField, keyValue) {
  if (!supabaseClient) return;
  supabaseClient.from(table).delete().eq(keyField, keyValue).then(({ error }) => {
    if (error) console.warn(`Erro ao excluir ${table}:`, error.message);
  });
}

function saveRequests() {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  upsertSupabaseRows("manupecas_requests", "id", requests);
}

function loadManagedUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];

  try {
    const genericUsers = new Set(["pcm@empresa.com.br", "almox@empresa.com.br", "cd@empresa.com.br", "gerente@empresa.com.br", "admin@empresa.com.br"]);
    return JSON.parse(stored).filter((user) => !genericUsers.has(String(user.email || "").toLowerCase()));
  } catch {
    return [];
  }
}

function saveManagedUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(managedUsers));
  upsertSupabaseRows("manupecas_users", "email", managedUsers);
}

function loadDeletedUsers() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDeletedUsers() {
  localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deletedUsers));
  replaceSupabaseDeletedUsers();
}

function loadCustomParts() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_PARTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomParts() {
  localStorage.setItem(CUSTOM_PARTS_KEY, JSON.stringify(customParts));
  upsertSupabaseRows("manupecas_custom_parts", "code", customParts);
}

function loadPartRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(PART_REGISTRATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePartRegistrations() {
  localStorage.setItem(PART_REGISTRATIONS_KEY, JSON.stringify(partRegistrations));
  upsertSupabaseRows("manupecas_part_registrations", "id", partRegistrations);
}

function getAvailableParts() {
  const seen = new Set();
  return [...customParts, ...partsCatalog].filter((part) => {
    const code = String(part.code || "").trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

function getAllAccounts() {
  const merged = managedUsers.reduce(
    (acc, user) => {
      acc[user.email] = user;
      return acc;
    },
    { ...accounts }
  );
  deletedUsers.forEach((email) => {
    delete merged[email];
  });
  return merged;
}

function roleLabel(role) {
  const labels = {
    pcm: "PCM",
    almox: "Almoxarife",
    cd: "CD",
    compras: "Compras",
    manager: "Gerente",
    admin: "Admin",
  };
  return labels[role] || role;
}

function loadSession() {
  const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    const account = getAllAccounts()[session.email];
    return account ? { ...session, role: account.role, label: roleLabel(account.role), name: account.name } : null;
  } catch {
    return null;
  }
}

function resetItemLines() {
  itemLines.innerHTML = "";
  addItemLine();
}

function addItemLine() {
  const line = itemTemplate.content.firstElementChild.cloneNode(true);
  const searchInput = line.querySelector('[name="partLookup"]');
  const suggestions = line.querySelector(".suggestions");

  searchInput.addEventListener("input", () => {
    searchInput.setCustomValidity("");
    updateSuggestions(line);
  });
  searchInput.addEventListener("focus", () => updateSuggestions(line));
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") suggestions.classList.remove("open");
  });

  line.querySelector(".remove-item").addEventListener("click", () => {
    if (itemLines.children.length > 1) line.remove();
  });

  itemLines.append(line);
}

function updateSuggestions(line) {
  const input = line.querySelector('[name="partLookup"]');
  const suggestions = line.querySelector(".suggestions");
  const query = input.value.trim().toLowerCase();
  suggestions.innerHTML = "";

  if (query.length < 2) {
    suggestions.classList.remove("open");
    return;
  }

  const matches = findParts(query, 12);
  matches.forEach((part) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${part.code}</strong><span>${part.description}</span>`;
    button.addEventListener("click", () => {
      input.value = `${part.code} - ${part.description}`;
      input.dataset.code = part.code;
      input.dataset.description = part.description;
      suggestions.classList.remove("open");
    });
    suggestions.append(button);
  });

  if (matches.length === 0) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggest-registration";
    button.innerHTML = `<strong>Solicitar cadastro</strong><span>${escapeHtml(input.value.trim())}</span>`;
    button.addEventListener("click", () => {
      suggestions.classList.remove("open");
      openPartRegistrationDialog(input.value.trim());
    });
    suggestions.append(button);
  }

  suggestions.classList.toggle("open", matches.length > 0 || query.length >= 2);
}

function findParts(query, limit) {
  const starts = [];
  const contains = [];

  for (const part of getAvailableParts()) {
    const code = String(part.code).toLowerCase();
    const description = String(part.description).toLowerCase();
    if (code.startsWith(query) || description.startsWith(query)) {
      starts.push(part);
    } else if (code.includes(query) || description.includes(query)) {
      contains.push(part);
    }
    if (starts.length >= limit) break;
  }

  return [...starts, ...contains].slice(0, limit);
}

function collectItems() {
  const lines = [...itemLines.querySelectorAll(".item-line")];
  const items = [];
  let hasInvalidPart = false;

  for (const line of lines) {
      const input = line.querySelector('[name="partLookup"]');
      const lookup = input.value.trim();
      const quantity = Number(line.querySelector('[name="partQuantity"]').value);
      if (!lookup || quantity < 1) continue;
      const part = resolvePart(input);
      if (!part) {
        input.setCustomValidity("Peça não cadastrada. Solicite o cadastro antes de abrir a solicitação.");
        input.reportValidity();
        hasInvalidPart = true;
        break;
      }
      items.push({ ...part, quantity, availableQty: 0, cdQty: 0, purchaseQty: 0 });
  }

  return hasInvalidPart ? [] : items;
}

function resolvePart(input) {
  if (input.dataset.code && input.dataset.description) {
    return { code: input.dataset.code, description: input.dataset.description };
  }

  const value = input.value.trim();
  const normalized = value.toLowerCase();
  const found = getAvailableParts().find((part) => {
    const full = `${part.code} - ${part.description}`.toLowerCase();
    return normalized === String(part.code).toLowerCase() || normalized === String(part.description).toLowerCase() || normalized === full;
  });

  if (found) return found;

  return null;
}

function makeCode() {
  const nextNumber = requests.reduce((max, request) => {
    const match = String(request.id || "").match(/^BP\s*-\s*(\d+)$/i);
    return match ? Math.max(max, Number(match[1]) || 0) : max;
  }, 0) + 1;
  return `BP - ${String(nextNumber).padStart(4, "0")}`;
}

function render() {
  if (!currentUser) return;

  updateCopy();
  updateMetrics();
  updateNotificationBadge();
  if (currentPage === "history") {
    renderHistory();
    return;
  }
  if (currentPage === "admin") {
    renderUsers();
    renderPartRegistrations();
    return;
  }
  if (currentPage === "approval") {
    renderApprovalQueue();
    return;
  }
  if (currentPage === "purchase") {
    renderPurchaseOverview();
    return;
  }
  list.innerHTML = "";

  const visible = requests.filter((request) => {
    if (currentUser.role === "pcm") {
      const isMine = request.requestedByEmail === currentUser.email || request.requestedBy === currentUser.name;
      if (!isMine) return false;
      if (currentFilter === "atendimento") return hasPickupPending(request);
      if (currentFilter === "compra") return request.status === "aprovacao" || request.status === "compra" || request.status === "recebimento" || request.status === "reprovado";
      return request.status === currentFilter;
    }
    if (currentUser.role === "cd") return request.status === "cd";
    if (currentUser.role === "almox" && currentFilter === "recebimento") {
      return request.status === "recebimento";
    }
    if (currentUser.role === "almox" && currentFilter === "atendimento") {
      return request.status === "atendimento" || hasPickupPending(request);
    }
    if (currentUser.role === "almox" && currentFilter === "compra") {
      return request.status === "aprovacao" || request.status === "compra" || request.status === "recebimento";
    }
    return request.status === currentFilter;
  });

  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma solicitação encontrada para este filtro.";
    list.append(empty);
    return;
  }

  visible.forEach((request) => list.append(createCard(request)));
}

function createCard(request) {
  const card = requestTemplate.content.firstElementChild.cloneNode(true);
  const pickupMode = currentUser.role === "almox" && currentFilter === "atendimento" && hasPickupPending(request);
  const pickupOnlyView = currentFilter === "atendimento" && (currentUser.role === "almox" || currentUser.role === "pcm") && hasPickupPending(request);
  const displayItems = pickupOnlyView ? request.items.filter(isPickupItemPending) : request.items;
  const status = card.querySelector(".status-pill");
  const response = card.querySelector(".response");
  const note = card.querySelector("textarea");
  const partsList = card.querySelector(".parts-list");
  const fulfillmentPanel = card.querySelector(".fulfillment-panel");
  const fulfillmentList = card.querySelector(".fulfillment-list");
  const emailButton = card.querySelector(".email-response");
  const purchaseWorkflow = card.querySelector(".purchase-workflow");
  const purchaseTitle = card.querySelector(".purchase-title");
  const purchaseItems = card.querySelector(".purchase-items");
  const purchaseOrderInput = card.querySelector(".purchase-order");
  const deliveryDateInput = card.querySelector(".delivery-date");
  const arrivalDateInput = card.querySelector(".arrival-date");
  const purchaseSaveButton = card.querySelector(".purchase-save");
  const purchaseEmailButton = card.querySelector(".purchase-email");
  const purchaseArrivalButton = card.querySelector(".purchase-arrival");
  const transferInvoiceInput = card.querySelector(".transfer-invoice");
  const invoiceName = card.querySelector(".invoice-name");
  const receiptNumberInput = card.querySelector(".receipt-number");
  const receiptPasswordInput = card.querySelector(".receipt-password");
  const receiptMessage = card.querySelector(".receipt-message");

  status.textContent = pickupOnlyView ? statusText.atendimento : statusText[request.status];
  status.className = `status-pill status-${pickupOnlyView ? "atendimento" : request.status}`;
  card.querySelector(".request-summary").addEventListener("click", () => card.classList.toggle("expanded"));
  card.querySelector(".request-code").textContent = request.id;
  card.querySelector("h3").textContent = displayItems.map((item) => item.description).join(", ");
  card.querySelector(".sla-pill").textContent = `SLA ${formatDuration(request.createdAt, new Date().toISOString())}`;
  card.querySelector(".bus-summary").textContent = `Prefixo ${request.bus}`;
  card.querySelector(".items-summary").textContent = `${displayItems.length} item(ns)`;
  card.querySelector(".priority-summary").textContent = request.priority;
  card.querySelector(".bus").textContent = request.bus;
  card.querySelector(".quantity").textContent = displayItems.length;
  card.querySelector(".priority").textContent = request.priority;
  card.querySelector(".created").textContent = formatDate(request.createdAt);
  card.querySelector(".requester").textContent = request.requestedBy || "-";
  card.querySelector(".warehouse-user").textContent = request.almoxBy || "-";
  card.querySelector(".reason").textContent = request.reason;
  response.textContent = request.response;
  note.value = request.response;
  purchaseTitle.textContent = request.status === "recebimento" ? "Recebimento e entrada SAP" : "Compra";
  purchaseOrderInput.value = request.purchaseOrder || "";
  purchaseOrderInput.readOnly = currentUser.role !== "compras" || Boolean(request.purchaseOrder);
  deliveryDateInput.value = request.deliveryDate || "";
  arrivalDateInput.value = request.purchaseArrivedDate || "";
  invoiceName.textContent = request.transferInvoiceName ? `NF anexada: ${request.transferInvoiceName}` : "";
  receiptNumberInput.value = request.receiptNumber || "";
  receiptMessage.textContent = request.receiptNumber ? `Recebimento registrado: ${request.receiptNumber}` : "";
  card.querySelector(".transfer-invoice-field").hidden = true;
  card.querySelector(".receipt-number-field").hidden = request.status !== "recebimento";
  card.querySelector(".receipt-password-field").hidden = request.status !== "recebimento";
  deliveryDateInput.closest(".field").hidden = true;
  card.querySelector(".purchase-arrival-field").hidden = request.status !== "recebimento";
  arrivalDateInput.disabled = true;
  purchaseWorkflow.classList.remove("active");
  card.querySelector(".process-map").innerHTML = createProcessMap(request);

  request.items.forEach((item, index) => {
    if (pickupOnlyView && !isPickupItemPending(item)) return;
    if (currentUser.role === "cd" && getCdPendingQty(item) <= 0) return;
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <small class="item-status">${getItemStageStatus(request, item)}</small>
      <div class="qty-stack ${getQtyStepClass(request, item, "requested")}">
        <b>${item.quantity}</b><small>solicitado</small>
      </div>
      <div class="qty-stack ${getQtyStepClass(request, item, "almox")}">
        <b>${item.availableQty || 0}</b><small>estoque</small>
      </div>
      <div class="qty-stack ${getQtyStepClass(request, item, "cd")}">
        <b>${item.cdQty || 0}</b><small>CD</small>
      </div>
      <div class="qty-stack ${getQtyStepClass(request, item, "purchase")}">
        <b>${getPurchasePendingQty(item)}</b><small>compra</small>
      </div>
      <div class="qty-stack ${getQtyStepClass(request, item, "withdrawn")}">
        <b>${getWithdrawnQty(item)}</b><small>retirado</small>
      </div>
    `;
    partsList.append(li);
    if (request.status !== "compra" && request.status !== "aprovacao" && request.status !== "recebimento" && !pickupMode) {
      fulfillmentList.append(currentUser.role === "cd" ? createCdFulfillmentLine(item, index) : createFulfillmentLine(item, index));
    }
  });

  if (request.status === "aprovacao") {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.remove("active");
  }

  if (request.status === "compra" || request.status === "recebimento") {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.add("active");
    card.querySelector(".transfer-invoice-field").hidden = true;
  }

  if (request.status !== "compra" && request.status !== "aprovacao" && request.status !== "recebimento" && currentUser.role === "cd") {
    card.querySelector(".save-fulfillment").hidden = true;
    emailButton.innerHTML = "<span>1</span> Salvar e enviar e-mail";
    emailButton.disabled = false;
    emailButton.title = "Salvar atendimento do CD e abrir e-mail para o Almoxarifado";
    card.querySelector(".reset").hidden = true;
    card.querySelector(".transfer-invoice-field").hidden = false;
    card.querySelector(".response-email").closest(".field").querySelector("label").textContent = "E-mail do Almoxarifado";
    card.querySelector(".fulfillment-panel > label").firstChild.textContent = "Observação do CD";
    transferInvoiceInput.addEventListener("change", () => {
      invoiceName.textContent = transferInvoiceInput.files.length ? `NF selecionada: ${transferInvoiceInput.files[0].name}` : "";
    });
    emailButton.addEventListener("click", () => {
      saveCdFulfillment(request.id, card, true);
    });
  } else if (request.status !== "compra" && request.status !== "aprovacao" && request.status !== "recebimento") {
    card.querySelector(".transfer-invoice-field").hidden = true;
    card.querySelector(".save-fulfillment").addEventListener("click", () => {
      saveFulfillment(request.id, card, false);
    });

    card.querySelector(".email-response").addEventListener("click", () => {
      saveFulfillment(request.id, card, true);
    });

    emailButton.disabled = !request.answeredAt;
    emailButton.title = request.answeredAt ? "Enviar retorno por e-mail" : "Salve o atendimento antes de enviar o e-mail";

    card.querySelector(".reset").addEventListener("click", () => {
      updateRequest(request.id, "solicitacao", note.value || "");
    });

    if (pickupMode) {
      fulfillmentList.hidden = true;
      card.querySelector(".response-email").closest(".field").hidden = true;
      card.querySelector(".save-fulfillment").hidden = true;
      emailButton.hidden = true;
      card.querySelector(".reset").hidden = true;
      card.querySelector(".fulfillment-panel > label").firstChild.textContent = "Observação da retirada";
    }
  }

  if (pickupMode) {
    fulfillmentPanel.hidden = false;
    fulfillmentList.hidden = true;
    card.querySelector(".response-email").closest(".field").hidden = true;
    card.querySelector(".save-fulfillment").hidden = true;
    emailButton.hidden = true;
    card.querySelector(".reset").hidden = true;
    card.querySelector(".fulfillment-panel > label").firstChild.textContent = "Observação da retirada";
    purchaseWorkflow.classList.remove("active");
  }

  const purchaseLines = request.status === "recebimento"
    ? request.items.filter((item) => getPurchasePendingQty(item) > 0 || Number(item.cdQty) > 0)
    : request.items.filter((item) => getPurchasePendingQty(item) > 0);
  fulfillmentPanel.hidden = (request.status === "compra" || request.status === "aprovacao" || request.status === "recebimento") && !pickupMode ? true : false;
  purchaseWorkflow.classList.toggle("active", ((request.status === "compra" && currentUser.role === "compras") || (request.status === "recebimento" && currentUser.role === "almox")) && !pickupMode);
  if (currentUser.role === "cd") purchaseWorkflow.classList.remove("active");
  purchaseItems.innerHTML = purchaseLines.length
    ? purchaseLines.map((item) => {
      return `<div>
        <strong>${item.code}</strong>
        <span>${item.description}</span>
        <em>${request.status === "recebimento" ? `${(Number(item.cdQty) || 0) + getPurchasePendingQty(item)} un. para entrada e recebimento` : `${getPurchasePendingQty(item)} un. para compra`}</em>
      </div>`;
    }).join("")
    : `<div><span>${request.status === "recebimento" ? "Nenhum item pendente de entrada e recebimento." : "Nenhum item pendente de compra."}</span></div>`;
  purchaseSaveButton.addEventListener("click", () => savePurchaseOrder(request.id, card, false));
  purchaseEmailButton.addEventListener("click", () => savePurchaseOrder(request.id, card, true));
  purchaseArrivalButton.addEventListener("click", () => confirmReceiptEntry(request.id, card));
  purchaseSaveButton.textContent = request.purchaseOrder ? "Atualizar data de chegada" : "Salvar pedido de compra";
  purchaseSaveButton.hidden = request.status !== "compra" || currentUser.role !== "compras";
  purchaseEmailButton.hidden = request.status !== "compra" || currentUser.role !== "compras";
  purchaseArrivalButton.hidden = request.status !== "recebimento" || currentUser.role !== "almox";
  purchaseOrderInput.closest(".field").hidden = request.status === "recebimento" && !request.purchaseOrder;
  deliveryDateInput.closest(".field").hidden = request.status !== "compra";
  purchaseEmailButton.disabled = !request.purchaseOrder;
  purchaseEmailButton.title = request.purchaseOrder ? "Enviar e-mail com pedido SAP" : "Informe e salve o pedido SAP antes de enviar";
  purchaseArrivalButton.disabled = !request.purchaseOrder && getPurchasePendingQtySum(request) > 0;
  purchaseArrivalButton.title = request.purchaseOrder || getCdReceivedQtySum(request) > 0 ? "Confirmar recebimento, entrada SAP e liberar retirada" : "Aguardando pedido de compra ou transferência do CD";

  if (pickupMode) {
    const doneButton = document.createElement("button");
    doneButton.className = "action reset";
    doneButton.type = "button";
    doneButton.textContent = "Confirmar retirada do PCM";
    doneButton.addEventListener("click", () => {
      if (confirmAlmoxPassword()) {
        markWithdrawn(request.id, note.value || "Itens retirados pelo PCM.");
      }
    });
    card.querySelector(".action-grid").append(doneButton);
  }

  return card;
}

function createFulfillmentLine(item, index) {
  const row = document.createElement("div");
  row.className = "fulfillment-row";
  row.dataset.code = item.code;
  row.dataset.index = index;
  const wms = getWmsSummary(item.code);
  row.innerHTML = `
    <div>
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <em>Solicitado: ${item.quantity}</em>
      <span class="inventory-badges">
        <small class="pending-owner">Pendente Almoxarifado</small>
        <small class="${wms.found ? "wms-found" : "wms-missing"}">${wms.text}</small>
      </span>
    </div>
    <label>
      Atende
      <input name="availableQty" type="number" min="0" max="${item.quantity}" value="${item.availableQty || 0}" />
    </label>
    <label>
      Vai ao CD
      <input name="cdPendingQty" type="number" min="0" max="${item.quantity}" value="${getCdPendingQty(item)}" readonly />
    </label>
  `;
  row.querySelector('[name="availableQty"]').addEventListener("input", (event) => {
    const availableQty = clampQty(event.target.value, item.quantity);
    row.querySelector('[name="cdPendingQty"]').value = Math.max(0, item.quantity - availableQty);
  });
  return row;
}

function createCdFulfillmentLine(item, index) {
  const row = document.createElement("div");
  row.className = "fulfillment-row cd-row";
  row.dataset.code = item.code;
  row.dataset.index = index;
  const cd = getCdWmsSummary(item.code);
  const pendingCd = getCdPendingQty(item);
  row.innerHTML = `
    <div>
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <em>Pendente para o CD: ${pendingCd}</em>
      <span class="inventory-badges">
        <small class="pending-owner">Pendente CD</small>
        <small class="${cd.found ? "cd-found" : "cd-missing"}">${cd.text}</small>
      </span>
    </div>
    <label>
      Atende CD
      <input name="cdQty" type="number" min="0" max="${pendingCd}" value="${item.cdQty || 0}" />
    </label>
  `;
  return row;
}

function saveFulfillment(id, card, shouldEmail) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  const rowsByIndex = new Map([...card.querySelectorAll(".fulfillment-row")].map((row) => [Number(row.dataset.index), row]));
  const updatedItems = request.items.map((item, index) => {
    const row = rowsByIndex.get(index);
    if (!row) return item;

    const availableQty = clampQty(row.querySelector('[name="availableQty"]').value, item.quantity);
    const remaining = Math.max(0, item.quantity - availableQty);
    const cdPendingQty = remaining;
    const cdQty = 0;
    const purchaseQty = 0;
    return { ...item, availableQty, cdQty, purchaseQty, cdPendingQty };
  });

  const status = calculateAlmoxStatus(updatedItems);
  const note = card.querySelector("textarea").value.trim();
  const response = note || buildResponseText(updatedItems);
  const updatedRequest = { ...request, items: updatedItems, status, response, answeredAt: new Date().toISOString() };
  updatedRequest.attendedAt = updatedRequest.answeredAt;
  updatedRequest.purchaseAt = status === "compra" ? updatedRequest.answeredAt : request.purchaseAt || "";
  updatedRequest.almoxBy = currentUser.name || currentUser.label;
  updatedRequest.almoxByEmail = currentUser.email;

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  saveRequests();

  openAlmoxEmailDraft(updatedRequest, "");

  render();
}

async function saveCdFulfillment(id, card, shouldEmail) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  const rowsByIndex = new Map([...card.querySelectorAll(".fulfillment-row")].map((row) => [Number(row.dataset.index), row]));
  const updatedItems = request.items.map((item, index) => {
    const row = rowsByIndex.get(index);
    if (!row) return item;

    const pendingCd = getCdPendingQty(item);
    const cdQty = clampQty(row.querySelector('[name="cdQty"]').value, pendingCd);
    const purchaseQty = Math.max(0, pendingCd - cdQty);
    return { ...item, cdQty, purchaseQty, cdPendingQty: pendingCd };
  });

  const status = calculateCdStatus(updatedItems);
  const finalItems = updatedItems.map((item) => {
    if (status === "aprovacao" && getPurchaseBaseQty(item) > 0) {
      return { ...item, purchaseApproval: item.purchaseApproval || "pending" };
    }
    return item;
  });
  const note = card.querySelector("textarea").value.trim();
  const response = note || buildCdResponseText(finalItems);
  const invoiceInput = card.querySelector(".transfer-invoice");
  const selectedInvoice = invoiceInput.files.length ? invoiceInput.files[0].name : "";
  const selectedInvoiceDataUrl = invoiceInput.files.length ? await readFileAsDataUrl(invoiceInput.files[0]) : "";
  const transferInvoiceName = selectedInvoice || request.transferInvoiceName || "";
  const transferInvoiceDataUrl = selectedInvoiceDataUrl || request.transferInvoiceDataUrl || "";
  const cdAnsweredQty = updatedItems.reduce((sum, item) => sum + (Number(item.cdQty) || 0), 0);

  if (cdAnsweredQty > 0 && !transferInvoiceName) {
    card.querySelector(".invoice-name").textContent = "Selecione a NF de transferência antes de salvar.";
    return;
  }

  const now = new Date().toISOString();
  const updatedRequest = {
    ...request,
    items: finalItems,
    status,
    response,
    cdAt: now,
    cdBy: currentUser.name || currentUser.label,
    cdByEmail: currentUser.email,
    transferInvoiceName,
    transferInvoiceDataUrl,
    purchaseAt: request.purchaseAt || "",
    purchaseApprovalRequestedAt: status === "aprovacao" ? now : request.purchaseApprovalRequestedAt || "",
    attendedAt: request.attendedAt || now,
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  saveRequests();

  if (shouldEmail) {
    openCdEmailDraft(updatedRequest, "");
  }

  render();
}

function savePurchaseOrder(id, card, shouldEmail) {
  if (currentUser.role !== "compras") return;
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  const purchaseOrder = request.purchaseOrder || card.querySelector(".purchase-order").value.trim();
  const deliveryDate = card.querySelector(".delivery-date").value;
  if (!purchaseOrder) {
    card.querySelector(".purchase-order").focus();
    return;
  }
  const updatedRequest = {
    ...request,
    items: request.items.map((item) => ({ ...item, purchaseQty: getPurchasePendingQty(item) })),
    purchaseOrder,
    deliveryDate,
    response: deliveryDate
      ? `Itens pendentes em compra no SAP. Pedido: ${purchaseOrder}. Previsão de entrega: ${formatDateOnly(deliveryDate)}.`
      : `Itens pendentes enviados para compra no SAP. Pedido: ${purchaseOrder}. Pendente previsão de entrega.`,
    purchaseArrivedDate: deliveryDate || request.purchaseArrivedDate || "",
    status: deliveryDate ? "recebimento" : "compra",
    purchaseAt: request.purchaseAt || new Date().toISOString(),
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  saveRequests();

  if (shouldEmail && purchaseOrder) {
    openPurchaseEmailDraft(updatedRequest, "");
  }

  render();
}

function confirmReceiptEntry(id, card) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  const receiptNumber = card.querySelector(".receipt-number").value.trim();
  const password = card.querySelector(".receipt-password").value;
  const message = card.querySelector(".receipt-message");
  const account = getAllAccounts()[currentUser.email];

  if (!receiptNumber) {
    message.textContent = "Informe o número de recebimento / entrada SAP.";
    return;
  }

  if (!account || account.password !== password) {
    message.textContent = "Senha incorreta. O recebimento não foi registrado.";
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const purchaseArrivedDate = request.deliveryDate || card.querySelector(".arrival-date").value || today;
  const now = new Date().toISOString();
  const items = request.items.map((item) => {
    const purchasedQty = getPurchasePendingQty(item);
    const cdQty = Number(item.cdQty) || 0;
    return {
      ...item,
      availableQty: (Number(item.availableQty) || 0) + purchasedQty + cdQty,
      cdReceivedQty: (Number(item.cdReceivedQty) || 0) + cdQty,
      purchaseReceivedQty: (Number(item.purchaseReceivedQty) || 0) + purchasedQty,
      cdQty: 0,
      purchaseQty: 0,
    };
  });
  const updatedRequest = {
    ...request,
    status: "atendimento",
    items,
    purchaseArrivedDate,
    purchaseArrivedAt: now,
    receiptNumber,
    receiptAt: now,
    receiptBy: currentUser.name || currentUser.label,
    receiptByEmail: currentUser.email,
    response: `Recebimento confirmado pelo Almoxarifado. Entrada SAP: ${receiptNumber}. Data de chegada: ${formatDateOnly(purchaseArrivedDate)}. Retirada liberada para o PCM.`,
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  saveRequests();
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function confirmAlmoxPassword() {
  const account = getAllAccounts()[currentUser.email];
  const password = window.prompt("Confirme sua senha para registrar a retirada pelo PCM.");
  if (password === null) return false;
  if (!account || account.password !== password) {
    window.alert("Senha incorreta. A retirada não foi registrada.");
    return false;
  }
  return true;
}

function markWithdrawn(id, response) {
  requests = requests.map((request) => {
    if (request.id !== id) return request;
    const now = new Date().toISOString();
    const items = request.items.map((item) => {
      const releasable = getPickupReleasedQty(item);
      return { ...item, withdrawnQty: Math.max(getWithdrawnQty(item), releasable) };
    });
    const allWithdrawn = items.every((item) => getWithdrawnQty(item) >= (Number(item.quantity) || 0));
    const nextStatus = allWithdrawn ? "retirado" : request.status;
    return { ...request, items, status: nextStatus, response, pickupAt: request.pickupAt || now, withdrawnAt: allWithdrawn ? now : request.withdrawnAt || "" };
  });
  saveRequests();
  render();
}

function clampQty(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(max, Math.floor(number));
}

function calculateStatus(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.requested += Number(item.quantity) || 0;
      acc.available += Number(item.availableQty) || 0;
      acc.cd += Number(item.cdQty) || 0;
      acc.purchase += getPurchasePendingQty(item);
      return acc;
    },
    { requested: 0, available: 0, cd: 0, purchase: 0 }
  );

  if (totals.purchase > 0) return "aprovacao";
  if (totals.available + totals.cd >= totals.requested && totals.requested > 0) return totals.cd > 0 ? "recebimento" : "atendimento";
  if (totals.available > 0) return "cd";
  return "solicitacao";
}

function calculateAlmoxStatus(items) {
  const requested = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const available = items.reduce((sum, item) => sum + (Number(item.availableQty) || 0), 0);
  if (available >= requested && requested > 0) return "atendimento";
  return "cd";
}

function calculateCdStatus(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.requested += Number(item.quantity) || 0;
      acc.available += Number(item.availableQty) || 0;
      acc.cd += Number(item.cdQty) || 0;
      acc.purchase += getPurchasePendingQty(item);
      return acc;
    },
    { requested: 0, available: 0, cd: 0, purchase: 0 }
  );

  if (totals.purchase > 0) return "aprovacao";
  if (totals.available + totals.cd >= totals.requested && totals.requested > 0) return totals.cd > 0 ? "recebimento" : "atendimento";
  return "cd";
}

function getCdPendingQty(item) {
  if (Number.isFinite(Number(item.cdPendingQty))) return Number(item.cdPendingQty);
  const quantity = Number(item.quantity) || 0;
  const local = Number(item.availableQty) || 0;
  return Math.max(0, quantity - local);
}

function getPurchaseBaseQty(item) {
  const quantity = Number(item.quantity) || 0;
  const local = Number(item.availableQty) || 0;
  const cd = Number(item.cdQty) || 0;
  const purchase = Number(item.purchaseQty) || 0;
  return Math.max(purchase, quantity - local - cd);
}

function getPurchasePendingQty(item) {
  if (item.purchaseApproval === "rejected") return 0;
  return getPurchaseBaseQty(item);
}

function getPurchasePendingQtySum(request) {
  return request.items.reduce((sum, item) => sum + getPurchasePendingQty(item), 0);
}

function getCdReceivedQtySum(request) {
  return request.items.reduce((sum, item) => sum + (Number(item.cdQty) || 0), 0);
}

function getCdServedQty(item) {
  return (Number(item.cdQty) || 0) + (Number(item.cdReceivedQty) || 0);
}

function getPurchaseServedQty(item) {
  return getPurchasePendingQty(item) + (Number(item.purchaseReceivedQty) || 0);
}

function getItemPurchaseStatus(request, item) {
  const need = getPurchaseBaseQty(item);
  if (need <= 0) return "Sem compra";
  if (item.purchaseApproval === "approved") return request.status === "compra" ? "Aprovado para SAP" : "Compra aprovada";
  if (item.purchaseApproval === "rejected") return "Não aprovado";
  if (request.status === "aprovacao") return "Pendente aprovação";
  return "Aguardando aprovação";
}

function getItemStageStatus(request, item) {
  if (getWithdrawnQty(item) >= (Number(item.quantity) || 0)) return "Retirado";
  if (request.status === "recebimento" && ((Number(item.cdQty) || 0) > 0 || getPurchasePendingQty(item) > 0)) return "Pendente entrada e recebimento";
  if (getPurchaseBaseQty(item) > 0) return getItemPurchaseStatus(request, item);
  if (getPickupReleasedQty(item) > 0) return "Liberado para retirada";
  if (request.status === "cd" && getCdPendingQty(item) > 0) return "Pendente CD";
  if (request.status === "solicitacao") return "Pendente Almox";
  return statusText[request.status] || "-";
}

function getWithdrawnQty(item) {
  return Number(item.withdrawnQty) || 0;
}

function getPickupReleasedQty(item) {
  const quantity = Number(item.quantity) || 0;
  const released = (Number(item.availableQty) || 0) + (Number(item.cdQty) || 0);
  return Math.min(quantity, released);
}

function isPickupItemPending(item) {
  return getPickupReleasedQty(item) > getWithdrawnQty(item);
}

function hasPickupPending(request) {
  if (!request.attendedAt) return false;
  if (request.status !== "atendimento" && request.status !== "retirado") return false;
  return request.items.some(isPickupItemPending);
}

function getQtyStepClass(request, item, step) {
  const valueByStep = {
    requested: Number(item.quantity) || 0,
    almox: Number(item.availableQty) || 0,
    cd: Number(item.cdQty) || 0,
    purchase: getPurchasePendingQty(item),
    withdrawn: getWithdrawnQty(item),
  };

  if (step === "requested") return "done";
  if (step === "withdrawn") return getWithdrawnQty(item) > 0 ? "done" : hasPickupPending(request) ? "active" : "idle";
  if (step === "almox" && request.status === "solicitacao") return valueByStep.almox > 0 ? "done" : "active";
  if (step === "almox" && request.attendedAt) return "done";
  if (step === "cd" && request.status === "cd") return getCdPendingQty(item) > 0 ? "active" : valueByStep.cd > 0 ? "done" : "idle";
  if (step === "cd" && request.cdAt) return "done";
  if (step === "purchase" && request.status === "aprovacao") return getPurchaseBaseQty(item) > 0 ? "active" : "idle";
  if (step === "purchase" && request.status === "compra") return valueByStep.purchase > 0 ? "active" : "idle";
  if (step === "purchase" && request.status === "recebimento") return valueByStep.purchase > 0 || valueByStep.cd > 0 ? "active" : "idle";
  if (step === "purchase") return "idle";
  if (valueByStep[step] > 0) return "done";
  return "idle";
}

function formatItemBalance(item) {
  const available = Number(item.availableQty) || 0;
  const cd = Number(item.cdQty) || 0;
  const purchase = getPurchasePendingQty(item);
  if (available === 0 && cd === 0 && purchase === 0) return `${item.quantity} un.`;
  return `${available} estoque | ${cd} CD | ${purchase} compra`;
}

function buildResponseText(items) {
  const available = items.filter((item) => Number(item.availableQty) > 0).length;
  const cdPending = items.filter((item) => getCdPendingQty(item) > 0).length;
  if (available && cdPending) return "Atendimento parcial: itens com estoque local liberados e saldo enviado para verificação do CD.";
  if (available) return "Itens disponíveis em estoque e liberados para retirada do PCM.";
  if (cdPending) return "Itens indisponíveis no estoque local e enviados para verificação do CD.";
  return "";
}

function buildCdResponseText(items) {
  const cd = items.filter((item) => Number(item.cdQty) > 0).length;
  const purchase = items.filter((item) => getPurchasePendingQty(item) > 0).length;
  if (cd && purchase) return "CD atendeu parte dos itens; saldo remanescente segue para aprovação de compra.";
  if (cd) return "CD possui os itens pendentes. Pendente entrada e recebimento pelo Almoxarifado.";
  if (purchase) return "CD sem saldo para atender; itens seguem para aprovação de compra.";
  return "";
}

function getWmsSummary(code) {
  const locations = wmsLocations[String(code)] || [];
  if (locations.length === 0) {
    return { found: false, text: "WMS: sem localização cadastrada" };
  }

  const first = locations[0];
  const extra = locations.length > 1 ? ` +${locations.length - 1}` : "";
  return {
    found: true,
    text: `WMS: ${first.location}${extra}`,
  };
}

function getCdWmsSummary(code) {
  const locations = cdWmsLocations[String(code)] || [];
  if (locations.length === 0) {
    return { found: false, text: "CD: sem localização cadastrada" };
  }

  const first = locations[0];
  const extra = locations.length > 1 ? ` +${locations.length - 1}` : "";
  const stockType = first.stockType ? `Estoque ${first.stockType}` : "Estoque não informado";
  return {
    found: true,
    text: `CD: ${first.location}${extra} | ${stockType}`,
  };
}

function updateRequest(id, status, response) {
  requests = requests.map((request) => {
    if (request.id !== id) return request;
    const items = request.items.map((item) => {
      if (status === "solicitacao") return { ...item, availableQty: 0, cdQty: 0, purchaseQty: 0, purchaseApproval: "" };
      return item;
    });
    return {
      ...request,
      status,
      response,
      items,
      answeredAt: status === "solicitacao" ? "" : request.answeredAt,
      cdAt: status === "solicitacao" ? "" : request.cdAt,
      purchaseOrder: status === "solicitacao" ? "" : request.purchaseOrder,
      deliveryDate: status === "solicitacao" ? "" : request.deliveryDate,
      purchaseArrivedDate: status === "solicitacao" ? "" : request.purchaseArrivedDate,
      receiptNumber: status === "solicitacao" ? "" : request.receiptNumber,
      receiptAt: status === "solicitacao" ? "" : request.receiptAt,
      receiptBy: status === "solicitacao" ? "" : request.receiptBy,
    };
  });
  saveRequests();
  render();
}

function updateMetrics() {
  const totals = requests.reduce(
    (acc, request) => {
      acc[request.status] += 1;
      return acc;
    },
    { solicitacao: 0, cd: 0, atendimento: 0, aprovacao: 0, compra: 0, recebimento: 0, reprovado: 0, retirado: 0 }
  );

  document.querySelector("#metric-open").textContent = totals.solicitacao;
  document.querySelector("#metric-stock").textContent = totals.atendimento + totals.retirado + totals.cd;
  document.querySelector("#metric-buy").textContent = totals.aprovacao + totals.compra + totals.recebimento;
  document.querySelector("#metric-done").textContent = requests.filter((request) => request.purchaseOrder).length;
  updateManagerDashboard();
}

function updateManagerDashboard() {
  if (!managerPendingItems || !managerBuyItems || !managerServiceRate) return;

  const itemTotals = requests.reduce(
    (acc, request) => {
      request.items.forEach((item) => {
        const requested = Number(item.quantity) || 0;
        const available = Number(item.availableQty) || 0;
        const cd = Number(item.cdQty) || 0;
        const purchase = getPurchasePendingQty(item);
        acc.requested += requested;
        acc.available += available + cd;
        acc.purchase += purchase;
        acc.pending += Math.max(0, requested - available - cd - purchase);
      });
      return acc;
    },
    { requested: 0, available: 0, purchase: 0, pending: 0 }
  );

  managerPendingItems.textContent = itemTotals.pending;
  managerBuyItems.textContent = itemTotals.purchase;
  managerServiceRate.textContent = itemTotals.requested ? `${Math.round((itemTotals.available / itemTotals.requested) * 100)}%` : "0%";
}

function updateCopy() {
  if (currentUser.role === "pcm") {
    queueEyebrow.textContent = "PCM";
    queueTitle.textContent = "Minhas etapas";
    queueSubtitle.textContent = "Acompanhe o retorno do Almoxarifado sem misturar com a abertura de pedido.";
  } else if (currentUser.role === "almox") {
    queueEyebrow.textContent = "Almoxarifado";
    queueTitle.textContent = "Fila de atendimento";
    queueSubtitle.textContent = "Atenda o que tem em estoque local; o saldo segue para verificação do CD.";
  } else if (currentUser.role === "cd") {
    queueEyebrow.textContent = "Centro de Distribuicao";
    queueTitle.textContent = "Pendências para o CD";
    queueSubtitle.textContent = "Veja apenas o que o almoxarifado não atendeu e informe o que o CD consegue liberar.";
  } else {
    queueEyebrow.textContent = "Gerente";
    queueTitle.textContent = "Visao corporativa";
    queueSubtitle.textContent = "Acompanhe solicitações, retiradas liberadas e compras SAP pendentes.";
  }
}

function renderHistory() {
  if (!historyList) return;

  const query = historyFilter.value.trim().toLowerCase();
  const dateFrom = historyDateFrom.value;
  const dateTo = historyDateTo.value;
  const filtered = requests.filter((request) => {
    const matchesQuery = !query || request.items.some((item) => `${item.code} ${item.description}`.toLowerCase().includes(query));
    const matchesDate = isRequestInHistoryDateRange(request, dateFrom, dateTo);
    return matchesQuery && matchesDate;
  });

  updateHistorySla(filtered);
  historyList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhum histórico encontrado para esse filtro.";
    historyList.append(empty);
    return;
  }

  filtered.forEach((request) => {
    const row = document.createElement("article");
    row.className = "history-row";
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>Prefixo ${request.bus} | ${request.items.length} item(ns) | ${request.priority}</span>
        </div>
        <div><small>Onde está</small><b>${statusText[request.status]}</b></div>
        <div><small>SLA atual</small><b>${getCurrentSla(request)}</b></div>
      </button>
      <div class="history-details">
        ${createHistoryTimeline(request)}
        <div class="history-qty-map">
          ${createHistoryItemDetails(request)}
        </div>
      </div>
    `;
    const summary = row.querySelector(".history-summary");
    summary.addEventListener("click", () => {
      const expanded = row.classList.toggle("expanded");
      summary.setAttribute("aria-expanded", String(expanded));
    });
    historyList.append(row);
  });
}

function renderUsers() {
  if (!userList) return;
  const users = Object.entries(getAllAccounts()).map(([email, user]) => ({ ...user, email, defaultUser: Boolean(accounts[email]) }));

  userList.innerHTML = users
    .map((user) => `<article class="user-row" data-email="${escapeAttr(user.email)}">
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
      <label class="user-role-field">
        <small>Perfil</small>
        <select class="user-role">
          ${createRoleOptions(user.role)}
        </select>
      </label>
      <label class="user-password-field">
        <small>Senha</small>
        <input class="user-password" type="text" value="${escapeAttr(user.password)}" />
      </label>
      <div><small>Tipo</small><b>${user.defaultUser ? "Padrao" : "Criado"}</b></div>
      <div class="user-actions">
        <button class="secondary-action compact" type="button" data-user-action="save-password">Salvar acesso</button>
        <button class="danger-action compact" type="button" data-user-action="delete-user" ${user.email === currentUser.email ? "disabled" : ""}>Excluir</button>
      </div>
    </article>`)
    .join("");
}

function canManagePartRegistrations() {
  return ["erik.lima", "bruno.medici"].includes(currentUser?.email);
}

function openPartRegistrationDialog(description = "") {
  partRegistrationMessage.textContent = "";
  partRegistrationMessage.className = "password-message";
  partRegistrationForm.reset();
  if (description) {
    partRegistrationForm.elements.description.value = description;
  }
  partRegistrationDialog.showModal();
}

function createPartRegistration(data) {
  const description = String(data.get("description") || "").trim();
  const originalCode = String(data.get("originalCode") || "").trim();

  if (!description || !originalCode) {
    partRegistrationMessage.textContent = "Informe a descrição e o código original.";
    partRegistrationMessage.className = "password-message error";
    return;
  }

  const alreadyPending = partRegistrations.some((item) => {
    return item.status === "pending" && item.description.toLowerCase() === description.toLowerCase() && item.originalCode.toLowerCase() === originalCode.toLowerCase();
  });

  if (alreadyPending) {
    partRegistrationMessage.textContent = "Esse cadastro já está pendente para o admin.";
    partRegistrationMessage.className = "password-message error";
    return;
  }

  partRegistrations = [
    {
      id: `CAD-${Date.now()}`,
      description,
      originalCode,
      requestedBy: currentUser.name || currentUser.label,
      requestedByEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      status: "pending",
      createdCode: "",
      completedAt: "",
      completedBy: "",
    },
    ...partRegistrations,
  ];
  savePartRegistrations();
  renderPartRegistrations();
  partRegistrationMessage.textContent = "Cadastro enviado para Erik e Bruno.";
  partRegistrationMessage.className = "password-message success";
  setTimeout(() => partRegistrationDialog.close(), 450);
}

function renderPartRegistrations() {
  if (!partRegistrationList) return;
  const canManage = canManagePartRegistrations();

  if (partRegistrations.length === 0) {
    partRegistrationList.innerHTML = '<div class="empty-state compact-empty">Nenhuma solicitação de cadastro de peça.</div>';
    return;
  }

  partRegistrationList.innerHTML = partRegistrations
    .map((item) => {
      const done = item.status === "done";
      return `<article class="part-registration-row ${done ? "done" : ""}" data-id="${escapeAttr(item.id)}">
        <div>
          <strong>${escapeHtml(item.description)}</strong>
          <span>Código original: ${escapeHtml(item.originalCode)}</span>
          <small>Solicitado por ${escapeHtml(item.requestedBy || "-")} em ${formatDateOrDash(item.createdAt)}</small>
        </div>
        <label>
          <small>Código SAP criado</small>
          <input class="created-part-code" value="${escapeAttr(item.createdCode || "")}" ${done || !canManage ? "disabled" : ""} placeholder="Ex.: 30000000" />
        </label>
        <div><small>Status</small><b>${done ? "Cadastrado" : "Pendente SAP"}</b></div>
        <div class="user-actions">
          <button class="secondary-action compact" type="button" data-part-action="save" ${done || !canManage ? "disabled" : ""}>Salvar cadastro</button>
          <button class="danger-action compact" type="button" data-part-action="delete" ${!canManage ? "disabled" : ""}>Excluir</button>
        </div>
      </article>`;
    })
    .join("");
}

function completePartRegistration(id, code) {
  if (!canManagePartRegistrations()) return;
  const cleanCode = String(code || "").trim();
  const registration = partRegistrations.find((item) => item.id === id);
  if (!registration || !cleanCode) return;

  const part = { code: cleanCode, description: registration.description };
  customParts = customParts.filter((item) => String(item.code) !== cleanCode);
  customParts.unshift(part);
  partRegistrations = partRegistrations.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "done",
          createdCode: cleanCode,
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name || currentUser.label,
        }
      : item
  );
  saveCustomParts();
  savePartRegistrations();
  renderPartRegistrations();
}

function deletePartRegistration(id) {
  if (!canManagePartRegistrations()) return;
  partRegistrations = partRegistrations.filter((item) => item.id !== id);
  savePartRegistrations();
  deleteSupabaseRow("manupecas_part_registrations", "id", id);
  renderPartRegistrations();
}

function createRoleOptions(selectedRole) {
  return ["pcm", "almox", "cd", "compras", "manager", "admin"]
    .map((role) => `<option value="${role}" ${role === selectedRole ? "selected" : ""}>${roleLabel(role)}</option>`)
    .join("");
}

function updateUserAccess(email, password, role) {
  const account = getAllAccounts()[email];
  if (!account) return;

  const updatedUser = {
    ...account,
    email,
    password: String(password || "").trim() || "1234",
    role,
    label: roleLabel(role),
  };

  managedUsers = managedUsers.filter((user) => user.email !== email);
  managedUsers.push(updatedUser);
  deletedUsers = deletedUsers.filter((item) => item !== email);
  saveManagedUsers();
  saveDeletedUsers();
  renderUsers();
}

function updateUserPassword(email, password) {
  const account = getAllAccounts()[email];
  if (!account) return;
  updateUserAccess(email, password, account.role);
}

function changeOwnPassword(data) {
  const account = getAllAccounts()[currentUser.email];
  const currentPassword = String(data.get("currentPassword") || "");
  const newPassword = String(data.get("newPassword") || "").trim();
  const confirmPassword = String(data.get("confirmPassword") || "").trim();

  if (!account || account.password !== currentPassword) {
    showPasswordMessage("Senha atual incorreta.", true);
    return;
  }

  if (!newPassword) {
    showPasswordMessage("Informe a nova senha.", true);
    return;
  }

  if (newPassword !== confirmPassword) {
    showPasswordMessage("A confirmação não confere.", true);
    return;
  }

  updateUserPassword(currentUser.email, newPassword);
  showPasswordMessage("Senha alterada com sucesso.", false);
  passwordForm.reset();
}

function showPasswordMessage(message, isError) {
  passwordMessage.textContent = message;
  passwordMessage.className = `password-message ${isError ? "error" : "success"}`;
}

function deleteUser(email) {
  if (email === currentUser.email) return;
  managedUsers = managedUsers.filter((user) => user.email !== email);
  if (accounts[email] && !deletedUsers.includes(email)) {
    deletedUsers.push(email);
  }
  saveManagedUsers();
  saveDeletedUsers();
  deleteSupabaseRow("manupecas_users", "email", email);
  renderUsers();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function updateHistorySla(source) {
  const requestDurations = [];
  const serviceDurations = [];
  const buyDurations = [];

  source.forEach((request) => {
    const firstMove = request.attendedAt || request.cdAt || request.purchaseAt || request.withdrawnAt;
    if (firstMove) requestDurations.push(durationMs(request.createdAt, firstMove));
    if (request.attendedAt && request.withdrawnAt) serviceDurations.push(durationMs(request.attendedAt, request.withdrawnAt));
    if (request.purchaseAt) buyDurations.push(durationMs(request.purchaseAt, request.withdrawnAt || new Date().toISOString()));
  });

  slaRequest.textContent = formatMsAverage(requestDurations);
  slaService.textContent = formatMsAverage(serviceDurations);
  slaBuy.textContent = formatMsAverage(buyDurations);
}

function getAreaSla(request, area) {
  const now = new Date().toISOString();
  if (area === "almox") {
    if (!request.createdAt) return "-";
    const end = request.attendedAt || (request.status === "solicitacao" ? now : "");
    return end ? formatDuration(request.createdAt, end) : "-";
  }
  if (area === "cd") {
    if (!request.attendedAt) return "-";
    const end = request.cdAt || (request.status === "cd" ? now : "");
    return end ? formatDuration(request.attendedAt, end) : "-";
  }
  if (area === "aprovacao") {
    if (!request.cdAt) return "-";
    const end = request.purchaseAt || (request.status === "reprovado" ? request.purchaseApprovedAt : "") || (request.status === "aprovacao" ? now : "");
    return end ? formatDuration(request.cdAt, end) : "-";
  }
  if (area === "compra") {
    if (!request.purchaseAt) return "-";
    const end = request.deliveryDate ? request.receiptAt || (request.status === "recebimento" ? now : "") : request.purchaseAt;
    return end ? formatDuration(request.purchaseAt, end) : "-";
  }
  if (area === "recebimento") {
    const start = request.deliveryDate ? `${request.deliveryDate}T00:00:00` : request.cdAt || request.purchaseAt;
    if (!start) return "-";
    const end = request.receiptAt || (request.status === "recebimento" ? now : "");
    return end ? formatDuration(start, end) : "-";
  }
  return "-";
}

function getCurrentSla(request) {
  return formatDuration(request.createdAt, request.withdrawnAt || new Date().toISOString());
}

function createHistorySlaMap(request) {
  const steps = [
    { key: "almox", label: "Almoxarifado", owner: request.almoxBy || "Pendente", active: request.status === "solicitacao", done: Boolean(request.attendedAt) },
    { key: "cd", label: "CD", owner: request.cdBy || "Pendente", active: request.status === "cd", done: Boolean(request.cdAt) },
    { key: "aprovacao", label: "Aprovação", owner: request.purchaseApprovedBy || "Gerente", active: request.status === "aprovacao", done: Boolean(request.purchaseAt) || request.status === "reprovado" },
    { key: "compra", label: "Compra", owner: request.purchaseOrder || "Pedido pendente", active: request.status === "compra", done: Boolean(request.purchaseOrder) },
    { key: "recebimento", label: "Recebimento", owner: request.receiptNumber || "Pendente entrada SAP", active: request.status === "recebimento", done: Boolean(request.receiptAt) },
  ];

  return steps
    .map((step) => `<button class="sla-node ${step.active ? "active" : ""} ${step.done ? "done" : ""}" type="button">
      <strong>${step.label}</strong>
      <span>${getAreaSla(request, step.key)}</span>
      <small>${step.owner}</small>
    </button>`)
    .join("");
}

function createHistoryTimeline(request) {
  const steps = [
    {
      label: "Solicitação",
      status: "Aberta pelo PCM",
      owner: request.requestedBy || "-",
      date: request.createdAt,
      sla: "0min",
      state: "done",
    },
    {
      label: "Almoxarifado",
      status: request.attendedAt ? "Atendido" : request.status === "solicitacao" ? "Pendente" : "Não passou",
      owner: request.almoxBy || "-",
      date: request.attendedAt,
      sla: getAreaSla(request, "almox"),
      state: request.attendedAt ? "done" : request.status === "solicitacao" ? "active" : "idle",
    },
    {
      label: "CD",
      status: request.cdAt ? "Atendido" : request.status === "cd" ? "Pendente" : "Não acionado",
      owner: request.cdBy || "-",
      date: request.cdAt,
      sla: getAreaSla(request, "cd"),
      state: request.cdAt ? "done" : request.status === "cd" ? "active" : "idle",
    },
    {
      label: "Aprovação",
      status: request.status === "reprovado" ? "Compra não aprovada" : request.purchaseAt ? "Compra aprovada" : request.status === "aprovacao" ? "Pendente aprovação" : "Não acionada",
      owner: request.purchaseApprovedBy || "Gerente",
      date: request.purchaseAt || request.purchaseApprovedAt,
      sla: getAreaSla(request, "aprovacao"),
      state: request.purchaseAt || request.status === "reprovado" ? "done" : request.status === "aprovacao" ? "active" : "idle",
    },
    {
      label: "Compra",
      status: request.purchaseAt ? request.deliveryDate ? "Pedido registrado" : "Pendente data de chegada" : "Não acionada",
      owner: request.purchaseOrder ? `Pedido ${request.purchaseOrder}` : "-",
      date: request.purchaseAt,
      sla: getAreaSla(request, "compra"),
      state: request.purchaseAt ? request.status === "compra" ? "active" : "done" : "idle",
    },
    {
      label: "Recebimento",
      status: request.receiptAt ? "Entrada SAP confirmada" : request.status === "recebimento" ? "Pendente entrada e recebimento" : "Aguardando",
      owner: request.receiptBy || request.almoxBy || "-",
      date: request.receiptAt,
      sla: getAreaSla(request, "recebimento"),
      state: request.receiptAt ? "done" : request.status === "recebimento" ? "active" : "idle",
    },
    {
      label: "Retirada",
      status: request.withdrawnAt ? "Retirado pelo PCM" : request.pickupAt ? "Retirada parcial registrada" : hasPickupPending(request) ? "Liberado para retirada" : "Aguardando",
      owner: request.withdrawnAt || request.pickupAt ? request.requestedBy || "-" : "-",
      date: request.withdrawnAt || request.pickupAt,
      sla: request.withdrawnAt || request.pickupAt ? formatDuration(request.createdAt, request.withdrawnAt || request.pickupAt) : "-",
      state: request.withdrawnAt ? "done" : hasPickupPending(request) ? "active" : request.pickupAt ? "done" : "idle",
    },
  ];

  return `<div class="history-timeline">
    ${steps.map((step) => `<article class="timeline-step ${step.state}">
      <small>${step.label}</small>
      <strong>${step.status}</strong>
      <span>${step.owner}</span>
      <b>${formatDateOrDash(step.date)}</b>
      <em>SLA ${step.sla}</em>
    </article>`).join("")}
  </div>`;
}

function createHistoryItemDetails(request) {
  const rows = request.items
    .map((item) => `<div class="history-item-row">
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <b>${item.quantity || 0}</b>
      <b>${item.availableQty || 0}</b>
      <b>${getCdServedQty(item)}</b>
      <b>${getPurchaseServedQty(item)}</b>
      <small>${getItemStageStatus(request, item)}</small>
      <em>${getItemInvoiceMarkup(request, item, "transfer")}</em>
      <em>${getItemReceiptMarkup(request, item)}</em>
    </div>`)
    .join("");

  return `
    <div class="history-item-header">
      <span>Código</span>
      <span>Descrição</span>
      <span>PCM</span>
      <span>Almox</span>
      <span>CD</span>
      <span>Compra</span>
      <span>Status</span>
      <span>NF transferência CD</span>
      <span>Entrada SAP</span>
    </div>
    ${rows}
  `;
}

function getItemInvoiceName(request, item, type) {
  if (type === "transfer" && getCdServedQty(item) > 0) return request.transferInvoiceName || "-";
  return "-";
}

function getItemInvoiceMarkup(request, item, type) {
  const name = getItemInvoiceName(request, item, type);
  if (name === "-") return "-";
  const dataUrl = type === "transfer" ? request.transferInvoiceDataUrl : request.receiptInvoiceDataUrl;
  if (!dataUrl) return name;
  return `<a class="invoice-link" href="${dataUrl}" download="${name}" target="_blank" rel="noopener">${name}</a>`;
}

function getItemReceiptMarkup(request, item) {
  if (!request.receiptNumber) return "-";
  if ((Number(item.purchaseReceivedQty) || 0) > 0 || (Number(item.cdReceivedQty) || 0) > 0 || getPurchasePendingQty(item) > 0 || Number(item.cdQty) > 0) return request.receiptNumber;
  return "-";
}

function createPurchaseItemDetails(request, items) {
  const rows = items
    .map((item) => `<div class="history-item-row purchase-item-row">
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <b>${getPurchasePendingQty(item)}</b>
      <b>${request.purchaseOrder || "-"}</b>
      <b>${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "-"}</b>
      <b>${getAreaSla(request, "compra")}</b>
    </div>`)
    .join("");

  return `
    <div class="history-item-header purchase-item-header">
      <span>Código</span>
      <span>Descrição</span>
      <span>Compra</span>
      <span>Pedido compra</span>
      <span>Data chegada</span>
      <span>SLA compra</span>
    </div>
    ${rows}
  `;
}

function createApprovalItemDetails(request, items, canApprove) {
  const rows = items
    .map((item) => `<div class="history-item-row approval-item-row">
      <label class="approval-check">
        <input type="checkbox" data-code="${item.code}" ${canApprove ? "" : "disabled"} />
      </label>
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <b>${item.quantity || 0}</b>
      <b>${item.availableQty || 0}</b>
      <b>${item.cdQty || 0}</b>
      <b>${getPurchaseBaseQty(item)}</b>
      <em>${getItemPurchaseStatus(request, item)}</em>
    </div>`)
    .join("");

  return `
    <div class="history-item-header approval-item-header">
      <span></span>
      <span>Código</span>
      <span>Descrição</span>
      <span>PCM</span>
      <span>Almox</span>
      <span>CD</span>
      <span>A aprovar</span>
      <span>Status</span>
    </div>
    ${rows}
  `;
}

function renderApprovalQueue() {
  if (!approvalList) return;

  const approvalRequests = requests
    .filter((request) => request.status === "aprovacao")
    .map((request) => ({
      request,
      items: request.items.filter((item) => getPurchaseBaseQty(item) > 0 && item.purchaseApproval !== "rejected"),
    }))
    .filter(({ items }) => items.length > 0);

  approvalList.innerHTML = "";

  if (approvalRequests.length === 0) {
    approvalList.innerHTML = '<div class="empty-state">Nenhuma compra aguardando aprovação.</div>';
    return;
  }

  approvalRequests.forEach(({ request, items }) => {
    const row = document.createElement("article");
    row.className = "history-row approval-request-row";
    const canApprove = currentUser.role === "manager";
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>Prefixo ${request.bus} | ${items.length} item(ns) aguardando aprovação</span>
        </div>
        <div><small>Onde está</small><b>${statusText[request.status]}</b></div>
        <div><small>SLA total</small><b>${getCurrentSla(request)}</b></div>
      </button>
      <div class="history-details">
        <div class="history-qty-map">
          ${createApprovalItemDetails(request, items, canApprove)}
        </div>
        <div class="history-meta history-dates">
          <div><small>Solicitante</small><b>${request.requestedBy || "-"}</b></div>
          <div><small>Almoxarifado</small><b>${request.almoxBy || "-"}</b></div>
          <div><small>CD</small><b>${request.cdBy || "-"}</b></div>
          <div><small>Entrada na aprovação</small><b>${formatDateOrDash(request.purchaseApprovalRequestedAt || request.cdAt)}</b></div>
        </div>
        <div class="approval-actions">
          <button class="action available approval-action" type="button" data-mode="all" ${canApprove ? "" : "disabled"}>Aprovar todos os itens</button>
          <button class="action purchase-email approval-action" type="button" data-mode="selected" ${canApprove ? "" : "disabled"}>Aprovar apenas selecionados</button>
          <button class="action reset approval-action" type="button" data-mode="reject-selected" ${canApprove ? "" : "disabled"}>${canApprove ? "Não aprovar selecionados" : "Somente o Gerente aprova"}</button>
          <button class="action reset approval-action" type="button" data-mode="none" ${canApprove ? "" : "disabled"}>${canApprove ? "Não aprovar todos" : "Somente o Gerente aprova"}</button>
        </div>
      </div>
    `;
    const summary = row.querySelector(".history-summary");
    summary.addEventListener("click", () => {
      const expanded = row.classList.toggle("expanded");
      summary.setAttribute("aria-expanded", String(expanded));
    });
    row.querySelectorAll(".approval-action").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedCodes = [...row.querySelectorAll(".approval-check input:checked")].map((input) => input.dataset.code);
        approvePurchase(request.id, button.dataset.mode, selectedCodes);
      });
    });
    approvalList.append(row);
  });
}

function approvePurchase(id, mode = "all", selectedCodes = []) {
  if (currentUser.role !== "manager") return;
  if ((mode === "selected" || mode === "reject-selected") && selectedCodes.length === 0) {
    window.alert("Selecione pelo menos um item para aplicar essa decisão.");
    return;
  }
  const now = new Date().toISOString();
  let approvedRequest = null;
  requests = requests.map((request) => {
    if (request.id !== id) return request;

    const selected = new Set(selectedCodes);
    const items = request.items.map((item) => {
      const need = getPurchaseBaseQty(item);
      if (need <= 0) return item;
      const approved = mode === "all"
        || (mode === "selected" && selected.has(item.code))
        || (mode === "reject-selected" && !selected.has(item.code));
      return {
        ...item,
        purchaseQty: approved ? need : 0,
        purchaseApproval: approved ? "approved" : "rejected",
      };
    });
    const approvedQty = items.reduce((sum, item) => sum + (item.purchaseApproval === "approved" ? getPurchasePendingQty(item) : 0), 0);
    const rejectedQty = items.reduce((sum, item) => sum + (item.purchaseApproval === "rejected" ? getPurchaseBaseQty(item) : 0), 0);
    const nextStatus = approvedQty > 0 ? "compra" : hasPickupPending({ ...request, items }) ? "atendimento" : "reprovado";
    approvedRequest = {
      ...request,
      items,
      status: nextStatus,
      purchaseAt: approvedQty > 0 ? now : request.purchaseAt || "",
      purchaseApprovedAt: now,
      purchaseApprovedBy: currentUser.name || currentUser.label,
      response: approvedQty > 0
        ? `Compra aprovada pelo Gerente. ${approvedQty} unidade(s) liberada(s) para abertura do pedido SAP${rejectedQty > 0 ? ` e ${rejectedQty} unidade(s) não aprovada(s)` : ""}.`
        : "Compra não aprovada pelo Gerente. Sem itens liberados para SAP.",
    };
    return approvedRequest;
  });
  saveRequests();
  if (approvedRequest) openApprovalEmailDraft(approvedRequest, "");
  render();
  renderApprovalQueue();
}

function renderPurchaseOverview() {
  const purchaseRequests = requests
    .filter((request) => request.status === "compra")
    .map((request) => ({
      request,
      items: request.items.filter((item) => getPurchasePendingQty(item) > 0),
    }))
    .filter(({ items }) => items.length > 0);

  purchaseOverviewList.innerHTML = "";

  if (purchaseRequests.length === 0) {
    purchaseOverviewList.innerHTML = '<div class="empty-state">Nenhum item pendente em compra.</div>';
    return;
  }

  purchaseRequests.forEach(({ request, items }) => {
    const row = document.createElement("article");
    row.className = "history-row purchase-request-row";
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>Prefixo ${request.bus} | ${items.length} item(ns) pendente(s) em compra</span>
        </div>
        <div><small>Solicitação</small><b>${request.id}</b></div>
        <div><small>SLA total</small><b>${getCurrentSla(request)}</b></div>
      </button>
      <div class="history-details">
        <div class="history-qty-map">
          ${createPurchaseItemDetails(request, items)}
        </div>
        <div class="history-meta history-dates">
          <div><small>Envio para compra</small><b>${formatDateOrDash(request.purchaseAt)}</b></div>
          <div><small>Data de chegada</small><b>${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "-"}</b></div>
          <div><small>Recebimento Almox</small><b>${formatDateOrDash(request.receiptAt)}</b></div>
          <div><small>Pedido de compra</small><b>${request.purchaseOrder || "-"}</b></div>
          <div><small>Entrada SAP</small><b>${request.receiptNumber || "-"}</b></div>
        </div>
        ${currentUser.role === "compras" ? `
          <div class="purchase-delivery-editor">
            <label>
              Número do pedido de compra
              <input class="purchase-overview-order" type="text" value="${request.purchaseOrder || ""}" placeholder="Ex.: 4500123456" ${request.purchaseOrder ? "readonly" : ""} />
            </label>
            <label>
              Data de chegada
              <input class="purchase-overview-delivery" type="date" value="${request.deliveryDate || ""}" />
            </label>
            <button class="action available purchase-overview-save" type="button">Salvar compra</button>
          </div>
        ` : ""}
      </div>
    `;
    const summary = row.querySelector(".history-summary");
    summary.addEventListener("click", () => {
      const expanded = row.classList.toggle("expanded");
      summary.setAttribute("aria-expanded", String(expanded));
    });
    const saveDeliveryButton = row.querySelector(".purchase-overview-save");
    if (saveDeliveryButton) {
      saveDeliveryButton.addEventListener("click", () => savePurchaseDelivery(request.id, row.querySelector(".purchase-overview-order").value, row.querySelector(".purchase-overview-delivery").value));
    }
    purchaseOverviewList.append(row);
  });
}

function savePurchaseDelivery(id, purchaseOrder, deliveryDate) {
  if (currentUser.role !== "compras") return;
  const cleanOrder = String(purchaseOrder || "").trim();
  if (!cleanOrder) {
    window.alert("Informe o número do pedido de compra.");
    return;
  }
  requests = requests.map((request) => {
    if (request.id !== id) return request;
    const nextStatus = cleanOrder && deliveryDate ? "recebimento" : "compra";
    return {
      ...request,
      purchaseOrder: request.purchaseOrder || cleanOrder,
      deliveryDate,
      purchaseArrivedDate: deliveryDate || request.purchaseArrivedDate || "",
      status: nextStatus,
      response: deliveryDate
        ? `Pedido de compra ${request.purchaseOrder || cleanOrder} registrado pelo time de Compras. Data de chegada: ${formatDateOnly(deliveryDate)}. Pendente entrada e recebimento pelo Almoxarifado.`
        : `Pedido de compra ${request.purchaseOrder || cleanOrder} registrado pelo time de Compras. Pendente data de chegada.`,
    };
  });
  saveRequests();
  renderPurchaseOverview();
}

function isRequestInHistoryDateRange(request, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const end = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  return getRequestStageDates(request).some((dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function getRequestStageDates(request) {
  return [request.createdAt, request.attendedAt, request.cdAt, request.purchaseApprovalRequestedAt, request.purchaseApprovedAt, request.purchaseAt, request.purchaseArrivedAt, request.receiptAt, request.pickupAt, request.withdrawnAt].filter(Boolean);
}

function formatDateOrDash(value) {
  return value ? formatDate(value) : "-";
}

function durationMs(start, end) {
  return Math.max(0, new Date(end) - new Date(start));
}

function formatMsAverage(values) {
  if (values.length === 0) return "0min";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return formatDuration(0, average);
}

function syncFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

function formatPlainTable(headers, rows) {
  const widths = headers.map((header, index) => Math.max(String(header).length, ...rows.map((row) => String(row[index] || "").length)));
  const line = widths.map((width) => "-".repeat(width + 2)).join("+");
  const formatRow = (row) => row.map((cell, index) => ` ${String(cell || "").padEnd(widths[index])} `).join("|");
  return [formatRow(headers), line, ...rows.map(formatRow)].join("\n");
}

function formatEmailItems(items, getQuantity, getExtraLines = () => []) {
  return items
    .map((item) => {
      const quantity = Number(getQuantity(item)) || 0;
      const extraLines = getExtraLines(item).filter(Boolean);
      return [
        `ITEM: ${item.description}`,
        "",
        `QTD: ${quantity} UNIDADES`,
        "",
        `COD: ${item.code}`,
        ...extraLines,
      ].join("\n");
    })
    .join("\n\n");
}

function buildEmailBody(title, intro, sections) {
  return [
    title.toUpperCase(),
    "",
    "Prezados,",
    "",
    intro,
    "",
    ...sections.flatMap((section) => [
      section.title.toUpperCase(),
      "-".repeat(section.title.length),
      section.content,
      "",
    ]),
    "Atenciosamente,",
    "ManuPeças | JTP Transportes",
  ].join("\n").trim();
}

function userLoginToEmail(login) {
  const value = String(login || "").trim().toLowerCase();
  if (!value) return "";
  return value.includes("@") ? value : `${value}@empresa.com.br`;
}

function getDefaultCc(to) {
  const primary = String(to || "").trim().toLowerCase();
  return Object.keys(getAllAccounts())
    .map(userLoginToEmail)
    .filter((email, index, list) => email && email !== primary && list.indexOf(email) === index)
    .join(";");
}

function openMailDraft(to, subject, bodyText) {
  const recipient = String(to || "").trim();
  const cc = getDefaultCc(recipient);
  const ccParam = cc ? `&cc=${encodeURIComponent(cc)}` : "";
  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}${ccParam}&body=${encodeURIComponent(bodyText)}`;
}

function buildEmailSubject(request, step) {
  return `[ManuPe\u00e7as ${request.id}] Prefixo ${request.bus} - ${step}`;
}

function openEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Solicita\u00e7\u00e3o");
  const bodyText = buildEmailBody("Solicitação de Peças", `Nova solicitação registrada para o prefixo ${request.bus}.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nSolicitante: ${request.requestedBy}\nPrefixo: ${request.bus}\nPrioridade: ${request.priority}` },
    { title: "Peças", content: formatEmailItems(request.items, (item) => item.quantity) },
    { title: "Motivo", content: request.reason },
  ]);

  openMailDraft(to, subject, bodyText);
}

function openAlmoxEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Atendimento Almox");
  const bodyText = buildEmailBody("Relatório de Atendimento - Almoxarifado", `Segue retorno da solicitação ${request.id}, prefixo ${request.bus}.`, [
    { title: "Resumo da Solicitação", content: `Status: ${statusText[request.status]}\nPrioridade: ${request.priority}\nRequisitante: ${request.requestedBy || "-"}` },
    { title: "Itens", content: formatEmailItems(request.items, (item) => item.quantity, (item) => {
      const pending = Math.max(0, item.quantity - (Number(item.availableQty) || 0) - (Number(item.cdQty) || 0) - getPurchasePendingQty(item));
      return [
        `ATENDIDO ALMOX: ${item.availableQty || 0} UNIDADES`,
        `ENVIADO CD: ${item.cdQty || 0} UNIDADES`,
        `COMPRA: ${getPurchasePendingQty(item)} UNIDADES`,
        `PENDENTE: ${pending} UNIDADES`,
      ];
    }) },
    { title: "Observação", content: request.response || "Sem observação." },
  ]);

  openMailDraft(to, subject, bodyText);
}

function openCdEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Atendimento CD");
  const cdItems = request.items.filter((item) => getCdPendingQty(item) > 0 || Number(item.cdQty) > 0 || getPurchasePendingQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Atendimento - Centro de Distribuição", `Segue retorno do CD para a solicitação ${request.id}, prefixo ${request.bus}.`, [
    { title: "Resumo da Transferência", content: `Atendido por: ${request.cdBy || "CD"}\nNF de transferência: ${request.transferInvoiceName || "Não informada"}\nObservação: ${request.response || "Sem observação."}` },
    { title: "Itens", content: cdItems.length ? formatEmailItems(cdItems, (item) => Math.max(Number(item.cdQty) || 0, getCdPendingQty(item)), (item) => [
      `PENDENTE CD: ${getCdPendingQty(item)} UNIDADES`,
      `ATENDIDO CD: ${item.cdQty || 0} UNIDADES`,
      `COMPRA: ${getPurchasePendingQty(item)} UNIDADES`,
    ]) : "Nenhum item pendente para o CD." },
    { title: "Anexo", content: request.transferInvoiceName ? `Anexar a NF selecionada: ${request.transferInvoiceName}` : "Anexar a NF de transferência antes do envio final." },
  ]);

  openMailDraft(to, subject, bodyText);
}

function openApprovalEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Aprova\u00e7\u00e3o de compra");
  const purchaseItems = request.items.filter((item) => getPurchaseBaseQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Aprovação de Compra", `Segue retorno da aprovação de compra da solicitação ${request.id}, prefixo ${request.bus}.`, [
    { title: "Resumo da Aprovação", content: `Aprovado por: ${request.purchaseApprovedBy || "Gerente"}\nData: ${formatDateOrDash(request.purchaseApprovedAt)}\nStatus atual: ${statusText[request.status]}` },
    { title: "Itens", content: purchaseItems.length ? formatEmailItems(purchaseItems, (item) => getPurchaseBaseQty(item), (item) => [
      `STATUS: ${getItemPurchaseStatus(request, item)}`,
    ]) : "Nenhum item pendente de compra." },
    { title: "Observação", content: request.response || "Sem observação." },
  ]);

  openMailDraft(to, subject, bodyText);
}

function openPurchaseEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Compra");
  const pendingItems = request.items.filter((item) => getPurchasePendingQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Compra", `Segue registro de compra para a solicitação ${request.id}, prefixo ${request.bus}.`, [
    { title: "Dados da Compra", content: `Solicitação: ${request.id}\nPedido de compra: ${request.purchaseOrder || "-"}\nData de chegada: ${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "Pendente"}\nStatus: ${statusText[request.status]}` },
    { title: "Itens", content: pendingItems.length ? formatEmailItems(pendingItems, (item) => getPurchasePendingQty(item), () => [
      `PEDIDO DE COMPRA: ${request.purchaseOrder || "-"}`,
      `DATA DE CHEGADA: ${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "Pendente"}`,
    ]) : "Nenhum item pendente de compra." },
  ]);

  openMailDraft(to, subject, bodyText);
}

function createProcessMap(request) {
  const steps = [
    { key: "solicitacao", label: "Solicitação", date: request.createdAt, done: Boolean(request.createdAt), active: false },
    { key: "atendimento", label: "Almoxarifado", date: request.attendedAt, done: Boolean(request.attendedAt), active: request.status === "solicitacao" },
    { key: "cd", label: "CD", date: request.cdAt, done: Boolean(request.cdAt), active: request.status === "cd" },
    { key: "aprovacao", label: "Aprovação", date: request.purchaseApprovedAt, done: Boolean(request.purchaseAt) || request.status === "reprovado", active: request.status === "aprovacao" },
    { key: "compra", label: "Compra", date: request.purchaseAt, done: Boolean(request.purchaseOrder), active: request.status === "compra" },
    { key: "recebimento", label: "Recebimento", date: request.receiptAt, done: Boolean(request.receiptAt), active: request.status === "recebimento" },
    { key: "retirado", label: "Retirada", date: request.withdrawnAt, done: request.status === "retirado", active: request.status === "atendimento" },
  ];
  return steps
    .map((step) => {
      const active = step.active;
      const done = step.done;
      const meta = step.date ? `${formatDate(step.date)} | ${formatDuration(request.createdAt, step.date)}` : "Aguardando";
      return `<div class="process-step ${active ? "active" : ""} ${done ? "done" : ""}"><strong>${step.label}</strong><span>${meta}</span></div>`;
    })
    .join("");
}

function formatDuration(start, end) {
  const diff = Math.max(0, new Date(end) - new Date(start));
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return `${hours}h${String(rest).padStart(2, "0")}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatDateOnly(value) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function applyTheme(theme) {
  body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Tema claro" : "Tema escuro";
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
