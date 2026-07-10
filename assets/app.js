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
  "Tiền cọc (50%)"
];

const FLEET_STORAGE_KEY = "kbaRentalFleet";
const BOOKINGS_STORAGE_KEY = "kbaRentalBookings";
const ADMIN_SESSION_KEY = "kbaSuperAdminSession";
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
   Thời lượng tối thiểu 1 ngày. Phần lẻ tính theo giờ = giá ngày / 24. */
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
  const totalHours = Math.max((end - start) / 3600000, 24); // tối thiểu 1 ngày
  let days = Math.floor(totalHours / 24);
  let hours = Math.ceil(totalHours - days * 24);
  if (hours >= 24) { days += 1; hours = 0; }
  return { days, hours, totalHours };
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
  if (!state.selectedCar) return { days: 0, hours: 0, total: 0 };
  const duration = bookingDuration();
  if (!duration) return { days: 0, hours: 0, total: 0 };
  const rate = Number(state.selectedCar.dailyRate || 0);
  const hourRate = Math.round(rate / 24 / 1000) * 1000;
  const total = duration.days * rate + duration.hours * hourRate;
  return { days: duration.days, hours: duration.hours, total, hourRate };
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

  const { days, hours, total, hourRate } = calcBooking();
  els.totalPrice.textContent = formatMoney(total);
  if (car && total) {
    const parts = [`${days} ngày x ${formatMoney(car.dailyRate)}`];
    if (hours) parts.push(`${hours} giờ x ${formatMoney(hourRate)}`);
    els.priceNote.textContent = parts.join(" + ");
  } else {
    els.priceNote.textContent = "Chọn xe và thời gian thuê để xem giá.";
  }

  const canShowForm = Boolean(car && total && els.acceptPrice.checked);
  els.customerForm.hidden = !canShowForm;
}

function renderAdminState() {
  els.adminPanel.hidden = !state.isAdmin;
  els.loginNav.hidden = state.isAdmin;
  els.manageNav.hidden = !state.isAdmin;
  if (state.isAdmin) renderAdminCarList();
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

/* ---- Popup ưu đãi đặt cọc + QR 50% ---- */
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

function closeDepositModal() {
  els.depositModal.hidden = true;
}

async function submitBooking(event) {
  event.preventDefault();
  els.formMessage.className = "form-message";
  els.formMessage.textContent = "Đang gửi thông tin...";

  const endpoint = window.APP_CONFIG?.GOOGLE_SHEET_ENDPOINT;
  const payload = buildPayload(new FormData(els.customerForm));
  const depositValue = Number(payload["Tiền cọc (50%)"] || 0);
  const contractNo = payload["Số hợp đồng"];
  const localBooking = { ...payload, carCode: state.selectedCar.code, savedAt: new Date().toISOString() };
  const saved = savedBookings();
  saved.push(localBooking);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(saved));

  const finishSuccess = (message) => {
    els.formMessage.classList.add("success");
    els.formMessage.textContent = message;
    els.customerForm.reset();
    els.acceptPrice.checked = false;
    renderTimeline();
    renderCars();
    renderBooking();
    openDepositModal(depositValue, contractNo);
  };

  if (!endpoint) {
    finishSuccess("Đã lưu tạm trên trình duyệt.");
    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    finishSuccess("Đã gửi thông tin.");
  } catch {
    els.formMessage.classList.add("error");
    els.formMessage.textContent = "Chưa gửi được dữ liệu.";
  }
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

  // Popup đặt cọc
  els.depositAccept.addEventListener("click", showDepositQr);
  els.depositLater.addEventListener("click", closeDepositModal);
  els.depositClose.addEventListener("click", closeDepositModal);
  els.qrDone.addEventListener("click", closeDepositModal);
  els.depositModal.addEventListener("click", (event) => {
    if (event.target === els.depositModal) closeDepositModal();
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
    if (event.key === "Escape" && !els.loginModal.hidden) closeLoginModal();
    if (event.key === "Escape" && !els.depositModal.hidden) closeDepositModal();
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
}

init().catch((error) => {
  els.emptyState.hidden = false;
  els.emptyState.textContent = `Không tải được danh sách xe: ${error.message}`;
});
// KBA Car Rental v2 — thuê theo ngày + giờ, đặt cọc 50%, bộ lọc số chỗ.
