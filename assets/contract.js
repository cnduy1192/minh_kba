/* ============================================================
   IN HỢP ĐỒNG THUÊ XE — template theo file HDTX.docx
   Các vị trí merge được điền từ thông tin Đặt xe trên website
   (thay thế file DATA_KH.xlsx).
   ============================================================ */

(function () {
  // Thông tin Bên A cố định (theo HDTX.docx) — sửa tại đây nếu thay đổi
  const PARTY_A = {
    name: "PHẠM TRÚC MINH",
    cccd: "079094006394",
    cccdDate: "10/2/2022",
    cccdPlace: "CTCCSQLHCVTTXH",
    addressPermanent: "38/4 đường 1A, Bình Hưng Hòa A, Bình Tân, HCM",
    addressContact: "51/13 đường 18B, Bình Hưng Hòa A, Bình Tân, HCM",
    phone: "0936.848.404",
    handoverPlace: "51/13 đường 18B, Bình Hưng Hòa A, Bình Tân, HCM",
    emergency: "0936.848.404 – 0917.778.992 Minh"
  };

  const moneyVN = new Intl.NumberFormat("vi-VN");

  function fmtMoney(value) {
    const number = Number(value || 0);
    return `${moneyVN.format(number)} VNĐ`;
  }

  // "2026-07-12" | "2026-07-12 08:00" → "12/07/2026"
  function fmtDate(value) {
    const s = String(value || "").slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (value || "………………");
  }

  // "2026-07-12 08:00" → { time: "08 giờ 00 phút", date: "12/07/2026" }
  function fmtDateTime(value) {
    const s = String(value || "");
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) return { time: "…… giờ …… phút", date: fmtDate(value) };
    return { time: `${m[4]} giờ ${m[5]} phút`, date: `${m[3]}/${m[2]}/${m[1]}` };
  }

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function dotted(value, fallback) {
    const v = String(value || "").trim();
    return v ? esc(v) : (fallback || "………………………");
  }

  // Số hợp đồng hiển thị: ddmmyyyy-MÃXE/HĐCTXTL (theo mẫu HDTX)
  function contractDisplayNo(booking) {
    const start = fmtDateTime(booking["Ngày bắt đầu"]);
    const compact = start.date.replace(/\//g, "");
    const core = booking.carCode || booking["Số hợp đồng"] || "";
    return `${compact}-${core}/HĐCTXTL`;
  }

  function buildContractHtml(booking) {
    const b = booking;
    const start = fmtDateTime(b["Ngày bắt đầu"]);
    const end = fmtDateTime(b["Ngày kết thúc"]);
    const customerName = String(b["Họ và Tên"] || "").toUpperCase();

    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Hợp đồng thuê xe — ${esc(b["Số hợp đồng"] || "")}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12.5pt;
    line-height: 1.45;
    color: #000;
    margin: 0;
  }
  .center { text-align: center; }
  .national { font-weight: bold; margin: 0; }
  .motto { font-weight: bold; text-decoration: underline; margin: 2px 0 14px; }
  h1 { font-size: 15pt; margin: 8px 0 2px; }
  .contract-no { font-style: italic; margin: 0 0 12px; }
  .basis { margin: 2px 0; font-style: italic; }
  h2 { font-size: 12.5pt; margin: 14px 0 6px; text-transform: uppercase; }
  p { margin: 5px 0; }
  ul { margin: 4px 0 8px; padding-left: 22px; }
  li { margin: 3px 0; }
  .field { font-weight: bold; }
  .sign-table { width: 100%; margin-top: 26px; border-collapse: collapse; text-align: center; }
  .sign-table td { width: 50%; padding: 6px; vertical-align: top; }
  .sign-name { margin-top: 70px; font-weight: bold; text-transform: uppercase; }
  .thanks { margin-top: 14px; font-style: italic; }
</style>
</head>
<body>
  <div class="center">
    <p class="national">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p class="motto">Độc lập – Tự do – Hạnh phúc</p>
    <h1>HỢP ĐỒNG CHO THUÊ XE Ô TÔ TỰ LÁI</h1>
    <p class="contract-no">(Số: ${esc(contractDisplayNo(b))})</p>
  </div>

  <p class="basis">- Căn cứ Bộ Luật Dân sự số 91/2015/QH13 ngày 24/11/2015;</p>
  <p class="basis">- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>
  <p class="basis">- Căn cứ theo nhu cầu và khả năng cung ứng của hai Bên.</p>

  <p>Hôm nay, ngày <span class="field">${start.date}</span>, tại ${esc(PARTY_A.handoverPlace)}</p>
  <p>Chúng tôi gồm có:</p>

  <p><strong>BÊN CHO THUÊ XE (BÊN A): ${esc(PARTY_A.name)}</strong></p>
  <p>CMND/CCCD số: ${esc(PARTY_A.cccd)}, cấp ngày ${esc(PARTY_A.cccdDate)} tại ${esc(PARTY_A.cccdPlace)}</p>
  <p>Địa chỉ thường trú: ${esc(PARTY_A.addressPermanent)}</p>
  <p>Địa chỉ liên hệ: ${esc(PARTY_A.addressContact)}</p>
  <p>Điện thoại: ${esc(PARTY_A.phone)}</p>

  <p><strong>BÊN THUÊ XE (BÊN B): <span class="field">${esc(customerName)}</span></strong></p>
  <p>CMND/CCCD/Passport số: <span class="field">${dotted(b["Số CCCD/Passport"])}</span>
     cấp ngày <span class="field">${fmtDate(b["Ngày cấp CCCD"])}</span>
     tại <span class="field">${dotted(b["Nơi cấp"])}</span></p>
  <p>GPLX số: <span class="field">${dotted(b["Số GPLX"])}</span>
     cấp ngày <span class="field">${fmtDate(b["Ngày cấp GPLX"])}</span>
     tại <span class="field">${dotted(b["Nơi cấp GPLX"])}</span></p>
  <p>Địa chỉ thường trú: <span class="field">${dotted(b["Địa chỉ thường trú"])}</span></p>
  <p>Địa chỉ liên hệ: <span class="field">${dotted(b["Địa chỉ liên hệ"])}</span></p>
  <p>Điện thoại: <span class="field">${dotted(b["SĐT"])}</span></p>

  <p>Sau khi bàn bạc, hai Bên cùng tiến hành thống nhất ký kết Hợp đồng cho thuê xe ô tô tự lái với các điều khoản sau:</p>

  <h2>Điều 1: Đối tượng hợp đồng</h2>
  <p>Bên A đồng ý cho Bên B thuê 01 (một) chiếc xe ô tô có thông tin sau đây:</p>
  <ul>
    <li>Biển số xe: <span class="field">${dotted(b["Biến số xe"])}</span> &nbsp;&nbsp;Nhãn hiệu: <span class="field">${dotted(b["Xe cho thuê"])}</span></li>
    <li>Sản xuất năm: <span class="field">${dotted(b["Năm SX"])}</span> &nbsp;&nbsp;Màu: <span class="field">${dotted(b["Màu xe"])}</span></li>
    <li>Giấy đăng ký xe ô tô số: <span class="field">${dotted(b["Giấy ĐKX"])}</span> &nbsp;&nbsp;Ngày cấp: <span class="field">${fmtDate(b["Ngày cấp GĐKX"])}</span></li>
    <li>Tên chủ xe: <span class="field">${dotted(b["Tên chủ xe"])}</span></li>
  </ul>

  <h2>Điều 2: Mục đích thuê xe</h2>
  <p>Bên B thuê xe nêu trên vào mục đích: Thuê xe ô tô tự lái theo lịch trình bổ sung sau.</p>

  <h2>Điều 3: Giá trị hợp đồng, hình thức thanh toán, địa điểm bàn giao xe</h2>
  <p>1. Đơn giá thuê: <span class="field">${fmtMoney(b["Đơn Giá thuê"])}/ngày</span></p>
  <p>2. Khống chế quãng đường: 400km/ngày. Phụ trội: 5.000 VNĐ/km.</p>
  <p>3. Thời gian thuê:</p>
  <ul>
    <li>Từ <span class="field">${start.time}, ngày ${start.date}</span></li>
    <li>Đến <span class="field">${end.time}, ngày ${end.date}</span></li>
    <li>Phụ trội: 100.000 VNĐ/giờ – 500.000 VNĐ cho vệ sinh, khử mùi khó chịu trong xe (nếu có).</li>
    <li>Quá 24 giờ cùng ngày mà Bên B chưa bàn giao xe cho Bên A thì tính thêm 1 (một) ngày thuê xe.</li>
  </ul>
  <p>4. Tổng giá trị thuê xe là: <span class="field">${fmtMoney(b["Tổng giá thuê"])}</span></p>
  <p>5. Hình thức thanh toán: Bên B thanh toán trước cho Bên A bằng hình thức tiền mặt hoặc chuyển khoản trước hoặc sau khi hoàn thành chuyến đi.</p>
  ${b["Tiền cọc (50%)"] ? `<p>Tiền đặt cọc (50% giá trị thuê): <span class="field">${fmtMoney(b["Tiền cọc (50%)"])}</span>${b["Trạng thái cọc"] ? ` — ${esc(b["Trạng thái cọc"])}` : ""}</p>` : ""}
  ${b["Tài sản thế chấp"] ? `<p>Tài sản thế chấp: <span class="field">${esc(b["Tài sản thế chấp"])}</span></p>` : ""}
  ${b["Ưu đãi"] ? `<p>Ưu đãi kèm theo: <span class="field">${esc(b["Ưu đãi"])}</span></p>` : ""}
  <p>Địa điểm bàn giao xe: ${esc(PARTY_A.handoverPlace)}</p>

  <h2>Điều 4: Quyền và nghĩa vụ của Bên A</h2>
  <p><strong>1. Quyền của Bên A</strong></p>
  <ul>
    <li>Nhận đủ tiền thuê theo phương thức đã thỏa thuận;</li>
    <li>Khi hết hạn Hợp đồng có quyền nhận lại tài sản thuê như tình trạng thỏa thuận ban đầu, trừ hao mòn tự nhiên; trường hợp giá trị tài sản giảm sút so với giá trị ban đầu được xác định do lỗi của Bên B thì Bên B có nghĩa vụ bồi thường thiệt hại đã gây ra;</li>
    <li>Trường hợp xe có phát sinh sự cố trong chuyến đi dẫn đến phải đưa xe đi kiểm tra, sửa chữa, Bên A có quyền yêu cầu Bên B cùng tham gia vào quá trình bao gồm nhưng không giới hạn: liên hệ bảo hiểm, cùng đi giám định… Trường hợp các Bên có thỏa thuận khác, phải ghi nhận thông tin ở Biên bản bàn giao xe;</li>
    <li>Có quyền đơn phương chấm dứt Hợp đồng và yêu cầu bồi thường thiệt hại nếu Bên B có các hành vi sử dụng tài sản thuê không đúng mục đích như đã thỏa thuận, làm hư hỏng, mất mát tài sản thuê, sửa chữa, đổi cho người khác thuê lại mà không có sự đồng ý của Bên A;</li>
    <li>Báo cho cơ quan công an khi Bên A không liên lạc được với Bên B hoặc Bên B tắt/tháo thiết bị định vị trên xe hoặc quá thời hạn thuê tại khoản 3.3 Điều 3 Hợp đồng này Bên B không giao xe cho Bên A;</li>
    <li>Yêu cầu Bên B thanh toán tiền phạt nguội/đi thanh toán tiền phạt nguội trong trường hợp có thông báo phạt nguội trong thời gian Bên B sử dụng xe thuê. Trường hợp Bên B không thể đi thanh toán thì phải cung cấp bằng lái xe của Bên B cho Bên A để Bên A thực hiện nghĩa vụ;</li>
    <li>Đối với trường hợp các bên có thỏa thuận về việc thế chấp tài sản, Bên A có quyền giữ tài sản thế chấp của Bên B từ lúc nhận xe đến khi Bên B hoàn tất việc trả xe và các khoản chi phí phát sinh (nếu có).</li>
  </ul>
  <p><strong>2. Nghĩa vụ của Bên A</strong></p>
  <ul>
    <li>Trước khi giao xe cho Bên B, phải kiểm tra, đối chiếu thông tin khách thuê, sao chụp lại các giấy tờ nhân thân cần thiết để phục vụ nhu cầu liên hệ sau này;</li>
    <li>Chịu trách nhiệm pháp lý về nguồn gốc và quyền sở hữu của xe;</li>
    <li>Giao đúng xe và toàn bộ giấy tờ liên quan đến xe trong tình trạng an toàn, vệ sinh sạch sẽ nhằm đảm bảo chất lượng dịch vụ khi Bên B sử dụng. Các giấy tờ xe liên quan bao gồm: giấy đăng ký xe ô tô (bản photo sao y trong thời hạn 06 tháng), giấy kiểm định xe ô tô (bản chính), giấy bảo hiểm xe ô tô bắt buộc (bản chính);</li>
    <li>Giao xe tại địa điểm bàn giao xe và đúng thời gian theo Hợp đồng này;</li>
    <li>Tự chịu trách nhiệm trong trường hợp ký Hợp đồng và giao xe cho khách thuê không đúng với thông tin đã giao kết;</li>
    <li>Đối với trường hợp các bên có thỏa thuận về việc thế chấp tài sản: (i) Bên A chịu mọi trách nhiệm chi trả hoặc đền bù trong trường hợp tài sản thế chấp của Bên B bị thiệt hại do lỗi Bên A; và (ii) Bên A có trách nhiệm hoàn trả đầy đủ tài sản thế chấp của Bên B khi 2 Bên đã hoàn tất Hợp đồng và Bên B đã thanh toán đầy đủ các chi phí phát sinh (trường hợp có nghĩa vụ chưa hoàn thành, các Bên ghi nhận sự việc phát sinh vào Biên bản bàn giao để làm căn cứ);</li>
    <li>Báo trước cho Bên B trong vòng 24 tiếng nếu xe cho thuê không thể thuê được vì xe bị hư hỏng buộc phải sửa chữa hoặc vì lý do khác không thể khắc phục được và phải giao xe ô tô khác tương tự như xe đã cho thuê.</li>
  </ul>

  <h2>Điều 5: Quyền và nghĩa vụ của Bên B</h2>
  <p><strong>1. Quyền của Bên B</strong></p>
  <ul>
    <li>Nhận đúng xe và các giấy tờ liên quan đến xe theo Hợp đồng này;</li>
    <li>Sửa chữa xe trong trường hợp cấp thiết và yêu cầu Bên A thanh toán chi phí hợp lý làm gia tăng giá trị của xe thuê. Trong trường hợp này, Bên B phải thông báo trước cho Bên A về tình trạng xe đang gặp phải và những vấn đề cần khắc phục trước khi tiến hành sửa chữa;</li>
    <li>Yêu cầu Bên A đổi xe nếu giao xe không đúng như thỏa thuận, sửa chữa nếu xe có hư hỏng do lỗi của Bên A và bồi thường thiệt hại nếu Bên A chậm giao hoặc giao xe không đúng như thỏa thuận;</li>
    <li>Yêu cầu Bên A cung cấp hóa đơn, giấy tờ thể hiện chi phí sửa chữa trong trường hợp Bên B gây ra sự cố làm giảm giá trị của xe và Bên A thay mặt làm việc với nhà bảo hiểm, gara;</li>
    <li>Đơn phương chấm dứt Hợp đồng và yêu cầu bồi thường thiệt hại nếu Bên A thực hiện các hành vi sau: giao xe không đúng thời hạn như thỏa thuận (trừ trường hợp bất khả kháng: mưa bão, dịch bệnh…, bên nào viện dẫn thì bên đó có nghĩa vụ chứng minh; trường hợp giao xe chậm gây thiệt hại cho Bên B thì phải bồi thường); xe có khuyết tật dẫn đến Bên B không đạt được mục đích thuê mà Bên B không biết; xe có tranh chấp về quyền sở hữu giữa Bên A và Bên thứ ba mà Bên B không biết, dẫn đến Bên B không xác lập được mục đích sử dụng xe trong quá trình thuê như đã thỏa thuận.</li>
  </ul>
  <p><strong>2. Nghĩa vụ của Bên B</strong></p>
  <ul>
    <li>Cung cấp và tự chịu trách nhiệm về các thông tin nhân thân cần thiết theo nội dung ở phần đầu Hợp đồng và Giấy phép lái xe của mình;</li>
    <li>Kiểm tra kỹ xe trước khi nhận và trước khi hoàn trả xe. Quay chụp tình trạng xe để làm căn cứ, đồng thời ký xác nhận biên bản bàn giao về tình trạng xe khi nhận và khi hoàn trả;</li>
    <li>Thanh toán đầy đủ tiền thuê xe cho Bên A khi nhận xe;</li>
    <li>Kiểm tra kỹ tư trang, tài sản cá nhân của mình trước khi trả xe, đảm bảo không để quên, thất lạc đồ trên xe;</li>
    <li>Đối với trường hợp các bên thỏa thuận về thế chấp tài sản, Bên B cung cấp tài sản thế chấp trước khi nhận xe và chịu trách nhiệm pháp lý về nguồn gốc, quyền sở hữu của tài sản thế chấp bao gồm: Passport và tiền mặt 20 triệu đồng/xe máy kèm giấy đăng ký xe hoặc theo thỏa thuận giữa 2 Bên được ghi nhận vào Biên bản bàn giao xe;</li>
    <li>Tuân thủ quy định trả xe như đã được ký kết trong Hợp đồng. Thời gian thuê xe được tính từ lúc Bên B nhận xe đến khi Bên B trả xe và ký xong Biên bản bàn giao. Nếu trả xe không đúng thời hạn, Bên B sẽ phải trả thêm tiền phụ trội và số tiền trả thêm sẽ được tính theo giờ như quy định tại Điều 3 của Hợp đồng này;</li>
    <li>Bên B chịu trách nhiệm đền bù mọi thất thoát về phụ tùng, phụ kiện của xe: đền bù 100% theo giá phụ tùng chính hãng nếu tráo đổi linh kiện, phụ tùng; chịu 100% chi phí sửa chữa xe nếu có xảy ra hỏng hóc tùy theo mức độ hư tổn của chiếc xe đó, địa điểm sửa chữa theo sự chỉ định của Bên A hoặc 2 Bên tự thỏa thuận. Các ngày xe nghỉ không chạy được do lỗi của Bên B thì Bên B phải trả tiền hoàn toàn trong các ngày đó, giá được tính bằng giá thuê trong Hợp đồng (hoặc các bên có thỏa thuận khác). Ngoài ra, nếu xe trong tình trạng không được sạch sẽ, Bên B sẽ phải chịu thêm khoản phí vệ sinh xe (hoặc tùy 2 Bên tự thỏa thuận);</li>
    <li>Đặt cọc một khoản tiền khi tiến hành trả xe nếu chủ xe yêu cầu để khắc phục hư hỏng, trầy xước xe trong chuyến đi. Các bên ghi nhận nội dung trong Biên bản bàn giao để làm căn cứ;</li>
    <li>Mọi chi phí đi lại, ăn ở của Bên A để giải quyết việc do lỗi của Bên B gây ra, Bên B phải chịu hoàn toàn;</li>
    <li>Nghiêm túc chấp hành đúng luật giao thông đường bộ. Tự chịu trách nhiệm dân sự, hình sự trong suốt thời gian thuê xe. Có nghĩa vụ thanh toán chi phí xăng dầu, cầu phà, bến bãi, tiền phạt nóng, tiền phạt nguội theo các lỗi mà luật pháp Việt Nam quy định. Nếu có phát sinh bất cứ chi phí nào tại thời điểm Bên B thuê xe, Bên B vẫn phải chịu chi phí đó mặc dù Hợp đồng đã thanh lý. Bên A sẽ căn cứ vào giờ đi và ngày đi trong Hợp đồng đã ký cùng với giấy phạt nguội làm bằng chứng để giải quyết sai phạm;</li>
    <li>Tuyệt đối không sử dụng xe cho các hành vi trái pháp luật: cầm cố, đua xe, chở hàng lậu, hàng cấm, cho người khác thuê lại… Không giao tay lái cho người không đủ năng lực hành vi, không có GPLX từ B1 trở lên. Trường hợp Bên A có căn cứ thấy rằng Bên B có dấu hiệu vi phạm thì Bên A có quyền đơn phương chấm dứt Hợp đồng, đồng thời sẽ thông báo với cơ quan công an để truy tìm xe. Bên B phải hoàn toàn chịu trách nhiệm hình sự trước pháp luật và chịu các phí tổn phát sinh khác.</li>
  </ul>

  <h2>Điều 6: Điều khoản chung</h2>
  <ul>
    <li>Hợp đồng này, Biên bản bàn giao và các phụ lục bổ sung Hợp đồng (nếu có) là bộ phận không tách rời của Hợp đồng; các Bên phải có nghĩa vụ thực hiện, cam kết thi hành đúng các điều khoản của Hợp đồng; không Bên nào tự ý đơn phương sửa đổi, đình chỉ hoặc hủy bỏ Hợp đồng. Mọi sự vi phạm phải được xử lý theo pháp luật;</li>
    <li>Hai Bên nghiêm chỉnh thực hiện các điều khoản của Hợp đồng này. Trong trường hợp có sự thay đổi, phải thông báo cho nhau bằng văn bản trước ít nhất 03 (ba) ngày kể từ ngày dự kiến giao xe;</li>
    <li>Trong quá trình thực hiện Hợp đồng, nếu có vấn đề phát sinh, các Bên sẽ cùng bàn bạc giải quyết trên tinh thần hợp tác và tôn trọng lợi ích của cả hai Bên, được thể hiện bằng văn bản. Nếu không giải quyết được thì đưa ra Tòa án nhân dân có thẩm quyền để giải quyết. Bên thua kiện sẽ chịu toàn bộ chi phí;</li>
    <li>Hợp đồng này được chấm dứt khi Bên B hoàn trả xe cho Bên A, được Bên A chấp nhận và thanh toán các chi phí liên quan. Hai bên đồng ý ký vào biên bản bàn giao xe;</li>
    <li>Hợp đồng có hiệu lực kể từ ngày hai Bên ký Hợp đồng;</li>
    <li>Hợp đồng được lập thành 02 (hai) bản, mỗi Bên giữ một bản và có giá trị như nhau.</li>
  </ul>

  <p class="thanks">- Trong quá trình di chuyển, có bất kỳ vấn đề hay sự cố gì, xin vui lòng liên hệ với chủ xe đầu tiên.
  Không giao xe cho người khác lái. Nếu có thay đổi lộ trình, vui lòng nhắn tin báo ngay với chủ xe.
  Trường hợp xe thay đổi lộ trình không thông báo với chủ xe sẽ bị hủy hợp đồng ngay tức khắc.
  Xe sẽ được thu hồi và bên thuê sẽ phải chịu mọi chi phí phát sinh về vấn đề thu hồi xe.</p>
  <p class="thanks">- Cảm ơn quý khách đã sử dụng dịch vụ của nhà xe Kim Bảo An. Trân trọng!
  Liên hệ khẩn cấp: ${esc(PARTY_A.emergency)}</p>

  <table class="sign-table">
    <tr>
      <td>
        <strong>Bên A – Chủ xe</strong><br>
        <em>(Ký, ghi rõ họ tên)</em>
        <p class="sign-name">${esc(PARTY_A.name)}</p>
      </td>
      <td>
        <strong>Bên B – Khách thuê xe</strong><br>
        <em>(Ký, ghi rõ họ tên)</em>
        <p class="sign-name">${esc(customerName)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Mở cửa sổ in hợp đồng đã điền thông tin
  window.printContract = function (booking) {
    const win = window.open("", "_blank");
    if (!win) {
      alert("Trình duyệt đã chặn cửa sổ bật lên. Hãy cho phép popup để in hợp đồng.");
      return;
    }
    win.document.write(buildContractHtml(booking));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };
})();
