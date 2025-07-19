import axios from 'axios';

interface RenterData {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  shoeSize: number;
  skillLevel: string;
  skiType: string;
  boardType: string;
  equipmentType: string;
  clothingOption: string;
  helmet: boolean;
  fase: boolean;
  prices: {
    mainEquipment: number;
    boots: number;
    clothing: number;
    helmet: number;
    fase: number;
    subtotal: number;
  };
}

interface ApplicantData {
  name: string;
  phone: string;
  email: string;
  messagingApp: {
    type: string;
    id: string;
  };
  hotel: string;
  transportation: {
    required: boolean;
    details: string[];
  };
}

interface ReservationData {
  reservation_number?: string;
  rentalDate: string;
  returnDate: string;
  pickup_date?: string;
  pickup_time?: string;
  pickupLocation: string;
  returnLocation: string;
  rentalDays: number;
  applicant: ApplicantData;
  renters: RenterData[];
  totalEquipmentCost: number;
  locationChangeFee: number;
  totalAmount: number;
}

class GoogleSheetsService {
  private gasUrl: string;

  constructor() {
    this.gasUrl = '';
    this.initializeUrl();
  }

  private initializeUrl() {
    this.gasUrl = process.env.GOOGLE_SHEETS_URL || '';
    if (!this.gasUrl) {
      console.warn('⚠️  GOOGLE_SHEETS_URL not configured. Google Sheets integration disabled.');
    } else {
      console.log('✅ Google Sheets URL configured:', this.gasUrl);
    }
  }

  private ensureUrlLoaded() {
    if (!this.gasUrl) {
      this.initializeUrl();
    }
  }

  async sendReservationToSheets(reservationData: ReservationData): Promise<boolean> {
    this.ensureUrlLoaded();
    if (!this.gasUrl) {
      console.log('📝 Google Sheets URL not configured, skipping sheets integration');
      return false;
    }

    try {
      console.log('📊 Sending reservation data to Google Sheets...');
      
      console.log('📤 Sending data to Google Sheets URL:', this.gasUrl);
      console.log('📦 Data being sent:', JSON.stringify(reservationData, null, 2));
      console.log('🔍 Data type check:');
      console.log('  - applicant exists:', !!reservationData.applicant);
      console.log('  - applicant.name:', reservationData.applicant?.name);
      console.log('  - rentalDate:', reservationData.rentalDate);
      console.log('  - returnDate:', reservationData.returnDate);
      console.log('  - pickupLocation:', reservationData.pickupLocation);
      
      const response = await axios.post(
        this.gasUrl,
        reservationData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📨 Google Sheets response:', response.data);
      
      if (response.data?.success) {
        console.log('✅ Reservation data successfully sent to Google Sheets');
        console.log('📋 Reservation ID:', response.data.reservationId);
        return true;
      } else {
        console.error('❌ Google Sheets returned error:', response.data?.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to send data to Google Sheets:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('⏱️  Request timeout - Google Sheets may be slow');
        } else if (error.response) {
          console.error('📨 Response status:', error.response.status);
          console.error('📨 Response data:', error.response.data);
        } else if (error.request) {
          console.error('🌐 No response received from Google Sheets');
        }
      }
      
      return false;
    }
  }

  // Convert your current reservation format to GAS expected format
  convertReservationToGASFormat(
    reservationData: any, 
    frontendData: any, 
    equipmentData: any
  ): ReservationData {
    // Calculate rental days (包含開始和結束日期)
    const startDate = new Date(reservationData.start_date);
    const endDate = new Date(reservationData.end_date);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create applicant data from frontend
    const applicant: ApplicantData = {
      name: frontendData.applicant?.name || '',
      phone: `${frontendData.applicant?.countryCode || ''} ${frontendData.applicant?.phone || ''}`.trim(),
      email: frontendData.applicant?.email || '',
      messagingApp: {
        type: frontendData.applicant?.messenger || 'Email',
        id: frontendData.applicant?.messengerId || frontendData.applicant?.email || ''
      },
      hotel: frontendData.applicant?.hotel || '',
      transportation: {
        required: frontendData.applicant?.shuttleMode === 'need',
        details: frontendData.applicant?.shuttle || []
      }
    };

    // Process all participants (up to 10)
    const renters: RenterData[] = [];
    const participants = frontendData.persons || [];
    const detailData = frontendData.detail || [];
    
    for (let i = 0; i < Math.min(participants.length, 10); i++) {
      const person = participants[i];
      const personDetail = detailData[i] || {};
      
      // Use actual prices from frontend calculation
      const mainEquipmentPrice = personDetail.main || 0;
      const helmetPrice = personDetail.helmet || 0;
      const fasePrice = personDetail.fase || 0;
      const clothingPrice = personDetail.clothing || 0;
      const bootPrice = personDetail.boots || 0;
      const crossPrice = personDetail.cross || 0;
      
      const subtotal = personDetail.subtotal || (mainEquipmentPrice + helmetPrice + fasePrice + clothingPrice + bootPrice + crossPrice);

      const renter: RenterData = {
        name: person.name || `參加者${i + 1}`,
        age: person.age || 25,
        gender: person.gender || '未指定',
        height: person.height || 170,
        weight: person.weight || 65,
        shoeSize: person.footSize || 26,
        skillLevel: person.level || '中級',
        skiType: person.skiType || '雙板',
        boardType: person.boardType || '一般',
        equipmentType: person.equipType || '大全配',
        clothingOption: person.clothingType || '否',
        helmet: person.helmetOnly === '是',
        fase: person.fastWear === '是',
        prices: {
          mainEquipment: mainEquipmentPrice,
          boots: bootPrice,
          clothing: clothingPrice,
          helmet: helmetPrice,
          fase: fasePrice,
          subtotal: subtotal
        }
      };
      
      renters.push(renter);
    }

    // 使用前端傳來的總金額，如果沒有則從詳細資料計算
    let totalAmount = reservationData.total_price || 0;
    
    // 如果總金額為 0，嘗試從前端詳細資料計算
    if (totalAmount === 0 && frontendData.detail && Array.isArray(frontendData.detail)) {
      totalAmount = frontendData.detail.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
      console.log('🧮 Calculated total from detail:', totalAmount);
    }
    
    // 如果還是 0，使用前端的 price 欄位
    if (totalAmount === 0 && frontendData.price) {
      totalAmount = frontendData.price;
      console.log('🧮 Using frontend price:', totalAmount);
    }

    console.log('💰 Final total amount for Google Sheets:', totalAmount);

    return {
      reservation_number: reservationData.reservation_number, // 傳遞預約號碼
      rentalDate: reservationData.start_date,
      returnDate: reservationData.end_date,
      pickup_date: reservationData.pickup_date, // 加入取件日期
      pickup_time: reservationData.pickup_time, // 加入取件時間
      pickupLocation: reservationData.pickupLocation || '富良野店',
      returnLocation: reservationData.returnLocation || '富良野店',
      rentalDays,
      applicant,
      renters,
      totalEquipmentCost: totalAmount, // 使用前端計算的總金額
      locationChangeFee: 0, // 不再單獨計算
      totalAmount: totalAmount
    };
  }

  // Test connection to Google Sheets
  async testConnection(): Promise<boolean> {
    this.ensureUrlLoaded();
    if (!this.gasUrl) {
      console.log('📝 Google Sheets URL not configured');
      return false;
    }

    try {
      // Send a simple test request
      const testData = {
        test: true,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(this.gasUrl, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log('🔗 Google Sheets connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export { ReservationData, ApplicantData, RenterData };