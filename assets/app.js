const DATA_FIELDS = [
  "STT",
  "Họ và Tên",
  "Số CCCD/Passport",
  "Ngày cấp CCCD",
  "Nơi cấp",
  "Địa chỉ thường trú",
  "Địa chỉ liên hệ",
  "SĐT",
  "Số GPLX",
  "Ngày cấp GPLX",
  "Nơi cấp GPLX",
  "Xe cho thuê",
  "Biến số xe",
  "Năm SX",
  "Màu xe",
  "Giấy ĐKX",
  "Ngày cấp GĐKX",
  "Tên chủ xe",
  "Đơn Giá thuê",
  "Ngày bắt đầu",
  "Ngày kết thúc",
  "Tổng giá thuê",
  "Số hợp đồng",
  "Tổng giá thuê APP",
  "Tài sản thế chấp",
  "Tiền cọc (50%)",
  "Ưu đãi",
  "Trạng thái cọc"
];

const FLEET_STORAGE_KEY = "kbaRentalFleet";
const BOOKINGS_STORAGE_KEY = "kbaRentalBookings";
const ADMIN_SESSION_KEY = "kbaSuperAdminSession";
const CUSTOMERS_KEY = "kbaCustomers";
const CUSTOMER_SESSION_KEY = "kbaCustomerSession";
const LOYALTY_TARGET = 10; // đủ 10 chuyến tặng 1 ngày thuê
const DEFAULT_CAR_IMAGE = "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80";

/* ---- Image library (naming convention) ----
   Đặt file ảnh vào assets/cars/ với tên = mã xe (code).
   Hỗ trợ .jpg / .jpeg / .png / .webp. Ảnh trong thư mục được ưu tiên hơn imageUrl mặc định. */
const CAR_IMAGE_DIR = "assets/cars/";
const CAR_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

function imageCandidates(car) {
  const list = [];
  if (car.imageData) list.push(car.imageData); // ảnh admin tải lên (data URL) — ưu tiên cao nhất
  if (car.code) {
    const base = CAR_IMAGE_DIR + encodeURIComponent(car.code);
    CAR_IMAGE_EXTS.forEach((ext) => list.push(`${base}.${ext}`));
  }
  if (car.imageUrl && !car.imageUrl.startsWith("data:")) list.push(car.imageUrl);
  list.push(DEFAULT_CAR_IMAGE);
  return list;
}

// Trả về URL đầu tiên có thể dùng (đồng bộ, để render list admin/preview đơn giản).
function primaryImage(car) {
  return imageCandidates(car)[0];
}

