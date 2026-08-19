const REQUESTS_KEY = "pecas-transporte-solicitacoes-v4";
const SESSION_KEY = "pecas-transporte-sessao";
const THEME_KEY = "pecas-transporte-tema";
const USERS_KEY = "pecas-transporte-usuarios";
const DELETED_USERS_KEY = "pecas-transporte-usuarios-excluidos";
const NOTIFICATION_READ_KEY = "pecas-transporte-notificacoes-lidas";
const CUSTOM_PARTS_KEY = "pecas-transporte-pecas-cadastradas";
const PART_REGISTRATIONS_KEY = "pecas-transporte-cadastros-pecas";
const EMAIL_SETTINGS_KEY = "pecas-transporte-email-config";
const supabaseClient = window.manuPecasSupabase || null;

const partsCatalog = Array.isArray(globalThis.PARTS_CATALOG) ? globalThis.PARTS_CATALOG : [];
const wmsLocations = globalThis.WMS_LOCATIONS && typeof globalThis.WMS_LOCATIONS === "object" ? globalThis.WMS_LOCATIONS : {};
const cdWmsLocations = globalThis.CD_WMS_LOCATIONS && typeof globalThis.CD_WMS_LOCATIONS === "object" ? globalThis.CD_WMS_LOCATIONS : {};

const accounts = {
  "erik.barreto": { password: "1234", role: "admin", label: "Admin", name: "ERIK.BARRETO", corporateEmail: "erik.barreto@jtptransportes.com.br" },
  "bruno.medici": { password: "1234", role: "admin", label: "Admin", name: "BRUNO.MEDICI", corporateEmail: "bruno.medici@jtptransportes.com.br" },
  "caio.silveira": { password: "1234", role: "admin", label: "Admin", name: "CAIO.SILVEIRA", corporateEmail: "caio.silveira@jtptransportes.com.br" },
  "rodrigo.araujo": { password: "1234", role: "manager", label: "Gerente", name: "RODRIGO.ARAUJO", corporateEmail: "rodrigo.araujo@jtptransportes.com.br" },
  "carla.alves": { password: "1234", role: "cd", label: "CD", name: "CARLA.ALVES", corporateEmail: "carla.alves@jtptransportes.com.br" },
  "jessica.lopes": { password: "1234", role: "almox", label: "Almoxarifado", name: "JESSICA.LOPES", corporateEmail: "jessica.lopes@jtptransportes.com.br" },
  "gabriel.ribeiro": { password: "1234", role: "manager", label: "Gerente", name: "GABRIEL.RIBEIRO", corporateEmail: "gabriel.ribeiro@jtptransportes.com.br" },
  "wesley.vinicius": { password: "1234", role: "almox", label: "Almoxarifado", name: "WESLEY.VINICIUS", corporateEmail: "wesley.vinicius@jtptransportes.com.br" },
  "anderson.silva": { password: "1234", role: "cd", label: "CD", name: "ANDERSON.SILVA", corporateEmail: "anderson.silva@jtptransportes.com.br" },
  "marcio.ferreira": { password: "1234", role: "compras", label: "Compras", name: "MARCIO.FERREIRA", corporateEmail: "marcio.ferreira@jtptransportes.com.br" },
  "matheus.campos": { password: "1234", role: "pcm", label: "PCM", name: "MATHEUS.CAMPOS", corporateEmail: "matheus.campos@jtptransportes.com.br" },
};

const emailAliases = {
  erik: "erik.barreto",
  "erik.lima": "erik.barreto",
  bruno: "bruno.medici",
  caio: "caio.silveira",
  rodrigo: "rodrigo.araujo",
  "rodrigo.silva": "rodrigo.araujo",
  "rodrigo.araujo": "rodrigo.araujo",
  gabriel: "gabriel.ribeiro",
  "gabriel.ribeiro": "gabriel.ribeiro",
  wesley: "wesley.vinicius",
  "wesley.vinicius": "wesley.vinicius",
  anderson: "anderson.silva",
  "anderson.silva": "anderson.silva",
  carla: "carla.alves",
  jessica: "jessica.lopes",
  marcio: "marcio.ferreira",
  matheus: "matheus.campos",
};

const statusText = {
  solicitacao: "Pendente de atendimento do Almoxarifado",
  cd: "Pendente de atendimento do CD",
  atendimento: "Retirada liberada para o PCM",
  aprovacao: "Compra liberada para SAP",
  compra: "Compra pendente",
  cadastro: "Aguardando cadastro da peça",
  recebimento: "Pendente entrada e recebimento pelo Almoxarifado",
  reprovado: "Compra não aprovada",
  cancelamento: "Cancelamento aguardando aprovação",
  cancelado: "Solicitação cancelada",
  retirado: "Item retirado pelo PCM",
};

const emailStepKeys = ["request", "registration", "almox", "cd", "approval", "purchase", "receipt", "pickup", "cancellation"];
const emailStepLabels = {
  request: "Solicitação",
  registration: "Cadastro de item",
  almox: "Atendimento Almoxarifado",
  cd: "Atendimento CD",
  approval: "Aprovação de compra",
  purchase: "Compra",
  receipt: "Recebimento",
  pickup: "Retirada",
  cancellation: "Cancelamento",
};
const defaultEmailSettings = {
  request: { toUsers: ["jessica.lopes"], ccUsers: [], extraTo: "", extraCc: "" },
  registration: { toUsers: ["erik.barreto", "bruno.medici"], ccUsers: [], extraTo: "", extraCc: "" },
  almox: { toUsers: ["matheus.campos"], ccUsers: [], extraTo: "", extraCc: "" },
  cd: { toUsers: ["jessica.lopes"], ccUsers: [], extraTo: "", extraCc: "" },
  approval: { toUsers: ["jessica.lopes", "marcio.ferreira"], ccUsers: [], extraTo: "", extraCc: "" },
  purchase: { toUsers: ["jessica.lopes", "matheus.campos"], ccUsers: ["rodrigo.araujo"], extraTo: "", extraCc: "" },
  receipt: { toUsers: ["matheus.campos"], ccUsers: ["rodrigo.araujo"], extraTo: "", extraCc: "" },
  pickup: { toUsers: ["matheus.campos"], ccUsers: [], extraTo: "", extraCc: "" },
  cancellation: { toUsers: ["erik.barreto", "bruno.medici", "caio.silveira"], ccUsers: [], extraTo: "", extraCc: "" },
};

const fixedUserCorporateEmails = {
  "rodrigo.araujo": "rodrigo.araujo@jtptransportes.com.br",
  "gabriel.ribeiro": "gabriel.ribeiro@jtptransportes.com.br",
  "wesley.vinicius": "wesley.vinicius@jtptransportes.com.br",
  "anderson.silva": "anderson.silva@jtptransportes.com.br",
};

const seedRequests = [];

let requests = loadRequests();
let managedUsers = loadManagedUsers();
let deletedUsers = loadDeletedUsers();
let customParts = loadCustomParts();
let partRegistrations = loadPartRegistrations();
let emailSettings = loadEmailSettings();
let currentUser = loadSession();
let currentFilter = "solicitacao";
let currentPage = "request";
let activePartRegistrationInput = null;
let userAccessFeedback = null;
let pendingSupabaseWrites = [];
let preparedMailPopup = null;
let isSubmittingRequest = false;

window.addEventListener("error", (event) => {
  setSupabaseStatus("error", "Erro no app");
  console.error("Erro no ManuPeças:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  setSupabaseStatus("error", "Supabase: erro de sincronização");
  console.error("Falha não tratada no ManuPeças:", event.reason);
});

const body = document.body;
const loginForm = document.querySelector("#login-form");
const sessionLabel = document.querySelector("#session-label");
const supabaseStatus = document.querySelector("#supabase-status");
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
const requestTarget = document.querySelector("#request-target");
const busInput = document.querySelector("#bus");
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
const queueRequestFilter = document.querySelector("#queue-request-filter");
const queuePartFilter = document.querySelector("#queue-part-filter");
const queueCarFilter = document.querySelector("#queue-car-filter");
const managerPendingItems = document.querySelector("#manager-pending-items");
const managerBuyItems = document.querySelector("#manager-buy-items");
const managerServiceRate = document.querySelector("#manager-service-rate");
const historyFilter = document.querySelector("#history-filter");
const historyPrefixFilter = document.querySelector("#history-prefix-filter");
const historyDateFrom = document.querySelector("#history-date-from");
const historyDateTo = document.querySelector("#history-date-to");
const historyList = document.querySelector("#history-list");
const approvalList = document.querySelector("#approval-list");
const purchaseOverviewList = document.querySelector("#purchase-overview-list");
const userForm = document.querySelector("#user-form");
const userList = document.querySelector("#user-list");
const emailSettingsForm = document.querySelector("#email-settings-form");
const emailSettingsGrid = document.querySelector("#email-settings-grid");
const emailSettingsMessage = document.querySelector("#email-settings-message");
const partRegistrationList = document.querySelector("#part-registration-list");
const slaRequest = document.querySelector("#sla-request");
const slaService = document.querySelector("#sla-service");
const slaBuy = document.querySelector("#sla-buy");

applyTheme(localStorage.getItem(THEME_KEY) || "light");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const rawEmail = loginForm.elements.email.value.trim().toLowerCase();
  const email = normalizeLogin(rawEmail);
  const password = loginForm.elements.password.value;
  let account = getAllAccounts()[email];
  if ((!account || account.password !== password) && supabaseClient) {
    account = await loadAccountForLogin(email);
  }

  if (!account || account.password !== password) {
    loginForm.classList.add("has-error");
    return;
  }

  currentUser = { email, role: account.role, label: roleLabel(account.role), name: account.name, corporateEmail: account.corporateEmail };
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
  clearQueueFilters();
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
  updateNotificationBadge();
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

requestTarget.addEventListener("change", syncRequestTarget);
syncRequestTarget();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSubmittingRequest) return;

  const submitButton = form.querySelector('[type="submit"]');
  isSubmittingRequest = true;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.textContent;
    submitButton.textContent = "Registrando...";
  }

  try {
    const data = new FormData(form);
    const targetType = data.get("requestTarget") || "prefixo";
    const bus = targetType === "frota" ? "Frota" : data.get("bus").trim();
    const items = collectItems();

    if (targetType === "prefixo" && !bus) {
      busInput.focus();
      return;
    }

    if (items.length === 0) {
      addItemLine();
      return;
    }

    const draftRequest = {
      id: "",
      bus,
      targetType,
      maintainer: data.get("maintainer").trim(),
      items,
      priority: data.get("priority"),
      reason: data.get("reason").trim(),
      status: items.some(isPendingRegistrationItem) ? "cadastro" : "solicitacao",
      response: "",
      createdAt: new Date().toISOString(),
      requestedBy: currentUser.name || currentUser.label,
      requestedByEmail: currentUser.email,
      almoxBy: "",
      almoxByEmail: "",
    };
    const recentDuplicate = findRecentDuplicateRequest(draftRequest);
    const request = recentDuplicate || { ...draftRequest, id: makeLocalRequestCode() };

    if (!recentDuplicate) {
      requests = [request, ...requests];
      linkPartRegistrationsToRequest(request);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    }

    const savedRequest = requests.find((item) => item.id === request.id) || requests.find((item) => isSameLogicalRequest(item, request)) || request;
    if (!recentDuplicate) {
      prepareMailPopup();
    }
    if (savedRequest.id !== request.id) {
      linkPartRegistrationsToRequest(savedRequest);
      await savePartRegistrations();
    }

    if (!recentDuplicate) {
      try {
        if (savedRequest.status === "cadastro") {
          openPartRegistrationEmailDraft(savedRequest);
        } else {
          openEmailDraft(savedRequest, "");
        }
      } catch (error) {
        closePreparedMailPopup();
        console.warn("Solicitação registrada, mas não foi possível abrir o e-mail.", error);
      }
    } else {
      closePreparedMailPopup();
      window.alert(`Solicitação duplicada bloqueada. A solicitação ${recentDuplicate.id} já foi registrada.`);
    }

    form.reset();
    syncRequestTarget();
    resetItemLines();
    currentFilter = "solicitacao";
    syncFilterButtons();
    setPage("pending");
    render();
    if (!recentDuplicate) {
      saveRequestsSafely("nova solicitação")
        .then(() => syncFromSupabase())
        .then(() => renderAppSafely())
        .catch((error) => console.warn("Solicitação registrada localmente, mas a sincronização posterior falhou.", error));
    }
  } catch (error) {
    closePreparedMailPopup();
    setSupabaseStatus("error", "Erro ao registrar solicitação");
    console.error("Erro ao registrar solicitação:", error);
    const detail = error?.message || String(error || "erro não identificado");
    window.alert(`Não foi possível registrar a solicitação.\n\nErro: ${detail}`);
  } finally {
    isSubmittingRequest = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.originalText || "Registrar solicitação";
    }
  }
});

addItemButton.addEventListener("click", () => addItemLine());

requestPartRegistrationButton.addEventListener("click", () => openPartRegistrationDialog());

partRegistrationClose.addEventListener("click", () => {
  activePartRegistrationInput = null;
  partRegistrationDialog.close();
});

partRegistrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await createPartRegistration(new FormData(partRegistrationForm));
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

queueRequestFilter?.addEventListener("input", () => render());
queuePartFilter?.addEventListener("input", () => render());
queueCarFilter?.addEventListener("input", () => render());
historyFilter.addEventListener("input", () => renderHistory());
historyPrefixFilter.addEventListener("input", () => renderHistory());
historyDateFrom.addEventListener("change", () => renderHistory());
historyDateTo.addEventListener("change", () => renderHistory());
userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(userForm);
  const email = data.get("email").trim().toLowerCase();
  const role = data.get("role");
  const user = {
    email,
    corporateEmail: normalizeCorporateEmail(data.get("corporateEmail"), email),
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

emailSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentUser?.role !== "admin") return;
  emailSettingsMessage.textContent = "Gravando configurações...";
  emailSettingsMessage.classList.remove("error", "success");
  emailSettings = Object.fromEntries(emailStepKeys.map((key) => {
    const selected = Array.from(emailSettingsForm.querySelectorAll(`[data-email-step="${key}"][data-user-login]:checked`));
    const toUsers = selected.filter((input) => input.value === "to").map((input) => input.dataset.userLogin);
    const ccUsers = selected.filter((input) => input.value === "cc").map((input) => input.dataset.userLogin);
    const extraTo = emailSettingsForm.querySelector(`[data-email-step="${key}"][data-extra-to]`)?.value || "";
    const extraCc = emailSettingsForm.querySelector(`[data-email-step="${key}"][data-extra-cc]`)?.value || "";
    return [key, { toUsers, ccUsers, extraTo, extraCc }];
  }));
  const result = await saveEmailSettings();
  renderEmailSettings();
  emailSettingsMessage.textContent = result.remote
    ? "Configurações gravadas no Supabase com sucesso."
    : result.ok
    ? "Configurações gravadas neste aparelho. Supabase não conectado."
    : `Não foi possível gravar no Supabase: ${result.error}`;
  emailSettingsMessage.classList.toggle("success", result.ok);
  emailSettingsMessage.classList.toggle("error", !result.ok);
  setTimeout(() => {
    emailSettingsMessage.textContent = "";
    emailSettingsMessage.classList.remove("error", "success");
  }, 2500);
});

emailSettingsForm?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-email-toggle-all]");
  const roleButton = event.target.closest("[data-email-toggle-role]");
  if (button) {
    event.preventDefault();
    event.stopPropagation();
    const key = button.dataset.emailToggleAll;
    const toRadios = Array.from(emailSettingsForm.querySelectorAll(`[data-email-step="${key}"][data-user-login][value="to"]`));
    const shouldSelectAll = toRadios.some((input) => !input.checked);
    toRadios.forEach((input) => {
      input.checked = shouldSelectAll;
    });
    updateEmailStepSummary(key);
  }
  if (roleButton) {
    event.preventDefault();
    event.stopPropagation();
    const key = roleButton.dataset.emailStep;
    const role = roleButton.dataset.emailToggleRole;
    const mode = roleButton.dataset.emailMode;
    emailSettingsForm.querySelectorAll(`[data-email-step="${key}"][data-user-role="${role}"][value="${mode}"]`).forEach((input) => {
      input.checked = true;
    });
    updateEmailStepSummary(key);
  }
});

emailSettingsForm?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-email-step][data-user-login], [data-email-step][data-extra-to], [data-email-step][data-extra-cc]");
  if (!input) return;
  updateEmailStepSummary(input.dataset.emailStep);
});

userList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-user-action]");
  if (!button) return;

  const row = button.closest(".user-row");
  const email = row?.dataset.email;
  if (!email) return;

  if (button.dataset.userAction === "save-password") {
    const account = getAllAccounts()[email];
    const newCorporateEmail = normalizeCorporateEmail(row.querySelector(".user-corporate-email").value, email);
    const emailChanged = account && normalizeCorporateEmail(account.corporateEmail, email) !== newCorporateEmail;
    userAccessFeedback = { email, message: emailChanged ? "E-mail gravado com sucesso." : "Acesso gravado com sucesso." };
    updateUserAccess(email, row.querySelector(".user-password").value, row.querySelector(".user-role").value, newCorporateEmail);
  }

  if (button.dataset.userAction === "delete-user") {
    deleteUser(email);
  }
});

userList.addEventListener("input", (event) => {
  markUserRowChanged(event.target);
});

userList.addEventListener("change", (event) => {
  markUserRowChanged(event.target);
});

partRegistrationList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-part-action]");
  if (!button) return;

  const row = button.closest(".part-registration-row");
  const id = row?.dataset.id;
  if (!id) return;

  if (button.dataset.partAction === "save" || button.dataset.partAction === "existing") {
    completePartRegistration(id, row.querySelector(".created-part-code").value, row.querySelector(".created-part-description").value, button.dataset.partAction === "existing");
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
  clearQueueFilters();
  hardenQueueFiltersAgainstAutofill();
  body.dataset.view = "app";
  body.dataset.role = currentUser.role;
  sessionLabel.textContent = `${currentUser.label} | ${currentUser.email}`;
  userGreeting.textContent = getUserGreeting(currentUser);
  currentPage = currentUser.role === "pcm" ? "request" : currentUser.role === "compras" ? "purchase" : "pending";
  currentFilter = currentUser.role === "cd" ? "cd" : "solicitacao";
  resetItemLines();
  await syncFromSupabase();
  if (repairBp0030VoltageRegulatorCdFulfillment()) {
    await saveRequestsSafely("ajuste BP - 0030");
  }
  if (repairReceivedItemsStuckInReceipt()) {
    await saveRequestsSafely("recebimentos pendentes");
  }
  if (repairReceiptReleasedItemsToPickup()) {
    await saveRequestsSafely("retiradas liberadas");
  }
  if (repairInvalidSapTestRequests()) {
    await saveRequestsSafely("testes SAP");
  }
  if (await repairWrongOilCapCode()) {
    await saveRequestsSafely("cadastro de item");
    saveCustomParts();
    savePartRegistrations();
  }
  if (repairRejectedCancellationsStuckInReview()) {
    await saveRequestsSafely("cancelamentos recusados");
  }
  if (await repairDuplicatePendingRequests()) {
    await saveRequestsSafely("solicitações duplicadas");
  }
  if (migratePurchaseApprovalBacklog()) {
    await saveRequestsSafely("pendências de compra");
  }
  syncStructuredTablesSafely("abertura do app");
  renderAppSafely();
  scheduleQueueFilterAutofillCleanup();
}

function syncStructuredTablesSafely(context = "sincronização") {
  Promise.resolve(mirrorRequestsToStructuredTables(requests)).catch((error) => {
    warnOptionalSupabaseMirror(`Falha ao sincronizar solicitações estruturadas em ${context}`, error);
  });

  Promise.resolve(mirrorCustomPartsToStructuredTable(customParts)).catch((error) => {
    warnOptionalSupabaseMirror(`Falha ao sincronizar itens em ${context}`, error);
  });
}

function renderAppSafely() {
  try {
    setPage(currentPage);
    render();
  } catch (error) {
    console.error("Erro ao carregar a tela principal. Tentando normalizar dados.", error);
    setSupabaseStatus("error", "Erro ao carregar tela");
    requests = (Array.isArray(requests) ? requests : []).map((request) => normalizeRequest(request)).filter(Boolean);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));

    try {
      setPage(currentPage);
      render();
    } catch (retryError) {
      console.error("Não foi possível renderizar o app após normalização.", retryError);
      showAppLoadError(retryError);
    }
  }
}

function showAppLoadError(error) {
  body.dataset.view = "app";
  if (!list) return;
  list.innerHTML = `
    <div class="empty-state">
      Não foi possível carregar as solicitações agora. Atualize a página ou entre novamente.
      <br><small>${escapeHtml(error?.message || "Erro interno")}</small>
    </div>
  `;
}

function syncRequestTarget() {
  if (!requestTarget || !busInput) return;
  const isFleet = requestTarget.value === "frota";
  busInput.required = !isFleet;
  busInput.disabled = isFleet;
  busInput.placeholder = isFleet ? "Solicitação para frota" : "Ex.: 1248";
  if (isFleet) busInput.value = "";
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

function getRequestTargetLabel(request) {
  return request?.targetType === "frota" || String(request?.bus || "").toLowerCase() === "frota" ? "Frota" : `Prefixo ${request?.bus || "-"}`;
}

function setPage(page) {
  if (page === "approval") page = "purchase";
  currentPage = page;
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.page === page));
  pages.forEach((section) => section.classList.toggle("active", section.id === `page-${page}`));
  if (page === "history") renderHistory();
  if (page === "approval") renderApprovalQueue();
  if (page === "purchase") renderPurchaseOverview();
  if (page === "admin") renderUsers();
  if (page === "part-admin") renderPartRegistrations();
  if (page === "email-admin") renderEmailSettings();
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
  const push = (request, type, title, filter, page = "pending", itemCount = null) => {
    const items = itemCount ?? getNotificationItemCount(request, filter);
    notifications.push({
      id: `${request.id}:${type}:${request.status}:${items}`,
      requestId: request.id,
      title,
      description: `${request.id} | ${getRequestTargetLabel(request)} | ${formatItemCount(items)}`,
      filter,
      page,
      items,
    });
  };

  requests.forEach((request) => {
    if (currentUser.role === "pcm" && hasPickupPending(request)) {
      push(request, "retirada", "Item liberado para retirada", "atendimento");
    }
    if (currentUser.role === "pcm" && hasPurchasedItemWaitingReceipt(request)) {
      push(request, "chegada-compra", "Item comprado chegou", "compra", "history", getReceiptPendingItems(request).length);
    }
    if (currentUser.role === "almox") {
      if (request.status === "solicitacao") push(request, "almox", "Pendente de atendimento do Almoxarifado", "solicitacao");
      if (getDisplayStatus(request) === "recebimento") push(request, "recebimento", "Pendente entrada e recebimento", "recebimento");
      if (hasPickupPending(request)) push(request, "retirada", "Retirada do PCM pendente", "atendimento");
    }
    if (currentUser.role === "cd") {
      if (request.status === "cd") push(request, "cd", "Pendente de atendimento do CD", "cd");
      if (getDisplayStatus(request) === "recebimento") push(request, "recebimento", "Pendente entrada e recebimento", "recebimento");
    }
    if (currentUser.role === "compras" && isPurchaseQueuePending(request) && getPurchasePendingQtySum(request) > 0) {
      push(request, "compra", "Pendente de pedido de compra", "compra", "purchase");
    }
    if ((currentUser.role === "manager" || currentUser.role === "admin") && hasPurchasedItemWaitingReceipt(request)) {
      push(request, "chegada-compra", "Item comprado chegou", "compra", "history", getReceiptPendingItems(request).length);
    }
  });

  const pendingPartRegistrations = partRegistrations.filter((item) => item.status !== "done");
  if (currentUser.role === "admin" && pendingPartRegistrations.length > 0) {
    const pendingIds = pendingPartRegistrations.map((item) => item.id).sort().join(",");
    notifications.push({
      id: `cadastro-item:${pendingIds}`,
      requestId: "",
      title: "Cadastro de item pendente",
      description: `${formatItemCount(pendingPartRegistrations.length)} aguardando código SAP`,
      filter: "",
      page: "part-admin",
      items: pendingPartRegistrations.length,
    });
  }

  return notifications;
}

function getNotificationItemCount(request, filter) {
  if (filter === "atendimento") return request.items.filter(isPickupItemPending).length;
  if (filter === "recebimento") return getReceiptPendingItems(request).length;
  if (filter === "compra" && currentUser?.role === "compras") return request.items.filter((item) => isPurchaseItemActive(request, item)).length;
  if (filter === "compra") return request.items.filter((item) => isPurchaseItemActive(request, item)).length;
  if (filter === "cd") return request.items.filter((item) => getCdPendingQty(item) > 0).length;
  return request.items.length;
}

