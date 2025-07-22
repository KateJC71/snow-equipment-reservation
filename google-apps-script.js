// Google Apps Script for Snow Equipment Reservation System
// 支持折扣碼功能 - R列
// 使用方法：複製此代碼到 Google Apps Script (script.google.com) 並替換 Spreadsheet ID

function doPost(e) {
  try {
    console.log('📨 收到 POST 請求');
    
    var data = JSON.parse(e.postData.contents);
    console.log('📦 接收到的資料:', JSON.stringify(data, null, 2));
    
    if (data.test) {
      console.log('🔍 測試連接請求');
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script 連接正常'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 請將此處的 Spreadsheet ID 替換為你的 Google Sheets ID
    var spreadsheet = SpreadsheetApp.openById('1ybiFGyWJhm8tM4jhjMZy6W6zWa5tBPXpfEj9yZca8x8');
    var sheet = spreadsheet.getActiveSheet();
    
    var reservationId = data.reservation_number || generateReservationNumber();
    
    var applicantName = '';
    var applicantPhone = '';
    var applicantEmail = '';
    var messagingApp = '';
    var hotel = '';
    var transportation = '';
    
    if (data.applicant) {
      applicantName = data.applicant.name || '';
      applicantPhone = data.applicant.phone || '';
      applicantEmail = data.applicant.email || '';
      
      if (data.applicant.messagingApp) {
        messagingApp = data.applicant.messagingApp.type + ': ' + data.applicant.messagingApp.id;
      }
      
      hotel = data.applicant.hotel || '';
      
      if (data.applicant.transportation) {
        if (data.applicant.transportation.required) {
          transportation = data.applicant.transportation.details.join(', ');
        } else {
          transportation = '不須接送';
        }
      }
    }
    
    var rentersData = formatRentersData(data.renters || []);
    
    var rowData = [
      reservationId,                                    // A列: 預約編號
      data.rentalDate || '',                           // B列: 租借日期
      data.returnDate || '',                           // C列: 歸還日期
      data.pickup_date || '',                          // D列: 取件日期  
      data.pickup_time || '',                          // E列: 取件時間
      data.pickupLocation || '富良野店',                // F列: 取件地點
      data.returnLocation || '富良野店',                // G列: 歸還地點
      data.rentalDays || 1,                           // H列: 租借天數
      applicantName,                                  // I列: 申請人姓名
      applicantPhone,                                 // J列: 申請人電話
      applicantEmail,                                 // K列: 申請人Email
      messagingApp,                                   // L列: 通訊軟體
      hotel,                                          // M列: 飯店
      transportation,                                 // N列: 接送需求
      rentersData,                                    // O列: 租借者資料
      data.totalAmount || 0,                          // P列: 總金額
      data.originalAmount || data.totalAmount || 0,    // Q列: 原始金額
      data.discountCode || '',                        // R列: 折扣碼
      new Date().toISOString()                        // S列: 建立時間
    ];
    
    console.log('📝 準備寫入的資料:', rowData);
    
    sheet.appendRow(rowData);
    
    console.log('✅ 資料已成功寫入 Google Sheets');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '預約資料已成功儲存到 Google Sheets',
      reservationId: reservationId,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('❌ Google Apps Script 錯誤:', error);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '儲存資料時發生錯誤: ' + error.toString(),
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function generateReservationNumber() {
  var now = new Date();
  var year = now.getFullYear().toString().substr(-2);
  var month = String(now.getMonth() + 1).padStart(2, '0');
  var day = String(now.getDate()).padStart(2, '0');
  var hour = String(now.getHours()).padStart(2, '0');
  var minute = String(now.getMinutes()).padStart(2, '0');
  var random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return 'SR' + year + month + day + hour + minute + random;
}

function formatRentersData(renters) {
  if (!renters || renters.length === 0) {
    return '';
  }
  
  var result = [];
  for (var i = 0; i < renters.length; i++) {
    var renter = renters[i];
    var subtotal = 0;
    if (renter.prices) {
      subtotal = renter.prices.subtotal || 0;
    }
    
    var renterInfo = '第' + (i + 1) + '位: ' + 
                    (renter.name || '未提供') + ' (' + 
                    (renter.age || '未知') + '歲, ' + 
                    (renter.gender || '未指定') + ', ' + 
                    (renter.height || '未知') + 'cm, ' + 
                    (renter.weight || '未知') + 'kg, 鞋號:' + 
                    (renter.shoeSize || '未知') + ', ' + 
                    (renter.equipmentType || '未指定') + ', ¥' + subtotal + ')';
                    
    result.push(renterInfo);
  }
  
  return result.join('\n');
}

function createReservationSheet() {
  try {
    console.log('🏗️ 初始化預約表格標題');
    
    // 請將此處的 Spreadsheet ID 替換為你的 Google Sheets ID
    var spreadsheet = SpreadsheetApp.openById('1ybiFGyWJhm8tM4jhjMZy6W6zWa5tBPXpfEj9yZca8x8');
    var sheet = spreadsheet.getActiveSheet();
    
    // 檢查是否已經有標題行
    var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var hasHeaders = firstRow.some(function(cell) { return cell !== ''; });
    
    if (!hasHeaders) {
      console.log('📝 添加表格標題');
      
      var headers = [
        '預約編號',      // A列
        '租借日期',      // B列
        '歸還日期',      // C列
        '取件日期',      // D列
        '取件時間',      // E列
        '取件地點',      // F列
        '歸還地點',      // G列
        '租借天數',      // H列
        '申請人姓名',    // I列
        '申請人電話',    // J列
        '申請人Email',   // K列
        '通訊軟體',      // L列
        '飯店',         // M列
        '接送需求',      // N列
        '租借者資料',    // O列
        '總金額',       // P列
        '原始金額',      // Q列
        '折扣碼',       // R列
        '建立時間'       // S列
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 設置標題行格式
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      
      console.log('✅ 表格標題已設置完成');
    } else {
      console.log('ℹ️ 表格標題已存在，跳過初始化');
    }
    
    return '表格初始化完成';
    
  } catch (error) {
    console.error('❌ 初始化表格失敗:', error);
    return '初始化失敗: ' + error.toString();
  }
}

function testFunction() {
  console.log('🧪 測試 Google Apps Script 功能');
  
  var testData = {
    reservation_number: 'TEST001',
    rentalDate: '2025-01-01',
    returnDate: '2025-01-03',
    pickup_date: '2025-01-01',
    pickup_time: '09:00',
    pickupLocation: '富良野店',
    returnLocation: '富良野店',
    rentalDays: 3,
    applicant: {
      name: '測試用戶',
      phone: '+81 90-1234-5678',
      email: 'test@example.com',
      messagingApp: {
        type: 'Line',
        id: 'testuser123'
      },
      hotel: '測試飯店',
      transportation: {
        required: true,
        details: ['飯店到雪具店', '雪具店到雪場']
      }
    },
    renters: [
      {
        name: '測試租借者',
        age: 30,
        gender: '男',
        height: 175,
        weight: 70,
        shoeSize: 27,
        equipmentType: '大全配',
        prices: {
          subtotal: 5000
        }
      }
    ],
    totalAmount: 5000,
    originalAmount: 6000,
    discountCode: 'TEST2025'
  };
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  var result = doPost(mockEvent);
  console.log('📤 測試結果:', result.getContent());
}