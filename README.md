# 📦 MobDev – Full Stack Inventory Management System

MobDev, **mobil odaklı, full-stack bir stok ve envanter yönetim sistemi**dir.
Proje, üniversite **Mobile Development (MobDev)** dersi kapsamında geliştirilmiştir.

Uygulama; ürün, tedarikçi, stok hareketleri ve bildirimlerin yönetimini sağlar.
Mobil istemci **offline-first** çalışır ve sunucu ile senkronize olur.

---

## 🎯 Proje Amaçları

* Profesyonel mobil uygulama geliştirme sürecini deneyimlemek
* Full-stack mimari (Mobile + Backend + Database) kurmak
* Rol bazlı yetkilendirme (RBAC) uygulamak
* Offline veri yönetimi ve senkronizasyonu gerçekleştirmek
* Gerçek dünyaya uygun bir **Inventory Management System** geliştirmek

---

## 🧱 Proje Mimarisi

Bu proje **monorepo** yapısı kullanır.

```
MobDev/
│
├── src/                    # React Native (Expo) Mobile App
│   ├── screens/
│   ├── navigation/
│   ├── context/
│   ├── db/
│   ├── services/
│   └── utils/
│
├── mobdev-backend/          # Node.js + Express Backend
│   ├── src/
│   │   ├── auth/
│   │   ├── modules/
│   │   ├── users/
│   │   └── index.ts
│   └── prisma/
│
├── README.md
└── package.json
```

---

## 📱 Mobile App (Frontend)

### Teknolojiler

* **React Native**
* **Expo**
* **TypeScript**
* **React Navigation**
* **React Native Paper**
* **SQLite (expo-sqlite)**

### Özellikler

* Kullanıcı kayıt & giriş
* Rol bazlı arayüz (Admin / Manager / Staff)
* Ürün ekleme, listeleme
* Tedarikçi yönetimi
* Barkod okuma (kamera)
* Offline çalışma
* Sunucu ile manuel ve otomatik senkronizasyon
* Bildirim sistemi
* CSV rapor export

---

## 🖥 Backend API

### Teknolojiler

* **Node.js**
* **Express**
* **TypeScript**
* **Prisma ORM**
* **JWT Authentication**
* **PostgreSQL**

### Özellikler

* RESTful API
* JWT tabanlı kimlik doğrulama
* Rol bazlı yetkilendirme
* Ürün / tedarikçi / stok / kullanıcı yönetimi
* Senkronizasyon endpointleri
* Global error handling

---

## 🐘 Veritabanı

* **PostgreSQL**
* Docker üzerinde çalışır
* Prisma ile yönetilir

### Docker ile PostgreSQL çalıştırma

```bash
docker run -d \
  --name mobdev-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 51214:5432 \
  postgres:16
```

---

## ⚙️ Kurulum ve Çalıştırma

### 1️⃣ Backend

```bash
cd mobdev-backend
npm install
npx prisma migrate dev
npx prisma generate
npx ts-node-dev src/index.ts
```

Backend çalıştığında:

```
API on http://localhost:5000
```

Health check:

```
GET http://localhost:5000/api/health
```

---

### 2️⃣ Frontend (Mobil)

```bash
npm install
npx expo start -c
```

* QR kod ile gerçek cihazda test edilebilir
* Android Emulator veya iOS Simulator desteklenir

---

## 🔐 Kullanıcı Rolleri

| Rol     | Yetkiler                         |
| ------- | -------------------------------- |
| Admin   | Kullanıcı yönetimi, tüm modüller |
| Manager | Ürün & tedarikçi yönetimi        |
| Staff   | Görüntüleme ve sınırlı işlemler  |

---

## 🔄 Senkronizasyon Mantığı

* Mobil uygulama offline çalışır
* SQLite üzerinde lokal veri tutulur
* Sunucuya:

  * **Upload (local → server)**
  * **Download (server → local)**
* Çakışmalar ownerUserId üzerinden yönetilir

---

## 🧪 Test Edilen Senaryolar

* Offline ürün ekleme
* Barkod okutma
* Rol bazlı ekran görünürlüğü
* Çoklu kullanıcı izolasyonu
* Sunucu bağlantı kopma / geri gelme
* Docker + Prisma migration

---

## 🎓 Akademik Bilgiler

* Ders: **Mobile Development**
* Üniversite: **Hasan Kalyoncu University**
* Bölüm: **Software Engineering**
* Proje Türü: **Bitirme / Dönem Projesi**

---

## 👨‍💻 Geliştirici

**Uygar Ali Göçmen**
Software Engineering
React Native & Full-Stack Developer

---

## 📌 Not

Bu proje eğitim amaçlı geliştirilmiştir.
Gerçek üretim ortamı için ek güvenlik, performans ve ölçeklendirme önlemleri gereklidir.
