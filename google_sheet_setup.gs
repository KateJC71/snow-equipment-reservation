/**
 * 雪具預約系統 - Google Sheet 自動建立腳本
 * 執行此腳本會自動建立完整的欄位結構
 */

function createReservationSheet() {
  // 搜尋或創建 SnowGearOrders 試算表
  let spreadsheet;
  let sheet;
  
  try {
    // 先嘗試取得活躍的試算表
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    console.log('📊 使用活躍試算表:', spreadsheet.getName());
  } catch (e) {
    // 如果沒有活躍的試算表，搜尋 SnowGearOrders
    console.log('🔍 搜尋 SnowGearOrders 檔案...');
    const files = DriveApp.getFilesByName('SnowGearOrders');
    if (files.hasNext()) {
      const file = files.next();
      spreadsheet = SpreadsheetApp.openById(file.getId());
      console.log('✅ 找到 SnowGearOrders 試算表');
    } else {
      // 創建新的試算表
      spreadsheet = SpreadsheetApp.create('SnowGearOrders');
      console.log('✅ 創建新的 SnowGearOrders 試算表');
    }
  }
  
  // 取得或創建 orders 工作表
  sheet = spreadsheet.getSheetByName('orders');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('orders');
    console.log('✅ 創建新的 orders 工作表');
  } else {
    console.log('📋 使用現有的 orders 工作表');
  }
  
  // 清空現有內容
  sheet.clear();
  
  // 定義所有欄位標題
  const headers = [
    // 基本預約資訊
    '預約編號', '預約日期', '租借日期', '歸還日期', '取件日期', '取件時間', '租借地點', '歸還地點', '租借天數', '甲地租乙地還',
    
    // 申請人資料
    '申請人姓名', '申請人電話', '申請人Email', '通訊軟體類型', '通訊軟體ID', '住宿飯店', '接送需求', '總金額'
  ];
  
  // 為每個租借者添加欄位 (最多10人)
  for (let i = 1; i <= 10; i++) {
    const renterHeaders = [
      `租借者${i}_姓名`, `租借者${i}_年齡`, `租借者${i}_性別`, `租借者${i}_身高`, `租借者${i}_體重`,
      `租借者${i}_腳尺寸`, `租借者${i}_滑雪程度`, `租借者${i}_滑雪種類`, `租借者${i}_雪板類型`,
      `租借者${i}_裝備類型`, `租借者${i}_雪衣選項`, `租借者${i}_安全帽`, `租借者${i}_Fase快穿`
    ];
    headers.push(...renterHeaders);
  }
  
  // 系統資訊
  headers.push('備註', '最後更新');
  
  // 寫入標題列
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題列格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // 設定欄寬
  for (let i = 1; i <= headers.length; i++) {
    if (headers[i-1].includes('姓名') || headers[i-1].includes('Email') || headers[i-1].includes('飯店')) {
      sheet.setColumnWidth(i, 200);
    } else if (headers[i-1].includes('價格') || headers[i-1].includes('費用') || headers[i-1].includes('小計')) {
      sheet.setColumnWidth(i, 120);
    } else if (headers[i-1].includes('備註')) {
      sheet.setColumnWidth(i, 300);
    } else {
      sheet.setColumnWidth(i, 100);
    }
  }
  
  // 設定資料驗證 (下拉選單)
  setupDataValidation(sheet, headers);
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  // 設定自動編號公式
  setupAutoNumbering(sheet);
  
  // 設定自動計算公式
  setupAutoCalculation(sheet, headers);
  
  Logger.log('Google Sheet 結構建立完成！');
}

/**
 * 設定資料驗證 (下拉選單)
 */
