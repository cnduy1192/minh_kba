const SHEET_NAME = "Data_KH";
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
  "Tiền còn lại APP"
];

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  ensureHeader_(sheet);

  const payload = JSON.parse(e.postData.contents || "{}");
  payload["STT"] = sheet.getLastRow();

  const row = HEADERS.map((field) => payload[field] || "");
  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "KBA Car Rental Sheet API" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeader_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const missing = HEADERS.some((field, index) => current[index] !== field);
  if (missing) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}