function formatItemCount(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? "item" : "itens"}`;
}

function updateNotificationBadge() {
  const read = getReadNotifications();
  const notifications = getUserNotifications();
  const unread = notifications.filter((item) => !read.has(item.id));
  const unreadItems = unread.reduce((sum, item) => sum + item.items, 0);
  notificationCount.textContent = unreadItems;
  notificationButton.classList.toggle("has-unread", unread.length > 0);
  notificationButton.title = `${formatItemCount(unreadItems)} não lido(s) para você`;
  if (!notificationPopover.hidden) renderNotifications();
}

function renderNotifications() {
  const read = getReadNotifications();
  const notifications = getUserNotifications();
  const unreadNotifications = notifications.filter((item) => !read.has(item.id));
  if (unreadNotifications.length === 0) {
    notificationList.innerHTML = '<div class="notification-empty">Nenhuma notificação não lida.</div>';
    notificationCount.textContent = "0";
    notificationButton.classList.remove("has-unread");
    return;
  }
  notificationList.innerHTML = unreadNotifications.map((item) => `
    <button class="notification-item unread" type="button" data-id="${item.id}" data-filter="${item.filter}" data-page="${item.page}">
      <i class="notification-item-icon" aria-hidden="true">??</i>
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
  if (page === "history") {
    setPage("history");
    return;
  }
  if (page === "part-admin") {
    setPage("part-admin");
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
  const cancellationWasApproved = Boolean(request?.cancellationApprovedAt) || request?.status === "cancelado";
  const normalizedStatus = cancellationWasApproved ? "cancelado" : hasPendingCancellation(request) ? "cancelamento" : normalizeStatus(request.status, request.items || []);
  const sapRequestNumber = normalizeSapRequestNumber(request.sapRequestNumber);
  if (request.items) {
    const rawItems = request.items.map((item) => normalizeItem(item, normalizedStatus));
    const normalizedItems = normalizedStatus === "cancelado"
      ? rawItems.map((item) => ({ ...item, status: "cancelado", statusItem: "cancelado" }))
      : normalizePurchaseApprovalFlow(rawItems);
    const finalStatus = normalizedStatus === "aprovacao" ? "compra" : normalizedStatus || calculateStatus(normalizedItems);
    return {
      ...request,
      targetType: request.targetType || (String(request.bus || "").toLowerCase() === "frota" ? "frota" : "prefixo"),
      status: finalStatus,
      purchaseOrder: request.purchaseOrder || "",
      response: normalizeSapRequestResponse(request.response, sapRequestNumber),
      sapRequestNumber,
      sapRequestAt: sapRequestNumber ? request.sapRequestAt || "" : "",
      sapRequestBy: sapRequestNumber ? request.sapRequestBy || "" : "",
      buyerNote: request.buyerNote || "",
      deliveryDate: request.deliveryDate || "",
      purchaseUpdatedAt: request.purchaseUpdatedAt || "",
      purchaseUpdatedBy: request.purchaseUpdatedBy || "",
      purchaseArrivedDate: request.purchaseArrivedDate || "",
      purchaseArrivedAt: request.purchaseArrivedAt || "",
      receiptNumber: request.receiptNumber || "",
      receiptAt: request.receiptAt || "",
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
      maintainer: request.maintainer || "",
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
      cancellationPreviousStatus: request.cancellationPreviousStatus || "",
      cancellationPreviousDisplayStatus: request.cancellationPreviousDisplayStatus || "",
      cancellationRequestedAt: request.cancellationRequestedAt || "",
      cancellationRequestedBy: request.cancellationRequestedBy || "",
      cancellationRequestedByEmail: request.cancellationRequestedByEmail || "",
      cancellationReason: request.cancellationReason || "",
      cancellationApprovedAt: request.cancellationApprovedAt || "",
      cancellationApprovedBy: request.cancellationApprovedBy || "",
      cancellationApprovedByEmail: request.cancellationApprovedByEmail || "",
      cancellationRejectedAt: request.cancellationRejectedAt || "",
      cancellationRejectedBy: request.cancellationRejectedBy || "",
      items: normalizedItems,
    };
  }
  const rawItems = [normalizeItem({ code: "", description: request.part || "Peça sem descrição", quantity: request.quantity || 1 }, normalizedStatus)];
  const normalizedItems = normalizedStatus === "cancelado"
    ? rawItems.map((item) => ({ ...item, status: "cancelado", statusItem: "cancelado" }))
    : normalizePurchaseApprovalFlow(rawItems);
  const finalStatus = normalizedStatus === "aprovacao" ? "compra" : normalizedStatus;
  return {
    ...request,
    targetType: request.targetType || (String(request.bus || "").toLowerCase() === "frota" ? "frota" : "prefixo"),
    status: finalStatus,
    purchaseOrder: request.purchaseOrder || "",
    response: normalizeSapRequestResponse(request.response, sapRequestNumber),
    sapRequestNumber,
    sapRequestAt: sapRequestNumber ? request.sapRequestAt || "" : "",
    sapRequestBy: sapRequestNumber ? request.sapRequestBy || "" : "",
    buyerNote: request.buyerNote || "",
    deliveryDate: request.deliveryDate || "",
    purchaseUpdatedAt: request.purchaseUpdatedAt || "",
    purchaseUpdatedBy: request.purchaseUpdatedBy || "",
    purchaseArrivedDate: request.purchaseArrivedDate || "",
    purchaseArrivedAt: request.purchaseArrivedAt || "",
    receiptNumber: request.receiptNumber || "",
    receiptAt: request.receiptAt || "",
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
    maintainer: request.maintainer || "",
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
    cancellationPreviousStatus: request.cancellationPreviousStatus || "",
    cancellationPreviousDisplayStatus: request.cancellationPreviousDisplayStatus || "",
    cancellationRequestedAt: request.cancellationRequestedAt || "",
    cancellationRequestedBy: request.cancellationRequestedBy || "",
    cancellationRequestedByEmail: request.cancellationRequestedByEmail || "",
    cancellationReason: request.cancellationReason || "",
    cancellationApprovedAt: request.cancellationApprovedAt || "",
    cancellationApprovedBy: request.cancellationApprovedBy || "",
    cancellationApprovedByEmail: request.cancellationApprovedByEmail || "",
    cancellationRejectedAt: request.cancellationRejectedAt || "",
    cancellationRejectedBy: request.cancellationRejectedBy || "",
    items: normalizedItems,
  };
}

function normalizeStatus(status, items = []) {
  if (status === "solicitacao" || status === "cadastro" || status === "cd" || status === "atendimento" || status === "aprovacao" || status === "compra" || status === "recebimento" || status === "cancelamento" || status === "cancelado" || status === "reprovado" || status === "retirado") return status;
  if (status === "pendente") return "solicitacao";
  if (status === "estoque" || status === "atendida") return "atendimento";
  if (status === "compra" || status === "parcial") return "compra";
  return calculateStatus(items);
}

function normalizeSapRequestNumber(value) {
  const text = String(value || "").trim();
  return text.toLowerCase() === "teste" ? "" : text;
}

function normalizeSapRequestResponse(response, sapRequestNumber) {
  const text = String(response || "");
  const hasInvalidSapTest = !sapRequestNumber && /solicita[cç][aã]o sap registrada[\s\S]*\bteste\b/i.test(text);
  return hasInvalidSapTest ? "Pendente solicitação SAP pelo Almoxarifado." : text;
}

function normalizeItem(item, requestStatus = "solicitacao") {
  const quantity = Number(item.quantity) || 1;
  const hasSapCode = hasRealSapCode(item);
  const pendingData = {
    isPendingRegistration: !hasSapCode && Boolean(item.isPendingRegistration),
    pendingRegistrationId: !hasSapCode ? item.pendingRegistrationId || "" : "",
    pendingOriginalCode: !hasSapCode ? item.pendingOriginalCode || "" : "",
    pendingPhotoName: !hasSapCode ? item.pendingPhotoName || "" : "",
    pendingPhotoDataUrl: !hasSapCode ? item.pendingPhotoDataUrl || "" : "",
  };
  if (Number.isFinite(Number(item.availableQty)) && Number.isFinite(Number(item.purchaseQty))) {
    return { ...item, ...pendingData, quantity, availableQty: Number(item.availableQty), cdQty: Number(item.cdQty) || 0, purchaseQty: Number(item.purchaseQty), withdrawnQty: Number(item.withdrawnQty) || 0, purchaseApproval: item.purchaseApproval || "" };
  }

  if (requestStatus === "atendimento" || requestStatus === "retirado") {
    return { ...item, ...pendingData, quantity, availableQty: quantity, cdQty: 0, purchaseQty: 0, withdrawnQty: requestStatus === "retirado" ? quantity : 0, purchaseApproval: item.purchaseApproval || "" };
  }

  if (requestStatus === "compra") {
    return { ...item, ...pendingData, quantity, availableQty: 0, cdQty: 0, purchaseQty: quantity, withdrawnQty: 0, purchaseApproval: item.purchaseApproval || "approved" };
  }

  return { ...item, ...pendingData, quantity, availableQty: 0, cdQty: 0, purchaseQty: 0, withdrawnQty: 0, purchaseApproval: item.purchaseApproval || "" };
}

function normalizePurchaseApprovalFlow(items) {
  return items.map((item) => {
    const purchaseQty = Number(item.purchaseQty) || 0;
    if (purchaseQty > 0 && item.purchaseApproval !== "rejected") {
      return { ...item, purchaseApproval: "approved" };
    }
    return item;
  });
}

function migratePurchaseApprovalBacklog() {
  let changed = false;
  requests = requests.map((request) => {
    if (request.status === "cancelado" || request.cancellationApprovedAt) {
      if (request.status === "cancelado") return request;
      changed = true;
      return {
        ...request,
        status: "cancelado",
        items: request.items.map((item) => ({ ...item, status: "cancelado", statusItem: "cancelado" })),
      };
    }
    if (request.status !== "aprovacao" && !request.items.some((item) => Number(item.purchaseQty) > 0 && item.purchaseApproval === "pending")) {
      return request;
    }
    changed = true;
    const now = new Date().toISOString();
    return {
      ...request,
      status: request.status === "aprovacao" ? "compra" : request.status,
      purchaseApprovalRequestedAt: "",
      purchaseApprovedAt: request.purchaseApprovedAt || now,
      purchaseApprovedBy: request.purchaseApprovedBy || "Fluxo automático",
      response: request.response || "Saldo pendente liberado diretamente para abertura da solicitação SAP.",
      items: request.items.map((item) => Number(item.purchaseQty) > 0 && item.purchaseApproval !== "rejected" ? { ...item, purchaseApproval: "approved" } : item),
    };
  });
  return changed;
}

function repairBp0030VoltageRegulatorCdFulfillment() {
  let changed = false;
  const now = new Date().toISOString();

  requests = requests.map((request) => {
    if (request.id !== "BP - 0030") return request;

    let repairedItem = false;
    const items = request.items.map((item) => {
      const isVoltageRegulator = String(item.code || "").trim() === "30007756"
        || String(item.description || "").toLowerCase().includes("regulador de voltagem");
      if (!isVoltageRegulator) return item;

      const requestedQty = Number(item.quantity) || 1;
      const alreadyFixed = Number(item.cdQty) >= requestedQty && Number(item.purchaseQty || 0) === 0;
      if (alreadyFixed) return item;

      repairedItem = true;
      return {
        ...item,
        cdQty: requestedQty,
        cdPendingQty: 0,
        purchaseQty: 0,
        purchaseApproval: "",
      };
    });

    if (!repairedItem) return request;

    changed = true;
    const hasPurchasePending = items.some((item) => getPurchasePendingQty(item) > 0);
    return {
      ...request,
      items,
      status: "recebimento",
      cdAt: request.cdAt || now,
      cdBy: request.cdBy || "CD",
      purchaseAt: hasPurchasePending ? request.purchaseAt || now : request.purchaseAt || "",
      response: "Regulador de voltagem atendido pelo CD. Item removido de compras; demais itens permanecem conforme fluxo.",
    };
  });

  return changed;
}

function repairReceivedItemsStuckInReceipt() {
  let changed = false;

  requests = requests.map((request) => {
    if (!request.receiptAt && !request.receiptNumber) return request;

    let repairedItem = false;
    const items = request.items.map((item) => {
      const cdQty = Number(item.cdQty) || 0;
      const purchaseQty = 0;
      if (cdQty <= 0 && purchaseQty <= 0) return item;

      repairedItem = true;
      return {
        ...item,
        availableQty: (Number(item.availableQty) || 0) + cdQty + purchaseQty,
        cdReceivedQty: (Number(item.cdReceivedQty) || 0) + cdQty,
        purchaseReceivedQty: (Number(item.purchaseReceivedQty) || 0) + purchaseQty,
        cdQty: 0,
        purchaseQty: 0,
        status: "atendimento",
        statusItem: "atendimento",
      };
    });

    if (!repairedItem) return request;
    changed = true;
    const hasPurchasePendingAfterRepair = items.some((item) => getPurchasePendingQty(item) > 0 && item.purchaseApproval === "approved");
    return {
      ...request,
      items,
      status: hasPurchasePendingAfterRepair ? "compra" : "atendimento",
      pickupAt: request.pickupAt || request.receiptAt || new Date().toISOString(),
      response: request.response || "Recebimento confirmado. Item liberado para retirada do PCM.",
    };
  });

  return changed;
}

function repairReceiptReleasedItemsToPickup() {
  let changed = false;

  requests = requests.map((request) => {
    if (!hasPickupPending(request)) return request;
    const displayStatus = getDisplayStatus(request);
    if (!["recebimento", "compra"].includes(request.status) && displayStatus !== "recebimento") return request;
    const hasReceivedItem = request.items.some((item) =>
      (Number(item.cdReceivedQty) || 0) > 0
      || (Number(item.purchaseReceivedQty) || 0) > 0
      || Boolean(item.receiptNumber || item.receiptAt)
    );
    if (!hasReceivedItem) return request;

    changed = true;
    return {
      ...request,
      status: "atendimento",
      pickupAt: request.pickupAt || request.receiptAt || new Date().toISOString(),
      response: request.response || "Item recebido e liberado para retirada do PCM.",
    };
  });

  return changed;
}

function repairInvalidSapTestRequests() {
  let changed = false;

  requests = requests.map((request) => {
    const sapRequestNumber = normalizeSapRequestNumber(request.sapRequestNumber);
    const response = normalizeSapRequestResponse(request.response, sapRequestNumber);
    const shouldCleanSapFields = !sapRequestNumber && String(request.sapRequestNumber || "").trim().toLowerCase() === "teste";
    if (!shouldCleanSapFields && response === (request.response || "")) return request;

    changed = true;
    return {
      ...request,
      sapRequestNumber,
      sapRequestAt: sapRequestNumber ? request.sapRequestAt || "" : "",
      sapRequestBy: sapRequestNumber ? request.sapRequestBy || "" : "",
      response,
    };
  });

  return changed;
}

async function repairWrongOilCapCode() {
  const wrongCode = "30027492";
  const rightCode = "30027495";
  const rightDescription = "A 990 010 38 00 - TAMPA DE ENCHIMENTO DE ÓLEO MB 1721";
  let changed = false;

  const fixPart = (part) => {
    if (String(part?.code || "").trim() !== wrongCode) return part;
    changed = true;
    return { ...part, code: rightCode, description: part.description || rightDescription };
  };

  requests = requests.map((request) => {
    let requestChanged = false;
    const items = (request.items || []).map((item) => {
      if (String(item.code || "").trim() !== wrongCode) return item;
      requestChanged = true;
      changed = true;
      return { ...item, code: rightCode, description: item.description || rightDescription };
    });
    return requestChanged ? { ...request, items } : request;
  });

  customParts = customParts
    .map(fixPart)
    .filter((part, index, list) => list.findIndex((item) => String(item.code || "").trim() === String(part.code || "").trim()) === index);

  partRegistrations = partRegistrations.map((registration) => {
    if (String(registration.createdCode || "").trim() !== wrongCode) return registration;
    changed = true;
    return {
      ...registration,
      createdCode: rightCode,
      createdDescription: registration.createdDescription || rightDescription,
    };
  });

  if (changed && supabaseClient) {
    await Promise.all([
      deleteSupabaseRow("manupecas_custom_parts", "code", wrongCode),
      deleteSupabaseRow("itens", "codigo_sap", wrongCode),
    ]);
  }

  return changed;
}

function repairRejectedCancellationsStuckInReview() {
  let changed = false;

  requests = requests.map((request) => {
    if (request.status !== "cancelamento" || !request.cancellationRejectedAt || request.cancellationApprovedAt) return request;
    changed = true;
    return {
      ...request,
      status: resolveCancellationRestoredStatus(request),
      response: request.response || "Cancelamento recusado. Solicitação mantida em aberto.",
    };
  });

  return changed;
}

async function syncFromSupabase() {
  if (!supabaseClient) {
    setSupabaseStatus("offline", "Supabase: não conectado");
    return;
  }

  try {
    setSupabaseStatus("saving", "Supabase: sincronizando");
    const [remoteRequests, remoteUsers, remoteDeletedUsers, remoteCustomParts, remotePartRegistrations, remoteStructuredParts, remoteEmailSettings] = await Promise.all([
      loadSupabaseRows("manupecas_requests", "id"),
      loadSupabaseRows("manupecas_users", "email"),
      loadSupabaseDeletedUsers(),
      loadSupabaseRows("manupecas_custom_parts", "code"),
      loadSupabaseRows("manupecas_part_registrations", "id"),
      loadStructuredItems(),
      loadEmailSettingsFromSupabase(),
    ]);

    let syncedRequests = remoteRequests;
    if (syncedRequests && syncedRequests.length === 0) {
      const structuredRequests = await loadStructuredRequests();
      if (structuredRequests && structuredRequests.length > 0) syncedRequests = structuredRequests;
    }

    if (syncedRequests) {
      requests = mergeRequestCollections(requests, syncedRequests.map(normalizeRequest))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    }
    if (remoteUsers) {
      managedUsers = dedupeUsers(remoteUsers.map((user) => normalizeAccount(user, user.email)));
      localStorage.setItem(USERS_KEY, JSON.stringify(managedUsers));
      saveManagedUsers();
      deleteSupabaseRow("manupecas_users", "email", "rodrigo.silva");
    }
    if (remoteDeletedUsers) {
      deletedUsers = remoteDeletedUsers;
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deletedUsers));
    }
    if (remoteCustomParts) {
      customParts = remoteCustomParts;
      localStorage.setItem(CUSTOM_PARTS_KEY, JSON.stringify(customParts));
    }
    if (remoteStructuredParts) {
      customParts = mergeCustomParts(customParts, remoteStructuredParts);
      localStorage.setItem(CUSTOM_PARTS_KEY, JSON.stringify(customParts));
    }
    if (remotePartRegistrations) {
      partRegistrations = remotePartRegistrations;
      localStorage.setItem(PART_REGISTRATIONS_KEY, JSON.stringify(partRegistrations));
    }
    if (remoteEmailSettings) {
      emailSettings = normalizeEmailSettings(remoteEmailSettings);
      localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(emailSettings));
    }
    setSupabaseStatus("ok", "Supabase: conectado");
  } catch (error) {
    setSupabaseStatus("error", "Supabase: erro de conexão");
    console.warn("Supabase indisponível. Usando dados locais.", error);
  }
}

function setSupabaseStatus(status, text) {
  if (!supabaseStatus) return;
  supabaseStatus.textContent = text;
  supabaseStatus.dataset.status = status;
}

function trackSupabaseWrite(promise, label = "dados") {
  if (!promise || typeof promise.then !== "function") return promise;
  setSupabaseStatus("saving", "Supabase: salvando");
  const tracked = promise
    .then((result) => {
      const error = Array.isArray(result)
        ? result.find((item) => item?.error)?.error
        : result?.error;
      if (error) {
        setSupabaseStatus("error", `Supabase: erro ao salvar ${label}`);
        console.warn(`Erro ao salvar ${label}:`, error.message || error);
      } else {
        setSupabaseStatus("ok", "Supabase: salvo");
      }
      return result;
    })
    .catch((error) => {
      setSupabaseStatus("error", `Supabase: erro ao salvar ${label}`);
      console.warn(`Erro ao salvar ${label}:`, error);
      return { error };
    })
    .finally(() => {
      pendingSupabaseWrites = pendingSupabaseWrites.filter((item) => item !== tracked);
    });
  pendingSupabaseWrites.push(tracked);
  return tracked;
}

function warnOptionalSupabaseMirror(context, error) {
  const detail = error?.message || error || "sem detalhe retornado";
  console.warn(`${context}. Espelho opcional não atualizado:`, detail);
}

async function flushSupabaseWrites() {
  if (pendingSupabaseWrites.length === 0) return;
  await Promise.allSettled([...pendingSupabaseWrites]);
}

async function loadSupabaseRows(table, keyField) {
  const { data, error } = await supabaseClient.from(table).select(`${keyField}, data, updated_at`);
  if (error) {
    console.warn(`Erro ao carregar ${table}:`, error.message);
    return null;
  }
  return (data || []).map((row) => row.data ? { ...row.data, updatedAt: row.data.updatedAt || row.updated_at || "" } : null).filter(Boolean);
}

async function loadAccountForLogin(login) {
  const normalizedLogin = normalizeLogin(login);
  const { data, error } = await supabaseClient
    .from("manupecas_users")
    .select("email, data")
    .eq("email", normalizedLogin)
    .maybeSingle();
  if (error) {
    console.warn("Erro ao buscar usuário no Supabase:", error.message);
    return null;
  }
  if (!data?.data) return null;
  const remoteUser = normalizeAccount(data.data, data.email);
  managedUsers = dedupeUsers([...managedUsers.filter((user) => normalizeLogin(user.email) !== normalizedLogin), remoteUser]);
  localStorage.setItem(USERS_KEY, JSON.stringify(managedUsers));
  return remoteUser;
}

async function loadStructuredItems() {
  const { data, error } = await supabaseClient
    .from("itens")
    .select("codigo_sap, descricao, codigo_original, ativo, criado_em")
    .eq("ativo", true);
  if (error) {
    console.warn("Erro ao carregar itens estruturados:", error.message);
    return null;
  }
  return (data || [])
    .map((row) => ({
      code: String(row.codigo_sap || "").trim(),
      description: String(row.descricao || "").trim(),
      originalCode: String(row.codigo_original || "").trim(),
      createdAt: row.criado_em || "",
    }))
    .filter((part) => part.code && part.description);
}

async function loadStructuredRequests() {
  const [{ data: requestRows, error: requestError }, { data: itemRows, error: itemError }] = await Promise.all([
    supabaseClient
      .from("solicitacoes")
      .select("id, numero, prefixo, tipo_solicitacao, prioridade, motivo, solicitante, manutentor, status_atual, criado_em")
      .order("criado_em", { ascending: false }),
    supabaseClient
      .from("solicitacao_itens")
      .select("solicitacao_id, codigo_sap, descricao, quantidade_solicitada, quantidade_almox, quantidade_cd, quantidade_compra, quantidade_retirada, status_item, nf_transferencia, entrada_sap, criado_em"),
  ]);

  if (requestError || itemError) {
    console.warn("Erro ao carregar solicitações estruturadas:", requestError?.message || itemError?.message);
    return null;
  }

  const itemsByRequest = (itemRows || []).reduce((acc, item) => {
    const key = item.solicitacao_id;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      code: item.codigo_sap || "",
      description: item.descricao || "Peça sem descrição",
      quantity: Number(item.quantidade_solicitada) || 1,
      almoxQty: Number(item.quantidade_almox) || 0,
      availableQty: Number(item.quantidade_almox) || 0,
      cdQty: Number(item.quantidade_cd) || 0,
      purchaseQty: Number(item.quantidade_compra) || 0,
      withdrawnQty: Number(item.quantidade_retirada) || 0,
    });
    return acc;
  }, {});

  return (requestRows || []).map((row) => ({
    id: row.numero,
    bus: row.tipo_solicitacao === "frota" ? "Frota" : row.prefixo,
    targetType: row.tipo_solicitacao || (String(row.prefixo || "").toLowerCase() === "frota" ? "frota" : "prefixo"),
    priority: row.prioridade || "Normal",
    reason: row.motivo || "",
    requestedBy: row.solicitante || "PCM",
    maintainer: row.manutentor || "",
    createdAt: row.criado_em || new Date().toISOString(),
    items: itemsByRequest[row.id] || [],
  })).filter((request) => request.id && request.items.length > 0);
}

