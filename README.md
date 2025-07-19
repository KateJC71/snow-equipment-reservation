# 雪具預約系統

一個現代化的雪具預約網站，提供用戶友好的介面來預約滑雪裝備。

## 功能特色

- 🎿 雪具預約管理
- 👤 用戶註冊與登入
- 📅 預約日期選擇
- 📊 庫存管理
- 📱 響應式設計
- 🔐 安全的身份驗證

## 技術棧

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query

### 後端
- Node.js
- Express
- TypeScript
- SQLite
- JWT 認證
- bcrypt 密碼加密

## 快速開始

1. 安裝依賴：
```bash
npm run install:all
```

2. 啟動開發伺服器：
```bash
npm run dev
```

3. 開啟瀏覽器訪問：
- 前端：http://localhost:5173
- 後端 API：http://localhost:3000

## 專案結構

```
├── frontend/          # React 前端應用
├── backend/           # Node.js 後端 API
├── package.json       # 根目錄配置
└── README.md         # 專案說明
```

## 開發

- `npm run dev` - 同時啟動前後端開發伺服器
- `npm run build` - 建置生產版本
- `npm run dev:frontend` - 僅啟動前端
- `npm run dev:backend` - 僅啟動後端 