// Markup <img> tự thử lần lượt các ứng viên khi lỗi tải (fallback chain).
function carImgMarkup(car, altExtra = "") {
  const [first, ...rest] = imageCandidates(car);
  const alt = `${car.name || "Xe"}${altExtra}`.replace(/"/g, "&quot;");
  return `<img src="${first}" alt="${alt}" loading="lazy"
    data-fallbacks="${rest.join("|").replace(/"/g, "&quot;")}"
    onerror="carImgError(this)">`;
}

window.carImgError = function (img) {
  const list = (img.dataset.fallbacks || "").split("|").filter(Boolean);
  if (!list.length) { img.onerror = null; return; }
  const next = list.shift();
  img.dataset.fallbacks = list.join("|");
  img.src = next;
};

/* ---- Trạng thái xe ----
   "available"  : còn sẵn, chọn được.
   "maintenance": còn trong kho nhưng bị khóa chọn (bảo dưỡng...), hiển thị mờ. */
function carStatus(car) {
  if (car.status === "maintenance" || car.available === false) return "maintenance";
  return "available";
}

const state = {
  baseCars: [],
  cars: [],
  selectedCar: null,
  filterType: "all",
  filterSeats: "all",
  isAdmin: sessionStorage.getItem(ADMIN_SESSION_KEY) === "1"
};

const els = {
  vehicleGrid: document.querySelector("#vehicleGrid"),
  vehicleCount: document.querySelector("#vehicleCount"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  availableOnly: document.querySelector("#availableOnly"),
  priceRange: document.querySelector("#priceRange"),
  priceLabel: document.querySelector("#priceLabel"),
  filterStartDate: document.querySelector("#filterStartDate"),
  filterEndDate: document.querySelector("#filterEndDate"),
  resetFilters: document.querySelector("#resetFilters"),
  avgPrice: document.querySelector("#avgPrice"),
  todayLabel: document.querySelector("#todayLabel"),
  bookingTitle: document.querySelector("#bookingTitle"),
  bookingSub: document.querySelector("#bookingSub"),
  selectedCarPreview: document.querySelector("#selectedCarPreview"),
  startDate: document.querySelector("#startDate"),
  startTime: document.querySelector("#startTime"),
  endDate: document.querySelector("#endDate"),
  endTime: document.querySelector("#endTime"),
  depositModal: document.querySelector("#depositModal"),
  depositClose: document.querySelector("#depositClose"),
  depositOffer: document.querySelector("#depositOffer"),
  depositQr: document.querySelector("#depositQr"),
  depositAmount: document.querySelector("#depositAmount"),
  depositAmountQr: document.querySelector("#depositAmountQr"),
  depositAccept: document.querySelector("#depositAccept"),
  depositLater: document.querySelector("#depositLater"),
  qrImage: document.querySelector("#qrImage"),
  qrPlaceholder: document.querySelector("#qrPlaceholder"),
  qrRef: document.querySelector("#qrRef"),
  qrDone: document.querySelector("#qrDone"),
  accountNav: document.querySelector("#accountNav"),
  accountModal: document.querySelector("#accountModal"),
  accountClose: document.querySelector("#accountClose"),
  authView: document.querySelector("#authView"),
  profileView: document.querySelector("#profileView"),
  tabLogin: document.querySelector("#tabLogin"),
  tabRegister: document.querySelector("#tabRegister"),
  customerLoginForm: document.querySelector("#customerLoginForm"),
  customerRegisterForm: document.querySelector("#customerRegisterForm"),
  loginPhone: document.querySelector("#loginPhone"),
  loginPass: document.querySelector("#loginPass"),
  regName: document.querySelector("#regName"),
  regPhone: document.querySelector("#regPhone"),
  regEmail: document.querySelector("#regEmail"),
  regPass: document.querySelector("#regPass"),
  authMessage: document.querySelector("#authMessage"),
  forgotPass: document.querySelector("#forgotPass"),
  resetView: document.querySelector("#resetView"),
  resetRequestForm: document.querySelector("#resetRequestForm"),
  resetConfirmForm: document.querySelector("#resetConfirmForm"),
  resetPhone: document.querySelector("#resetPhone"),
  resetCode: document.querySelector("#resetCode"),
  resetNewPass: document.querySelector("#resetNewPass"),
  resetMessage: document.querySelector("#resetMessage"),
  backToLogin: document.querySelector("#backToLogin"),
  detailPrintBtn: document.querySelector("#detailPrintBtn"),
  profileName: document.querySelector("#profileName"),
  profilePhone: document.querySelector("#profilePhone"),
  tripCount: document.querySelector("#tripCount"),
  loyaltyFill: document.querySelector("#loyaltyFill"),
  loyaltyNote: document.querySelector("#loyaltyNote"),
  customerLogout: document.querySelector("#customerLogout"),
  bookingsSection: document.querySelector("#bookingsSection"),
  bookingsTitle: document.querySelector("#bookingsTitle"),
  bookingsCount: document.querySelector("#bookingsCount"),
  bookingsList: document.querySelector("#bookingsList"),
  bookingDetailModal: document.querySelector("#bookingDetailModal"),
  bookingDetailClose: document.querySelector("#bookingDetailClose"),
  bookingDetailTitle: document.querySelector("#bookingDetailTitle"),
  bookingDetailBody: document.querySelector("#bookingDetailBody"),
  totalPrice: document.querySelector("#totalPrice"),
  priceNote: document.querySelector("#priceNote"),
  acceptPrice: document.querySelector("#acceptPrice"),
  customerForm: document.querySelector("#customer-form"),
  formMessage: document.querySelector("#formMessage"),
  openBookingButton: document.querySelector("#openBookingButton"),
  loginNav: document.querySelector("#loginNav"),
  manageNav: document.querySelector("#manageNav"),
  loginModal: document.querySelector("#loginModal"),
  loginModalClose: document.querySelector("#loginModalClose"),
  adminPanel: document.querySelector("#admin"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminId: document.querySelector("#adminId"),
  adminPassword: document.querySelector("#adminPassword"),
  adminGmail: document.querySelector("#adminGmail"),
  adminLoginMessage: document.querySelector("#adminLoginMessage"),
  adminLogout: document.querySelector("#adminLogout"),
  vehicleAdminForm: document.querySelector("#vehicleAdminForm"),
  adminCarCode: document.querySelector("#adminCarCode"),
  adminCarName: document.querySelector("#adminCarName"),
  adminCarYear: document.querySelector("#adminCarYear"),
  adminCarColor: document.querySelector("#adminCarColor"),
  adminCarRate: document.querySelector("#adminCarRate"),
  adminCarSeats: document.querySelector("#adminCarSeats"),
  adminCarFuel: document.querySelector("#adminCarFuel"),
  adminCarImage: document.querySelector("#adminCarImage"),
  adminCarImageFile: document.querySelector("#adminCarImageFile"),
  adminImgPreview: document.querySelector("#adminImgPreview"),
  adminCarImages: document.querySelector("#adminCarImages"),
  adminCarStatus: document.querySelector("#adminCarStatus"),
  adminCarStatusNote: document.querySelector("#adminCarStatusNote"),
  adminCarRanges: document.querySelector("#adminCarRanges"),
  clearAdminForm: document.querySelector("#clearAdminForm"),
  adminCarList: document.querySelector("#adminCarList")
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return money.format(Number(value || 0));
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function dateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function diffDays(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const days = Math.ceil((endDate - startDate) / 86400000);
  return Math.max(days, 1);
}

/* ---- Thuê theo ngày + giờ ----
   Quy tắc: tối thiểu 1 ngày. Giờ phát sinh vượt ngày tròn:
   - dưới 6 giờ  → tính phí nửa ngày
   - từ 6 giờ trở lên → tính phí 1 ngày */
function bookingStartMs() {
  if (!els.startDate.value) return NaN;
  return new Date(`${els.startDate.value}T${els.startTime.value || "00:00"}`).getTime();
}

function bookingEndMs() {
  if (!els.endDate.value) return NaN;
  return new Date(`${els.endDate.value}T${els.endTime.value || "00:00"}`).getTime();
}

function bookingDuration() {
  const start = bookingStartMs();
  const end = bookingEndMs();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const totalHours = (end - start) / 3600000;
  const fullDays = Math.floor(totalHours / 24);
  const remHours = Math.round((totalHours - fullDays * 24) * 100) / 100;
  let extra = 0; // 0 | 0.5 | 1 ngày phát sinh
  if (remHours > 0.01) extra = remHours < 6 ? 0.5 : 1;
  let billedDays = fullDays + extra;
  if (billedDays < 1) billedDays = 1; // tối thiểu 1 ngày
  return { fullDays, remHours, extra, billedDays, totalHours };
}

// Mặc định: kết thúc vào cùng giờ của ngày kế tiếp
function syncDefaultEnd() {
  if (!els.startDate.value) return;
  els.endDate.value = addDays(els.startDate.value, 1);
  els.endTime.value = els.startTime.value || "08:00";
}

function rangesOverlap(start, end, bookedStart, bookedEnd) {
  if (!start || !end || !bookedStart || !bookedEnd) return false;
  return dateOnly(start) <= dateOnly(bookedEnd) && dateOnly(end) >= dateOnly(bookedStart);
}

function readFleetStore() {
  try {
    return JSON.parse(localStorage.getItem(FLEET_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeFleetStore(data) {
  localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(data));
}

function savedBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function bookingRangesForCar(car) {
  const localRanges = savedBookings()
    .filter((booking) => booking["Xe cho thuê"] === car.name || booking.carCode === car.code)
    .map((booking) => ({
      start: booking["Ngày bắt đầu"] || booking.startDate,
      end: booking["Ngày kết thúc"] || booking.endDate
    }));
  return [...(car.bookedRanges || []), ...localRanges];
}

function isCarBookedInFilter(car) {
  const start = els.filterStartDate.value;
  const end = els.filterEndDate.value;
  return bookingRangesForCar(car).some((range) => rangesOverlap(start, end, range.start, range.end));
}

function isCarSelectable(car) {
  return Boolean(carStatus(car) === "available" && !isCarBookedInFilter(car));
}

function calcBooking() {
  if (!state.selectedCar) return { total: 0 };
  const duration = bookingDuration();
  if (!duration) return { total: 0 };
  const rate = Number(state.selectedCar.dailyRate || 0);
  const total = Math.round(duration.billedDays * rate);
  return { ...duration, total, rate };
}

function billingNote(calc) {
  if (!calc || !calc.total) return "";
  const { fullDays, remHours, extra, billedDays, rate } = calc;
  if (billedDays === 1 && fullDays <= 1 && !extra) return `1 ngày x ${formatMoney(rate)}`;
  const parts = [];
  if (fullDays > 0) parts.push(`${fullDays} ngày`);
  if (extra === 0.5) parts.push(`nửa ngày (phát sinh ${Math.round(remHours)}h < 6h)`);
  if (extra === 1) parts.push(`1 ngày (phát sinh ${Math.round(remHours)}h ≥ 6h)`);
  if (!parts.length) parts.push("1 ngày (tối thiểu)");
  return `${parts.join(" + ")} = ${billedDays} ngày x ${formatMoney(rate)}`;
}

function applyFleetStore() {
  const store = readFleetStore();
  const deletedCodes = new Set(store.deletedCodes || []);
  const customCars = store.customCars || [];
  const customByCode = new Map(customCars.map((car) => [car.code, car]));
  const merged = state.baseCars
    .filter((car) => !deletedCodes.has(car.code))
    .map((car) => ({ ...car, ...customByCode.get(car.code) }));
  const newCars = customCars.filter((car) => !state.baseCars.some((base) => base.code === car.code));
  state.cars = [...merged, ...newCars].filter((car) => !deletedCodes.has(car.code));
}

function persistCar(car) {
  const store = readFleetStore();
  const customCars = store.customCars || [];
  const index = customCars.findIndex((item) => item.code === car.code);
  if (index >= 0) {
    customCars[index] = car;
  } else {
    customCars.push(car);
  }
  writeFleetStore({ ...store, customCars });
}

function deleteCar(code) {
  const store = readFleetStore();
  const deletedCodes = new Set(store.deletedCodes || []);
  deletedCodes.add(code);
  const customCars = (store.customCars || []).filter((car) => car.code !== code);
  writeFleetStore({ ...store, deletedCodes: [...deletedCodes], customCars });
  if (state.selectedCar?.code === code) state.selectedCar = null;
  applyFleetStore();
  refreshAfterFleetChange();
}

function buildFilterOptions() { /* Bộ lọc năm SX & màu xe đã được gỡ theo yêu cầu */ }

function renderTimeline() { /* Đã gỡ khung timeline theo yêu cầu */ }

function getFilteredCars() {
  const term = normalize(els.searchInput.value);
  const maxPrice = Number(els.priceRange.value);

  return state.cars.filter((car) => {
    const matchesTerm = !term || normalize(`${car.name} ${car.year} ${car.color}`).includes(term);
    const matchesType = state.filterType === "all" || car.fuelType === state.filterType;
    const matchesAvailability = !els.availableOnly.checked || isCarSelectable(car);
    const matchesPrice = Number(car.dailyRate || 0) <= maxPrice;
    const matchesSeats = state.filterSeats === "all"
      || (state.filterSeats === "7" ? Number(car.seats) >= 7 : Number(car.seats) === Number(state.filterSeats));
    return matchesTerm && matchesType && matchesAvailability && matchesPrice && matchesSeats;
  });
}

function renderCars() {
  const cars = getFilteredCars();
  els.vehicleCount.textContent = cars.length;
  els.emptyState.hidden = cars.length !== 0;

  els.vehicleGrid.innerHTML = cars.map((car) => {
    const selected = state.selectedCar?.code === car.code;
    const booked = isCarBookedInFilter(car);
    const selectable = isCarSelectable(car);
    const status = carStatus(car);
    const maintNote = car.statusNote || "Đang bảo dưỡng";

    let cornerBadge = "";
    if (booked) {
      cornerBadge = `<span class="status-badge booked">● Đã có khách thuê</span>`;
    } else if (status === "maintenance") {
      cornerBadge = `<span class="status-badge maintenance">● ${maintNote}</span>`;
    }

    let statusTag = `<span class="tag-good">Còn sẵn</span>`;
    if (booked) statusTag = `<span class="tag-danger">Đã thuê</span>`;
    else if (status === "maintenance") statusTag = `<span class="tag-warn">Bảo dưỡng</span>`;

    let btnLabel = selected ? "Hủy chọn" : "Chọn xe";
    if (!selectable) btnLabel = booked ? "Đã thuê" : "Tạm khóa";

    return `
      <article class="vehicle-card ${selected ? "selected" : ""} ${!selectable ? "is-unavailable" : ""}">
        <div class="vehicle-media" data-car-code="${car.code}" role="button" tabindex="0" aria-label="Phóng to ảnh ${car.name}">
          ${cornerBadge}
          ${carImgMarkup(car)}
          ${galleryCount(car) > 1 ? `<span class="multi-dot">◧ ${galleryCount(car)} ảnh</span>` : ""}
          <span class="zoom-hint">⤢ Phóng to</span>
        </div>
        <div class="vehicle-meta">
          <div class="mini-row">
            <span>${car.seats} chỗ</span>
            <span class="rating">★ ${car.rating || "4.8"}</span>
          </div>
          <h3>${car.name}</h3>
          <p>${car.year} · ${car.color || "Đang cập nhật"}</p>
          <div class="vehicle-tags">
            <span>${car.fuelType === "electric" ? "Xe điện" : "Xăng"}</span>
            ${statusTag}
          </div>
          <div class="vehicle-foot">
            <div><strong>${formatMoney(car.dailyRate)}</strong><small> / ngày</small></div>
            <button type="button" data-select-car="${car.code}" ${!selectable ? "disabled" : ""}>
              ${btnLabel}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderBooking() {
  const car = state.selectedCar;
  if (!car) {
    els.bookingTitle.textContent = "Chọn một xe";
    els.bookingSub.textContent = "";
    els.selectedCarPreview.hidden = true;
  } else {
    els.bookingTitle.textContent = car.name;
    els.bookingSub.textContent = `${car.year} · ${car.color || "Đang cập nhật"} · ${formatMoney(car.dailyRate)} / ngày`;
    els.selectedCarPreview.hidden = false;
    els.selectedCarPreview.innerHTML = `
      <strong>${car.name}</strong>
      <span>${car.year} · ${car.color || "Đang cập nhật"}</span>
      <span>${formatMoney(car.dailyRate)} / ngày</span>
    `;
  }

  const calc = calcBooking();
  const total = calc.total;
  els.totalPrice.textContent = formatMoney(total);
  els.priceNote.textContent = (car && total)
    ? billingNote(calc)
    : "Chọn xe và thời gian thuê để xem giá.";

  const canShowForm = Boolean(car && total && els.acceptPrice.checked);
  els.customerForm.hidden = !canShowForm;
  if (!els.customerForm.hidden) prefillCustomerForm();
}

function renderAdminState() {
  els.adminPanel.hidden = !state.isAdmin;
  els.loginNav.hidden = state.isAdmin;
  els.manageNav.hidden = !state.isAdmin;
  if (state.isAdmin) renderAdminCarList();
  renderBookingsList();
}

function openLoginModal() {
  els.loginModal.hidden = false;
  setTimeout(() => els.adminId && els.adminId.focus(), 50);
}
function closeLoginModal() {
  els.loginModal.hidden = true;
  els.adminLoginMessage.textContent = "";
  els.adminLoginMessage.className = "form-message";
}
function galleryCount(car) {
  return 1 + ((car.images && car.images.length) || 0);
}

function renderAdminCarList() {
  els.adminCarList.innerHTML = state.cars.map((car) => {
    const maint = carStatus(car) === "maintenance";
    const pill = maint
      ? `<span class="admin-car-status maint">● ${car.statusNote || "Bảo dưỡng"}</span>`
      : `<span class="admin-car-status ok">● Còn sẵn</span>`;
    return `
    <article class="admin-car-row">
      ${carImgMarkup(car)}
      <div class="admin-car-info">
        <strong>${car.name}</strong>
        <span>${car.code} · ${car.year} · ${car.color || "Đang cập nhật"} · ${formatMoney(car.dailyRate)}/ngày</span>
        ${pill}
      </div>
      <div class="admin-car-actions">
        <button type="button" data-edit-car="${car.code}">Sửa</button>
        <button type="button" data-delete-car="${car.code}">Xóa</button>
      </div>
    </article>
  `;
  }).join("");
}

function refreshAfterFleetChange() {
  buildFilterOptions();
  renderTimeline();
  renderCars();
  renderBooking();
  renderAdminState();
}

function clearAdminForm() {
  els.vehicleAdminForm.reset();
  els.adminCarCode.value = "";
  els.adminCarCode.readOnly = false;
  els.adminCarStatus.value = "available";
  if (els.adminCarImages) els.adminCarImages.value = "";
  els.adminImgPreview.hidden = true;
  els.adminImgPreview.removeAttribute("src");
  delete els.vehicleAdminForm.dataset.editingCode;
}

function parseBookedRanges(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [start, end] = item.split(":").map((part) => part.trim());
      return { start, end: end || start };
    })
    .filter((range) => range.start);
}

function bookedRangesText(car) {
  return (car.bookedRanges || []).map((range) => `${range.start}:${range.end}`).join(", ");
}

function fillAdminForm(car) {
  els.adminCarCode.value = car.code;
  els.adminCarCode.readOnly = true; // không đổi mã khi sửa (giữ liên kết ảnh)
  els.vehicleAdminForm.dataset.editingCode = car.code;
  els.adminCarName.value = car.name || "";
  els.adminCarYear.value = car.year || "";
  els.adminCarColor.value = car.color || "";
  els.adminCarRate.value = car.dailyRate || "";
  els.adminCarSeats.value = car.seats || 5;
  els.adminCarFuel.value = car.fuelType || "gasoline";
  els.adminCarImage.value = car.imageUrl?.startsWith("data:") ? "" : car.imageUrl || "";
  els.adminCarStatus.value = carStatus(car);
  els.adminCarStatusNote.value = car.statusNote || "";
  if (els.adminCarImages) els.adminCarImages.value = (car.images || []).join("\n");
  els.adminCarRanges.value = bookedRangesText(car);
  els.adminImgPreview.src = primaryImage(car);
  els.adminImgPreview.hidden = false;
  els.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function syncBookingDatesFromFilter() {
  els.startDate.value = els.filterStartDate.value;
  els.endDate.value = els.filterEndDate.value;
}

function syncFilterDatesFromBooking() {
  els.filterStartDate.value = els.startDate.value;
  els.filterEndDate.value = els.endDate.value;
}

function normalizeDateRange(source) {
  const startEl = source === "booking" ? els.startDate : els.filterStartDate;
  const endEl = source === "booking" ? els.endDate : els.filterEndDate;
  if (startEl.value && endEl.value && endEl.value < startEl.value) endEl.value = startEl.value;
  endEl.min = startEl.value || todayIso();
}

function handleDateChange(source) {
  normalizeDateRange(source);
  if (source === "filter") {
    syncBookingDatesFromFilter();
  } else {
    syncFilterDatesFromBooking();
  }
  if (state.selectedCar && !isCarSelectable(state.selectedCar)) {
    state.selectedCar = null;
    els.acceptPrice.checked = false;
  }
  renderTimeline();
  renderCars();
  renderBooking();
}

function selectCar(code) {
  const car = state.cars.find((item) => item.code === code);
  if (!car || !isCarSelectable(car)) return;

  if (state.selectedCar?.code === code) {
    state.selectedCar = null;
  } else {
    state.selectedCar = car;
    document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  els.acceptPrice.checked = false;
  renderCars();
  renderBooking();
}

function resetFilters() {
  els.searchInput.value = "";
  els.availableOnly.checked = true;
  els.priceRange.value = els.priceRange.max;
  els.filterStartDate.value = todayIso();
  els.filterEndDate.value = addDays(todayIso(), 1);
  syncBookingDatesFromFilter();
  els.startTime.value = els.startTime.value || "08:00";
  syncDefaultEnd();
  state.filterType = "all";
  state.filterSeats = "all";
  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filterType === "all");
  });
  document.querySelectorAll("[data-filter-seats]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filterSeats === "all");
  });
  updatePriceLabel();
  renderTimeline();
  renderCars();
  renderBooking();
}

function updatePriceLabel() {
  els.priceLabel.textContent = formatMoney(els.priceRange.value);
}

function buildPayload(formData) {
  const car = state.selectedCar;
  const { total } = calcBooking();
  const contractNo = formData.get("Số hợp đồng") || `HD-${Date.now().toString().slice(-8)}`;
  const startAt = `${els.startDate.value} ${els.startTime.value || "00:00"}`;
  const endAt = `${els.endDate.value} ${els.endTime.value || "00:00"}`;
  const raw = {
    "STT": "",
    "Họ và Tên": formData.get("Họ và Tên"),
    "Số CCCD/Passport": formData.get("Số CCCD/Passport"),
    "Ngày cấp CCCD": formData.get("Ngày cấp CCCD"),
    "Nơi cấp": formData.get("Nơi cấp"),
    "Địa chỉ thường trú": formData.get("Địa chỉ thường trú"),
    "Địa chỉ liên hệ": formData.get("Địa chỉ liên hệ"),
    "SĐT": formData.get("SĐT"),
    "Số GPLX": formData.get("Số GPLX"),
    "Ngày cấp GPLX": formData.get("Ngày cấp GPLX"),
    "Nơi cấp GPLX": formData.get("Nơi cấp GPLX"),
    "Xe cho thuê": car.name,
    "Biến số xe": car.plate || "",
    "Năm SX": car.year,
    "Màu xe": car.color,
    "Giấy ĐKX": car.registrationNumber || "",
    "Ngày cấp GĐKX": car.registrationDate || "",
    "Tên chủ xe": car.owner || "",
    "Đơn Giá thuê": car.dailyRate,
    "Ngày bắt đầu": startAt,
    "Ngày kết thúc": endAt,
    "Tổng giá thuê": total,
    "Số hợp đồng": contractNo,
    "Tổng giá thuê APP": total,
    "Tài sản thế chấp": formData.get("Tài sản thế chấp") || "",
    "Tiền cọc (50%)": Math.round(total / 2)
  };

  return DATA_FIELDS.reduce((payload, field) => {
    payload[field] = raw[field] ?? "";
    return payload;
  }, {});
}

/* ============================================================
   TÀI KHOẢN KHÁCH HÀNG (đăng ký bằng SĐT — lưu trên trình duyệt)
   ============================================================ */
// Gọi API Google Apps Script (POST text/plain — không preflight, đọc được kết quả)
async function api(action, data = {}) {
  const endpoint = window.APP_CONFIG?.GOOGLE_SHEET_ENDPOINT;
  if (!endpoint) return null;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...data })
    });
    return await response.json();
  } catch {
    return null;
  }
}

function getCustomers() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomers(list) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

// Phiên đăng nhập: lưu {name, phone, email} trên trình duyệt
function currentCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setCustomerSession(customer) {
  if (customer) {
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
  } else {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  }
}

// Lịch sử thuê từ Google Sheet (đồng bộ mọi thiết bị)
let serverHistory = null;

async function fetchServerHistory() {
  const customer = currentCustomer();
  if (!customer) { serverHistory = null; return; }
  const result = await api("history", { phone: customer.phone });
  if (result?.ok && Array.isArray(result.bookings)) {
    serverHistory = result.bookings;
    renderAccountModal();
    renderBookingsList();
  }
}

// Gộp lịch sử trên Sheet + đơn lưu trên máy (khử trùng lặp theo Số hợp đồng)
function customerBookings(phone) {
  const p = normalizePhone(phone);
  const local = savedBookings().filter((b) => normalizePhone(b["SĐT"]) === p);
  if (!serverHistory) return local;
  const seen = new Set(serverHistory.map((b) => b["Số hợp đồng"]));
  return [...serverHistory, ...local.filter((b) => !seen.has(b["Số hợp đồng"]))];
}

function setAuthMessage(text, type) {
  els.authMessage.className = `form-message${type ? ` ${type}` : ""}`;
  els.authMessage.textContent = text || "";
}

function openAccountModal() {
  renderAccountModal();
  els.accountModal.hidden = false;
}

function closeAccountModal() {
  els.accountModal.hidden = true;
  setAuthMessage("");
}

function switchAuthTab(mode) {
  const isLogin = mode === "login";
  els.tabLogin.classList.toggle("active", isLogin);
  els.tabRegister.classList.toggle("active", !isLogin);
  els.customerLoginForm.hidden = !isLogin;
  els.customerRegisterForm.hidden = isLogin;
  setAuthMessage("");
}

function renderAccountModal() {
  const customer = currentCustomer();
  els.resetView.hidden = true;
  els.authView.hidden = Boolean(customer);
  els.profileView.hidden = !customer;
  if (!customer) return;

  const trips = customerBookings(customer.phone).length;
  const cycles = trips % LOYALTY_TARGET;
  const rewards = Math.floor(trips / LOYALTY_TARGET);
  els.profileName.textContent = customer.name;
  els.profilePhone.textContent = `SĐT: ${customer.phone}`;
  els.tripCount.textContent = `${trips} chuyến`;
  els.loyaltyFill.style.width = `${Math.min((cycles / LOYALTY_TARGET) * 100, 100)}%`;
  if (rewards > 0 && cycles === 0) {
    els.loyaltyNote.textContent = `🎉 Chúc mừng! Bạn có ${rewards} ngày thuê miễn phí — liên hệ hotline để sử dụng.`;
  } else if (rewards > 0) {
    els.loyaltyNote.textContent = `Bạn có ${rewards} ngày thuê miễn phí. Còn ${LOYALTY_TARGET - cycles} chuyến nữa để nhận thêm 1 ngày!`;
  } else {
    els.loyaltyNote.textContent = `Còn ${LOYALTY_TARGET - cycles} chuyến nữa để được tặng 1 ngày thuê miễn phí!`;
  }
}

function finishAuth(customer) {
  setCustomerSession(customer);
  els.customerRegisterForm.reset();
  els.customerLoginForm.reset();
  renderAccountModal();
  renderBookingsList();
  prefillCustomerForm();
  fetchServerHistory();
}

async function registerCustomer(event) {
  event.preventDefault();
  const name = els.regName.value.trim();
  const phone = normalizePhone(els.regPhone.value);
  const email = els.regEmail.value.trim();
  const pass = els.regPass.value;
  if (phone.length < 9) {
    setAuthMessage("Số điện thoại không hợp lệ.", "error");
    return;
  }

  setAuthMessage("Đang tạo tài khoản...");
  const result = await api("register", { name, phone, email, pass });

  if (result) {
    if (!result.ok) {
      setAuthMessage(result.error === "exists"
        ? "SĐT này đã có tài khoản. Hãy đăng nhập."
        : "Không tạo được tài khoản. Kiểm tra lại thông tin.", "error");
      return;
    }
    finishAuth({ name: result.name, phone: result.phone, email: result.email });
    return;
  }

  // Fallback: chưa kết nối Google Sheet → lưu trên trình duyệt
  const customers = getCustomers();
  if (customers.some((c) => c.phone === phone)) {
    setAuthMessage("SĐT này đã có tài khoản. Hãy đăng nhập.", "error");
    return;
  }
  customers.push({ name, phone, email, pass, createdAt: new Date().toISOString() });
  saveCustomers(customers);
  finishAuth({ name, phone, email });
}

async function loginCustomer(event) {
  event.preventDefault();
  const phone = normalizePhone(els.loginPhone.value);
  const pass = els.loginPass.value;

  setAuthMessage("Đang đăng nhập...");
  const result = await api("login", { phone, pass });

  if (result) {
    if (!result.ok) {
      setAuthMessage(result.error === "not-found"
        ? "SĐT chưa có tài khoản. Hãy đăng ký."
        : "SĐT hoặc mật khẩu không đúng.", "error");
      return;
    }
    finishAuth({ name: result.name, phone: result.phone, email: result.email });
    return;
  }

  // Fallback local
  const customer = getCustomers().find((c) => c.phone === phone && c.pass === pass);
  if (!customer) {
    setAuthMessage("SĐT hoặc mật khẩu không đúng.", "error");
    return;
  }
  finishAuth({ name: customer.name, phone: customer.phone, email: customer.email || "" });
}

function logoutCustomer() {
  setCustomerSession(null);
  serverHistory = null;
  renderAccountModal();
  switchAuthTab("login");
  renderBookingsList();
}

/* ---- Quên mật khẩu: gửi mã 6 số về email đã đăng ký ---- */
function setResetMessage(text, type) {
  els.resetMessage.className = `form-message${type ? ` ${type}` : ""}`;
  els.resetMessage.textContent = text || "";
}

function showResetView(show) {
  els.resetView.hidden = !show;
  els.authView.hidden = show || Boolean(currentCustomer());
  if (show) {
    els.resetConfirmForm.hidden = true;
    els.resetRequestForm.hidden = false;
    setResetMessage("");
  }
}

async function requestPasswordReset(event) {
  event.preventDefault();
  const phone = normalizePhone(els.resetPhone.value);
  setResetMessage("Đang gửi mã...");

  const result = await api("resetRequest", { phone });
  if (!result) {
    setResetMessage("Website chưa kết nối Google Sheet. Vui lòng liên hệ hotline 0936 848 404 (Zalo) để được cấp lại mật khẩu.", "error");
    return;
  }
  if (!result.ok) {
    if (result.error === "not-found") {
      setResetMessage("SĐT này chưa có tài khoản.", "error");
    } else if (result.error === "no-email") {
      setResetMessage("Tài khoản chưa đăng ký email khôi phục. Vui lòng liên hệ hotline / Zalo 0936 848 404 để được cấp lại mật khẩu.", "error");
    } else {
      setResetMessage("Không gửi được mã. Thử lại sau.", "error");
    }
    return;
  }
  setResetMessage(`Đã gửi mã 6 số tới email ${result.maskedEmail}. Mã có hiệu lực 15 phút.`, "success");
  els.resetConfirmForm.hidden = false;
}

async function confirmPasswordReset(event) {
  event.preventDefault();
  const phone = normalizePhone(els.resetPhone.value);
  const code = els.resetCode.value.trim();
  const newPass = els.resetNewPass.value;
  setResetMessage("Đang xác nhận...");

  const result = await api("resetConfirm", { phone, code, newPass });
  if (!result || !result.ok) {
    const reason = result?.error;
    setResetMessage(reason === "expired"
      ? "Mã đã hết hạn. Bấm gửi lại mã mới."
      : "Mã xác nhận không đúng.", "error");
    return;
  }
  els.resetRequestForm.reset();
  els.resetConfirmForm.reset();
  showResetView(false);
  finishAuth({ name: result.name, phone: result.phone, email: result.email });
  setAuthMessage("Đã đặt lại mật khẩu và đăng nhập thành công.", "success");
}

// Tự điền thông tin khách đã đăng nhập vào form thuê xe
function prefillCustomerForm() {
  const customer = currentCustomer();
  if (!customer || els.customerForm.hidden) return;
  const nameInput = els.customerForm.elements["Họ và Tên"];
  const phoneInput = els.customerForm.elements["SĐT"];
  if (nameInput && !nameInput.value) nameInput.value = customer.name;
  if (phoneInput && !phoneInput.value) phoneInput.value = customer.phone;
}

/* ============================================================
   POPUP ĐẶT CỌC — chọn 1 trong 2 ưu đãi, gửi Sheet sau khi chọn
   ============================================================ */
let pendingBooking = null; // đơn đang chờ khách chọn cọc/ưu đãi

function selectedPerk() {
  const checked = document.querySelector('input[name="perkChoice"]:checked');
  return checked ? checked.value : "";
}

function openDepositModal(depositValue, contractNo) {
  els.depositAmount.textContent = formatMoney(depositValue);
  els.depositAmountQr.textContent = formatMoney(depositValue);
  els.qrRef.textContent = `${contractNo} DAT COC`;
  els.depositOffer.hidden = false;
  els.depositQr.hidden = true;
  els.depositModal.hidden = false;
}

function showDepositQr() {
  const qrUrl = window.APP_CONFIG?.DEPOSIT_QR_URL || "";
  if (qrUrl) {
    els.qrImage.src = qrUrl;
    els.qrImage.hidden = false;
    els.qrPlaceholder.hidden = true;
  } else {
    els.qrImage.hidden = true;
    els.qrPlaceholder.hidden = false;
  }
  els.depositOffer.hidden = true;
  els.depositQr.hidden = false;
}

// Gửi đơn lên Google Sheet + lưu trên máy (chỉ chạy 1 lần cho mỗi đơn)
async function finalizeBooking(depositChosen) {
  if (!pendingBooking) return;
  const payload = pendingBooking;
  pendingBooking = null;

  payload["Ưu đãi"] = depositChosen ? selectedPerk() : "";
  payload["Trạng thái cọc"] = depositChosen ? "Đã quét QR đặt cọc" : "Chưa đặt cọc";

  const saved = savedBookings();
  saved.push({ ...payload, savedAt: new Date().toISOString() });
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(saved));

  renderTimeline();
  renderCars();
  renderBooking();
  renderBookingsList();

  const sheetPayload = { ...payload };
  delete sheetPayload.carCode;
  await api("booking", sheetPayload); // đơn vẫn được lưu trên máy nếu gửi lỗi
}

function acceptDeposit() {
  showDepositQr();
}

function closeDepositModal(depositChosen) {
  els.depositModal.hidden = true;
  finalizeBooking(Boolean(depositChosen));
}

function submitBooking(event) {
  event.preventDefault();
  els.formMessage.className = "form-message success";
  els.formMessage.textContent = "Đã nhận thông tin đặt xe!";

  const payload = buildPayload(new FormData(els.customerForm));
  payload.carCode = state.selectedCar.code;
  pendingBooking = payload;

  els.customerForm.reset();
  els.acceptPrice.checked = false;
  openDepositModal(Number(payload["Tiền cọc (50%)"] || 0), payload["Số hợp đồng"]);
}

/* ============================================================
   DANH SÁCH ĐƠN ĐÃ ĐẶT (tab Đặt xe) + CHI TIẾT ĐƠN
   ============================================================ */
const DETAIL_FIELDS = [
  "Số hợp đồng", "Họ và Tên", "SĐT", "Xe cho thuê", "Biến số xe",
  "Ngày bắt đầu", "Ngày kết thúc", "Đơn Giá thuê", "Tổng giá thuê",
  "Tiền cọc (50%)", "Trạng thái cọc", "Ưu đãi", "Tài sản thế chấp",
  "Số CCCD/Passport", "Số GPLX", "Địa chỉ liên hệ"
];

function visibleBookings() {
  const all = savedBookings();
  if (state.isAdmin) return all;
  const customer = currentCustomer();
  if (customer) return customerBookings(customer.phone);
  return all; // đơn đặt từ trình duyệt này
}

function renderBookingsList() {
  const list = visibleBookings().slice().reverse(); // mới nhất lên đầu
  els.bookingsSection.hidden = list.length === 0;
  if (!list.length) return;

  els.bookingsTitle.textContent = state.isAdmin ? "Tất cả đơn đặt xe" : "Đơn đã đặt của bạn";
  els.bookingsCount.textContent = `${list.length} đơn`;

  els.bookingsList.innerHTML = list.map((booking, index) => {
    const deposit = booking["Trạng thái cọc"] === "Đã quét QR đặt cọc";
    return `
      <div class="booking-row" data-booking-index="${index}" role="button" tabindex="0"
        aria-label="Xem chi tiết đơn ${booking["Số hợp đồng"] || ""}">
        <span class="booking-row-main">
          <strong>${booking["Xe cho thuê"] || "Xe"}</strong>
          <small>${state.isAdmin ? `${booking["Họ và Tên"] || ""} · ` : ""}${booking["Ngày bắt đầu"] || ""} → ${booking["Ngày kết thúc"] || ""}</small>
        </span>
        <span class="booking-row-side">
          <strong>${formatMoney(booking["Tổng giá thuê"])}</strong>
          <small class="${deposit ? "dep-ok" : "dep-no"}">${deposit ? "● Đã cọc" : "○ Chưa cọc"}</small>
        </span>
        <button type="button" class="row-print" data-print-index="${index}" title="In Hợp đồng" aria-label="In hợp đồng">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8V4H6v4H4a2 2 0 0 0-2 2v7h4v4h12v-4h4v-7a2 2 0 0 0-2-2h-2ZM8 6h8v2H8V6Zm8 13H8v-4h8v4Zm4-6h-2v-1H6v1H4v-3h16v3Z"/></svg>
          <span>In HĐ</span>
        </button>
      </div>
    `;
  }).join("");

  els.bookingsList.querySelectorAll(".booking-row").forEach((row) => {
    const booking = list[Number(row.dataset.bookingIndex)];
    row.addEventListener("click", () => openBookingDetail(booking));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openBookingDetail(booking);
    });
  });
  els.bookingsList.querySelectorAll("[data-print-index]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      window.printContract(list[Number(button.dataset.printIndex)]);
    });
  });
}

let currentDetailBooking = null;

function openBookingDetail(booking) {
  currentDetailBooking = booking;
  els.bookingDetailTitle.textContent = booking["Xe cho thuê"] || "Chi tiết đơn";
  els.bookingDetailBody.innerHTML = DETAIL_FIELDS
    .filter((field) => booking[field] !== undefined && booking[field] !== "")
    .map((field) => {
      let value = booking[field];
      if (["Đơn Giá thuê", "Tổng giá thuê", "Tiền cọc (50%)"].includes(field)) value = formatMoney(value);
      return `<div class="detail-row"><span>${field}</span><strong>${value}</strong></div>`;
    }).join("");
  els.bookingDetailModal.hidden = false;
}

function closeBookingDetail() {
  els.bookingDetailModal.hidden = true;
  currentDetailBooking = null;
}

function bindEvents() {
  els.vehicleGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-car]");
    if (button) selectCar(button.dataset.selectCar);
  });

  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filterType = button.dataset.filterType;
      document.querySelectorAll("[data-filter-type]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderCars();
    });
  });

  document.querySelectorAll("[data-filter-seats]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filterSeats = button.dataset.filterSeats;
      document.querySelectorAll("[data-filter-seats]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderCars();
    });
  });

  [els.searchInput, els.availableOnly].forEach((element) => element.addEventListener("input", renderCars));
  els.priceRange.addEventListener("input", () => {
    updatePriceLabel();
    renderCars();
  });
  [els.filterStartDate, els.filterEndDate].forEach((element) => {
    element.addEventListener("input", () => handleDateChange("filter"));
  });
  [els.startDate, els.startTime].forEach((element) => {
    element.addEventListener("input", () => {
      syncDefaultEnd();
      handleDateChange("booking");
    });
  });
  [els.endDate, els.endTime].forEach((element) => {
    element.addEventListener("input", () => handleDateChange("booking"));
  });

  // Popup đặt cọc: "Đặt cọc ngay" → QR; đóng ở bước QR = đã cọc, ngược lại = chưa cọc
  els.depositAccept.addEventListener("click", acceptDeposit);
  els.depositLater.addEventListener("click", () => closeDepositModal(false));
  els.depositClose.addEventListener("click", () => closeDepositModal(!els.depositQr.hidden));
  els.qrDone.addEventListener("click", () => closeDepositModal(true));
  els.depositModal.addEventListener("click", (event) => {
    if (event.target === els.depositModal) closeDepositModal(!els.depositQr.hidden);
  });

  // Tài khoản khách hàng
  els.accountNav.addEventListener("click", openAccountModal);
  els.accountClose.addEventListener("click", closeAccountModal);
  els.accountModal.addEventListener("click", (event) => {
    if (event.target === els.accountModal) closeAccountModal();
  });
  els.tabLogin.addEventListener("click", () => switchAuthTab("login"));
  els.tabRegister.addEventListener("click", () => switchAuthTab("register"));
  els.customerLoginForm.addEventListener("submit", loginCustomer);
  els.customerRegisterForm.addEventListener("submit", registerCustomer);
  els.customerLogout.addEventListener("click", logoutCustomer);

  // Quên mật khẩu
  els.forgotPass.addEventListener("click", () => showResetView(true));
  els.backToLogin.addEventListener("click", () => {
    showResetView(false);
    switchAuthTab("login");
  });
  els.resetRequestForm.addEventListener("submit", requestPasswordReset);
  els.resetConfirmForm.addEventListener("submit", confirmPasswordReset);

  // In hợp đồng từ modal chi tiết
  els.detailPrintBtn.addEventListener("click", () => {
    if (currentDetailBooking) window.printContract(currentDetailBooking);
  });

  // Chi tiết đơn thuê
  els.bookingDetailClose.addEventListener("click", closeBookingDetail);
  els.bookingDetailModal.addEventListener("click", (event) => {
    if (event.target === els.bookingDetailModal) closeBookingDetail();
  });
  els.acceptPrice.addEventListener("input", renderBooking);
  els.resetFilters.addEventListener("click", resetFilters);
  els.customerForm.addEventListener("submit", submitBooking);
  els.openBookingButton?.addEventListener("click", () => {
    document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.loginNav.addEventListener("click", openLoginModal);
  els.manageNav.addEventListener("click", () => {
    els.adminPanel.hidden = false;
    els.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.loginModalClose.addEventListener("click", closeLoginModal);
  els.loginModal.addEventListener("click", (event) => {
    if (event.target === els.loginModal) closeLoginModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!els.loginModal.hidden) closeLoginModal();
    if (!els.depositModal.hidden) closeDepositModal(!els.depositQr.hidden);
    if (!els.accountModal.hidden) closeAccountModal();
    if (!els.bookingDetailModal.hidden) closeBookingDetail();
  });

  els.adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const config = window.APP_CONFIG || {};
    const valid = els.adminId.value === config.SUPER_ADMIN_ID
      && els.adminPassword.value === config.SUPER_ADMIN_PASSWORD
      && normalize(els.adminGmail.value) === normalize(config.SUPER_ADMIN_GMAIL);
    if (!valid) {
      els.adminLoginMessage.className = "form-message error";
      els.adminLoginMessage.textContent = "Thông tin đăng nhập không đúng.";
      return;
    }
    state.isAdmin = true;
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    els.adminLoginForm.reset();
    closeLoginModal();
    renderAdminState();
    els.adminPanel.hidden = false;
    els.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.adminLogout.addEventListener("click", () => {
    state.isAdmin = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdminState();
  });

  els.clearAdminForm.addEventListener("click", clearAdminForm);

  els.adminCarList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-car]");
    const deleteButton = event.target.closest("[data-delete-car]");
    if (editButton) {
      const car = state.cars.find((item) => item.code === editButton.dataset.editCar);
      if (car) fillAdminForm(car);
    }
    if (deleteButton) deleteCar(deleteButton.dataset.deleteCar);
  });

  els.vehicleAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = (els.adminCarCode.value || "").trim() || `KBA-${Date.now()}`;
    const existing = state.cars.find((car) => car.code === code);
    const uploadedImage = await readImageFile(els.adminCarImageFile.files[0]);
    const status = els.adminCarStatus.value;
    const car = {
      ...(existing || {}),
      code,
      name: els.adminCarName.value.trim(),
      year: Number(els.adminCarYear.value),
      color: els.adminCarColor.value.trim(),
      dailyRate: Number(els.adminCarRate.value),
      seats: Number(els.adminCarSeats.value),
      fuelType: els.adminCarFuel.value,
      // imageData = ảnh admin tải lên (ưu tiên). imageUrl = link ngoài / ảnh gốc.
      imageData: uploadedImage || existing?.imageData || "",
      imageUrl: els.adminCarImage.value.trim() || existing?.imageUrl || "",
      status,
      statusNote: els.adminCarStatusNote.value.trim(),
      images: (els.adminCarImages && els.adminCarImages.value || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      available: status === "available",
      rating: existing?.rating || 4.8,
      distanceKm: existing?.distanceKm || 1,
      bookedRanges: parseBookedRanges(els.adminCarRanges.value),
      plate: existing?.plate || "",
      registrationNumber: existing?.registrationNumber || "",
      registrationDate: existing?.registrationDate || "",
      owner: existing?.owner || ""
    };
    persistCar(car);
    applyFleetStore();
    clearAdminForm();
    refreshAfterFleetChange();
  });

  // Xem trước ảnh khi admin chọn file hoặc nhập URL
  els.adminCarImageFile.addEventListener("change", async () => {
    const data = await readImageFile(els.adminCarImageFile.files[0]);
    if (data) { els.adminImgPreview.src = data; els.adminImgPreview.hidden = false; }
  });
  els.adminCarImage.addEventListener("input", () => {
    const url = els.adminCarImage.value.trim();
    if (url) { els.adminImgPreview.src = url; els.adminImgPreview.hidden = false; }
  });
}

async function init() {
  els.todayLabel.textContent = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full"
  }).format(new Date());

  const today = todayIso();
  [els.startDate, els.endDate, els.filterStartDate, els.filterEndDate].forEach((input) => {
    input.min = today;
    input.value = today;
  });
  // Giờ thuê mặc định 08:00, kết thúc cùng giờ ngày kế tiếp
  els.startTime.value = "08:00";
  syncDefaultEnd();
  els.filterEndDate.value = els.endDate.value;
  updatePriceLabel();

  // Ưu tiên dữ liệu nhúng sẵn (chạy được khi mở trực tiếp index.html, không cần server).
  if (Array.isArray(window.CARS_DATA)) {
    state.baseCars = window.CARS_DATA;
  } else {
    const response = await fetch("data/cars.json");
    state.baseCars = await response.json();
  }
  applyFleetStore();
  buildFilterOptions();
  bindEvents();
  const rates = state.cars.map((car) => Number(car.dailyRate || 0)).filter(Boolean).sort((a, b) => a - b);
  if (els.avgPrice) els.avgPrice.textContent = formatMoney(rates[Math.floor(rates.length / 2)] || 0);
  window.KBA = {
    getCarByCode: (code) => state.cars.find((c) => c.code === code),
    mainChain: (car) => imageCandidates(car),
    extraImages: (car) => (car.images || []).slice(),
    numberedVariants: (car) => {
      if (!car.code) return [];
      const base = CAR_IMAGE_DIR + encodeURIComponent(car.code);
      const out = [];
      for (let i = 2; i <= 5; i++) out.push(CAR_IMAGE_EXTS.map((ext) => `${base}-${i}.${ext}`));
      return out;
    }
  };
  renderTimeline();
  renderCars();
  renderBooking();
  renderAdminState();
  renderBookingsList();
  fetchServerHistory(); // tải lịch sử thuê nếu khách đã đăng nhập
}

init().catch((error) => {
  els.emptyState.hidden = false;
  els.emptyState.textContent = `Không tải được danh sách xe: ${error.message}`;
});
// KBA Car Rental v2 — thuê theo ngày + giờ, đặt cọc 50%, bộ lọc số chỗ.