function mergeCustomParts(localParts, remoteParts) {
  const merged = [...localParts];
  const seen = new Set(merged.map((part) => String(part.code || "").trim()));
  remoteParts.forEach((part) => {
    if (seen.has(part.code)) return;
    seen.add(part.code);
    merged.push(part);
  });
  return merged;
}

async function loadSupabaseDeletedUsers() {
  const { data, error } = await supabaseClient.from("manupecas_deleted_users").select("email");
  if (error) {
    console.warn("Erro ao carregar usuários excluídos:", error.message);
    return null;
  }
  return (data || []).map((row) => row.email).filter(Boolean);
}

async function loadEmailSettingsFromSupabase() {
  const { data, error } = await supabaseClient.from("manupecas_email_settings").select("id, data").eq("id", "default").maybeSingle();
  if (error) {
    console.warn("Erro ao carregar configuração de e-mail:", error.message);
    return null;
  }
  return data?.data || null;
}

function upsertSupabaseRows(table, keyField, rows) {
  if (!supabaseClient) return Promise.resolve();
  const now = new Date().toISOString();
  const payload = rows.map((row) => {
    const data = { ...row, updatedAt: row.updatedAt || now };
    return { [keyField]: row[keyField], data, updated_at: data.updatedAt };
  });
  if (payload.length === 0) return Promise.resolve();
  return trackSupabaseWrite(supabaseClient.from(table).upsert(payload, { onConflict: keyField }), table);
}

async function upsertMergedRequestRows(rows) {
  if (!supabaseClient || rows.length === 0) return Promise.resolve();
  const ids = rows.map((row) => row.id).filter(Boolean);
  if (ids.length === 0) return Promise.resolve();

  const { data, error } = await supabaseClient
    .from("manupecas_requests")
    .select("id, data")
    .in("id", ids);

  if (error) {
    setSupabaseStatus("error", "Supabase: erro ao validar solicitações");
    console.warn("Erro ao validar solicitações antes de salvar:", error.message);
    return { error };
  }

  const remoteById = new Map((data || []).map((row) => [row.id, normalizeRequest(row.data)]));
  const usedIds = new Set([
    ...requests.map((request) => request.id).filter(Boolean),
    ...(data || []).map((row) => row.id).filter(Boolean),
  ]);
  const rowsWithoutCollision = rows.map((row) => {
    const remoteRequest = remoteById.get(row.id);
    if (remoteRequest && !isSameLogicalRequest(row, remoteRequest)) {
      const originalId = row.id;
      row.id = makeNextRequestCode(usedIds);
      usedIds.add(row.id);
      row.response = row.response || `Solicitação renumerada de ${originalId} para ${row.id} para evitar duplicidade.`;
    } else if (row.id) {
      usedIds.add(row.id);
    }
    return row;
  });
  const mergedRows = rowsWithoutCollision.map((row) => mergeRequestByProgress(row, remoteById.get(row.id)));
  const mergedById = new Map(mergedRows.map((row) => [row.id, row]));
  requests = requests.map((request) => mergedById.get(request.id) || request);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));

  return upsertSupabaseRows("manupecas_requests", "id", mergedRows);
}

function mergeRequestByProgress(localRequest, remoteRequest) {
  if (!remoteRequest) return localRequest;
  if (!isSameLogicalRequest(localRequest, remoteRequest)) return localRequest;
  const localScore = getRequestProgressScore(localRequest);
  const remoteScore = getRequestProgressScore(remoteRequest);
  if (remoteScore > localScore) return remoteRequest;
  if (localScore > remoteScore) return localRequest;
  return getRequestLastChange(remoteRequest) > getRequestLastChange(localRequest) ? remoteRequest : localRequest;
}

function mergeRequestCollections(localRows = [], remoteRows = []) {
  const merged = new Map();
  remoteRows.forEach((row) => {
    if (!row?.id) return;
    merged.set(row.id, normalizeRequest(row));
  });
  localRows.forEach((row) => {
    if (!row?.id) return;
    const localRequest = normalizeRequest(row);
    const remoteRequest = merged.get(localRequest.id);
    merged.set(localRequest.id, remoteRequest ? mergeRequestByProgress(localRequest, remoteRequest) : localRequest);
  });
  return [...merged.values()];
}

function isSameLogicalRequest(localRequest, remoteRequest) {
  if (!localRequest || !remoteRequest) return false;
  if (localRequest.createdAt && remoteRequest.createdAt && localRequest.createdAt === remoteRequest.createdAt) return true;
  const localRequester = normalizeLogin(localRequest.requestedByEmail || localRequest.requestedBy || "");
  const remoteRequester = normalizeLogin(remoteRequest.requestedByEmail || remoteRequest.requestedBy || "");
  return Boolean(localRequester)
    && localRequester === remoteRequester
    && getRequestItemSignature(localRequest) === getRequestItemSignature(remoteRequest);
}

function normalizeCode(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeSearchCompact(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function getRequestItemSignature(request) {
  return (request.items || [])
    .map((item) => [
      normalizeCode(item.code || ""),
      String(item.description || "").trim().toLowerCase(),
      Number(item.quantity) || 0,
    ].join("|"))
    .join("||");
}

function getRequestDuplicateSignature(request) {
  return [
    normalizeLogin(request?.requestedByEmail || request?.requestedBy || ""),
    String(request?.targetType || "").trim().toLowerCase(),
    String(request?.bus || "").trim().toLowerCase(),
    String(request?.maintainer || "").trim().toLowerCase(),
    String(request?.priority || "").trim().toLowerCase(),
    String(request?.reason || "").trim().toLowerCase(),
    getRequestItemSignature(request),
  ].join("##");
}

function isRequestEarlyStage(request) {
  if (!request) return false;
  const displayStatus = getDisplayStatus(request);
  const allowedStatuses = ["solicitacao", "cadastro"];
  const untouchedItems = (request.items || []).every((item) =>
    (Number(item.availableQty) || 0) === 0
    && (Number(item.cdPendingQty) || 0) === 0
    && (Number(item.cdQty) || 0) === 0
    && (Number(item.purchaseQty) || 0) === 0
    && (Number(item.withdrawnQty) || 0) === 0
  );
  return allowedStatuses.includes(displayStatus)
    && untouchedItems
    && !request.attendedAt
    && !request.cdAt
    && !request.purchaseAt
    && !request.receiptAt
    && !request.pickupAt
    && !request.withdrawnAt
    && !request.cancellationRequestedAt;
}

function areRequestsCreatedClose(first, second, maxMinutes = 10) {
  const firstTime = new Date(first?.createdAt || "").getTime();
  const secondTime = new Date(second?.createdAt || "").getTime();
  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) return false;
  return Math.abs(firstTime - secondTime) <= maxMinutes * 60 * 1000;
}

function findRecentDuplicateRequest(draftRequest) {
  const signature = getRequestDuplicateSignature(draftRequest);
  return requests.find((request) =>
    isRequestEarlyStage(request)
    && getRequestDuplicateSignature(request) === signature
    && areRequestsCreatedClose(request, draftRequest, 0.5)
  );
}

async function repairDuplicatePendingRequests() {
  const keepBySignature = new Map();
  const duplicateIds = [];
  const cleaned = [];

  [...requests]
    .sort((a, b) => (new Date(a.createdAt || 0).getTime() || 0) - (new Date(b.createdAt || 0).getTime() || 0))
    .forEach((request) => {
      if (!isRequestEarlyStage(request)) {
        cleaned.push(request);
        return;
      }

      const signature = getRequestDuplicateSignature(request);
      const kept = keepBySignature.get(signature);
      if (kept && areRequestsCreatedClose(kept, request, 10)) {
        duplicateIds.push(request.id);
        return;
      }

      keepBySignature.set(signature, request);
      cleaned.push(request);
    });

  if (duplicateIds.length === 0) return false;

  const orderByOriginalList = new Map(requests.map((request, index) => [request.id, index]));
  requests = cleaned.sort((a, b) => (orderByOriginalList.get(a.id) || 0) - (orderByOriginalList.get(b.id) || 0));
  if (supabaseClient) {
    await Promise.all(duplicateIds.map((id) => deleteSupabaseRow("manupecas_requests", "id", id)));
  }
  return true;
}

function getRequestProgressScore(request) {
  const itemScore = (request.items || []).reduce((score, item) => score
    + (Number(item.availableQty) || 0) * 2
    + (Number(item.cdPendingQty) || 0) * 2
    + (Number(item.cdQty) || 0) * 3
    + (Number(item.purchaseQty) || 0) * 3
    + (Number(item.purchaseReceivedQty) || 0) * 4
    + (Number(item.cdReceivedQty) || 0) * 4
    + (Number(item.withdrawnQty) || 0) * 5
    + (item.purchaseApproval === "approved" || item.purchaseApproval === "rejected" ? 3 : 0), 0);
  return itemScore + getRequestStageDates(request).length * 10 + getStatusRank(getDisplayStatus(request)) * 20;
}

function getStatusRank(status) {
  const ranks = {
    solicitacao: 1,
    cadastro: 1,
    cd: 2,
    aprovacao: 3,
    compra: 4,
    recebimento: 5,
    atendimento: 6,
    reprovado: 6,
    cancelamento: 6,
    retirado: 7,
    cancelado: 8,
  };
  return ranks[status] || 0;
}

function getRequestLastChange(request) {
  const dates = [request.updatedAt, ...getRequestStageDates(request)].map((date) => new Date(date).getTime()).filter((time) => Number.isFinite(time));
  return dates.length ? Math.max(...dates) : 0;
}

function toNullableIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNullableDate(value) {
  return value || null;
}

function getElapsedMinutes(start, end) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(0, Math.round((endDate - startDate) / 60000));
}

function getStructuredItemKey(item, index) {
  const code = String(item.code || "").trim();
  if (code) return `${index + 1}-${code}`;
  return `${index + 1}-${String(item.description || "item").trim().toLowerCase().slice(0, 80)}`;
}

function getReceiptNumberPlain(request, item) {
  if (!request.receiptNumber) return "";
  if ((Number(item.purchaseReceivedQty) || 0) > 0 || (Number(item.cdReceivedQty) || 0) > 0) return request.receiptNumber;
  return "";
}

async function replaceOperationalRows(table, requestNumbers, rows) {
  if (!supabaseClient || requestNumbers.length === 0) return true;
  const { error: deleteError } = await supabaseClient
    .from(table)
    .delete()
    .in("solicitacao_numero", requestNumbers);
  if (deleteError) {
    warnOptionalSupabaseMirror(`Erro ao limpar ${table}`, deleteError);
    return false;
  }
  if (rows.length === 0) return true;
  const { error: insertError } = await supabaseClient.from(table).insert(rows);
  if (insertError) {
    warnOptionalSupabaseMirror(`Erro ao salvar ${table}`, insertError);
    return false;
  }
  return true;
}

async function mirrorOperationalTables(normalizedRows) {
  const requestNumbers = normalizedRows.map((request) => request.id);
  const cdRows = [];
  const purchaseRows = [];
  const receiptRows = [];

  normalizedRows.forEach((request) => {
    request.items.forEach((item, index) => {
      const itemKey = getStructuredItemKey(item, index);
      const requestedQty = Number(item.quantity) || 0;
      const cdSentQty = Math.max(Number(item.cdPendingQty) || 0, Number(item.cdQty) || 0, Number(item.cdReceivedQty) || 0);
      const cdServedQty = getCdServedQty(item);
      const purchaseQty = Math.max(getPurchasePendingQty(item), Number(item.purchaseQty) || 0, Number(item.purchaseReceivedQty) || 0);
      const cdStartedAt = request.attendedAt || request.createdAt || "";
      const purchaseStartedAt = request.purchaseAt || request.purchaseApprovedAt || "";
      const receiptStartedAt = (Number(item.cdQty) || Number(item.cdReceivedQty)) ? request.cdAt : request.purchaseArrivedAt;

      if (cdSentQty > 0 || cdServedQty > 0) {
        cdRows.push({
          solicitacao_numero: request.id,
          item_chave: itemKey,
          codigo_sap: item.code || "",
          descricao: item.description || "",
          quantidade_enviada: cdSentQty,
          quantidade_atendida: cdServedQty,
          quantidade_compra: Math.max(0, cdSentQty - cdServedQty),
          responsavel: request.cdBy || "",
          nf_transferencia: cdServedQty > 0 ? request.transferInvoiceName || "" : "",
          inicio_em: toNullableIso(cdStartedAt),
          finalizado_em: toNullableIso(request.cdAt),
          sla_minutos: getElapsedMinutes(cdStartedAt, request.cdAt),
          status: request.cdAt ? "Atendido" : "Pendente atendimento do CD",
          criado_em: toNullableIso(request.createdAt) || new Date().toISOString(),
        });
      }

      if (purchaseQty > 0 || item.purchaseApproval === "approved" || item.purchaseApproval === "rejected") {
        purchaseRows.push({
          solicitacao_numero: request.id,
          item_chave: itemKey,
          codigo_sap: item.code || "",
          descricao: item.description || "",
          quantidade_compra: purchaseQty,
          solicitacao_sap: request.sapRequestNumber || "",
          pedido_compra: request.purchaseOrder || "",
          previsao_entrega: toNullableDate(request.deliveryDate),
          data_chegada: toNullableDate(request.purchaseArrivedDate),
          observacao: request.buyerNote || "",
          responsavel_sap: request.sapRequestBy || "",
          responsavel_compras: request.purchaseUpdatedBy || "",
          inicio_em: toNullableIso(purchaseStartedAt || request.sapRequestAt),
          pedido_registrado_em: toNullableIso(request.purchaseUpdatedAt || request.purchaseAt),
          chegada_em: toNullableIso(request.purchaseArrivedAt),
          finalizado_em: toNullableIso(request.purchaseArrivedAt || request.purchaseUpdatedAt),
          sla_minutos: getElapsedMinutes(purchaseStartedAt || request.sapRequestAt, request.purchaseArrivedAt || request.purchaseUpdatedAt),
          status: getItemPurchaseStatus(request, item),
          criado_em: toNullableIso(request.createdAt) || new Date().toISOString(),
        });
      }

      if (isReceiptItemPending(request, item) || (Number(item.cdReceivedQty) || 0) > 0 || (Number(item.purchaseReceivedQty) || 0) > 0) {
        receiptRows.push({
          solicitacao_numero: request.id,
          item_chave: itemKey,
          codigo_sap: item.code || "",
          descricao: item.description || "",
          quantidade_cd: Math.max(Number(item.cdQty) || 0, Number(item.cdReceivedQty) || 0),
          quantidade_compra: Math.max(getPurchasePendingQty(item), Number(item.purchaseReceivedQty) || 0),
          quantidade_recebida: (Number(item.cdReceivedQty) || 0) + (Number(item.purchaseReceivedQty) || 0),
          entrada_sap: getReceiptNumberPlain(request, item),
          nf_transferencia_cd: request.transferInvoiceName || "",
          nf_fornecedor: request.receiptInvoiceName || "",
          responsavel: request.receiptBy || "",
          inicio_em: toNullableIso(receiptStartedAt),
          finalizado_em: toNullableIso(request.receiptAt),
          sla_minutos: getElapsedMinutes(receiptStartedAt, request.receiptAt),
          status: request.receiptAt ? "Recebido pelo Almoxarifado" : "Pendente entrada e recebimento",
          criado_em: toNullableIso(request.createdAt) || new Date().toISOString(),
        });
      }
    });
  });

  await replaceOperationalRows("atendimentos_cd", requestNumbers, cdRows);
  await replaceOperationalRows("compras", requestNumbers, purchaseRows);
  await replaceOperationalRows("recebimentos", requestNumbers, receiptRows);
}

async function mirrorRequestsToStructuredTables(rows) {
  if (!supabaseClient) return;
  const normalizedRows = rows.map(normalizeRequest);
  if (normalizedRows.length === 0) return;

  try {
    const requestPayload = normalizedRows.map((request) => ({
      numero: request.id,
      prefixo: request.targetType === "frota" ? null : String(request.bus || ""),
      tipo_solicitacao: request.targetType || "prefixo",
      prioridade: request.priority || "Normal",
      motivo: request.reason || "",
      solicitante: request.requestedBy || "",
      manutentor: request.maintainer || "",
      status_atual: getRequestStatusText(request),
      criado_em: request.createdAt || new Date().toISOString(),
    }));

    const { error: requestError } = await supabaseClient
      .from("solicitacoes")
      .upsert(requestPayload, { onConflict: "numero" });

    if (requestError) {
      warnOptionalSupabaseMirror("Erro ao salvar solicitações estruturadas", requestError);
      return;
    }

    const requestNumbers = normalizedRows.map((request) => request.id);
    const { data: savedRequests, error: selectError } = await supabaseClient
      .from("solicitacoes")
      .select("id, numero")
      .in("numero", requestNumbers);

    if (selectError) {
      warnOptionalSupabaseMirror("Erro ao buscar solicitações estruturadas", selectError);
      return;
    }

    const idByNumber = new Map((savedRequests || []).map((row) => [row.numero, row.id]));
    const requestIds = Array.from(idByNumber.values()).filter(Boolean);
    if (requestIds.length === 0) {
      warnOptionalSupabaseMirror("Solicitações estruturadas não retornaram ID para gravar itens", null);
      return;
    }

    const { error: deleteError } = await supabaseClient
      .from("solicitacao_itens")
      .delete()
      .in("solicitacao_id", requestIds);
    if (deleteError) {
      warnOptionalSupabaseMirror("Erro ao atualizar itens estruturados", deleteError);
      return;
    }

    const itemPayload = normalizedRows.flatMap((request) => {
      const solicitacaoId = idByNumber.get(request.id);
      if (!solicitacaoId) return [];
      return request.items.map((item) => ({
        solicitacao_id: solicitacaoId,
        codigo_sap: item.code || "",
        descricao: item.description || "",
        quantidade_solicitada: Number(item.quantity) || 0,
        quantidade_almox: Number(item.availableQty) || 0,
        quantidade_cd: Number(item.cdQty) || 0,
        quantidade_compra: getPurchasePendingQty(item),
        quantidade_retirada: Number(item.withdrawnQty) || 0,
        status_item: getItemPurchaseStatus(request, item),
        nf_transferencia: getItemInvoiceName(request, item, "transfer"),
        entrada_sap: getItemReceiptMarkup(request, item),
        criado_em: request.createdAt || new Date().toISOString(),
      }));
    });

    if (itemPayload.length > 0) {
      const { error: itemError } = await supabaseClient.from("solicitacao_itens").insert(itemPayload);
      if (itemError) {
        warnOptionalSupabaseMirror("Erro ao salvar itens estruturados", itemError);
        return;
      }
    }

    await mirrorOperationalTables(normalizedRows);
  } catch (error) {
    warnOptionalSupabaseMirror("Não foi possível espelhar solicitações estruturadas", error);
  }
}

function mirrorCustomPartsToStructuredTable(parts) {
  if (!supabaseClient || parts.length === 0) return;
  const payload = parts
    .map((part) => ({
      codigo_sap: String(part.code || "").trim(),
      descricao: String(part.description || "").trim(),
      codigo_original: String(part.originalCode || "").trim(),
      ativo: true,
      criado_em: part.createdAt || new Date().toISOString(),
    }))
    .filter((part) => part.codigo_sap && part.descricao);
  if (payload.length === 0) return;
  return supabaseClient.from("itens").upsert(payload, { onConflict: "codigo_sap" }).then(({ error }) => {
    if (error) warnOptionalSupabaseMirror("Erro ao sincronizar itens estruturados", error);
    return { error };
  });
}

function replaceSupabaseDeletedUsers() {
  if (!supabaseClient) return;
  return trackSupabaseWrite(supabaseClient.from("manupecas_deleted_users").delete().neq("email", "__never__").then(({ error }) => {
    if (error) {
      console.warn("Erro ao limpar usuários excluídos:", error.message);
      return { error };
    }
    if (deletedUsers.length === 0) return { error: null };
    return supabaseClient.from("manupecas_deleted_users").upsert(deletedUsers.map((email) => ({ email, updated_at: new Date().toISOString() })), { onConflict: "email" });
  }), "usuários excluídos");
}

function deleteSupabaseRow(table, keyField, keyValue) {
  if (!supabaseClient) return;
  return trackSupabaseWrite(supabaseClient.from(table).delete().eq(keyField, keyValue), table);
}

function saveRequests() {
  const now = new Date().toISOString();
  const previousById = getStoredRequestsById();
  requests = requests.map((request) => {
    const previous = previousById.get(request.id);
    const changed = !previous || getComparableRequestPayload(previous) !== getComparableRequestPayload(request);
    return { ...request, updatedAt: changed ? now : request.updatedAt || previous?.updatedAt || now };
  });
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return upsertMergedRequestRows(requests).then(() => {
    syncStructuredTablesSafely("salvamento de solicitações");
  });
}

function persistRequestsLocally() {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

async function saveRequestsSafely(context = "solicitações") {
  try {
    await saveRequests();
    return true;
  } catch (error) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    setSupabaseStatus("error", "Supabase: erro ao salvar");
    console.warn(`Falha ao salvar ${context}. O app continuará com os dados locais.`, error);
    return false;
  }
}

function getStoredRequestsById() {
  try {
    return new Map(JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]").map((request) => [request.id, request]));
  } catch {
    return new Map();
  }
}

function getComparableRequestPayload(request) {
  const { updatedAt, ...rest } = request || {};
  return JSON.stringify(rest);
}

function loadManagedUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];

  try {
    const genericUsers = new Set(["pcm@empresa.com.br", "almox@empresa.com.br", "cd@empresa.com.br", "gerente@empresa.com.br", "admin@empresa.com.br"]);
    return dedupeUsers(JSON.parse(stored)
      .map((user) => normalizeAccount(user, user.email))
      .filter((user) => !genericUsers.has(String(user.email || "").toLowerCase())));
  } catch {
    return [];
  }
}

function saveManagedUsers() {
  managedUsers = dedupeUsers(managedUsers.map((user) => normalizeAccount(user, user.email)));
  localStorage.setItem(USERS_KEY, JSON.stringify(managedUsers));
  upsertSupabaseRows("manupecas_users", "email", managedUsers);
}

function dedupeUsers(users) {
  const byLogin = new Map();
  users.forEach((user) => {
    const normalizedUser = normalizeAccount(user, user.email);
    if (normalizedUser.email) byLogin.set(normalizedUser.email, normalizedUser);
  });
  return [...byLogin.values()];
}

function loadDeletedUsers() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_USERS_KEY) || "[]").map(normalizeLogin);
  } catch {
    return [];
  }
}

function saveDeletedUsers() {
  localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deletedUsers));
  replaceSupabaseDeletedUsers();
}

function loadEmailSettings() {
  try {
    return normalizeEmailSettings(JSON.parse(localStorage.getItem(EMAIL_SETTINGS_KEY) || "{}"));
  } catch {
    return normalizeEmailSettings({});
  }
}

function normalizeEmailSettings(settings) {
  return Object.fromEntries(emailStepKeys.map((key) => [key, normalizeEmailStepSetting(settings?.[key], defaultEmailSettings[key])]));
}

function normalizeEmailStepSetting(setting, fallback) {
  if (Array.isArray(setting)) return { toUsers: uniqueLogins(setting), ccUsers: [], extraTo: "", extraCc: "" };
  if (setting && typeof setting === "object") {
    const legacyUsers = uniqueLogins(setting.users || []);
    const legacyExtra = normalizeEmailList(setting.extra || "");
    return {
      toUsers: uniqueLogins(setting.toUsers || legacyUsers),
      ccUsers: uniqueLogins(setting.ccUsers || []),
      extraTo: normalizeEmailList(setting.extraTo || legacyExtra),
      extraCc: normalizeEmailList(setting.extraCc || ""),
    };
  }
  const converted = splitEmailLikeList(setting || "");
  if (converted.length === 0) {
    return {
      toUsers: uniqueLogins(fallback?.toUsers || fallback?.users || []),
      ccUsers: uniqueLogins(fallback?.ccUsers || []),
      extraTo: normalizeEmailList(fallback?.extraTo || fallback?.extra || ""),
      extraCc: normalizeEmailList(fallback?.extraCc || ""),
    };
  }
  return convertEmailsToUserSetting(converted);
}

function splitEmailLikeList(value) {
  return String(value || "")
    .split(/[;,]+/)
    .map((email) => email.trim())
    .filter((email) => !["email@jtptransportes.com.br", "outro@email.com"].includes(email.toLowerCase()))
    .filter(Boolean);
}

function uniqueLogins(values) {
  return values
    .map(normalizeLogin)
    .filter(Boolean)
    .filter((login, index, list) => list.indexOf(login) === index);
}

