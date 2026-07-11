/* ============================================================
   KBA CAR RENTAL — Google Apps Script
   - Lưu đơn đặt xe vào sheet "Data_KH"
   - Lưu tài khoản khách hàng vào sheet "Accounts"
   - Đăng ký / Đăng nhập / Quên mật khẩu (gửi mã qua email)
   - Trả lịch sử thuê xe theo SĐT
   Sau khi dán code mới: Deploy → Manage deployments → Edit → New version
   ============================================================ */

const SHEET_NAME = "Data_KH";
const ACCOUNTS_SHEET = "Accounts";
const RESET_CODE_TTL_MINUTES = 15;

const HEADERS = [
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

const ACCOUNT_HEADERS = ["SĐT", "Họ và Tên", "Email", "Mật khẩu", "Ngày tạo", "Mã reset", "Hạn mã reset"];

function doPost(e) {
  let payload = {};
  try {
    payload = JSON.parse(e.postData.contents || "{}");
  } catch (err) {
    return json_({ ok: false, error: "bad-json" });
  }

  const action = payload.action || "booking";
  try {
    switch (action) {
      case "booking": return handleBooking_(payload);
      case "register": return handleRegister_(payload);
      case "login": return handleLogin_(payload);
      case "resetRequest": return handleResetRequest_(payload);
      case "resetConfirm": return handleResetConfirm_(payload);
      case "history": return handleHistory_(payload);
      default: return json_({ ok: false, error: "unknown-action" });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "KBA Car Rental API" });
}

/* ---------------- Đơn đặt xe ---------------- */
function handleBooking_(payload) {
  const sheet = getSheet_(SHEET_NAME);
  ensureHeader_(sheet, HEADERS);
  payload["STT"] = sheet.getLastRow();
  const row = HEADERS.map(function (field) { return payload[field] || ""; });
  sheet.appendRow(row);
  return json_({ ok: true });
}

/* ---------------- Lịch sử thuê theo SĐT ---------------- */
function handleHistory_(payload) {
  const phone = normalizePhone_(payload.phone);
  if (!phone) return json_({ ok: false, error: "missing-phone" });
  const sheet = getSheet_(SHEET_NAME);
  ensureHeader_(sheet, HEADERS);
  const values = sheet.getDataRange().getValues();
  const phoneCol = HEADERS.indexOf("SĐT");
  const bookings = [];
  for (let i = 1; i < values.length; i++) {
    if (normalizePhone_(values[i][phoneCol]) !== phone) continue;
    const item = {};
    HEADERS.forEach(function (h, idx) { item[h] = formatCell_(values[i][idx]); });
    bookings.push(item);
  }
  return json_({ ok: true, bookings: bookings });
}

/* ---------------- Tài khoản ---------------- */
function handleRegister_(payload) {
  const phone = normalizePhone_(payload.phone);
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const pass = String(payload.pass || "");
  if (phone.length < 9 || !name || pass.length < 4) return json_({ ok: false, error: "invalid-data" });

  const sheet = getAccountsSheet_();
  if (findAccountRow_(sheet, phone) > 0) return json_({ ok: false, error: "exists" });

  sheet.appendRow([phone, name, email, pass, new Date(), "", ""]);
  return json_({ ok: true, name: name, phone: phone, email: email });
}

function handleLogin_(payload) {
  const phone = normalizePhone_(payload.phone);
  const pass = String(payload.pass || "");
  const sheet = getAccountsSheet_();
  const row = findAccountRow_(sheet, phone);
  if (row < 0) return json_({ ok: false, error: "not-found" });

  const data = sheet.getRange(row, 1, 1, ACCOUNT_HEADERS.length).getValues()[0];
  if (String(data[3]) !== pass) return json_({ ok: false, error: "wrong-pass" });
  return json_({ ok: true, name: data[1], phone: phone, email: data[2] });
}

// Bước 1 quên mật khẩu: gửi mã 6 số về email đã đăng ký
function handleResetRequest_(payload) {
  const phone = normalizePhone_(payload.phone);
  const sheet = getAccountsSheet_();
  const row = findAccountRow_(sheet, phone);
  if (row < 0) return json_({ ok: false, error: "not-found" });

  const data = sheet.getRange(row, 1, 1, ACCOUNT_HEADERS.length).getValues()[0];
  const email = String(data[2] || "").trim();
  if (!email) return json_({ ok: false, error: "no-email" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60000);
  sheet.getRange(row, 6, 1, 2).setValues([[code, expiry]]);

  MailApp.sendEmail({
    to: email,
    subject: "KBA Car Rental — Mã đặt lại mật khẩu",
    body: "Xin chào " + data[1] + ",\n\n"
      + "Mã đặt lại mật khẩu của bạn là: " + code + "\n"
      + "Mã có hiệu lực trong " + RESET_CODE_TTL_MINUTES + " phút.\n\n"
      + "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\n"
      + "KBA Car Rental — Hotline 0936 848 404"
  });

  return json_({ ok: true, maskedEmail: maskEmail_(email) });
}

// Bước 2 quên mật khẩu: xác nhận mã + đặt mật khẩu mới
function handleResetConfirm_(payload) {
  const phone = normalizePhone_(payload.phone);
  const code = String(payload.code || "").trim();
  const newPass = String(payload.newPass || "");
  if (newPass.length < 4) return json_({ ok: false, error: "invalid-pass" });

  const sheet = getAccountsSheet_();
  const row = findAccountRow_(sheet, phone);
  if (row < 0) return json_({ ok: false, error: "not-found" });

  const data = sheet.getRange(row, 1, 1, ACCOUNT_HEADERS.length).getValues()[0];
  const savedCode = String(data[5] || "");
  const expiry = data[6] ? new Date(data[6]) : null;
  if (!savedCode || savedCode !== code) return json_({ ok: false, error: "wrong-code" });
  if (!expiry || expiry.getTime() < Date.now()) return json_({ ok: false, error: "expired" });

  sheet.getRange(row, 4).setValue(newPass); // mật khẩu mới
  sheet.getRange(row, 6, 1, 2).setValues([["", ""]]); // xóa mã reset
  return json_({ ok: true, name: data[1], phone: phone, email: data[2] });
}

/* ---------------- Helpers ---------------- */
function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function getAccountsSheet_() {
  const sheet = getSheet_(ACCOUNTS_SHEET);
  ensureHeader_(sheet, ACCOUNT_HEADERS);
  return sheet;
}

function ensureHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const missing = headers.some(function (field, index) { return current[index] !== field; });
  if (missing) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

// Trả số dòng (1-based) của tài khoản theo SĐT, -1 nếu không có
function findAccountRow_(sheet, phone) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (normalizePhone_(values[i][0]) === phone) return i + 1;
  }
  return -1;
}

function normalizePhone_(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskEmail_(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const visible = name.slice(0, 2);
  return visible + "***@" + parts[1];
}

function formatCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  }
  return String(value);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