function setupDataValidation(sheet, headers) {
  // 租借地點/歸還地點
  const locationColumns = headers.map((header, index) => header.includes('地點') ? index + 1 : null).filter(col => col);
  locationColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['富良野店', '旭川店'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 性別欄位
  const genderColumns = headers.map((header, index) => header.includes('性別') ? index + 1 : null).filter(col => col);
  genderColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['男', '女'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 滑雪程度
  const skillColumns = headers.map((header, index) => header.includes('滑雪程度') ? index + 1 : null).filter(col => col);
  skillColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['初學者', '中級', '高級'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 滑雪種類
  const typeColumns = headers.map((header, index) => header.includes('滑雪種類') ? index + 1 : null).filter(col => col);
  typeColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['雙板', '單板'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 裝備類型
  const equipmentColumns = headers.map((header, index) => header.includes('裝備類型') ? index + 1 : null).filter(col => col);
  equipmentColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['大全配', '板靴組', '單租雪板', '單租雪靴'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 雪衣選項
  const clothingColumns = headers.map((header, index) => header.includes('雪衣選項') ? index + 1 : null).filter(col => col);
  clothingColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['單租雪衣', '單租雪褲', '租一整套(雪衣及雪褲)', '否'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 安全帽/Fase快穿
  const yesNoColumns = headers.map((header, index) => 
    (header.includes('安全帽') || header.includes('Fase快穿')) ? index + 1 : null
  ).filter(col => col);
  yesNoColumns.forEach(col => {
    const range = sheet.getRange(2, col, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['是', '否'], true)
      .setAllowInvalid(false)
      .build();
    range.setDataValidation(rule);
  });
  
  // 移除狀態欄位驗證
}

/**
 * 設定自動編號
 */
function setupAutoNumbering(sheet) {
  // 在 A2 設定自動編號公式
  const formula = '=IF(ROW()=2, "RSV"&TEXT(NOW(), "YYYYMMDD")&"001", IF(ROW()>2, "RSV"&TEXT(NOW(), "YYYYMMDD")&TEXT(ROW()-1, "000"), ""))';
  sheet.getRange(2, 1).setFormula(formula);
}

/**
 * 設定自動計算公式
 */
function setupAutoCalculation(sheet, headers) {
  // 找到各欄位的位置
  const getColumnIndex = (headerName) => headers.indexOf(headerName) + 1;
  
  // 移除小計公式設定（已移除價格相關欄位）
  
  // 移除裝備費用小計公式設定（已移除小計欄位）
  
  // 移除總金額公式設定（總金額現在直接從前端傳送）
  
  // 移除幣值和狀態預設值設定
}

/**
 * 建立 Web API 接收預約資料 - 簡化版本
 */
function doPost(e) {
  console.log('🚀 doPost 函數開始執行');
  
  try {
    // 解析接收到的資料
    console.log('📦 接收到的原始資料:', e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    console.log('✅ 資料解析成功');
    
    // 直接使用你的試算表 ID
    const SPREADSHEET_ID = '1ybiFGyWJhm8tM4jhjMZy6W6zWa5tBPXpfEj9yZca8x8';
    console.log('📊 嘗試打開試算表 ID:', SPREADSHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ 成功打開試算表:', spreadsheet.getName());
    
    // 取得 orders 工作表
    let sheet = spreadsheet.getSheetByName('orders');
    if (!sheet) {
      console.log('⚠️  orders 工作表不存在，使用第一個工作表');
      sheet = spreadsheet.getSheets()[0];
    }
    console.log('✅ 使用工作表:', sheet.getName());
    
    // 使用從後端傳來的預約編號
    const reservationId = data.reservation_number || data.reservation_id || generateFallbackReservationId();
    
    // 建立完整的表頭和資料陣列
    const headers = [
      '預約編號', '預約日期', '租借日期', '歸還日期', '取件日期', '取件時間', '租借地點', '歸還地點', '租借天數', '甲地租乙地還',
      '申請人姓名', '申請人電話', '申請人Email', '通訊軟體類型', '通訊軟體ID', '住宿飯店', '接送需求', '總金額'
    ];
    
    // 添加租借者欄位
    for (let i = 1; i <= 10; i++) {
      headers.push(
        `租借者${i}_姓名`, `租借者${i}_年齡`, `租借者${i}_性別`, `租借者${i}_身高`, `租借者${i}_體重`,
        `租借者${i}_腳尺寸`, `租借者${i}_滑雪程度`, `租借者${i}_滑雪種類`, `租借者${i}_雪板類型`,
        `租借者${i}_裝備類型`, `租借者${i}_雪衣選項`, `租借者${i}_安全帽`, `租借者${i}_Fase快穿`
      );
    }
    
    // 添加系統欄位
    headers.push('備註', '最後更新');
    
    // 準備基本資料行
    const rowData = new Array(headers.length).fill('');
    
    // 填寫基本預約資訊
    console.log('🔍 檢查日期資料:');
    console.log('  - rentalDate:', data.rentalDate);
    console.log('  - returnDate:', data.returnDate);
    console.log('  - start_date:', data.start_date);
    console.log('  - end_date:', data.end_date);
    
    rowData[headers.indexOf('預約編號')] = reservationId;
    rowData[headers.indexOf('預約日期')] = new Date();
    rowData[headers.indexOf('租借日期')] = data.rentalDate || data.start_date || new Date();
    rowData[headers.indexOf('歸還日期')] = data.returnDate || data.end_date || new Date();
    rowData[headers.indexOf('取件日期')] = data.pickup_date || data.pickupDate || '';
    rowData[headers.indexOf('取件時間')] = data.pickup_time || data.pickupTime || '';
    rowData[headers.indexOf('租借地點')] = data.pickupLocation || '富良野店';
    rowData[headers.indexOf('歸還地點')] = data.returnLocation || '富良野店';
    rowData[headers.indexOf('租借天數')] = data.rentalDays || 1;
    rowData[headers.indexOf('甲地租乙地還')] = (data.pickupLocation !== data.returnLocation) ? '是' : '否';
    
    // 填寫申請人資訊
    rowData[headers.indexOf('申請人姓名')] = data.applicant?.name || '';
    rowData[headers.indexOf('申請人電話')] = data.applicant?.phone || '';
    rowData[headers.indexOf('申請人Email')] = data.applicant?.email || '';
    rowData[headers.indexOf('通訊軟體類型')] = data.applicant?.messagingApp?.type || 'Email';
    rowData[headers.indexOf('通訊軟體ID')] = data.applicant?.messagingApp?.id || data.applicant?.email || '';
    rowData[headers.indexOf('住宿飯店')] = data.applicant?.hotel || '';
    rowData[headers.indexOf('接送需求')] = data.applicant?.transportation?.required ? 
      (data.applicant.transportation.details && data.applicant.transportation.details.length > 0 ? 
        data.applicant.transportation.details.join('、') : '需要接送') : '不須接送';
    rowData[headers.indexOf('總金額')] = data.totalAmount || '';
    
    // 填寫租借者資料
    if (data.renters && Array.isArray(data.renters)) {
      data.renters.forEach((renter, index) => {
        if (index < 10) { // 最多10人
          const prefix = `租借者${index + 1}_`;
          rowData[headers.indexOf(prefix + '姓名')] = renter.name || '';
          rowData[headers.indexOf(prefix + '年齡')] = renter.age || '';
          rowData[headers.indexOf(prefix + '性別')] = renter.gender || '';
          rowData[headers.indexOf(prefix + '身高')] = renter.height || '';
          rowData[headers.indexOf(prefix + '體重')] = renter.weight || '';
          rowData[headers.indexOf(prefix + '腳尺寸')] = renter.shoeSize || '';
          rowData[headers.indexOf(prefix + '滑雪程度')] = renter.skillLevel || '';
          rowData[headers.indexOf(prefix + '滑雪種類')] = renter.skiType || '';
          rowData[headers.indexOf(prefix + '雪板類型')] = renter.boardType || '';
          rowData[headers.indexOf(prefix + '裝備類型')] = renter.equipmentType || '';
          rowData[headers.indexOf(prefix + '雪衣選項')] = renter.clothingOption || '';
          rowData[headers.indexOf(prefix + '安全帽')] = renter.helmet ? '是' : '否';
          rowData[headers.indexOf(prefix + 'Fase快穿')] = renter.fase ? '是' : '否';
        }
      });
    }
    
    // 填寫系統欄位
    rowData[headers.indexOf('最後更新')] = new Date();
    
    console.log('✅ 資料準備完成，準備寫入試算表');
    
    // 寫入新的一行
    const lastRow = sheet.getLastRow() + 1;
    console.log('📝 寫入第', lastRow, '行');
    
    sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
    console.log('✅ 資料寫入成功');
    
    // 回傳成功訊息
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '預約資料已成功儲存',
        reservationId: reservationId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ doPost 錯誤:', error);
    console.error('❌ 錯誤堆疊:', error.stack);
    
    // 回傳錯誤訊息
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '儲存失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 準備要寫入試算表的資料
 */
function prepareRowData(data) {
  // 直接定義標題，避免調用 getHeaders()
  const headers = [
    '預約編號', '預約日期', '租借日期', '歸還日期', '取件日期', '取件時間', '租借地點', '歸還地點', '租借天數', '甲地租乙地還',
    '申請人姓名', '申請人電話', '申請人Email', '通訊軟體類型', '通訊軟體ID', '住宿飯店', '接送需求', '總金額'
  ];
  
  // 添加租借者欄位
  for (let i = 1; i <= 10; i++) {
    headers.push(
      `租借者${i}_姓名`, `租借者${i}_年齡`, `租借者${i}_性別`, `租借者${i}_身高`, `租借者${i}_體重`,
      `租借者${i}_腳尺寸`, `租借者${i}_滑雪程度`, `租借者${i}_滑雪種類`, `租借者${i}_雪板類型`,
      `租借者${i}_裝備類型`, `租借者${i}_雪衣選項`, `租借者${i}_安全帽`, `租借者${i}_Fase快穿`
    );
  }
  
  // 添加系統欄位
  headers.push('備註', '最後更新');
  
  const rowData = new Array(headers.length).fill('');
  
  // 基本預約資訊
  try {
    rowData[headers.indexOf('預約編號')] = generateReservationId();
    rowData[headers.indexOf('預約日期')] = new Date();
    rowData[headers.indexOf('租借日期')] = data.rentalDate ? new Date(data.rentalDate) : new Date();
    rowData[headers.indexOf('歸還日期')] = data.returnDate ? new Date(data.returnDate) : new Date();
    rowData[headers.indexOf('取件日期')] = data.pickup_date || data.pickupDate || '';
    rowData[headers.indexOf('取件時間')] = data.pickup_time || data.pickupTime || '';
    rowData[headers.indexOf('租借地點')] = data.pickupLocation || '富良野店';
    rowData[headers.indexOf('歸還地點')] = data.returnLocation || '富良野店';
    rowData[headers.indexOf('租借天數')] = data.rentalDays || 1;
    rowData[headers.indexOf('甲地租乙地還')] = (data.pickupLocation !== data.returnLocation) ? '是' : '否';
    console.log('✅ 基本預約資訊處理完成');
  } catch (err) {
    console.error('❌ 基本預約資訊處理錯誤:', err);
  }
  
  // 申請人資料
  rowData[headers.indexOf('申請人姓名')] = data.applicant.name;
  rowData[headers.indexOf('申請人電話')] = data.applicant.phone;
  rowData[headers.indexOf('申請人Email')] = data.applicant.email;
  rowData[headers.indexOf('通訊軟體類型')] = data.applicant.messagingApp.type;
  rowData[headers.indexOf('通訊軟體ID')] = data.applicant.messagingApp.id;
  rowData[headers.indexOf('住宿飯店')] = data.applicant.hotel;
  rowData[headers.indexOf('接送需求')] = data.applicant.transportation.required ? 
    (data.applicant.transportation.details && data.applicant.transportation.details.length > 0 ? 
      data.applicant.transportation.details.join('、') : '需要接送') : '不須接送';
  rowData[headers.indexOf('總金額')] = data.totalAmount || '';
  
  // 租借者資料
  data.renters.forEach((renter, index) => {
    if (index < 10) { // 最多10人
      const prefix = `租借者${index + 1}_`;
      rowData[headers.indexOf(prefix + '姓名')] = renter.name;
      rowData[headers.indexOf(prefix + '年齡')] = renter.age;
      rowData[headers.indexOf(prefix + '性別')] = renter.gender;
      rowData[headers.indexOf(prefix + '身高')] = renter.height;
      rowData[headers.indexOf(prefix + '體重')] = renter.weight;
      rowData[headers.indexOf(prefix + '腳尺寸')] = renter.shoeSize;
      rowData[headers.indexOf(prefix + '滑雪程度')] = renter.skillLevel;
      rowData[headers.indexOf(prefix + '滑雪種類')] = renter.skiType;
      rowData[headers.indexOf(prefix + '雪板類型')] = renter.boardType;
      rowData[headers.indexOf(prefix + '裝備類型')] = renter.equipmentType;
      rowData[headers.indexOf(prefix + '雪衣選項')] = renter.clothingOption;
      rowData[headers.indexOf(prefix + '安全帽')] = renter.helmet ? '是' : '否';
      rowData[headers.indexOf(prefix + 'Fase快穿')] = renter.fase ? '是' : '否';
      // 移除價格相關欄位的資料填寫
    }
  });
  
  // 移除費用計算相關欄位
  rowData[headers.indexOf('最後更新')] = new Date();
  
  return rowData;
}

/**
 * 取得標題列
 */
function getHeaders() {
  // 搜尋 SnowGearOrders 檔案和 orders 工作表
  const files = DriveApp.getFilesByName('SnowGearOrders');
  if (files.hasNext()) {
    const file = files.next();
    const spreadsheet = SpreadsheetApp.openById(file.getId());
    const sheet = spreadsheet.getSheetByName('orders') || spreadsheet.getSheets()[0];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  // 如果找不到檔案，返回預設標題
  return ['預約編號', '預約日期', '租借日期', '歸還日期', '租借地點', '歸還地點', '租借天數', '甲地租乙地還', '申請人姓名', '申請人電話', '申請人Email'];
}

/**
 * 產生預約編號 (備用方案)
 */
function generateReservationId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, 'Asia/Tokyo', 'HHmmss');
  return `RSV${dateStr}${timeStr}`;
}

/**
 * 產生備用預約編號 (RSV + 日期 + 001格式)
 */
function generateFallbackReservationId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd');
  const timestamp = now.getTime().toString().slice(-3);
  return `RSV${dateStr}${timestamp}`;
}

/**
 * 為 orders 工作表創建標題列
 */
function createOrdersSheetHeaders(sheet) {
  // 定義所有欄位標題
  const headers = [
    // 基本預約資訊
    '預約編號', '預約日期', '租借日期', '歸還日期', '取件日期', '取件時間', '租借地點', '歸還地點', '租借天數', '甲地租乙地還',
    
    // 申請人資料
    '申請人姓名', '申請人電話', '申請人Email', '通訊軟體類型', '通訊軟體ID', '住宿飯店', '接送需求', '總金額'
  ];
  
  // 為每個租借者添加欄位 (最多10人)
  for (let i = 1; i <= 10; i++) {
    const renterHeaders = [
      `租借者${i}_姓名`, `租借者${i}_年齡`, `租借者${i}_性別`, `租借者${i}_身高`, `租借者${i}_體重`,
      `租借者${i}_腳尺寸`, `租借者${i}_滑雪程度`, `租借者${i}_滑雪種類`, `租借者${i}_雪板類型`,
      `租借者${i}_裝備類型`, `租借者${i}_雪衣選項`, `租借者${i}_安全帽`, `租借者${i}_Fase快穿`
    ];
    headers.push(...renterHeaders);
  }
  
  // 系統資訊
  headers.push('備註', '最後更新');
  
  // 寫入標題列
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題列格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  console.log('✅ orders 工作表標題已設定');
}

/**
 * 為新建立的試算表創建結構
 */
function createReservationSheetStructure(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('orders');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('orders');
  }
  
  // 定義所有欄位標題
  const headers = [
    // 基本預約資訊
    '預約編號', '預約日期', '租借日期', '歸還日期', '取件日期', '取件時間', '租借地點', '歸還地點', '租借天數', '甲地租乙地還',
    
    // 申請人資料
    '申請人姓名', '申請人電話', '申請人Email', '通訊軟體類型', '通訊軟體ID', '住宿飯店', '接送需求', '總金額'
  ];
  
  // 為每個租借者添加欄位 (最多10人)
  for (let i = 1; i <= 10; i++) {
    const renterHeaders = [
      `租借者${i}_姓名`, `租借者${i}_年齡`, `租借者${i}_性別`, `租借者${i}_身高`, `租借者${i}_體重`,
      `租借者${i}_腳尺寸`, `租借者${i}_滑雪程度`, `租借者${i}_滑雪種類`, `租借者${i}_雪板類型`,
      `租借者${i}_裝備類型`, `租借者${i}_雪衣選項`, `租借者${i}_安全帽`, `租借者${i}_Fase快穿`
    ];
    headers.push(...renterHeaders);
  }
  
  // 系統資訊
  headers.push('備註', '最後更新');
  
  // 寫入標題列
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題列格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  console.log('✅ 新試算表結構建立完成');
}

/**
 * 測試用：建立範例資料
 */
function createSampleData() {
  const sampleData = {
    rentalDate: '2024-12-25',
    pickupLocation: '富良野店',
    returnLocation: '旭川店',
    rentalDays: 3,
    applicant: {
      name: '張小明',
      phone: '+886912345678',
      email: 'test@example.com',
      messagingApp: { type: 'Line', id: 'test123' },
      hotel: '富良野王子大飯店',
      transportation: { required: true, details: ['富良野站接送', '飯店接送'] }
    },
    renters: [
      {
        name: '張小明',
        age: 30,
        gender: '男',
        height: 175,
        weight: 70,
        shoeSize: 26.5,
        skillLevel: '中級',
        skiType: '雙板',
        boardType: '一般',
        equipmentType: '大全配',
        clothingOption: '否',
        helmet: true,
        fase: false,
        prices: {
          mainEquipment: 8000,
          boots: 0,
          clothing: 0,
          helmet: 1000,
          fase: 0,
          subtotal: 9000
        }
      }
    ],
    totalEquipmentCost: 9000,
    locationChangeFee: 2000,
    totalAmount: 11000
  };
  
  // 模擬 POST 請求
  const mockEvent = {
    postData: {
      contents: JSON.stringify(sampleData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
} 