function convertEmailsToUserSetting(values) {
  const accountsMap = getAllAccounts();
  const toUsers = [];
  const extraTo = [];
  values.forEach((value) => {
    const normalizedValue = String(value || "").trim().toLowerCase();
    const login = normalizeLogin(normalizedValue);
    const matchedLogin = Object.entries(accountsMap).find(([accountLogin, account]) => {
      return accountLogin === login || normalizeCorporateEmail(account.corporateEmail, accountLogin) === normalizedValue;
    })?.[0];
    if (matchedLogin) toUsers.push(matchedLogin);
    else extraTo.push(userLoginToEmail(value));
  });
  return { toUsers: uniqueLogins(toUsers), ccUsers: [], extraTo: normalizeEmailList(extraTo.join(";")), extraCc: "" };
}

function normalizeEmailList(value) {
  return splitEmailLikeList(value)
    .map((email) => userLoginToEmail(email.trim()))
    .filter(Boolean)
    .filter((email, index, list) => list.indexOf(email) === index)
    .join("; ");
}

async function saveEmailSettings() {
  emailSettings = normalizeEmailSettings(emailSettings);
  localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(emailSettings));
  if (!supabaseClient) return { ok: true, remote: false, error: "" };
  const { error } = await supabaseClient
    .from("manupecas_email_settings")
    .upsert({ id: "default", data: emailSettings, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) {
    console.warn("Erro ao salvar configuração de e-mail:", error.message);
    return { ok: false, remote: true, error: error.message };
  }
  return { ok: true, remote: true, error: "" };
}

function normalizeLogin(login) {
  const value = String(login || "")
    .trim()
    .toLowerCase()
    .replace(/@jtptransportes\.com\.br$/, "")
    .replace(/\s+/g, ".");
  return emailAliases[value] || value;
}

function defaultCorporateEmail(login) {
  const value = normalizeLogin(login).replace(/@.*$/, "");
  return value ? `${value}@jtptransportes.com.br` : "";
}

function normalizeCorporateEmail(email, login) {
  const normalizedLogin = normalizeLogin(login);
  return fixedUserCorporateEmails[normalizedLogin] || String(email || "").trim().toLowerCase() || defaultCorporateEmail(normalizedLogin);
}

function normalizeUserName(name, login) {
  const normalizedLogin = normalizeLogin(login);
  if (fixedUserCorporateEmails[normalizedLogin]) return normalizedLogin.toUpperCase();
  return String(name || normalizedLogin).trim().toUpperCase();
}

function normalizeAccount(user, email) {
  const login = normalizeLogin(email || user.email);
  return {
    ...user,
    email: login,
    name: normalizeUserName(user.name, login),
    corporateEmail: normalizeCorporateEmail(user.corporateEmail, login),
  };
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
  mirrorCustomPartsToStructuredTable(customParts);
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
      const normalizedUser = normalizeAccount(user, user.email);
      acc[normalizedUser.email] = normalizedUser;
      return acc;
    },
    Object.fromEntries(Object.entries(accounts).map(([email, user]) => [email, normalizeAccount(user, email)]))
  );
  deletedUsers.forEach((email) => {
    if (accounts[email]) return;
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
    const email = normalizeLogin(session.email);
    const account = getAllAccounts()[email];
    return account ? { ...session, email, role: account.role, label: roleLabel(account.role), name: account.name, corporateEmail: account.corporateEmail } : null;
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
    searchInput.dataset.code = "";
    searchInput.dataset.description = "";
    searchInput.dataset.registrationId = "";
    searchInput.dataset.originalCode = "";
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
  return line;
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
      input.dataset.registrationId = "";
      input.dataset.originalCode = "";
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
      activePartRegistrationInput = input;
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
        input.setCustomValidity("Peça não cadastrada. Clique em Solicitar cadastro para vincular esta peça ao pedido.");
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

  if (input.dataset.registrationId && input.dataset.description) {
    return {
      code: "CADASTRO PENDENTE",
      description: input.dataset.description,
      isPendingRegistration: true,
      pendingRegistrationId: input.dataset.registrationId,
      pendingOriginalCode: input.dataset.originalCode || "",
      pendingPhotoName: input.dataset.photoName || "",
      pendingPhotoDataUrl: input.dataset.photoDataUrl || "",
    };
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

async function makeCode() {
  const usedIds = new Set(requests.map((request) => request.id).filter(Boolean));
  if (supabaseClient) {
    try {
      const [{ data, error }, { data: structuredData, error: structuredError }] = await Promise.all([
        supabaseClient.from("manupecas_requests").select("id"),
        supabaseClient.from("solicitacoes").select("numero"),
      ]);
      if (!error) (data || []).forEach((row) => row.id && usedIds.add(row.id));
      if (!structuredError) (structuredData || []).forEach((row) => row.numero && usedIds.add(row.numero));
    } catch (error) {
      console.warn("Não foi possível consultar a numeração no Supabase.", error);
    }
  }
  return makeNextRequestCode(usedIds);
}

function makeLocalRequestCode() {
  return makeNextRequestCode(new Set(requests.map((request) => request.id).filter(Boolean)));
}

function makeNextRequestCode(usedIds) {
  let nextNumber = Array.from(usedIds).reduce((max, id) => {
    const match = String(id || "").match(/^BP\s*-\s*(\d+)$/i);
    return match ? Math.max(max, Number(match[1]) || 0) : max;
  }, 0) + 1;
  let code = formatRequestCode(nextNumber);
  while (usedIds.has(code)) {
    nextNumber += 1;
    code = formatRequestCode(nextNumber);
  }
  return code;
}

function formatRequestCode(number) {
  return `BP - ${String(number).padStart(4, "0")}`;
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
    return;
  }
  if (currentPage === "email-admin") {
    renderEmailSettings();
    return;
  }
  if (currentPage === "part-admin") {
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
    const isCancellation = getDisplayStatus(request) === "cancelamento";
    const isCanceled = request.status === "cancelado" || Boolean(request.cancellationApprovedAt);
    const requestedByCurrentUser = normalizeLogin(request.cancellationRequestedByEmail || request.requestedByEmail || request.requestedBy) === currentUser.email;
    if (isCanceled) return false;
    if (isCancellation) {
      if (currentFilter !== "solicitacao") return false;
      return currentUser.role === "admin" || requestedByCurrentUser || (currentUser.role === "almox" && request.cancellationRequestedByEmail === currentUser.email);
    }
    if (currentUser.role === "pcm") {
      if (currentFilter === "atendimento") return hasPickupPending(request);
      if (currentFilter === "compra") return request.status === "aprovacao" || request.status === "compra" || request.status === "recebimento" || request.status === "reprovado";
      if (currentFilter === "solicitacao") return request.status === "solicitacao" || request.status === "cadastro";
      return request.status === currentFilter;
    }
    if (currentUser.role === "cd") {
      if (currentFilter === "recebimento") return getDisplayStatus(request) === "recebimento";
      if (currentFilter === "cd") return request.status === "cd";
      return false;
    }
    if (currentUser.role === "almox" && currentFilter === "recebimento") {
      return getDisplayStatus(request) === "recebimento";
    }
    if (currentUser.role === "almox" && currentFilter === "atendimento") {
      return request.status === "atendimento" || hasPickupPending(request);
    }
    if (currentUser.role === "almox" && currentFilter === "compra") {
      return isPurchaseQueuePending(request);
    }
    if (currentUser.role === "almox" && currentFilter === "cd") return request.status === "cd";
    if (currentFilter === "solicitacao") return request.status === "solicitacao" || request.status === "cadastro";
    if (currentFilter === "compra") return isPurchaseQueuePending(request);
    return request.status === currentFilter;
  }).filter(matchesQueueFilters);

  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma solicitação encontrada para este filtro.";
    list.append(empty);
    return;
  }

  visible.forEach((request) => list.append(createCard(request)));
}

function matchesQueueFilters(request) {
  const requestTerm = normalizeSearchCompact(queueRequestFilter?.value || "");
  const partTerm = normalizeSearchText(queuePartFilter?.value || "");
  const carTerm = normalizeSearchCompact(queueCarFilter?.value || "");

  if (requestTerm) {
    const requestId = normalizeSearchCompact(request.id || "");
    const requestNumber = normalizeSearchCompact(String(request.id || "").replace(/^bp-?/i, ""));
    if (!requestId.includes(requestTerm) && !requestNumber.includes(requestTerm)) return false;
  }

  if (carTerm) {
    const targetText = normalizeSearchCompact([
      request.bus,
      request.targetType,
      getRequestTargetLabel(request),
    ].filter(Boolean).join(" "));
    if (!targetText.includes(carTerm)) return false;
  }

  if (partTerm) {
    const itemText = normalizeSearchText((request.items || [])
      .map((item) => `${item.code || ""} ${item.description || ""}`)
      .join(" "));
    if (!itemText.includes(partTerm)) return false;
  }

  return true;
}

function clearQueueFilters() {
  [queueRequestFilter, queuePartFilter, queueCarFilter].forEach((input) => {
    if (input) input.value = "";
  });
}

function hardenQueueFiltersAgainstAutofill() {
  [queueRequestFilter, queuePartFilter, queueCarFilter].forEach((input) => {
    if (!input) return;
    input.setAttribute("autocomplete", "new-password");
    input.setAttribute("data-lpignore", "true");
    input.setAttribute("data-form-type", "other");
    input.defaultValue = "";
  });
}

function scheduleQueueFilterAutofillCleanup() {
  [0, 150, 600, 1500].forEach((delay) => {
    window.setTimeout(() => {
      if (clearAutofilledQueueFilters() && currentPage === "pending") render();
    }, delay);
  });
}

function clearAutofilledQueueFilters() {
  const knownLogins = new Set([
    ...Object.keys(getAllAccounts()),
    currentUser?.email,
  ].filter(Boolean).map(normalizeLogin));
  let changed = false;
  [queueRequestFilter, queuePartFilter, queueCarFilter].forEach((input) => {
    if (!input) return;
    const value = String(input.value || "").trim();
    const compact = normalizeLogin(value);
    const looksLikeUserLogin = knownLogins.has(compact) || /^[a-z]+[._-][a-z]+$/i.test(value) || value.includes("@");
    if (looksLikeUserLogin) {
      input.value = "";
      changed = true;
    }
  });
  return changed;
}

function createCard(request) {
  const card = requestTemplate.content.firstElementChild.cloneNode(true);
  const pickupMode = currentUser.role === "almox" && currentFilter === "atendimento" && hasPickupPending(request);
  const pickupOnlyView = currentFilter === "atendimento" && (currentUser.role === "almox" || currentUser.role === "pcm") && hasPickupPending(request);
  const receiptOnlyView = currentFilter === "recebimento" && getDisplayStatus(request) === "recebimento";
  const purchaseOnlyView = currentFilter === "compra" && currentUser.role === "almox";
  const displayItems = getDisplayItemsForCurrentView(request);
  const status = card.querySelector(".status-pill");
  const response = card.querySelector(".response");
  const cancelPanel = card.querySelector(".cancel-panel");
  const note = card.querySelector("textarea");
  const partsList = card.querySelector(".parts-list");
  const fulfillmentPanel = card.querySelector(".fulfillment-panel");
  const fulfillmentList = card.querySelector(".fulfillment-list");
  const emailButton = card.querySelector(".email-response");
  const purchaseWorkflow = card.querySelector(".purchase-workflow");
  const purchaseTitle = card.querySelector(".purchase-title");
  const purchaseItems = card.querySelector(".purchase-items");
  const sapRequestInput = card.querySelector(".sap-request-number");
  const sapRequestSaveButton = card.querySelector(".sap-request-save");
  const purchaseOrderInput = card.querySelector(".purchase-order");
  const deliveryDateInput = card.querySelector(".delivery-date");
  const buyerNoteInput = card.querySelector(".buyer-note");
  const arrivalDateInput = card.querySelector(".arrival-date");
  const purchaseSaveButton = card.querySelector(".purchase-save");
  const purchaseEmailButton = card.querySelector(".purchase-email");
  const purchaseArrivalButton = card.querySelector(".purchase-arrival");
  const purchaseArrivalSaveButton = card.querySelector(".purchase-arrival-save");
  const transferInvoiceInput = card.querySelector(".transfer-invoice");
  const invoiceName = card.querySelector(".invoice-name");
  const receiptInvoiceInput = card.querySelector(".receipt-invoice");
  const receiptInvoiceName = card.querySelector(".receipt-invoice-name");
  const receiptNumberInput = card.querySelector(".receipt-number");
  const receiptPasswordInput = card.querySelector(".receipt-password");
  const receiptMessage = card.querySelector(".receipt-message");

  const displayStatus = pickupOnlyView ? "atendimento" : currentFilter === "compra" && isPurchaseQueuePending(request) ? "compra" : getDisplayStatus(request);
  const isReceiptFlow = currentFilter === "recebimento" && displayStatus === "recebimento";
  const isAlmoxPurchaseQueue = isPurchaseQueuePending(request) && currentUser.role === "almox" && currentFilter === "compra";
  const isBuyerPurchaseQueue = isPurchaseQueuePending(request) && currentUser.role === "compras";
  const isCancellationStatus = getDisplayStatus(request) === "cancelamento" || getDisplayStatus(request) === "cancelado";
  const canCurrentUserReceive = (currentUser.role === "almox" || currentUser.role === "cd") && currentFilter === "recebimento";
  const isReceiptQueue = isReceiptFlow && canCurrentUserReceive;
  const isCdAttendanceQueue = currentUser.role === "cd" && currentFilter === "cd" && getDisplayStatus(request) === "cd";
  const isAlmoxCdViewOnly = currentUser.role === "almox" && currentFilter === "cd";
  status.textContent = getRequestStatusText(request, displayStatus);
  status.className = `status-pill status-${displayStatus}`;
  card.querySelector(".request-summary").addEventListener("click", () => card.classList.toggle("expanded"));
  card.querySelector(".request-code").textContent = request.id;
  card.querySelector("h3").textContent = createRequestCardTitle(request, displayItems);
  card.querySelector(".sla-pill").textContent = `SLA ${formatDuration(request.createdAt, new Date().toISOString())}`;
  card.querySelector(".bus-summary").textContent = getRequestTargetLabel(request);
  card.querySelector(".items-summary").textContent = formatItemCount(displayItems.length);
  card.querySelector(".priority-summary").textContent = request.priority;
  card.querySelector(".bus").textContent = request.bus;
  card.querySelector(".quantity").textContent = displayItems.length;
  card.querySelector(".priority").textContent = request.priority;
  card.querySelector(".created").textContent = formatDate(request.createdAt);
  card.querySelector(".requester").textContent = request.requestedBy || "-";
  card.querySelector(".maintainer").textContent = request.maintainer || "-";
  card.querySelector(".warehouse-user").textContent = request.almoxBy || "-";
  card.querySelector(".reason").textContent = request.reason;
  response.textContent = request.response;
  note.value = request.response;
  renderCancellationPanel(request, cancelPanel);
  purchaseTitle.textContent = isReceiptFlow ? "Recebimento e entrada SAP" : "Compra";
  sapRequestInput.value = request.sapRequestNumber || "";
  sapRequestInput.readOnly = currentUser.role !== "almox" || Boolean(request.sapRequestNumber);
  purchaseOrderInput.value = request.purchaseOrder || "";
  purchaseOrderInput.readOnly = currentUser.role !== "compras" || Boolean(request.purchaseOrder) || !request.sapRequestNumber;
  buyerNoteInput.value = request.buyerNote || "";
  buyerNoteInput.readOnly = currentUser.role !== "compras";
  deliveryDateInput.value = request.deliveryDate || "";
  arrivalDateInput.value = request.purchaseArrivedDate || "";
  const arrivalField = card.querySelector(".purchase-arrival-field");
  const arrivalLabel = arrivalField.querySelector("label");
  if (arrivalLabel) arrivalLabel.textContent = "Data de chegada / recebimento";
  invoiceName.textContent = request.transferInvoiceName ? `NF anexada: ${request.transferInvoiceName}` : "";
  receiptInvoiceName.textContent = request.receiptInvoiceName ? `NF fornecedor anexada: ${request.receiptInvoiceName}` : "";
  receiptNumberInput.value = request.receiptNumber || "";
  receiptMessage.textContent = request.receiptNumber ? `Recebimento registrado: ${request.receiptNumber}` : "";
  card.querySelector(".transfer-invoice-field").hidden = true;
  card.querySelector(".receipt-number-field").hidden = !isReceiptFlow;
  card.querySelector(".receipt-invoice-field").hidden = !isReceiptQueue;
  card.querySelector(".receipt-password-field").hidden = !isReceiptFlow;
  deliveryDateInput.closest(".field").hidden = true;
  arrivalField.hidden = !isReceiptQueue;
  arrivalDateInput.disabled = !isReceiptQueue;
  purchaseWorkflow.classList.remove("active");
  card.querySelector(".process-map").innerHTML = createProcessMap(pickupOnlyView ? { ...request, status: "atendimento" } : request);

  displayItems.forEach((item) => {
    const index = request.items.indexOf(item);
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
    if (request.status !== "cadastro" && request.status !== "compra" && request.status !== "aprovacao" && request.status !== "recebimento" && request.status !== "cancelamento" && request.status !== "cancelado" && !pickupMode) {
      if (isCdAttendanceQueue) {
        if (getCdPendingQty(item) > 0) fulfillmentList.append(createCdFulfillmentLine(item, index));
      } else if (currentUser.role === "almox" && currentFilter !== "cd") {
        fulfillmentList.append(createFulfillmentLine(item, index));
      }
    }
  });

  if (request.status === "cadastro") {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.remove("active");
  }

  if (request.status === "aprovacao") {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.remove("active");
  }

  if (request.status === "cancelamento" || request.status === "cancelado") {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.remove("active");
  }

  if (isPurchaseQueuePending(request) || request.status === "recebimento") {
    fulfillmentPanel.hidden = true;
    if (currentFilter === "compra" || currentFilter === "recebimento") {
      purchaseWorkflow.classList.add("active");
    }
    card.querySelector(".transfer-invoice-field").hidden = true;
  }

  if (isCdAttendanceQueue) {
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
  } else if (request.status !== "cadastro" && request.status !== "compra" && request.status !== "aprovacao" && request.status !== "recebimento" && request.status !== "cancelamento" && request.status !== "cancelado") {
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

  const purchaseLines = isReceiptFlow
    ? getReceiptPendingItems(request)
    : request.items.filter((item) => isPurchaseItemActive(request, item));
  fulfillmentPanel.hidden = (request.status === "cadastro" || isCancellationStatus || isPurchaseQueuePending(request) || request.status === "aprovacao" || isReceiptFlow) && !pickupMode ? true : false;
  purchaseWorkflow.classList.toggle("active", (((isPurchaseQueuePending(request) && currentUser.role === "compras") || (isPurchaseQueuePending(request) && currentUser.role === "almox" && currentFilter === "compra") || isReceiptQueue) && !pickupMode && !isCancellationStatus));
  if (isCdAttendanceQueue) {
    fulfillmentPanel.hidden = false;
    fulfillmentList.hidden = false;
    purchaseWorkflow.classList.remove("active");
    if (!fulfillmentList.children.length) {
      const emptyLine = document.createElement("div");
      emptyLine.className = "fulfillment-row";
      emptyLine.innerHTML = "<div><strong>Nenhum item pendente para o CD.</strong><span>Atualize a página ou confira o status da solicitação.</span></div>";
      fulfillmentList.append(emptyLine);
    }
  }
  if (isAlmoxCdViewOnly) {
    fulfillmentPanel.hidden = true;
    purchaseWorkflow.classList.remove("active");
  }
  purchaseItems.innerHTML = purchaseLines.length
    ? purchaseLines.map((item) => {
      const cdReceiptQty = Number(item.cdQty) || 0;
      const purchaseReceiptQty = isPurchaseArrivalRegistered(request) && item.purchaseApproval === "approved" ? getPurchasePendingQty(item) : 0;
      const transferInvoiceMarkup = cdReceiptQty > 0 ? getItemInvoiceMarkup(request, item, "transfer") : "";
      const receiptNotes = isReceiptFlow
        ? [
          cdReceiptQty > 0 ? `CD: ${cdReceiptQty} un.` : "",
          purchaseReceiptQty > 0 ? `Compra: ${purchaseReceiptQty} un.` : "",
        ].filter(Boolean).join(" | ")
        : "";
      return `<div>
        ${isReceiptFlow ? `<label class="receipt-item-check"><input class="receipt-item-toggle" type="checkbox" data-index="${request.items.indexOf(item)}" /> Receber este item</label>` : ""}
        <strong>${item.code}</strong>
        <span>${item.description}</span>
        <em>${isReceiptFlow ? `${cdReceiptQty + purchaseReceiptQty} un. para entrada e recebimento` : `${getPurchasePendingQty(item)} un. para compra`}</em>
        ${receiptNotes ? `<small>${receiptNotes}</small>` : ""}
        ${transferInvoiceMarkup ? `<small>NF transferência: ${transferInvoiceMarkup}</small>` : ""}
      </div>`;
    }).join("")
    : `<div><span>${isReceiptFlow ? "Nenhum item pendente de entrada e recebimento." : "Nenhum item pendente de compra."}</span></div>`;
  purchaseSaveButton.addEventListener("click", () => savePurchaseOrder(request.id, card, false));
  purchaseEmailButton.addEventListener("click", () => savePurchaseOrder(request.id, card, true));
  sapRequestSaveButton.addEventListener("click", () => saveSapRequestNumber(request.id, card));
  purchaseArrivalSaveButton.addEventListener("click", () => registerPurchaseArrival(request.id, card));
  purchaseArrivalButton.addEventListener("click", () => confirmReceiptEntry(request.id, card));
  receiptInvoiceInput.addEventListener("change", () => {
    receiptInvoiceName.textContent = receiptInvoiceInput.files.length ? `NF fornecedor selecionada: ${receiptInvoiceInput.files[0].name}` : request.receiptInvoiceName ? `NF fornecedor anexada: ${request.receiptInvoiceName}` : "";
  });
  purchaseSaveButton.textContent = request.purchaseOrder ? "Atualizar previsão de entrega" : "Salvar pedido de compra";
  purchaseArrivalSaveButton.textContent = "Item chegou ao Almoxarifado";
  purchaseSaveButton.hidden = !isBuyerPurchaseQueue;
  purchaseEmailButton.hidden = !isBuyerPurchaseQueue;
  sapRequestSaveButton.hidden = !isAlmoxPurchaseQueue || Boolean(request.sapRequestNumber);
  purchaseArrivalSaveButton.hidden = !isAlmoxPurchaseQueue || !request.purchaseOrder;
  purchaseArrivalButton.hidden = !isReceiptQueue;
  sapRequestInput.closest(".field").hidden = isReceiptFlow && !request.sapRequestNumber;
  purchaseOrderInput.closest(".field").hidden = currentUser.role !== "compras" && !request.purchaseOrder;
  deliveryDateInput.closest(".field").hidden = !isBuyerPurchaseQueue;
  buyerNoteInput.closest(".field").hidden = currentUser.role !== "compras" && !request.buyerNote;
  purchaseSaveButton.disabled = currentUser.role === "compras" && !request.sapRequestNumber;
  purchaseSaveButton.title = request.sapRequestNumber ? "" : "Aguardando o Almoxarifado informar a solicitação SAP";
  purchaseEmailButton.disabled = !request.purchaseOrder;
  purchaseEmailButton.title = request.purchaseOrder ? "Enviar e-mail com pedido de compra" : "Informe e salve o pedido de compra antes de enviar";
  const hasReceiptLine = getReceiptPendingItems(request).length > 0;
  purchaseArrivalButton.disabled = !hasReceiptLine;
  purchaseArrivalButton.title = hasReceiptLine ? "Confirmar recebimento, entrada SAP e liberar retirada" : "Aguardando item recebido do CD ou compra com data de chegada";

  if (pickupMode) {
    const actionGrid = card.querySelector(".action-grid");
    const pickupFields = document.createElement("div");
    pickupFields.className = "pickup-confirmation-fields";
    pickupFields.innerHTML = `
      <label class="field">
        Número da requisição Praxio
        <input class="pickup-praxio" type="text" value="${escapeAttr(request.praxioRequisition || "")}" placeholder="Ex.: 123456" />
      </label>
      <label class="field">
        Quem está retirando
        <input class="pickup-person" type="text" value="${escapeAttr(request.withdrawnPerson || "")}" placeholder="Nome e sobrenome" />
      </label>
      <small class="pickup-message"></small>
    `;
    actionGrid.before(pickupFields);
    const doneButton = document.createElement("button");
    doneButton.className = "action reset";
    doneButton.type = "button";
    doneButton.textContent = "Confirmar retirada do PCM";
    doneButton.addEventListener("click", async () => {
      const praxio = pickupFields.querySelector(".pickup-praxio").value.trim();
      const person = pickupFields.querySelector(".pickup-person").value.trim();
      const message = pickupFields.querySelector(".pickup-message");
      if (!praxio) {
        message.textContent = "Informe o número da requisição Praxio.";
        pickupFields.querySelector(".pickup-praxio").focus();
        return;
      }
      if (!person) {
        message.textContent = "Informe quem está retirando.";
        pickupFields.querySelector(".pickup-person").focus();
        return;
      }
      if (confirmAlmoxPassword()) {
        await markWithdrawn(request.id, note.value || "Itens retirados pelo PCM.", { praxio, person });
      }
    });
    actionGrid.append(doneButton);
  }

  return card;
}

function createRequestCardTitle(request, items) {
  const count = items.length || request.items?.length || 0;
  return `${formatItemCount(count)} nesta solicitação`;
}

function canRequestCancellation(request) {
  if (!request || !currentUser) return false;
  if (request.cancellationApprovedAt || hasPendingCancellation(request) || request.status === "cancelamento" || request.status === "cancelado" || request.status === "retirado") return false;
  return currentUser.role === "pcm" || currentUser.role === "almox";
}

function canReviewCancellation(request) {
  return currentUser?.role === "admin" && (request?.status === "cancelamento" || hasPendingCancellation(request));
}

function hasPendingCancellation(request) {
  return Boolean(request?.cancellationRequestedAt && !request?.cancellationApprovedAt && !request?.cancellationRejectedAt && request?.status !== "cancelado");
}

function renderCancellationPanel(request, panel) {
  if (!panel) return;
  const isCanceled = request.status === "cancelado" || Boolean(request.cancellationApprovedAt);
  const hasCancellationData = request.status === "cancelamento" || isCanceled || request.cancellationRequestedAt || request.cancellationRejectedAt;
  if (!hasCancellationData && !canRequestCancellation(request)) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }

  panel.hidden = false;
  const requestedBy = request.cancellationRequestedBy || "-";
  const requestedAt = formatDateOrDash(request.cancellationRequestedAt);
  const reason = request.cancellationReason || "Sem motivo informado.";

  if (isCanceled) {
    panel.innerHTML = `
      <div class="cancel-box done">
        <strong>Solicitação cancelada</strong>
        <span>Solicitado por ${escapeHtml(requestedBy)} em ${escapeHtml(requestedAt)}.</span>
        <span>Aprovado por ${escapeHtml(request.cancellationApprovedBy || "Admin")} em ${escapeHtml(formatDateOrDash(request.cancellationApprovedAt))}.</span>
        <em>${escapeHtml(reason)}</em>
      </div>`;
    return;
  }

  if (request.status === "cancelamento" || hasPendingCancellation(request)) {
    panel.innerHTML = `
      <div class="cancel-box pending">
        <strong>Cancelamento aguardando aprovação do Admin</strong>
        <span>Solicitado por ${escapeHtml(requestedBy)} em ${escapeHtml(requestedAt)}.</span>
        <em>${escapeHtml(reason)}</em>
        ${canReviewCancellation(request) ? `
          <div class="cancel-actions">
            <button class="action available approve-cancel" type="button">Aprovar cancelamento</button>
            <button class="action reset reject-cancel" type="button">Recusar cancelamento</button>
          </div>` : ""}
      </div>`;
    const approveButton = panel.querySelector(".approve-cancel");
    const rejectButton = panel.querySelector(".reject-cancel");
    if (approveButton) approveButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      approveCancellation(request.id);
    });
    if (rejectButton) rejectButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      rejectCancellation(request.id);
    });
    return;
  }

  panel.innerHTML = `
    <div class="cancel-box">
      <strong>Cancelamento da solicitação</strong>
      <span>Use apenas quando a solicitação estiver incorreta ou não puder seguir.</span>
      ${request.cancellationRejectedAt ? `<em>Última recusa: ${escapeHtml(formatDateOrDash(request.cancellationRejectedAt))} por ${escapeHtml(request.cancellationRejectedBy || "Admin")}.</em>` : ""}
      <div class="cancel-actions">
        <button class="action reset request-cancel" type="button">Solicitar cancelamento</button>
      </div>
    </div>`;
  panel.querySelector(".request-cancel")?.addEventListener("click", () => requestCancellation(request.id));
}

