import { Request, Response } from 'express';
import { Database } from 'sqlite3';

// 驗證折扣碼
export const validateDiscountCode = (req: Request, res: Response) => {
  const { code } = req.body;
  
  if (!code) {
    return res.json({ valid: false, message: '請輸入折扣碼' });
  }
  
  const db = new Database('./reservations.db');
  
  const query = `
    SELECT * FROM discount_codes 
    WHERE code = ? 
    AND active = 1 
    AND (valid_from IS NULL OR date('now') >= valid_from)
    AND (valid_until IS NULL OR date('now') <= valid_until)
    AND (usage_limit IS NULL OR used_count < usage_limit)
  `;
  
  db.get(query, [code], (err, row: any) => {
    if (err) {
      console.error('折扣碼驗證錯誤:', err);
      return res.status(500).json({ valid: false, message: '驗證失敗' });
    }
    
    if (row) {
      res.json({
        valid: true,
        discountType: row.discount_type,
        discountValue: row.discount_value,
        name: row.name,
        message: `折扣碼有效！${row.discount_type === 'percentage' ? 
          `享有 ${row.discount_value}% 折扣` : 
          `減免 ¥${row.discount_value}`}`
      });
    } else {
      res.json({ valid: false, message: '折扣碼無效或已過期' });
    }
    
    db.close();
  });
};

// 計算折扣後價格
export const applyDiscount = (req: Request, res: Response) => {
  const { code, originalAmount } = req.body;
  
  if (!code || !originalAmount) {
    return res.json({ 
      originalAmount: originalAmount || 0, 
      discountAmount: 0, 
      finalAmount: originalAmount || 0 
    });
  }
  
  const db = new Database('./reservations.db');
  
  const query = `
    SELECT * FROM discount_codes 
    WHERE code = ? 
    AND active = 1 
    AND (valid_from IS NULL OR date('now') >= valid_from)
    AND (valid_until IS NULL OR date('now') <= valid_until)
    AND (usage_limit IS NULL OR used_count < usage_limit)
  `;
  
  db.get(query, [code], (err, row: any) => {
    if (err || !row) {
      return res.json({ 
        originalAmount, 
        discountAmount: 0, 
        finalAmount: originalAmount 
      });
    }
    
    let discountAmount = 0;
    if (row.discount_type === 'percentage') {
      discountAmount = Math.round(originalAmount * (row.discount_value / 100));
    } else {
      discountAmount = Math.min(row.discount_value, originalAmount);
    }
    
    const finalAmount = originalAmount - discountAmount;
    
    res.json({
      originalAmount,
      discountAmount,
      finalAmount,
      discountInfo: {
        code: row.code,
        name: row.name,
        type: row.discount_type,
        value: row.discount_value
      }
    });
    
    db.close();
  });
};

// 記錄折扣碼使用
export const recordDiscountUsage = (
  reservationId: number, 
  discountCode: string, 
  originalAmount: number, 
  discountAmount: number, 
  finalAmount: number
) => {
  return new Promise<void>((resolve, reject) => {
    const db = new Database('./reservations.db');
    
    // 先取得折扣碼ID
    db.get(
      'SELECT id FROM discount_codes WHERE code = ?', 
      [discountCode], 
      (err, row: any) => {
        if (err || !row) {
          db.close();
          return resolve(); // 沒有折扣碼就直接完成
        }
        
        const discountCodeId = row.id;
        
        // 記錄使用情況
        db.run(
          `INSERT INTO reservation_discounts 
           (reservation_id, discount_code_id, original_amount, discount_amount, final_amount) 
           VALUES (?, ?, ?, ?, ?)`,
          [reservationId, discountCodeId, originalAmount, discountAmount, finalAmount],
          function(err) {
            if (err) {
              console.error('記錄折扣使用失敗:', err);
              db.close();
              return reject(err);
            }
            
            // 更新使用次數
            db.run(
              'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?',
              [discountCodeId],
              (err) => {
                db.close();
                if (err) {
                  console.error('更新折扣碼使用次數失敗:', err);
                  return reject(err);
                }
                resolve();
              }
            );
          }
        );
      }
    );
  });
};