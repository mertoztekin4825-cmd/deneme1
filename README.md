# Yeşil Market

Yeşil Market, Express ve EJS kullanılarak geliştirilmiş, SQLite üzerinde çalışan organik ürünler temalı örnek bir e-ticaret uygulamasıdır.

## Özellikler

- Express + EJS tabanlı sunucu tarafı render
- Kullanıcı kayıt, giriş, çıkış akışı (bcrypt ile şifreleme)
- Sepet, ödeme, sipariş takip ekranları
- Reklam yönetimi ve anasayfada banner/yan reklam alanları
- Basit yönetim paneli ile ürün ve reklam CRUD işlemleri
- CSRF koruması, helmet ile temel güvenlik başlıkları
- better-sqlite3 ile kurulum gerektirmeyen SQLite veritabanı
- Responsive ve yeşil tonlara sahip arayüz

## Kurulum

Projeyi çalıştırmak için Node.js 18+ sürümü önerilir.

```bash
npm install
npm run db:reset
npm start
```

Uygulama varsayılan olarak `http://0.0.0.0:3000` adresinde çalışır.

## Giriş Bilgileri

Örnek kullanıcılar seed verisi ile birlikte gelir:

- Yönetici: `admin@yesilmarket.com` / `password`
- Müşteri: `ayse@yesilmarket.com` / `password`

## Dizim

```
yesil-market/
├── index.js
├── package.json
├── README.md
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── yesilmarket.sqlite (npm run db:reset ile oluşturulur)
├── public/
│   ├── css/style.css
│   ├── js/app.js
│   └── img/
├── scripts/reset-db.js
└── views/
    ├── layout.ejs
    ├── partials/
    ├── pages/
    └── admin/
```

## Notlar

- Oturumlar hafızada tutulur, üretimde kalıcı bir session store kullanılması önerilir.
- Varsayılan şifreleri değiştirerek canlı ortam öncesi güvenlik artırılmalıdır.
- Multer ile yüklenen görseller `public/img` klasörüne kaydedilir.