async function requestCancellation(id) {
  const request = requests.find((item) => item.id === id);
  if (!canRequestCancellation(request)) return;
  const reason = window.prompt("Informe o motivo do cancelamento:");
  if (reason === null) return;
  prepareMailPopup();
  const now = new Date().toISOString();
  const userName = currentUser.name || currentUser.label || currentUser.email;
  let updatedRequest = null;
  requests = requests.map((item) => item.id === id ? {
    ...item,
    status: "cancelamento",
    cancellationPreviousStatus: item.status,
    cancellationPreviousDisplayStatus: getDisplayStatus(item),
    cancellationRequestedAt: now,
    cancellationRequestedBy: userName,
    cancellationRequestedByEmail: currentUser.email,
    cancellationReason: reason.trim(),
    cancellationApprovedAt: "",
    cancellationApprovedBy: "",
    cancellationApprovedByEmail: "",
    cancellationRejectedAt: "",
    cancellationRejectedBy: "",
    response: reason.trim()
      ? `Cancelamento solicitado por ${userName}. Motivo: ${reason.trim()}`
      : `Cancelamento solicitado por ${userName}.`,
  } : item).map((item) => {
    if (item.id === id) updatedRequest = item;
    return item;
  });
  persistRequestsLocally();
  if (updatedRequest) openCancellationRequestEmailDraft(updatedRequest, "");
  await saveRequestsSafely("solicitação de cancelamento");
  render();
}

async function approveCancellation(id) {
  const request = requests.find((item) => item.id === id);
  if (!request || !hasPendingCancellation(request)) {
    window.alert("Não há cancelamento pendente para aprovar nesta solicitação.");
    return;
  }
  if (currentUser?.role !== "admin") {
    window.alert("Apenas usuários Admin podem aprovar cancelamento.");
    return;
  }
  prepareMailPopup();
  const now = new Date().toISOString();
  const userName = currentUser.name || currentUser.label || currentUser.email;
  let updatedRequest = null;
  requests = requests.map((item) => {
    if (item.id !== id) return item;
    updatedRequest = {
      ...item,
      status: "cancelado",
      items: item.items.map((part) => ({ ...part, status: "cancelado", statusItem: "cancelado" })),
      cancellationApprovedAt: now,
      cancellationApprovedBy: userName,
      cancellationApprovedByEmail: currentUser.email,
      cancellationRejectedAt: "",
      cancellationRejectedBy: "",
      response: `Solicitação cancelada por aprovação do Admin ${userName}.`,
    };
    return updatedRequest;
  });
  render();
  persistRequestsLocally();
  if (updatedRequest) openCancellationDecisionEmailDraft(updatedRequest, true, "");
  await saveRequestsSafely("aprovação de cancelamento");
}

async function rejectCancellation(id) {
  const request = requests.find((item) => item.id === id);
  if (!request || !hasPendingCancellation(request)) {
    window.alert("Não há cancelamento pendente para recusar nesta solicitação.");
    return;
  }
  if (currentUser?.role !== "admin") {
    window.alert("Apenas usuários Admin podem recusar cancelamento.");
    return;
  }
  prepareMailPopup();
  const restoredStatus = resolveCancellationRestoredStatus(request);
  const now = new Date().toISOString();
  const userName = currentUser.name || currentUser.label || currentUser.email;
  let updatedRequest = null;
  requests = requests.map((item) => {
    if (item.id !== id) return item;
    updatedRequest = {
      ...item,
      status: restoredStatus,
      cancellationApprovedAt: "",
      cancellationApprovedBy: "",
      cancellationApprovedByEmail: "",
      cancellationRejectedAt: now,
      cancellationRejectedBy: userName,
      response: `Cancelamento recusado pelo Admin ${userName}. Solicitação mantida em aberto.`,
    };
    return updatedRequest;
  });
  render();
  persistRequestsLocally();
  if (updatedRequest) openCancellationDecisionEmailDraft(updatedRequest, false, "");
  await saveRequestsSafely("recusa de cancelamento");
}

function resolveCancellationRestoredStatus(request) {
  if (!request) return "solicitacao";
  const items = request.items || [];

  if (items.some(isPendingRegistrationItem)) return "cadastro";
  if (items.some((item) => getCdPendingQty(item) > 0)) return "cd";
  if (getReceiptPendingItems(request).length > 0) return "recebimento";
  if (items.some((item) => getPurchasePendingQty(item) > 0)) return "compra";
  if (hasPickupPending(request)) return "atendimento";

  const candidates = [
    request?.cancellationPreviousDisplayStatus,
    request?.cancellationPreviousStatus,
  ];
  const restored = candidates
    .map((status) => normalizeStatus(status, items))
    .find((status) => status && status !== "cancelamento" && status !== "cancelado");
  if (restored) return restored;
  return calculateStatus(items);
}

function createFulfillmentLine(item, index) {
  const row = document.createElement("div");
  row.className = "fulfillment-row";
  row.dataset.code = item.code;
  row.dataset.index = index;
  const wms = getWmsSummary(item.code);
  const cd = getCdWmsSummary(item.code);
  const requestedQty = Number(item.quantity) || 0;
  const localQty = Number(item.availableQty) || 0;
  const remainingQty = Math.max(0, requestedQty - localQty);
  const defaultCdQty = Number.isFinite(Number(item.cdPendingQty)) ? Number(item.cdPendingQty) : cd.found ? remainingQty : 0;
  const defaultPurchaseQty = Math.max(0, remainingQty - defaultCdQty);
  row.innerHTML = `
    <div>
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <em>Solicitado: ${item.quantity}</em>
      <span class="inventory-badges">
        <small class="pending-owner">Pendente Almoxarifado</small>
        <small class="${wms.found ? "wms-found" : "wms-missing"}">Almox: ${wms.text}</small>
        <small class="${cd.found ? "cd-found" : "cd-missing"}">CD: ${cd.text}</small>
      </span>
    </div>
    <label>
      Atende
      <input name="availableQty" type="number" min="0" max="${item.quantity}" value="${item.availableQty || 0}" />
    </label>
    <label>
      Vai ao CD
      <input name="cdPendingQty" type="number" min="0" max="${item.quantity}" value="${defaultCdQty}" />
    </label>
    <label>
      Compra
      <input name="purchaseQty" type="number" min="0" max="${item.quantity}" value="${defaultPurchaseQty}" readonly />
    </label>
  `;
  const syncSplit = () => {
    const availableQty = clampQty(row.querySelector('[name="availableQty"]').value, item.quantity);
    const remaining = Math.max(0, item.quantity - availableQty);
    const cdPendingQty = clampQty(row.querySelector('[name="cdPendingQty"]').value, remaining);
    row.querySelector('[name="cdPendingQty"]').value = cdPendingQty;
    row.querySelector('[name="purchaseQty"]').value = Math.max(0, remaining - cdPendingQty);
  };
  row.querySelector('[name="availableQty"]').addEventListener("input", () => {
    const availableQty = clampQty(row.querySelector('[name="availableQty"]').value, item.quantity);
    const remaining = Math.max(0, item.quantity - availableQty);
    row.querySelector('[name="cdPendingQty"]').value = cd.found ? remaining : 0;
    syncSplit();
  });
  row.querySelector('[name="cdPendingQty"]').addEventListener("input", syncSplit);
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

async function saveFulfillment(id, card, shouldEmail) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;
  prepareMailPopup();

  const rowsByIndex = new Map([...card.querySelectorAll(".fulfillment-row")].map((row) => [Number(row.dataset.index), row]));
  const updatedItems = request.items.map((item, index) => {
    const row = rowsByIndex.get(index);
    if (!row) return item;

    const availableQty = clampQty(row.querySelector('[name="availableQty"]').value, item.quantity);
    const remaining = Math.max(0, item.quantity - availableQty);
    const cdPendingQty = clampQty(row.querySelector('[name="cdPendingQty"]').value, remaining);
    const cdQty = 0;
    const purchaseQty = Math.max(0, remaining - cdPendingQty);
    return { ...item, almoxQty: availableQty, availableQty, cdQty, purchaseQty, cdPendingQty };
  });

  const status = calculateAlmoxStatus(updatedItems);
  const finalItems = updatedItems.map((item) => {
    if (getPurchaseBaseQty(item) > 0) {
      return { ...item, purchaseApproval: "approved" };
    }
    return item;
  });
  const note = card.querySelector("textarea").value.trim();
  const response = note || buildResponseText(finalItems);
  const updatedRequest = { ...request, items: finalItems, status, response, answeredAt: new Date().toISOString() };
  updatedRequest.attendedAt = updatedRequest.answeredAt;
  updatedRequest.purchaseAt = status === "compra" ? updatedRequest.answeredAt : request.purchaseAt || "";
  updatedRequest.purchaseApprovalRequestedAt = "";
  updatedRequest.almoxBy = currentUser.name || currentUser.label;
  updatedRequest.almoxByEmail = currentUser.email;

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  openAlmoxEmailDraft(updatedRequest, "");
  await saveRequestsSafely("atendimento do Almoxarifado");

  render();
}

