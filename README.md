# CHECK-IN XE & SU KIEN DU LICH

Web app check-in su kien du lich noi bo cho Danko Group. App ho tro CBNV tu check-in theo so dien thoai va Admin diem danh nhanh theo tung hoat dong.

## Cong nghe

- React
- TypeScript
- Vite
- Tailwind CSS
- xlsx de import/export Excel
- localStorage cho ban hien tai

## Cai dat

```bash
npm install
npm run dev
```

## Bien moi truong

Tao file `.env.local` tren may local:

```text
VITE_ADMIN_PIN=your-admin-pin
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Khong commit `.env.local` len GitHub.

## Deploy Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Them cac bien moi truong tren Vercel:

```text
VITE_ADMIN_PIN
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Luu y

Ban hien tai dang luu du lieu check-in tren trinh duyet. Khi dung production cho su kien that, nen ket noi Supabase de du lieu tap trung va dong bo giua nhieu thiet bi.