async function saveCdFulfillment(id, card, shouldEmail) {
  if (currentUser.role !== "cd") return;
  const request = requests.find((item) => item.id === id);
  if (!request) return;
  if (shouldEmail) prepareMailPopup();

  const rowsByIndex = new Map([...card.querySelectorAll(".fulfillment-row")].map((row) => [Number(row.dataset.index), row]));
  const updatedItems = request.items.map((item, index) => {
    const row = rowsByIndex.get(index);
    if (!row) return item;

    const pendingCd = getCdPendingQty(item);
    const cdQty = clampQty(row.querySelector('[name="cdQty"]').value, pendingCd);
    const purchaseQty = Math.max(0, pendingCd - cdQty);
    return { ...item, cdQty, purchaseQty, cdPendingQty: 0 };
  });

  const cdAnsweredQty = updatedItems.reduce((sum, item) => sum + (Number(item.cdQty) || 0), 0);
  const status = cdAnsweredQty > 0 ? "recebimento" : calculateCdStatus(updatedItems);
  const finalItems = updatedItems.map((item) => {
    if (getPurchaseBaseQty(item) > 0) {
      return { ...item, purchaseApproval: "approved" };
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
    purchaseApprovalRequestedAt: "",
    attendedAt: request.attendedAt || now,
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  if (shouldEmail) {
    openCdEmailDraft(updatedRequest, "");
  }
  await saveRequestsSafely("atendimento do CD");

  render();
}

async function savePurchaseOrder(id, card, shouldEmail) {
  if (currentUser.role !== "compras") return;
  const request = requests.find((item) => item.id === id);
  if (!request) return;
  if (!request.sapRequestNumber) {
    window.alert("Aguardando o Almoxarifado informar a solicitação SAP.");
    return;
  }

  const purchaseOrder = request.purchaseOrder || card.querySelector(".purchase-order").value.trim();
  const deliveryDate = card.querySelector(".delivery-date").value;
  const buyerNote = card.querySelector(".buyer-note").value.trim();
  if (!purchaseOrder) {
    card.querySelector(".purchase-order").focus();
    return;
  }
  prepareMailPopup();
  const updatedRequest = {
    ...request,
    items: request.items.map((item) => (isPurchaseItemActive(request, item) ? { ...item, purchaseQty: getPurchasePendingQty(item), purchaseApproval: "approved" } : item)),
    purchaseOrder,
    buyerNote,
    deliveryDate,
    purchaseUpdatedAt: new Date().toISOString(),
    purchaseUpdatedBy: currentUser.name || currentUser.label,
    response: deliveryDate
      ? `Pedido de compra registrado. Pedido: ${purchaseOrder}. Previsão de entrega: ${formatDateOnly(deliveryDate)}. Aguardando chegada.`
      : `Itens pendentes enviados para compra no SAP. Pedido: ${purchaseOrder}. Pendente previsão de entrega.`,
    status: "compra",
    purchaseAt: request.purchaseAt || new Date().toISOString(),
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  if (purchaseOrder) {
    openPurchaseEmailDraft(updatedRequest, "");
  }
  await saveRequestsSafely("pedido de compra");

  render();
}

async function saveSapRequestNumber(id, card) {
  if (currentUser.role !== "almox") return;
  const request = requests.find((item) => item.id === id);
  if (!request) return;
  const sapRequestInput = card.querySelector(".sap-request-number");
  const sapRequestNumber = normalizeSapRequestNumber(sapRequestInput.value);
  if (!sapRequestNumber) {
    sapRequestInput.value = "";
    sapRequestInput.focus();
    window.alert("Informe o número real da solicitação SAP.");
    return;
  }
  prepareMailPopup();
  const now = new Date().toISOString();
  const updatedRequest = {
    ...request,
    sapRequestNumber,
    sapRequestAt: request.sapRequestAt || now,
    sapRequestBy: currentUser.name || currentUser.label,
    response: `Solicitação SAP registrada pelo Almoxarifado: ${sapRequestNumber}. Pendente atualização de Compras com pedido, previsão e acompanhamento.`,
  };
  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  openPurchaseEmailDraft(updatedRequest, "");
  await saveRequestsSafely("solicitação SAP");
  render();
}

async function registerPurchaseArrival(id, card) {
  if (currentUser.role !== "almox") return;
  const request = requests.find((item) => item.id === id);
  if (!request) return;
  if (!request.purchaseOrder) {
    window.alert("Aguardando Compras informar o pedido de compra.");
    return;
  }
  prepareMailPopup();
  const arrivedDate = getTodayDateInputValue();
  const now = new Date().toISOString();
  const updatedRequest = {
    ...request,
    status: "recebimento",
    purchaseArrivedDate: arrivedDate,
    purchaseArrivedAt: now,
    purchaseArrivedBy: currentUser.name || currentUser.label,
    response: `Item comprado chegou ao Almoxarifado em ${formatDateOnly(arrivedDate)}. Pendente entrada e recebimento no SAP.`,
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  openPurchaseArrivalEmailDraft(updatedRequest, "");
  await saveRequestsSafely("chegada de compra");
  render();
}

async function confirmReceiptEntry(id, card) {
  const request = requests.find((item) => item.id === id);
  if (!request) return;

  const receiptNumber = card.querySelector(".receipt-number").value.trim();
  const purchaseArrivedDate = card.querySelector(".arrival-date").value;
  const receiptInvoiceInput = card.querySelector(".receipt-invoice");
  const selectedReceiptInvoice = receiptInvoiceInput?.files?.[0] || null;
  const password = card.querySelector(".receipt-password").value;
  const message = card.querySelector(".receipt-message");
  const account = getAllAccounts()[currentUser.email];
  const selectedReceiptIndexes = Array.from(card.querySelectorAll(".receipt-item-toggle:checked"))
    .map((input) => Number(input.dataset.index))
    .filter((index) => Number.isInteger(index));

  if (!receiptNumber) {
    message.textContent = "Informe o número de recebimento / entrada SAP.";
    return;
  }

  if (selectedReceiptIndexes.length === 0) {
    message.textContent = "Selecione pelo menos um item para receber.";
    return;
  }

  if (!purchaseArrivedDate) {
    message.textContent = "Informe a data de chegada / recebimento.";
    return;
  }

  if (!account || account.password !== password) {
    message.textContent = "Senha incorreta. O recebimento não foi registrado.";
    return;
  }

  prepareMailPopup();
  const receiptInvoiceName = selectedReceiptInvoice?.name || request.receiptInvoiceName || "";
  const receiptInvoiceDataUrl = selectedReceiptInvoice ? await readFileAsDataUrl(selectedReceiptInvoice) : request.receiptInvoiceDataUrl || "";
  const now = new Date().toISOString();
  const hadPurchaseArrival = isPurchaseArrivalRegistered(request);
  const selectedReceiptIndexSet = new Set(selectedReceiptIndexes);
  const items = request.items.map((item) => {
    const index = request.items.indexOf(item);
    if (!selectedReceiptIndexSet.has(index) || !isReceiptItemPending(request, item)) return item;
    const purchasedQty = isPurchaseArrivalRegistered(request) && item.purchaseApproval === "approved" ? getPurchasePendingQty(item) : 0;
    const cdQty = Number(item.cdQty) || 0;
    return {
      ...item,
      availableQty: (Number(item.availableQty) || 0) + purchasedQty + cdQty,
      cdReceivedQty: (Number(item.cdReceivedQty) || 0) + cdQty,
      purchaseReceivedQty: (Number(item.purchaseReceivedQty) || 0) + purchasedQty,
      cdQty: 0,
      purchaseQty: purchasedQty > 0 ? 0 : Number(item.purchaseQty) || getPurchasePendingQty(item),
      receiptNumber,
      receiptAt: now,
      receiptBy: currentUser.name || currentUser.label,
      receiptInvoiceName: purchasedQty > 0 ? receiptInvoiceName : item.receiptInvoiceName || "",
      receiptInvoiceDataUrl: purchasedQty > 0 ? receiptInvoiceDataUrl : item.receiptInvoiceDataUrl || "",
      status: "atendimento",
      statusItem: "atendimento",
    };
  });
  const hasApprovedPurchaseAfterReceipt = items.some((item) => getPurchasePendingQty(item) > 0 && item.purchaseApproval === "approved");
  const hasPickupAfterReceipt = items.some(isPickupItemPending);
  const updatedRequest = {
    ...request,
    status: hasPickupAfterReceipt ? "atendimento" : hasApprovedPurchaseAfterReceipt ? "compra" : "atendimento",
    items: hasApprovedPurchaseAfterReceipt
      ? items.map((item) => (getPurchaseBaseQty(item) > 0 ? { ...item, purchaseApproval: "approved" } : item))
      : items,
    purchaseArrivedDate: hadPurchaseArrival ? purchaseArrivedDate : request.purchaseArrivedDate || "",
    purchaseArrivedAt: hadPurchaseArrival ? request.purchaseArrivedAt || now : request.purchaseArrivedAt || "",
    receiptNumber,
    receiptInvoiceName,
    receiptInvoiceDataUrl,
    receiptAt: now,
    pickupAt: request.pickupAt || now,
    receiptBy: currentUser.name || currentUser.label,
    receiptByEmail: currentUser.email,
    purchaseApprovalRequestedAt: "",
    response: hasApprovedPurchaseAfterReceipt
      ? `Recebimento confirmado pelo Almoxarifado. Entrada SAP: ${receiptNumber}. Saldo aprovado aguardando pedido de compra.`
      : `Recebimento confirmado pelo Almoxarifado. Entrada SAP: ${receiptNumber}. Data de chegada: ${formatDateOnly(purchaseArrivedDate)}. Retirada liberada para o PCM.`,
  };

  requests = requests.map((item) => (item.id === id ? updatedRequest : item));
  persistRequestsLocally();
  openReceiptEmailDraft(updatedRequest, "");
  await saveRequestsSafely("recebimento");
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

async function markWithdrawn(id, response, pickupData = {}) {
  requests = requests.map((request) => {
    if (request.id !== id) return request;
    const now = new Date().toISOString();
    const items = request.items.map((item) => {
      const releasable = getPickupReleasedQty(item);
      return { ...item, withdrawnQty: Math.max(getWithdrawnQty(item), releasable) };
    });
    const allWithdrawn = items.every((item) => getWithdrawnQty(item) >= (Number(item.quantity) || 0));
    const nextStatus = allWithdrawn ? "retirado" : request.status;
    return {
      ...request,
      items,
      status: nextStatus,
      response,
      praxioRequisition: pickupData.praxio || request.praxioRequisition || "",
      withdrawnPerson: pickupData.person || request.withdrawnPerson || "",
      withdrawnConfirmedBy: currentUser.name || currentUser.label,
      withdrawnConfirmedByEmail: currentUser.email,
      pickupAt: request.pickupAt || now,
      withdrawnAt: allWithdrawn ? now : request.withdrawnAt || "",
    };
  });
  await saveRequestsSafely("retirada");
  render();
}

function clampQty(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(max, Math.floor(number));
}

function calculateStatus(items) {
  if (items.some(isPendingRegistrationItem)) return "cadastro";

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

  if (totals.purchase > 0) return "compra";
  if (totals.available + totals.cd >= totals.requested && totals.requested > 0) return totals.cd > 0 ? "recebimento" : "atendimento";
  if (totals.available > 0) return "cd";
  return "solicitacao";
}

function calculateAlmoxStatus(items) {
  const requested = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const available = items.reduce((sum, item) => sum + (Number(item.availableQty) || 0), 0);
  const cdPending = items.reduce((sum, item) => sum + getCdPendingQty(item), 0);
  const purchase = items.reduce((sum, item) => sum + getPurchasePendingQty(item), 0);
  if (available >= requested && requested > 0) return "atendimento";
  if (cdPending > 0) return "cd";
  if (purchase > 0) return "compra";
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

  if (totals.purchase > 0) return "compra";
  if (totals.available + totals.cd >= totals.requested && totals.requested > 0) return totals.cd > 0 ? "recebimento" : "atendimento";
  return "cd";
}

function getCdPendingQty(item) {
  if (isPendingRegistrationItem(item)) return 0;
  if (Number.isFinite(Number(item.cdPendingQty))) return Number(item.cdPendingQty);
  const quantity = Number(item.quantity) || 0;
  const local = Number(item.availableQty) || 0;
  return Math.max(0, quantity - local);
}

function getPurchaseBaseQty(item) {
  if (isPendingRegistrationItem(item)) return 0;
  const quantity = Number(item.quantity) || 0;
  const local = Number(item.availableQty) || 0;
  const cd = Number(item.cdQty) || 0;
  const purchase = Number(item.purchaseQty) || 0;
  if (getCdPendingQty(item) > 0 && item.purchaseApproval !== "pending" && item.purchaseApproval !== "approved" && item.purchaseApproval !== "rejected") return purchase;
  return Math.max(purchase, quantity - local - cd);
}

function getPurchasePendingQty(item) {
  if (item.purchaseApproval === "rejected") return 0;
  return getPurchaseBaseQty(item);
}

function getPurchasePendingQtySum(request) {
  return request.items.reduce((sum, item) => sum + getPurchasePendingQty(item), 0);
}

function getDisplayItemsForCurrentView(request) {
  if (!request?.items) return [];
  if (currentFilter === "recebimento") {
    return getReceiptPendingItems(request);
  }
  if (currentFilter === "cd" || (currentUser?.role === "cd" && currentFilter !== "recebimento")) {
    return request.items.filter((item) => getCdPendingQty(item) > 0);
  }
  if (currentFilter === "atendimento" && (currentUser?.role === "pcm" || currentUser?.role === "almox")) {
    const pickupItems = request.items.filter(isPickupItemPending);
    return pickupItems.length ? pickupItems : request.items;
  }
  if (currentFilter === "compra") {
    const purchaseItems = request.items.filter((item) => isPurchaseItemActive(request, item));
    return purchaseItems.length ? purchaseItems : request.items;
  }
  return request.items;
}

function hasPurchaseApprovalPending(request) {
  return false;
}

function hasApprovedPurchasePending(request) {
  return Boolean(request?.items?.some((item) => getPurchasePendingQty(item) > 0 && item.purchaseApproval === "approved"));
}

function isPurchaseItemActive(request, item) {
  if (!request || !item || getPurchasePendingQty(item) <= 0) return false;
  return item.purchaseApproval === "approved" || request.status === "compra" || request.status === "aprovacao";
}

function isPurchaseQueuePending(request) {
  return Boolean(request && !isPurchaseArrivalRegistered(request) && request.items?.some((item) => isPurchaseItemActive(request, item)));
}

function getTodayDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function isPurchaseArrivalRegistered(request) {
  return Boolean(request?.purchaseArrivedAt || request?.purchaseArrivedDate);
}

function hasPurchasedItemWaitingReceipt(request) {
  return Boolean(request?.items?.some((item) => item.purchaseApproval === "approved" && getPurchasePendingQty(item) > 0)) && isPurchaseArrivalRegistered(request);
}

function hasPurchaseReceipt(request) {
  return Boolean(request?.items?.some((item) => (Number(item.purchaseReceivedQty) || 0) > 0));
}

function isReceiptItemPending(request, item) {
  const cdArrived = Number(item.cdQty) > 0;
  const purchaseArrived = isPurchaseArrivalRegistered(request) && item.purchaseApproval === "approved" && getPurchasePendingQty(item) > 0;
  return cdArrived || purchaseArrived;
}

function getReceiptPendingItems(request) {
  if (!request) return [];
  return request.items.filter((item) => isReceiptItemPending(request, item));
}

function getDisplayStatus(request) {
  if (!request) return "solicitacao";
  if (request.status === "cancelado" || request.cancellationApprovedAt) return "cancelado";
  if (hasPendingCancellation(request)) return "cancelamento";
  if (request.status === "cancelamento" || request.status === "cancelado") return request.status;
  const hasPendingRegistration = request.items.some(isPendingRegistrationItem);
  const hasCdPending = request.items.some((item) => getCdPendingQty(item) > 0);
  const hasPurchasePending = request.items.some((item) => getPurchasePendingQty(item) > 0);
  const hasCdReceipt = request.items.some((item) => Number(item.cdQty) > 0);
  const hasReceiptPending = getReceiptPendingItems(request).length > 0;
  if (request.status === "cadastro" && hasPendingRegistration) return "cadastro";
  if (request.status === "cadastro" && !hasPendingRegistration) return calculateStatus(request.items);
  if (request.status === "aprovacao") return "compra";
  if (request.status === "cd" && !hasCdPending && hasPurchasePending) return "compra";
  if (request.status === "recebimento" && !hasReceiptPending && hasPurchasePending) return "compra";
  if (request.status === "recebimento" || hasCdReceipt || hasReceiptPending) return "recebimento";
  return request.status;
}

function getRequestStatusText(request, displayStatus = getDisplayStatus(request)) {
  if (displayStatus === "compra") {
    if (!request.sapRequestNumber) return "Pendente solicitação SAP pelo Almoxarifado";
    if (!request.purchaseOrder) return "Pendente pedido de compra";
    if (!request.deliveryDate) return "Pendente previsão de entrega";
    if (!isPurchaseArrivalRegistered(request)) return "Pendente chegada da compra";
  }
  return statusText[displayStatus] || displayStatus || "-";
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

function getAlmoxServedQty(item) {
  if (Number.isFinite(Number(item.almoxQty))) return Number(item.almoxQty) || 0;
  const quantity = Number(item.quantity) || 0;
  return Math.max(0, quantity - getCdServedQty(item) - getPurchaseServedQty(item));
}

function getAlmoxServedQtySum(request) {
  return request.items.reduce((sum, item) => sum + getAlmoxServedQty(item), 0);
}

function getCdServedQtySum(request) {
  return request.items.reduce((sum, item) => sum + getCdServedQty(item), 0);
}

function getPurchaseServedQtySum(request) {
  return request.items.reduce((sum, item) => sum + getPurchaseServedQty(item), 0);
}

function getItemPurchaseStatus(request, item) {
  const need = getPurchaseBaseQty(item);
  if (need <= 0) return "Sem compra";
  if (item.purchaseApproval === "approved") {
    if ((Number(item.purchaseReceivedQty) || 0) > 0) return "Recebido pelo Almoxarifado";
    if (isPurchaseArrivalRegistered(request)) return "Pendente entrada e recebimento";
    if (request.purchaseOrder) return request.deliveryDate ? "Pendente de chegada e recebimento" : "Pendente de data de chegada";
    if (request.sapRequestNumber) return "Solicitação SAP aberta";
    return "Aprovada para compra";
  }
  if (item.purchaseApproval === "rejected") return "Não aprovado";
  if (request.status === "aprovacao" || getDisplayStatus(request) === "aprovacao") return "Pendente aprovação";
  return "Aguardando aprovação";
}

function getItemStageStatus(request, item) {
  if (isPendingRegistrationItem(item)) return "Aguardando cadastro SAP";
  if (getWithdrawnQty(item) >= (Number(item.quantity) || 0)) return "Retirado";
  if (getDisplayStatus(request) === "recebimento" && (Number(item.cdQty) || 0) > 0) return "Pendente entrada e recebimento";
  if (isPurchaseArrivalRegistered(request) && item.purchaseApproval === "approved" && getPurchasePendingQty(item) > 0) return "Pendente entrada e recebimento";
  if (request.status === "cd" && getCdPendingQty(item) > 0) return "Pendente CD";
  if (getPurchaseBaseQty(item) > 0) return getItemPurchaseStatus(request, item);
  if (getPickupReleasedQty(item) > 0) return "Liberado para retirada";
  if (request.status === "solicitacao") return "Pendente Almox";
  return statusText[request.status] || "-";
}

function hasRealSapCode(item) {
  const code = String(item?.code || "").trim().toUpperCase();
  return Boolean(code && code !== "CADASTRO PENDENTE");
}

function getWithdrawnQty(item) {
  return Number(item.withdrawnQty) || 0;
}

function getPickupReleasedQty(item) {
  const quantity = Number(item.quantity) || 0;
  const released = Number(item.availableQty) || 0;
  return Math.min(quantity, released);
}

function isPickupItemPending(item) {
  return getPickupReleasedQty(item) > getWithdrawnQty(item);
}

function hasPickupPending(request) {
  return request.items.some(isPickupItemPending);
}

function getQtyStepClass(request, item, step) {
  if (isPendingRegistrationItem(item)) {
    return step === "requested" ? "active" : "idle";
  }

  const valueByStep = {
    requested: Number(item.quantity) || 0,
    almox: Number(item.availableQty) || 0,
    cd: Number(item.cdQty) || 0,
    purchase: getPurchasePendingQty(item),
    withdrawn: getWithdrawnQty(item),
  };

  if (step === "requested") return "done";
  if (step === "withdrawn") return getWithdrawnQty(item) > 0 ? "done" : isPickupItemPending(item) ? "active" : "idle";
  if (step === "almox" && request.status === "solicitacao") return valueByStep.almox > 0 ? "done" : "active";
  if (step === "almox" && request.attendedAt) return "done";
  if (step === "cd" && request.status === "cd") return getCdPendingQty(item) > 0 ? "active" : valueByStep.cd > 0 ? "done" : "idle";
  if (step === "cd" && request.cdAt) return "done";
  if (step === "purchase" && request.status === "aprovacao") return getPurchaseBaseQty(item) > 0 ? "active" : "idle";
  if (step === "purchase" && isPurchaseQueuePending(request)) return valueByStep.purchase > 0 ? "active" : "idle";
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
      sapRequestNumber: status === "solicitacao" ? "" : request.sapRequestNumber,
      sapRequestAt: status === "solicitacao" ? "" : request.sapRequestAt,
      sapRequestBy: status === "solicitacao" ? "" : request.sapRequestBy,
      buyerNote: status === "solicitacao" ? "" : request.buyerNote,
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
    { solicitacao: 0, cadastro: 0, cd: 0, atendimento: 0, aprovacao: 0, compra: 0, recebimento: 0, reprovado: 0, retirado: 0 }
  );

  document.querySelector("#metric-open").textContent = totals.solicitacao + totals.cadastro;
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
  document.querySelector(".approval-tab")?.setAttribute("hidden", "");
  if (currentUser.role === "pcm") {
    queueEyebrow.textContent = "PCM";
    queueTitle.textContent = "Minhas etapas";
    queueSubtitle.textContent = "Veja o que está liberado ou pendente.";
  } else if (currentUser.role === "almox") {
    queueEyebrow.textContent = "Almoxarifado";
    queueTitle.textContent = "Fila de atendimento";
    queueSubtitle.textContent = "Informe estoque local e encaminhe saldos.";
  } else if (currentUser.role === "cd") {
    queueEyebrow.textContent = "CD";
    queueTitle.textContent = "Pendências para o CD";
    queueSubtitle.textContent = "Atenda apenas o saldo enviado.";
  } else {
    queueEyebrow.textContent = "Gerente";
    queueTitle.textContent = "Painel corporativo";
    queueSubtitle.textContent = "Pendências, retiradas e compras.";
  }
}

function renderHistory() {
  if (!historyList) return;

  const query = historyFilter.value.trim().toLowerCase();
  const prefixQuery = historyPrefixFilter.value.trim().toLowerCase();
  const dateFrom = historyDateFrom.value;
  const dateTo = historyDateTo.value;
  const filtered = requests.filter((request) => {
    const matchesQuery = !query || request.items.some((item) => `${item.code} ${item.description}`.toLowerCase().includes(query));
    const matchesPrefix = !prefixQuery || String(request.bus || "").toLowerCase().includes(prefixQuery);
    const matchesDate = isRequestInHistoryDateRange(request, dateFrom, dateTo);
    return matchesQuery && matchesPrefix && matchesDate;
  });

  updateHistorySla(filtered);
  historyList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhum histórico encontrado para este filtro.";
    historyList.append(empty);
    return;
  }

  filtered.forEach((request) => {
    const displayStatus = getDisplayStatus(request);
    const row = document.createElement("article");
    row.className = "history-row";
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>${getRequestTargetLabel(request)} | ${formatItemCount(request.items.length)} | ${request.priority}</span>
        </div>
        <div><small>Onde está</small><b>${getRequestStatusText(request, displayStatus)}</b></div>
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
    .map((user) => {
      const feedback = userAccessFeedback?.email === user.email ? userAccessFeedback.message : "";
      return `<article class="user-row" data-email="${escapeAttr(user.email)}">
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
      <label class="user-corporate-field">
        <small>E-mail corporativo</small>
        <input class="user-corporate-email" type="email" value="${escapeAttr(user.corporateEmail || defaultCorporateEmail(user.email))}" />
      </label>
      <label class="user-password-field">
        <small>Senha</small>
        <input class="user-password" type="text" value="${escapeAttr(user.password)}" />
      </label>
      <div><small>Tipo</small><b>${user.defaultUser ? "Padrão" : "Criado"}</b></div>
      <div class="user-actions">
        <button class="secondary-action compact" type="button" data-user-action="save-password">Gravar acesso</button>
        <button class="danger-action compact" type="button" data-user-action="delete-user" ${user.email === currentUser.email ? "disabled" : ""}>Excluir</button>
        <span class="user-save-status ${feedback ? "success" : ""}" aria-live="polite">${escapeHtml(feedback)}</span>
      </div>
    </article>`;
    })
    .join("");
}

function renderEmailSettings() {
  if (!emailSettingsForm || !emailSettingsGrid) return;
  emailSettings = normalizeEmailSettings(emailSettings);
  const users = Object.entries(getAllAccounts()).map(([email, user]) => ({ ...user, email }));
  const roleOrder = ["admin", "manager", "almox", "cd", "compras", "pcm"];
  const usersByRole = roleOrder
    .map((role) => ({
      role,
      users: users.filter((user) => user.role === role),
    }))
    .filter((group) => group.users.length > 0);
  emailSettingsGrid.innerHTML = emailStepKeys
    .map((key) => {
      const setting = emailSettings[key] || { toUsers: [], ccUsers: [], extraTo: "", extraCc: "" };
      const allSelected = users.length > 0 && setting.toUsers.length >= users.length;
      return `<article class="email-step-card">
        <div class="email-step-head">
          <div>
            <strong>${emailStepLabels[key]}</strong>
            <span data-email-summary="${key}">${setting.toUsers.length} Para | ${setting.ccUsers.length} Cópia</span>
          </div>
          <button class="secondary-action compact email-toggle-all" type="button" data-email-toggle-all="${key}">${allSelected ? "Não enviar para todos" : "Todos em Para"}</button>
        </div>
        <div class="email-role-groups">
          ${usersByRole.map((group) => {
            const roleToCount = group.users.filter((user) => setting.toUsers.includes(user.email)).length;
            const roleCcCount = group.users.filter((user) => setting.ccUsers.includes(user.email)).length;
            const roleNoneCount = group.users.length - roleToCount - roleCcCount;
            const activeMode = roleToCount === group.users.length ? "to" : roleCcCount === group.users.length ? "cc" : roleNoneCount === group.users.length ? "none" : "";
            return `
            <details class="email-role-group">
              <summary>
                <span>
                  <strong>${roleLabel(group.role)}</strong>
                  <small data-email-role-summary="${key}-${group.role}">${roleToCount} Para | ${roleCcCount} Cópia</small>
                </span>
                <div>
                  <button class="secondary-action compact email-role-mode ${activeMode === "to" ? "is-active to" : ""}" type="button" data-email-step="${key}" data-email-toggle-role="${group.role}" data-email-mode="to">Para</button>
                  <button class="secondary-action compact email-role-mode ${activeMode === "cc" ? "is-active cc" : ""}" type="button" data-email-step="${key}" data-email-toggle-role="${group.role}" data-email-mode="cc">Cópia</button>
                  <button class="secondary-action compact email-role-mode ${activeMode === "none" ? "is-active none" : ""}" type="button" data-email-step="${key}" data-email-toggle-role="${group.role}" data-email-mode="none">Não enviar</button>
                </div>
              </summary>
              <div class="email-user-options">
                ${group.users.map((user) => `
                  <div class="email-user-chip">
                    <span>${escapeHtml(user.name || user.email)}</span>
                    <small>${escapeHtml(user.corporateEmail || defaultCorporateEmail(user.email))}</small>
                    <div class="email-recipient-modes" role="radiogroup" aria-label="Destino de ${escapeAttr(user.name || user.email)}">
                      <label><input type="radio" name="email-${key}-${escapeAttr(user.email)}" value="to" data-email-step="${key}" data-user-role="${escapeAttr(group.role)}" data-user-login="${escapeAttr(user.email)}" ${setting.toUsers.includes(user.email) ? "checked" : ""} /> Para</label>
                      <label><input type="radio" name="email-${key}-${escapeAttr(user.email)}" value="cc" data-email-step="${key}" data-user-role="${escapeAttr(group.role)}" data-user-login="${escapeAttr(user.email)}" ${setting.ccUsers.includes(user.email) ? "checked" : ""} /> Cópia</label>
                      <label><input type="radio" name="email-${key}-${escapeAttr(user.email)}" value="none" data-email-step="${key}" data-user-role="${escapeAttr(group.role)}" data-user-login="${escapeAttr(user.email)}" ${!setting.toUsers.includes(user.email) && !setting.ccUsers.includes(user.email) ? "checked" : ""} /> Não enviar</label>
                    </div>
                  </div>
                `).join("")}
              </div>
            </details>
          `;
          }).join("")}
        </div>
        <label class="email-extra-field">
          <small>E-mails extras em Para</small>
          <input type="text" data-email-step="${key}" data-extra-to value="${escapeAttr(setting.extraTo || "")}" placeholder="email@jtptransportes.com.br; outro@email.com" />
        </label>
        <label class="email-extra-field">
          <small>E-mails extras em Cópia</small>
          <input type="text" data-email-step="${key}" data-extra-cc value="${escapeAttr(setting.extraCc || "")}" placeholder="email@jtptransportes.com.br; outro@email.com" />
        </label>
      </article>`;
    })
    .join("");
}

function updateEmailStepSummary(key) {
  const radios = Array.from(emailSettingsForm.querySelectorAll(`[data-email-step="${key}"][data-user-login]`));
  const toSelected = radios.filter((input) => input.checked && input.value === "to").length;
  const ccSelected = radios.filter((input) => input.checked && input.value === "cc").length;
  const summary = emailSettingsForm.querySelector(`[data-email-summary="${key}"]`);
  const button = emailSettingsForm.querySelector(`[data-email-toggle-all="${key}"]`);
  const userCount = new Set(radios.map((input) => input.dataset.userLogin)).size;
  if (summary) summary.textContent = `${toSelected} Para | ${ccSelected} Cópia`;
  if (button) button.textContent = toSelected === userCount ? "Não enviar para todos" : "Todos em Para";
  const roleNames = new Set(radios.map((input) => input.dataset.userRole).filter(Boolean));
  roleNames.forEach((role) => {
    const roleRadios = radios.filter((input) => input.dataset.userRole === role);
    const roleTo = roleRadios.filter((input) => input.checked && input.value === "to").length;
    const roleCc = roleRadios.filter((input) => input.checked && input.value === "cc").length;
    const roleNone = new Set(roleRadios.map((input) => input.dataset.userLogin)).size - roleTo - roleCc;
    const roleUserCount = new Set(roleRadios.map((input) => input.dataset.userLogin)).size;
    const roleSummary = emailSettingsForm.querySelector(`[data-email-role-summary="${key}-${role}"]`);
    if (roleSummary) roleSummary.textContent = `${roleTo} Para | ${roleCc} Cópia`;
    emailSettingsForm.querySelectorAll(`[data-email-step="${key}"][data-email-toggle-role="${role}"]`).forEach((button) => {
      const active =
        (button.dataset.emailMode === "to" && roleTo === roleUserCount) ||
        (button.dataset.emailMode === "cc" && roleCc === roleUserCount) ||
        (button.dataset.emailMode === "none" && roleNone === roleUserCount);
      button.classList.toggle("is-active", active);
      button.classList.toggle("to", active && button.dataset.emailMode === "to");
      button.classList.toggle("cc", active && button.dataset.emailMode === "cc");
      button.classList.toggle("none", active && button.dataset.emailMode === "none");
    });
  });
}

function markUserRowChanged(target) {
  if (!target?.matches?.(".user-password, .user-role, .user-corporate-email")) return;
  const row = target.closest(".user-row");
  if (!row) return;
  row.classList.add("is-dirty");
  const button = row.querySelector("[data-user-action='save-password']");
  const status = row.querySelector(".user-save-status");
  if (button) button.textContent = "Gravar alterações";
  if (status) {
    status.textContent = "Alteração pendente.";
    status.classList.remove("success");
  }
}

function isPendingRegistrationItem(item) {
  return !hasRealSapCode(item) && Boolean(item?.isPendingRegistration || item?.pendingRegistrationId || String(item?.code || "").trim().toUpperCase() === "CADASTRO PENDENTE");
}

function canManagePartRegistrations() {
  return ["erik.barreto", "bruno.medici"].includes(currentUser?.email);
}

function openPartRegistrationDialog(description = "") {
  if (!description) activePartRegistrationInput = null;
  partRegistrationMessage.textContent = "";
  partRegistrationMessage.className = "password-message";
  partRegistrationForm.reset();
  if (description) {
    partRegistrationForm.elements.description.value = description;
  }
  partRegistrationDialog.showModal();
}

async function createPartRegistration(data) {
  const description = String(data.get("description") || "").trim();
  const originalCode = String(data.get("originalCode") || "").trim();
  const photoFile = data.get("partPhoto");
  const hasPhoto = photoFile && photoFile.name && photoFile.size > 0;

  if (!description || !originalCode) {
    partRegistrationMessage.textContent = "Informe a descrição e o código original.";
    partRegistrationMessage.className = "password-message error";
    return;
  }

  if (hasPhoto && photoFile.size > 900 * 1024) {
    partRegistrationMessage.textContent = "A foto deve ter até 900 KB.";
    partRegistrationMessage.className = "password-message error";
    return;
  }

  const photoDataUrl = hasPhoto ? await readFileAsDataUrl(photoFile) : "";

  const alreadyPending = partRegistrations.some((item) => {
    return item.status === "pending" && item.description.toLowerCase() === description.toLowerCase() && item.originalCode.toLowerCase() === originalCode.toLowerCase();
  });

  if (alreadyPending) {
    const pending = partRegistrations.find((item) => item.status === "pending" && item.description.toLowerCase() === description.toLowerCase() && item.originalCode.toLowerCase() === originalCode.toLowerCase());
    linkPendingRegistrationToInput(pending, getPartRegistrationTargetInput());
    partRegistrationMessage.textContent = "Este cadastro já está pendente para o admin e foi vinculado à solicitação.";
    partRegistrationMessage.className = "password-message success";
    setTimeout(() => partRegistrationDialog.close(), 450);
    return;
  }

  const registration = {
    id: `CAD-${Date.now()}`,
    description,
    originalCode,
    photoName: hasPhoto ? photoFile.name : "",
    photoDataUrl,
    requestedBy: currentUser.name || currentUser.label,
    requestedByEmail: currentUser.email,
    createdAt: new Date().toISOString(),
    status: "pending",
    createdCode: "",
    completedAt: "",
    completedBy: "",
    linkedRequestId: "",
  };
  partRegistrations = [
    registration,
    ...partRegistrations,
  ];
  savePartRegistrations();
  renderPartRegistrations();
  linkPendingRegistrationToInput(registration, getPartRegistrationTargetInput());
  partRegistrationMessage.textContent = "Cadastro enviado para Erik e Bruno.";
  partRegistrationMessage.className = "password-message success";
  setTimeout(() => partRegistrationDialog.close(), 450);
}

function getPartRegistrationTargetInput() {
  if (activePartRegistrationInput) return activePartRegistrationInput;
  const emptyInput = [...itemLines.querySelectorAll('[name="partLookup"]')].find((input) => !input.value.trim());
  if (emptyInput) return emptyInput;
  const line = addItemLine();
  return line.querySelector('[name="partLookup"]');
}

function linkPendingRegistrationToInput(registration, input) {
  if (!registration || !input) return;
  input.value = `[Cadastro pendente] ${registration.description}`;
  input.dataset.code = "";
  input.dataset.description = registration.description;
  input.dataset.registrationId = registration.id;
  input.dataset.originalCode = registration.originalCode;
  input.dataset.photoName = registration.photoName || "";
  input.dataset.photoDataUrl = registration.photoDataUrl || "";
  input.setCustomValidity("");
  activePartRegistrationInput = null;
}

function linkPartRegistrationsToRequest(request) {
  const pendingIds = request.items
    .filter(isPendingRegistrationItem)
    .map((item) => item.pendingRegistrationId)
    .filter(Boolean);
  if (pendingIds.length === 0) return;

  partRegistrations = partRegistrations.map((registration) =>
    pendingIds.includes(registration.id)
      ? { ...registration, linkedRequestId: request.id, linkedRequestBus: request.bus }
      : registration
  );
  savePartRegistrations();
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
          <small>Descrição PCM</small>
          <strong>${escapeHtml(item.description)}</strong>
          <span>Código/Fabricante: ${escapeHtml(item.originalCode)}</span>
          <small>Solicitado: ${formatDateOrDash(item.createdAt)}</small>
          ${item.photoDataUrl ? `<a class="file-link" href="${escapeAttr(item.photoDataUrl)}" download="${escapeAttr(item.photoName || "foto-peca.png")}" target="_blank" rel="noopener">Ver foto da peça</a>` : ""}
        </div>
        <label>
          <small>Código SAP</small>
          <input class="created-part-code" value="${escapeAttr(item.createdCode || "")}" ${done || !canManage ? "disabled" : ""} placeholder="Ex.: 30000000" />
        </label>
        <label>
          <small>Descrição SAP</small>
          <textarea class="created-part-description" rows="2" ${done || !canManage ? "disabled" : ""} placeholder="Preencha ou use a existente">${escapeHtml(item.createdDescription || item.description || "")}</textarea>
        </label>
        <div><small>Status</small><b>${done ? item.resolvedAsExisting ? "Já existia" : "Cadastrado" : "Pendente SAP"}</b></div>
        <div class="user-actions">
          ${done ? "" : `<button class="secondary-action compact" type="button" data-part-action="existing" ${!canManage ? "disabled" : ""}>Já existe</button>
          <button class="secondary-action compact" type="button" data-part-action="save" ${!canManage ? "disabled" : ""}>Criar cadastro</button>
          <button class="danger-action compact" type="button" data-part-action="delete" ${!canManage ? "disabled" : ""}>Excluir</button>`}
        </div>
      </article>`;
    })
    .join("");
}

function getRegistrationRequest(registration) {
  if (!registration) return null;
  return requests.find((request) => {
    if (registration.linkedRequestId && request.id === registration.linkedRequestId) return true;
    return request.items.some((item) => item.pendingRegistrationId === registration.id);
  }) || null;
}

async function completePartRegistration(id, code, finalDescription, useExisting = false) {
  if (!canManagePartRegistrations()) return;
  const cleanCode = String(code || "").trim();
  const registration = partRegistrations.find((item) => item.id === id);
  if (!registration) return;
  const existingPart = useExisting ? findPartByCode(cleanCode) : null;
  const cleanDescription = String(existingPart?.description || finalDescription || "").trim();
  if (!cleanCode || !cleanDescription) {
    window.alert("Informe o código SAP e a descrição do item.");
    return;
  }

  prepareMailPopup();
  const part = { code: cleanCode, description: cleanDescription };
  if (!useExisting || !existingPart) {
    customParts = customParts.filter((item) => String(item.code) !== cleanCode);
    customParts.unshift(part);
  }
  const updatedRequests = [];
  requests = requests.map((request) => {
    let changed = false;
    const items = request.items.map((item) => {
      const matchesRegistration = item.pendingRegistrationId === id;
      const matchesLegacyPending = isPendingRegistrationItem(item)
        && String(item.description || "").toLowerCase() === registration.description.toLowerCase()
        && String(item.pendingOriginalCode || "").toLowerCase() === registration.originalCode.toLowerCase();
      if (!matchesRegistration && !matchesLegacyPending) return item;
      changed = true;
      return {
        ...item,
        code: cleanCode,
        description: cleanDescription,
        isPendingRegistration: false,
        pendingRegistrationId: "",
        pendingOriginalCode: "",
        pendingPhotoName: "",
        pendingPhotoDataUrl: "",
      };
    });
    if (!changed) return request;
    const hasPendingRegistration = items.some(isPendingRegistrationItem);
    const updatedRequest = {
      ...request,
      items,
      status: hasPendingRegistration ? "cadastro" : "solicitacao",
      response: hasPendingRegistration
        ? request.response || "Solicitação aguardando cadastro de item."
        : "Cadastro SAP concluído. Solicitação liberada para atendimento do Almoxarifado.",
    };
    updatedRequests.push(updatedRequest);
    return updatedRequest;
  });
  partRegistrations = partRegistrations.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "done",
          createdCode: cleanCode,
          createdDescription: cleanDescription,
          resolvedAsExisting: Boolean(useExisting),
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name || currentUser.label,
        }
      : item
  );
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  localStorage.setItem(CUSTOM_PARTS_KEY, JSON.stringify(customParts));
  localStorage.setItem(PART_REGISTRATIONS_KEY, JSON.stringify(partRegistrations));
  if (updatedRequests.length > 0) {
    openPartRegistrationCompletedEmailDraft(updatedRequests[0], part, useExisting);
  } else {
    closePreparedMailPopup();
  }
  await saveRequestsSafely("cadastro de item");
  saveCustomParts();
  savePartRegistrations();
  renderPartRegistrations();
  render();
}

function findPartByCode(code) {
  const cleanCode = String(code || "").trim().toLowerCase();
  if (!cleanCode) return null;
  return getAvailableParts().find((part) => String(part.code || "").trim().toLowerCase() === cleanCode) || null;
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

function updateUserAccess(email, password, role, corporateEmail = "") {
  const account = getAllAccounts()[email];
  if (!account) return;

  const updatedUser = {
    ...account,
    email,
    corporateEmail: normalizeCorporateEmail(corporateEmail || account.corporateEmail, email),
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
    const start = request.cdAt || request.attendedAt;
    if (!start) return "-";
    const end = request.purchaseAt || (request.status === "reprovado" ? request.purchaseApprovedAt : "") || (request.status === "aprovacao" ? now : "");
    return end ? formatDuration(start, end) : "-";
  }
  if (area === "compra") {
    if (!request.purchaseAt) return "-";
    const end = request.purchaseArrivedAt || (hasApprovedPurchasePending(request) || getDisplayStatus(request) === "compra" ? now : request.purchaseAt);
    return end ? formatDuration(request.purchaseAt, end) : "-";
  }
  if (area === "recebimento") {
    const start = request.purchaseArrivedAt || request.cdAt || request.purchaseAt;
    if (!start) return "-";
    const end = request.receiptAt || (getDisplayStatus(request) === "recebimento" ? now : "");
    return end ? formatDuration(start, end) : "-";
  }
  return "-";
}

function getCurrentSla(request) {
  return formatDuration(request.createdAt, request.withdrawnAt || new Date().toISOString());
}

function createHistorySlaMap(request) {
  const displayStatus = getDisplayStatus(request);
  const steps = [
    { key: "almox", label: "Almoxarifado", owner: request.almoxBy || "Pendente", active: displayStatus === "solicitacao", done: Boolean(request.attendedAt) },
    { key: "cd", label: "CD", owner: request.cdBy || "Pendente", active: displayStatus === "cd", done: Boolean(request.cdAt) },
    { key: "aprovacao", label: "Aprovação", owner: request.purchaseApprovedBy || "Gerente", active: displayStatus === "aprovacao", done: Boolean(request.purchaseAt) || request.status === "reprovado" },
    { key: "compra", label: "Compra", owner: request.purchaseOrder || request.sapRequestNumber || "Pedido pendente", active: displayStatus === "compra", done: Boolean(request.purchaseArrivedAt || hasPurchaseReceipt(request)) },
    { key: "recebimento", label: "Recebimento", owner: request.receiptNumber || "Pendente entrada SAP", active: displayStatus === "recebimento", done: Boolean(request.receiptAt) },
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
  const displayStatus = getDisplayStatus(request);
  const isCanceled = displayStatus === "cancelado" || request.status === "cancelado" || Boolean(request.cancellationApprovedAt);
  const almoxQty = getAlmoxServedQtySum(request);
  const cdQty = getCdServedQtySum(request);
  const purchaseQty = getPurchaseServedQtySum(request);
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
      status: request.attendedAt ? almoxQty > 0 ? `Atendeu ${almoxQty} un.` : "Sem saldo local" : displayStatus === "solicitacao" ? "Pendente" : "Não passou",
      owner: request.almoxBy || "-",
      date: request.attendedAt,
      sla: getAreaSla(request, "almox"),
      state: request.attendedAt ? "done" : !isCanceled && displayStatus === "solicitacao" ? "active" : "idle",
    },
    {
      label: "CD",
      status: request.cdAt ? cdQty > 0 ? `Atendeu ${cdQty} un.` : "Sem saldo no CD" : displayStatus === "cd" ? "Pendente" : "Não acionado",
      owner: request.cdBy || "-",
      date: request.cdAt,
      sla: getAreaSla(request, "cd"),
      state: request.cdAt ? "done" : !isCanceled && displayStatus === "cd" ? "active" : "idle",
    },
    {
      label: "Aprovação",
      status: request.status === "reprovado" ? "Compra não aprovada" : request.purchaseAt ? "Compra aprovada" : displayStatus === "aprovacao" ? "Pendente aprovação" : "Não acionada",
      owner: request.purchaseApprovedBy || "Gerente",
      date: request.purchaseAt || request.purchaseApprovedAt,
      sla: getAreaSla(request, "aprovacao"),
      state: request.purchaseAt || request.status === "reprovado" ? "done" : !isCanceled && displayStatus === "aprovacao" ? "active" : "idle",
    },
    {
      label: "Compra",
      status: request.purchaseAt
        ? hasPurchaseReceipt(request)
          ? `Recebida ${purchaseQty} un.`
          : request.purchaseArrivedAt
          ? "Compra entregue ao Almoxarifado"
          : request.purchaseOrder
          ? request.deliveryDate
            ? "Pendente de chegada e recebimento"
            : "Pendente de data de chegada"
          : request.sapRequestNumber
          ? "Solicitação SAP aberta"
          : "Aguardando solicitação SAP"
        : "Não acionada",
      owner: request.purchaseOrder ? `Pedido ${request.purchaseOrder}` : request.sapRequestNumber ? `SAP ${request.sapRequestNumber}` : "-",
      date: request.purchaseAt,
      sla: getAreaSla(request, "compra"),
      state: request.purchaseAt ? hasPurchaseReceipt(request) ? "done" : isCanceled ? "idle" : "active" : "idle",
    },
    {
      label: "Recebimento",
      status: request.receiptAt ? "Entrada SAP confirmada" : displayStatus === "recebimento" ? "Pendente entrada e recebimento" : "Não solicitado",
      owner: request.receiptBy || request.almoxBy || "-",
      date: request.receiptAt,
      sla: getAreaSla(request, "recebimento"),
      state: request.receiptAt ? "done" : !isCanceled && displayStatus === "recebimento" ? "active" : "idle",
    },
    {
      label: "Retirada",
      status: request.withdrawnAt ? "Retirado pelo PCM" : request.pickupAt ? "Retirada parcial registrada" : hasPickupPending(request) ? "Liberado para retirada" : "Aguardando",
      owner: request.withdrawnAt || request.pickupAt ? `${request.withdrawnPerson || request.requestedBy || "-"}${request.praxioRequisition ? ` | Praxio ${request.praxioRequisition}` : ""}` : "-",
      date: request.withdrawnAt || request.pickupAt,
      sla: request.withdrawnAt || request.pickupAt ? formatDuration(request.createdAt, request.withdrawnAt || request.pickupAt) : "-",
      state: request.withdrawnAt ? "done" : !isCanceled && hasPickupPending(request) ? "active" : request.pickupAt ? "done" : "idle",
    },
    {
      label: "Cancelamento",
      status: request.status === "cancelado" ? "Cancelamento aprovado" : request.status === "cancelamento" ? "Aguardando aprovação" : request.cancellationRejectedAt ? "Cancelamento recusado" : "Não solicitado",
      owner: request.cancellationApprovedBy || request.cancellationRejectedBy || request.cancellationRequestedBy || "-",
      date: request.cancellationApprovedAt || request.cancellationRejectedAt || request.cancellationRequestedAt,
      sla: request.cancellationRequestedAt ? formatDuration(request.cancellationRequestedAt, request.cancellationApprovedAt || request.cancellationRejectedAt || new Date().toISOString()) : "-",
      state: request.status === "cancelado" ? "done" : request.status === "cancelamento" ? "active" : request.cancellationRejectedAt ? "done" : "idle",
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
      <b>${getAlmoxServedQty(item)}</b>
      <b>${getCdServedQty(item)}</b>
      <b>${getPurchaseServedQty(item)}</b>
      <small>${getHistoryItemStageStatus(request, item)}</small>
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

function getHistoryItemStageStatus(request, item) {
  if (request.status === "cancelado" || item.status === "cancelado" || item.statusItem === "cancelado") return "Cancelado";
  if (isPendingRegistrationItem(item)) return "Aguardando cadastro SAP";
  if (getWithdrawnQty(item) >= (Number(item.quantity) || 0)) return "Retirado";

  const localQty = Number(item.availableQty) || 0;
  const cdQty = Number(item.cdQty) || 0;
  const cdReceivedQty = Number(item.cdReceivedQty) || 0;
  const purchaseReceivedQty = Number(item.purchaseReceivedQty) || 0;
  const hasItemReceipt = Boolean(item.receiptNumber || item.receiptAt || item.receiptBy);

  if (hasItemReceipt && (cdReceivedQty > 0 || purchaseReceivedQty > 0) && getPickupReleasedQty(item) > getWithdrawnQty(item)) {
    return "Liberado para retirada";
  }
  if (cdQty > 0 || (!hasItemReceipt && cdReceivedQty > 0)) return "Pendente entrada e recebimento";
  if (getPurchasePendingQty(item) > 0) return getItemPurchaseStatus(request, item);
  if (purchaseReceivedQty > 0 && !hasItemReceipt) return "Pendente validação do recebimento";
  if (localQty > getWithdrawnQty(item)) return "Liberado para retirada";
  if (request.status === "solicitacao") return "Pendente Almox";
  return getItemStageStatus(request, item);
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
  const receiptNumber = item.receiptNumber || "";
  if (!receiptNumber) return "-";
  const hasPurchaseReceiptItem = (Number(item.purchaseReceivedQty) || 0) > 0;
  const hasCdReceiptItem = (Number(item.cdReceivedQty) || 0) > 0;
  if (hasPurchaseReceiptItem) {
    const invoiceName = item.receiptInvoiceName || request.receiptInvoiceName || "";
    const invoiceUrl = item.receiptInvoiceDataUrl || request.receiptInvoiceDataUrl || "";
    const invoice = invoiceName
      ? invoiceUrl
        ? `<a class="invoice-link" href="${escapeAttr(invoiceUrl)}" download="${escapeAttr(invoiceName)}" target="_blank" rel="noopener">${escapeHtml(invoiceName)}</a>`
        : escapeHtml(invoiceName)
      : "";
    return invoice ? `${escapeHtml(receiptNumber)}<br>${invoice}` : escapeHtml(receiptNumber);
  }
  if (hasCdReceiptItem) return escapeHtml(receiptNumber);
  return "-";
}

function createPurchaseItemDetails(request, items, compact = false) {
  const rows = items
    .map((item) => compact ? `<div class="history-item-row purchase-item-row compact-purchase-item-row">
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <b>${getPurchasePendingQty(item)}</b>
      <em>${getItemPurchaseStatus(request, item)}</em>
    </div>` : `<div class="history-item-row purchase-item-row">
      <strong>${item.code}</strong>
      <span>${item.description}</span>
      <b>${getPurchasePendingQty(item)}</b>
      <b>${request.sapRequestNumber || "-"}</b>
      <b>${request.purchaseOrder || "-"}</b>
      <b>${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "-"}</b>
      <b>${request.purchaseArrivedDate ? formatDateOnly(request.purchaseArrivedDate) : "-"}</b>
      <b>${getAreaSla(request, "compra")}</b>
    </div>`)
    .join("");

  if (compact) {
    return `
      <div class="history-item-header purchase-item-header compact-purchase-item-header">
        <span>Código</span>
        <span>Descrição</span>
        <span>Qtd.</span>
        <span>Status</span>
      </div>
      ${rows}
    `;
  }

  return `
    <div class="history-item-header purchase-item-header">
      <span>Código</span>
      <span>Descrição</span>
      <span>Compra</span>
      <span>Solicitação SAP</span>
      <span>Pedido compra</span>
      <span>Previsão</span>
      <span>Chegada real</span>
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
      <b>${getPurchaseBaseQty(item)}</b>
      <em>${getItemPurchaseStatus(request, item)}</em>
    </div>`)
    .join("");

  return `
    <div class="history-item-header approval-item-header">
      <span></span>
      <span>Código</span>
      <span>Descrição</span>
      <span>Qtd. compra</span>
      <span>Status</span>
    </div>
    ${rows}
  `;
}

function renderApprovalQueue() {
  if (!approvalList) return;

  const approvalRequests = requests
    .filter(hasPurchaseApprovalPending)
    .map((request) => ({
      request,
      items: request.items.filter((item) => getPurchaseBaseQty(item) > 0 && item.purchaseApproval !== "approved" && item.purchaseApproval !== "rejected"),
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
    const canApprove = canCurrentUserApprovePurchase();
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>${getRequestTargetLabel(request)} | ${formatItemCount(items.length)} aguardando aprovação</span>
        </div>
        <div><small>Onde está</small><b>${statusText.aprovacao}</b></div>
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

async function approvePurchase(id, mode = "all", selectedCodes = []) {
  if (!canCurrentUserApprovePurchase()) return;
  if ((mode === "selected" || mode === "reject-selected") && selectedCodes.length === 0) {
    window.alert("Selecione pelo menos um item para aplicar essa decisão.");
    return;
  }
  prepareMailPopup();
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
    const hasCdReceiptPending = items.some((item) => Number(item.cdQty) > 0);
    const nextStatus = approvedQty > 0 ? hasCdReceiptPending ? "recebimento" : "compra" : hasPickupPending({ ...request, items }) ? "atendimento" : "reprovado";
    approvedRequest = {
      ...request,
      items,
      status: nextStatus,
      purchaseAt: approvedQty > 0 ? now : request.purchaseAt || "",
      purchaseApprovedAt: now,
      purchaseApprovedBy: currentUser.name || currentUser.label,
      response: approvedQty > 0
        ? `Compra aprovada pelo Gerente. ${approvedQty} unidade(s) liberada(s) para abertura da solicitação SAP${rejectedQty > 0 ? ` e ${rejectedQty} unidade(s) não aprovada(s)` : ""}.`
        : "Compra não aprovada pelo Gerente. Sem itens liberados para SAP.",
    };
    return approvedRequest;
  });
  persistRequestsLocally();
  if (approvedRequest) openApprovalEmailDraft(approvedRequest, "");
  await saveRequestsSafely("aprovação de compra");
  render();
  renderApprovalQueue();
}

function canCurrentUserApprovePurchase() {
  return currentUser?.role === "manager" || String(currentUser?.label || "").toLowerCase() === "gerente";
}

function renderPurchaseOverview() {
  const purchaseRequests = requests
    .filter(isPurchaseQueuePending)
    .map((request) => ({
      request,
      items: request.items.filter((item) => isPurchaseItemActive(request, item)),
    }))
    .filter(({ items }) => items.length > 0);

  purchaseOverviewList.innerHTML = "";

  if (purchaseRequests.length === 0) {
    purchaseOverviewList.innerHTML = '<div class="empty-state">Nenhum item pendente de compra.</div>';
    return;
  }

  purchaseRequests.forEach(({ request, items }) => {
    const row = document.createElement("article");
    const buyerView = currentUser.role === "compras";
    row.className = `history-row purchase-request-row ${buyerView ? "buyer-request-row" : ""}`;
    const purchaseReceived = items.some((item) => (Number(item.purchaseReceivedQty) || 0) > 0);
    const purchaseMeta = buyerView ? `
          <div><small>Solicitação SAP</small><b>${request.sapRequestNumber || "-"}</b></div>
          <div><small>Pedido de compra</small><b>${request.purchaseOrder || "-"}</b></div>
          <div><small>Previsão de entrega</small><b>${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "-"}</b></div>
          <div><small>Observação de compras</small><b>${request.buyerNote || "-"}</b></div>
        ` : `
          <div><small>Envio para compra</small><b>${formatDateOrDash(request.purchaseAt)}</b></div>
          <div><small>Solicitação SAP</small><b>${request.sapRequestNumber || "-"}</b></div>
          <div><small>Previsão de entrega</small><b>${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "-"}</b></div>
          <div><small>Chegada real</small><b>${request.purchaseArrivedDate ? formatDateOnly(request.purchaseArrivedDate) : "-"}</b></div>
          <div><small>Recebimento Almox</small><b>${purchaseReceived ? formatDateOrDash(request.receiptAt) : "-"}</b></div>
          <div><small>Pedido de compra</small><b>${request.purchaseOrder || "-"}</b></div>
          <div><small>Entrada SAP</small><b>${purchaseReceived ? request.receiptNumber || "-" : "-"}</b></div>
          <div><small>Observação de compras</small><b>${request.buyerNote || "-"}</b></div>
        `;
    row.innerHTML = `
      <button class="history-summary" type="button" aria-expanded="false">
        <div>
          <strong>${request.id}</strong>
          <span>${getRequestTargetLabel(request)} | ${formatItemCount(items.length)} pendente(s) de compra</span>
        </div>
        <div><small>Solicitação</small><b>${request.id}</b></div>
        <div><small>SLA total</small><b>${getCurrentSla(request)}</b></div>
      </button>
      <div class="history-details">
        <div class="history-qty-map">
          ${createPurchaseItemDetails(request, items, buyerView)}
        </div>
        <div class="history-meta history-dates">
          ${purchaseMeta}
        </div>
        ${buyerView ? `
          <div class="purchase-delivery-editor">
            <label>
              Solicitação SAP
              <input class="purchase-overview-sap" type="text" value="${request.sapRequestNumber || "Aguardando Almoxarifado"}" readonly />
            </label>
            <label>
              Número do pedido de compra
              <input class="purchase-overview-order" type="text" value="${request.purchaseOrder || ""}" placeholder="Ex.: 4500123456" ${request.purchaseOrder ? "readonly" : ""} ${request.sapRequestNumber ? "" : "disabled"} />
            </label>
            <label>
              Previsão de entrega
              <input class="purchase-overview-delivery" type="date" value="${request.deliveryDate || ""}" ${request.sapRequestNumber ? "" : "disabled"} />
            </label>
            <label class="purchase-note-label">
              Observação de Compras
              <textarea class="purchase-overview-note" rows="3" ${request.sapRequestNumber ? "" : "disabled"}>${request.buyerNote || ""}</textarea>
            </label>
            <button class="action available purchase-overview-save" type="button" ${request.sapRequestNumber ? "" : "disabled"}>Salvar compra</button>
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
      saveDeliveryButton.addEventListener("click", () => savePurchaseDelivery(request.id, row.querySelector(".purchase-overview-order").value, row.querySelector(".purchase-overview-delivery").value, row.querySelector(".purchase-overview-note").value));
    }
    purchaseOverviewList.append(row);
  });
}

async function savePurchaseDelivery(id, purchaseOrder, deliveryDate, buyerNote = "") {
  if (currentUser.role !== "compras") return;
  const cleanOrder = String(purchaseOrder || "").trim();
  if (!cleanOrder) {
    window.alert("Informe o número do pedido de compra.");
    return;
  }
  let updatedRequest = null;
  requests = requests.map((request) => {
    if (request.id !== id) return request;
    if (!request.sapRequestNumber) {
      window.alert("Aguardando o Almoxarifado informar a solicitação SAP.");
      return request;
    }
    const hasCdReceiptPending = request.items.some((item) => Number(item.cdQty) > 0);
    const nextStatus = hasCdReceiptPending ? "recebimento" : "compra";
    updatedRequest = {
      ...request,
      purchaseOrder: request.purchaseOrder || cleanOrder,
      deliveryDate,
      buyerNote: String(buyerNote || "").trim(),
      purchaseUpdatedAt: new Date().toISOString(),
      purchaseUpdatedBy: currentUser.name || currentUser.label,
      status: nextStatus,
      response: deliveryDate
        ? `Pedido de compra ${request.purchaseOrder || cleanOrder} registrado pelo time de Compras. Previsão de entrega: ${formatDateOnly(deliveryDate)}. Aguardando chegada.`
        : `Pedido de compra ${request.purchaseOrder || cleanOrder} registrado pelo time de Compras. Pendente de data de chegada.`,
    };
    return updatedRequest;
  });
  if (updatedRequest) {
    prepareMailPopup();
    persistRequestsLocally();
    openPurchaseEmailDraft(updatedRequest, "");
  }
  await saveRequestsSafely("atualização de compras");
  render();
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
    .map((item, index) => {
      const quantity = Number(getQuantity(item)) || 0;
      const extraLines = getExtraLines(item).filter(Boolean);
      const block = [
        `ITEM: ${item.description}`,
        "",
        `QTD: ${quantity} UNIDADES`,
        "",
        `COD: ${item.code}`,
      ];
      if (extraLines.length) block.push("", ...extraLines);
      return `${index > 0 ? "----------------------------------------\n" : ""}${block.join("\n")}`;
    })
    .join("\n\n\n");
}

function buildEmailBody(title, intro, sections) {
  return [
    title.toUpperCase(),
    "=".repeat(title.length),
    "",
    "Prezados,",
    "",
    intro,
    "",
    ...sections.flatMap((section) => [
      section.title.toUpperCase(),
      "-".repeat(Math.max(section.title.length, 24)),
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
  const account = getAllAccounts()[normalizeLogin(value)];
  if (account?.corporateEmail) return account.corporateEmail;
  return value.includes("@") ? value : `${normalizeLogin(value)}@jtptransportes.com.br`;
}

function getEmailRecipients(step, fallback = "") {
  const setting = normalizeEmailStepSetting(emailSettings?.[step], null);
  const hasStepConfig = Boolean(emailSettings && Object.prototype.hasOwnProperty.call(emailSettings, step));
  const to = [
    ...(setting.toUsers || []).map(userLoginToEmail),
    ...splitEmailLikeList(setting.extraTo || "").map(userLoginToEmail),
  ].filter(Boolean);
  const cc = [
    ...(setting.ccUsers || []).map(userLoginToEmail),
    ...splitEmailLikeList(setting.extraCc || "").map(userLoginToEmail),
  ].filter(Boolean);
  const uniqueTo = to.filter((email, index, list) => list.indexOf(email) === index);
  const toSet = new Set(uniqueTo.map((email) => email.toLowerCase()));
  const uniqueCc = cc.filter((email, index, list) => email && !toSet.has(email.toLowerCase()) && list.indexOf(email) === index);
  return {
    step,
    fallback,
    to: uniqueTo.join(";") || (hasStepConfig ? "" : normalizeEmailList(fallback)),
    cc: uniqueCc.join(";"),
  };
}

function prepareMailPopup() {
  if (isPopupUsable(preparedMailPopup)) return preparedMailPopup;
  preparedMailPopup = window.open("about:blank", "_blank");
  if (isPopupUsable(preparedMailPopup)) {
    try {
      preparedMailPopup.document.write("<!doctype html><title>ManuPeças</title><body style=\"font-family:Arial,sans-serif;padding:24px;color:#10201a\"><h2>Abrindo Outlook Web...</h2><p>Aguarde enquanto o e-mail automático é preparado.</p></body>");
      preparedMailPopup.document.close();
    } catch {
      // A aba pode ficar inacessível dependendo da política do navegador.
    }
  }
  return preparedMailPopup;
}

function closePreparedMailPopup() {
  if (!isPopupUsable(preparedMailPopup)) {
    preparedMailPopup = null;
    return;
  }
  try {
    if (preparedMailPopup.location.href === "about:blank") {
      preparedMailPopup.close();
    }
  } catch {
    preparedMailPopup.close();
  }
  preparedMailPopup = null;
}

function isPopupUsable(popup) {
  try {
    return Boolean(popup && !popup.closed);
  } catch {
    return Boolean(popup);
  }
}

function openMailDraft(to, subject, bodyText) {
  const recipients = typeof to === "object" && to !== null ? to : { to };
  flushSupabaseWrites();
  const popup = isPopupUsable(preparedMailPopup) ? preparedMailPopup : prepareMailPopup();
  preparedMailPopup = null;
  openMailDraftInOutlookWeb(recipients, subject, bodyText, popup);
  refreshEmailSettingsCache().catch(() => {});
}

async function refreshEmailSettingsCache() {
  if (supabaseClient) {
    try {
      const remoteEmailSettings = await loadEmailSettingsFromSupabase();
      if (remoteEmailSettings) {
        emailSettings = normalizeEmailSettings(remoteEmailSettings);
        localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(emailSettings));
        return emailSettings;
      }
    } catch (error) {
      console.warn("Não foi possível atualizar as configurações de e-mail pelo Supabase.", error);
    }
  }
  try {
    emailSettings = normalizeEmailSettings(JSON.parse(localStorage.getItem(EMAIL_SETTINGS_KEY) || "{}"));
  } catch {
    emailSettings = normalizeEmailSettings(emailSettings);
  }
  return emailSettings;
}

function openMailDraftInOutlookWeb(recipients, subject, bodyText, popup = null) {
  let finalRecipients = recipients;
  if (recipients.step) {
    finalRecipients = getEmailRecipients(recipients.step, recipients.fallback || "");
  }
  const recipient = formatOutlookWebRecipients(finalRecipients.to);
  const cc = formatOutlookWebRecipients(finalRecipients.cc);
  console.info("ManuPeças e-mail", { etapa: finalRecipients.step || "manual", para: recipient, copia: cc });
  const params = [];
  const toWithCc = recipient && cc ? `${recipient}?cc=${cc}` : recipient;
  if (toWithCc) params.push(`to=${encodeMailParam(toWithCc)}`);
  if (!recipient && cc) params.push(`cc=${encodeMailParam(cc)}`);
  params.push(`subject=${encodeMailParam(subject || "")}`);
  params.push(`body=${encodeMailParam(bodyText || "")}`);
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?${params.join("&")}`;
  if (isPopupUsable(popup)) {
    popup.location.href = outlookUrl;
    return;
  }
  const opened = window.open(outlookUrl, "_blank", "noopener,noreferrer");
  if (!opened) window.alert("O navegador bloqueou a abertura do Outlook Web. Libere pop-ups para o ManuPeças e tente novamente.");
}

function cleanEmailText(value) {
  return String(value || "").normalize("NFC");
}

function encodeMailParam(value) {
  return encodeURIComponent(cleanEmailText(value));
}

function formatOutlookWebRecipients(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => userLoginToEmail(item.trim()))
    .filter(Boolean)
    .filter((email, index, list) => list.indexOf(email) === index)
    .join(",");
}

function buildEmailSubject(request, step) {
  return `[ManuPe\u00e7as ${request.id}] ${getRequestTargetLabel(request)} - ${step}`;
}

function openEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Solicita\u00e7\u00e3o");
  const targetLabel = getRequestTargetLabel(request);
  const bodyText = buildEmailBody("Solicitação de Peças", `Nova solicitação registrada para ${targetLabel.toLowerCase()}.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nSolicitante: ${request.requestedBy}\nManutentor: ${request.maintainer || "-"}\nAplicação: ${targetLabel}\nPrioridade: ${request.priority}` },
    { title: "Peças", content: formatEmailItems(request.items, (item) => item.quantity) },
    { title: "Motivo", content: request.reason },
  ]);

  openMailDraft({ step: "request", fallback: to || userLoginToEmail("jessica.lopes") }, subject, bodyText);
}

function openPartRegistrationEmailDraft(request) {
  const pendingItems = request.items.filter(isPendingRegistrationItem);
  if (pendingItems.length === 0) return;

  const subject = buildEmailSubject(request, "Cadastro de item");
  const targetLabel = getRequestTargetLabel(request);
  const bodyText = buildEmailBody("Solicitação de Cadastro de Item", `Existem itens sem cadastro SAP na solicitação ${request.id}. Cadastre no SAP e informe código e descrição final na aba Cadastro de Item para liberar o Almoxarifado.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nSolicitante: ${request.requestedBy}\nManutentor: ${request.maintainer || "-"}\nAplicação: ${targetLabel}\nPrioridade: ${request.priority}\nData: ${formatDate(request.createdAt)}` },
    { title: "Itens para Cadastro", content: formatEmailItems(pendingItems, (item) => item.quantity, (item) => [
      `CÓDIGO ORIGINAL: ${item.pendingOriginalCode || "-"}`,
      `FOTO: ${item.pendingPhotoName ? `${item.pendingPhotoName} - disponível no ManuPeças` : "Não anexada"}`,
      `STATUS: Aguardando cadastro SAP`,
    ]) },
    { title: "Solicitação completa", content: formatEmailItems(request.items, (item) => item.quantity, (item) => [
      isPendingRegistrationItem(item) ? "OBS.: item aguardando código SAP" : "",
    ]) },
    { title: "Motivo", content: request.reason },
  ]);

  openMailDraft({ step: "registration", fallback: `${userLoginToEmail("erik.barreto")}; ${userLoginToEmail("bruno.medici")}` }, subject, bodyText);
}

function openPartRegistrationCompletedEmailDraft(request, part, useExisting = false) {
  const subject = buildEmailSubject(request, "Cadastro SAP concluído");
  const bodyText = buildEmailBody("Cadastro SAP Concluído", `O cadastro de item da solicitação ${request.id} foi concluído e a solicitação está liberada para atendimento do Almoxarifado.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nSolicitante: ${request.requestedBy || "-"}\nManutentor: ${request.maintainer || "-"}\nAplicação: ${getRequestTargetLabel(request)}\nPrioridade: ${request.priority}` },
    { title: "Item cadastrado", content: formatEmailItems([part], () => 1, () => [
      `TIPO: ${useExisting ? "Cadastro já existente no SAP" : "Novo cadastro SAP"}`,
    ]) },
    { title: "Próxima etapa", content: "Atendimento do Almoxarifado." },
  ]);

  openMailDraft({ step: "registration", fallback: `${userLoginToEmail("jessica.lopes")}; ${userLoginToEmail("erik.barreto")}; ${userLoginToEmail("bruno.medici")}` }, subject, bodyText);
}

function openAlmoxEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Atendimento Almox");
  const bodyText = buildEmailBody("Relatório de Atendimento - Almoxarifado", `Segue retorno da solicitação ${request.id}, ${getRequestTargetLabel(request).toLowerCase()}.`, [
    { title: "Resumo da Solicitação", content: `Status: ${getRequestStatusText(request)}\nPrioridade: ${request.priority}\nSolicitante: ${request.requestedBy || "-"}\nManutentor: ${request.maintainer || "-"}` },
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

  openMailDraft({ step: "almox", fallback: to || userLoginToEmail(request.requestedByEmail || request.requestedBy) }, subject, bodyText);
}

function openCdEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Atendimento CD");
  const cdItems = request.items.filter((item) => getCdPendingQty(item) > 0 || Number(item.cdQty) > 0 || getPurchasePendingQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Atendimento - Centro de Distribuição", `Segue retorno do CD para a solicitação ${request.id}, ${getRequestTargetLabel(request).toLowerCase()}.`, [
    { title: "Resumo da Transferência", content: `Atendido por: ${request.cdBy || "CD"}\nNF de transferência: ${request.transferInvoiceName || "Não informada"}\nObservação: ${request.response || "Sem observação."}` },
    { title: "Itens", content: cdItems.length ? formatEmailItems(cdItems, (item) => Math.max(Number(item.cdQty) || 0, getCdPendingQty(item)), (item) => [
      `PENDENTE CD: ${getCdPendingQty(item)} UNIDADES`,
      `ATENDIDO CD: ${item.cdQty || 0} UNIDADES`,
      `COMPRA: ${getPurchasePendingQty(item)} UNIDADES`,
    ]) : "Nenhum item pendente para o CD." },
    { title: "Anexo", content: request.transferInvoiceName ? `Anexar a NF selecionada: ${request.transferInvoiceName}` : "Anexar a NF de transferência antes do envio final." },
  ]);

  openMailDraft({ step: "cd", fallback: to || userLoginToEmail(request.almoxByEmail || request.almoxBy || "jessica.lopes") }, subject, bodyText);
}

function openApprovalEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Aprova\u00e7\u00e3o de compra");
  const purchaseItems = request.items.filter((item) => getPurchaseBaseQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Aprovação de Compra", `Segue retorno da aprovação de compra da solicitação ${request.id}, ${getRequestTargetLabel(request).toLowerCase()}.`, [
    { title: "Resumo da Aprovação", content: `Aprovado por: ${request.purchaseApprovedBy || "Gerente"}\nData: ${formatDateOrDash(request.purchaseApprovedAt)}\nStatus atual: ${getRequestStatusText(request)}` },
    { title: "Itens", content: purchaseItems.length ? formatEmailItems(purchaseItems, (item) => getPurchaseBaseQty(item), (item) => [
      `STATUS: ${getItemPurchaseStatus(request, item)}`,
    ]) : "Nenhum item pendente de compra." },
    { title: "Observação", content: request.response || "Sem observação." },
  ]);

  openMailDraft({ step: "approval", fallback: to || `${userLoginToEmail("jessica.lopes")}; ${userLoginToEmail("marcio.ferreira")}` }, subject, bodyText);
}

function openPurchaseEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Compra");
  const pendingItems = request.items.filter((item) => getPurchasePendingQty(item) > 0);
  const bodyText = buildEmailBody("Relatório de Compra", `Segue registro de compra para a solicitação ${request.id}, ${getRequestTargetLabel(request).toLowerCase()}.`, [
    { title: "Dados da Compra", content: `Solicitação: ${request.id}\nSolicitação SAP: ${request.sapRequestNumber || "-"}\nPedido de compra: ${request.purchaseOrder || "-"}\nPrevisão de entrega: ${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "Pendente"}\nObservação de Compras: ${request.buyerNote || "-"}\nStatus: ${getRequestStatusText(request)}` },
    { title: "Itens", content: pendingItems.length ? formatEmailItems(pendingItems, (item) => getPurchasePendingQty(item), () => [
      `SOLICITAÇÃO SAP: ${request.sapRequestNumber || "-"}`,
      `PEDIDO DE COMPRA: ${request.purchaseOrder || "-"}`,
      `PREVISÃO DE ENTREGA: ${request.deliveryDate ? formatDateOnly(request.deliveryDate) : "Pendente"}`,
    ]) : "Nenhum item pendente de compra." },
  ]);

  openMailDraft({ step: "purchase", fallback: to || `${userLoginToEmail("jessica.lopes")}; ${userLoginToEmail(request.requestedByEmail || request.requestedBy)}` }, subject, bodyText);
}

function openPurchaseArrivalEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Chegada de compra");
  const arrivedItems = request.items.filter((item) => item.purchaseApproval === "approved" && (getPurchasePendingQty(item) > 0 || Number(item.purchaseReceivedQty) > 0));
  const bodyText = buildEmailBody("Chegada de Item Comprado", `O Almoxarifado informou a chegada de item comprado da solicitação ${request.id}.`, [
    { title: "Dados da Compra", content: `Solicitação: ${request.id}\nSolicitação SAP: ${request.sapRequestNumber || "-"}\nPedido de compra: ${request.purchaseOrder || "-"}\nData de chegada: ${request.purchaseArrivedDate ? formatDateOnly(request.purchaseArrivedDate) : formatDateOrDash(request.purchaseArrivedAt)}\nInformado por: ${request.purchaseArrivedBy || "Almoxarifado"}\nStatus: Pendente entrada e recebimento no SAP` },
    { title: "Itens", content: arrivedItems.length ? formatEmailItems(arrivedItems, (item) => getPurchasePendingQty(item) || item.purchaseReceivedQty || item.purchaseQty, () => [
      `PEDIDO DE COMPRA: ${request.purchaseOrder || "-"}`,
      "STATUS: Pendente entrada e recebimento no SAP",
    ]) : "Nenhum item comprado pendente de recebimento." },
  ]);

  openMailDraft({ step: "receipt", fallback: to || `${userLoginToEmail(request.requestedByEmail || request.requestedBy)}; ${userLoginToEmail("rodrigo.araujo")}` }, subject, bodyText);
}

function openReceiptEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Disponível para retirada");
  const receiptItems = request.items.filter((item) => Number(item.availableQty) > 0 && (Number(item.cdReceivedQty) > 0 || Number(item.purchaseReceivedQty) > 0));
  const bodyText = buildEmailBody("Peça Disponível para Retirada", `O Almoxarifado confirmou entrada SAP/recebimento da solicitação ${request.id}. Os itens abaixo estão disponíveis para retirada do PCM.`, [
    { title: "Dados do Recebimento", content: `Solicitação: ${request.id}\nEntrada SAP: ${request.receiptNumber || "-"}\nData de chegada/recebimento: ${request.purchaseArrivedDate ? formatDateOnly(request.purchaseArrivedDate) : "-"}\nRecebido por: ${request.receiptBy || "Almoxarifado"}\nNF fornecedor: ${request.receiptInvoiceName || "-"}\nNF transferência CD: ${request.transferInvoiceName || "-"}` },
    { title: "Itens disponíveis", content: receiptItems.length ? formatEmailItems(receiptItems, (item) => Number(item.availableQty) || 0, (item) => [
      `ATENDIDO ALMOX: ${getAlmoxServedQty(item)} UNIDADES`,
      `RECEBIDO CD: ${item.cdReceivedQty || 0} UNIDADES`,
      `RECEBIDO COMPRA: ${item.purchaseReceivedQty || 0} UNIDADES`,
      "STATUS: Disponível para retirada do PCM",
    ]) : "Nenhum item disponível para retirada." },
  ]);

  openMailDraft({ step: "pickup", fallback: to || userLoginToEmail(request.requestedByEmail || request.requestedBy) }, subject, bodyText);
}

function openCancellationRequestEmailDraft(request, to) {
  const subject = buildEmailSubject(request, "Cancelamento");
  const requestedByEmail = userLoginToEmail(request.cancellationRequestedByEmail || request.requestedByEmail || request.requestedBy);
  const bodyText = buildEmailBody("Solicitação de Cancelamento", `Foi solicitado o cancelamento da solicitação ${request.id}. Favor avaliar e aprovar ou recusar no ManuPeças.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nAplicação: ${getRequestTargetLabel(request)}\nPrioridade: ${request.priority}\nSolicitante: ${request.requestedBy || "-"}\nManutentor: ${request.maintainer || "-"}\nStatus anterior: ${statusText[request.cancellationPreviousStatus] || request.cancellationPreviousStatus || "-"}` },
    { title: "Cancelamento", content: `Solicitado por: ${request.cancellationRequestedBy || "-"}\nData: ${formatDateOrDash(request.cancellationRequestedAt)}\nMotivo: ${request.cancellationReason || "Sem motivo informado."}` },
    { title: "Peças", content: formatEmailItems(request.items, (item) => item.quantity) },
  ]);

  const fallback = [
    userLoginToEmail("erik.barreto"),
    userLoginToEmail("bruno.medici"),
    userLoginToEmail("caio.silveira"),
    requestedByEmail,
  ].filter(Boolean).join("; ");
  openMailDraft({ step: "cancellation", fallback: to || fallback }, subject, bodyText);
}

function openCancellationDecisionEmailDraft(request, approved, to) {
  const subject = buildEmailSubject(request, approved ? "Cancelamento aprovado" : "Cancelamento recusado");
  const requestedByEmail = userLoginToEmail(request.cancellationRequestedByEmail || request.requestedByEmail || request.requestedBy);
  const decisionUser = approved ? request.cancellationApprovedBy : request.cancellationRejectedBy;
  const decisionDate = approved ? request.cancellationApprovedAt : request.cancellationRejectedAt;
  const bodyText = buildEmailBody(approved ? "Cancelamento Aprovado" : "Cancelamento Recusado", approved
    ? `O cancelamento da solicitação ${request.id} foi aprovado.`
    : `O cancelamento da solicitação ${request.id} foi recusado. A solicitação voltou para a etapa correta do fluxo.`, [
    { title: "Dados da Solicitação", content: `Solicitação: ${request.id}\nAplicação: ${getRequestTargetLabel(request)}\nPrioridade: ${request.priority}\nSolicitante: ${request.requestedBy || "-"}\nManutentor: ${request.maintainer || "-"}\nStatus atual: ${getRequestStatusText(request)}` },
    { title: "Decisão", content: `Decisão: ${approved ? "Cancelamento aprovado" : "Cancelamento recusado"}\nResponsável: ${decisionUser || "Admin"}\nData: ${formatDateOrDash(decisionDate)}\nMotivo solicitado: ${request.cancellationReason || "Sem motivo informado."}` },
    { title: "Peças", content: formatEmailItems(request.items, (item) => item.quantity) },
  ]);
  const fallback = [
    requestedByEmail,
    userLoginToEmail("erik.barreto"),
    userLoginToEmail("bruno.medici"),
    userLoginToEmail("caio.silveira"),
  ].filter(Boolean).join("; ");
  openMailDraft({ step: "cancellation", fallback: to || fallback }, subject, bodyText);
}

function createProcessMap(request) {
  const registrationInfo = getRegistrationStepInfo(request);
  const displayStatus = getDisplayStatus(request);
  const isCanceled = displayStatus === "cancelado" || request.status === "cancelado" || Boolean(request.cancellationApprovedAt);
  const steps = [
    { key: "solicitacao", label: "Solicitação", date: request.createdAt, done: Boolean(request.createdAt), active: false, requested: true },
    { key: "cadastro", label: "Cadastro SAP", date: registrationInfo.date, done: registrationInfo.done, active: !isCanceled && request.status === "cadastro", requested: registrationInfo.requested },
    { key: "atendimento", label: "Almoxarifado", date: request.attendedAt, done: Boolean(request.attendedAt), active: !isCanceled && request.status === "solicitacao", requested: true },
    { key: "cd", label: "CD", date: request.cdAt, done: Boolean(request.cdAt), active: !isCanceled && request.status === "cd", requested: Boolean(request.cdAt) || request.status === "cd" || request.items.some((item) => getCdPendingQty(item) > 0 || Number(item.cdQty) > 0) },
    { key: "aprovacao", label: "Aprovação", date: request.purchaseApprovedAt, done: Boolean(request.purchaseApprovedAt) || request.status === "reprovado", active: !isCanceled && hasPurchaseApprovalPending(request), requested: Boolean(request.purchaseApprovalRequestedAt || request.purchaseApprovedAt) || hasPurchaseApprovalPending(request) },
    { key: "compra", label: "Compra", date: request.purchaseAt, done: Boolean(hasPurchaseReceipt(request)), active: !isCanceled && (displayStatus === "compra" || (displayStatus === "recebimento" && isPurchaseArrivalRegistered(request))), requested: Boolean(request.purchaseAt || request.purchaseOrder || request.sapRequestNumber) || hasApprovedPurchasePending(request) },
    { key: "recebimento", label: "Recebimento", date: request.receiptAt, done: Boolean(request.receiptAt), active: !isCanceled && displayStatus === "recebimento", requested: Boolean(request.receiptAt) || displayStatus === "recebimento" },
    { key: "retirado", label: "Retirada", date: request.withdrawnAt, done: request.status === "retirado", active: !isCanceled && hasPickupPending(request), requested: Boolean(request.withdrawnAt) || hasPickupPending(request) },
    { key: "cancelamento", label: "Cancelamento", date: request.cancellationApprovedAt || request.cancellationRejectedAt || request.cancellationRequestedAt, done: request.status === "cancelado" || Boolean(request.cancellationRejectedAt), active: !isCanceled && displayStatus === "cancelamento", requested: Boolean(request.cancellationRequestedAt) || request.status === "cancelamento" || request.status === "cancelado" },
  ];
  return steps
    .map((step) => {
      const active = step.active;
      const notRequested = !step.requested;
      const done = step.done && !notRequested;
      const meta = step.date ? `${formatDate(step.date)} | ${formatDuration(request.createdAt, step.date)}` : step.requested ? "Aguardando" : "Não solicitado";
      return `<div class="process-step ${active ? "active" : ""} ${done ? "done" : ""} ${notRequested ? "not-requested" : ""}"><strong>${step.label}</strong><span>${meta}</span></div>`;
    })
    .join("");
}

function getRegistrationStepInfo(request) {
  const linked = partRegistrations.filter((item) => item.linkedRequestId === request.id);
  const hasPendingItem = request.items.some(isPendingRegistrationItem);
  const doneRegistration = linked.find((item) => item.status === "done" && item.completedAt);
  return {
    requested: hasPendingItem || linked.length > 0,
    done: !hasPendingItem && linked.some((item) => item.status === "done"),
    date: doneRegistration?.completedAt || "",
  };
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






