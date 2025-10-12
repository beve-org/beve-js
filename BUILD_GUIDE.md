# BEVE-JS Build & NPM Setup Guide

## 📦 Proje Yapısı

Beve-js projesi şu ana bileşenlerden oluşur:

- **src/**: TypeScript kaynak kodları
  - `index.ts`: Ana export noktası
  - `encoder.ts`: BEVE encoding mantığı
  - `decoder.ts`: BEVE decoding mantığı
  - `writer.ts`: Buffer yazma yardımcıları
  - `utils.ts`: Yardımcı fonksiyonlar
  - `benchmark.ts`: Performans testleri

- **dist/**: Build edilmiş JavaScript dosyaları (npm'de yayınlanır)
- **examples/**: Kullanım örnekleri

## 🛠️ Build Süreci

### 1. Dependencies Yükleme

```bash
npm install
```

Yüklenen paketler:
- `typescript`: TypeScript derleyici
- `tsx`: TypeScript execution tool (development)
- `@types/node`: Node.js tip tanımları

### 2. Build Komutları

```bash
# Tam build (ES modules + CommonJS)
npm run build

# Sadece temizlik
npm run clean

# Watch mode (development)
npm run watch
```

### 3. Build Çıktıları

Build işlemi iki format üretir:

- **ES Modules**: `dist/*.js` - Modern import/export syntax
- **CommonJS**: `dist/cjs/*.js` - require() syntax için

## 📊 Benchmark Çalıştırma

### Development Mode

```bash
npm run benchmark
```

Bu komut TypeScript kaynak kodlarını direkt çalıştırır (tsx kullanarak).

### Production Mode

```bash
npm run benchmark:prod
```

Bu komut önce build yapar, sonra compiled JavaScript'i çalıştırır.

## 📝 NPM Package Hazırlama

### 1. Package.json Ayarları

- **name**: `@beve-org/beve` (scoped package)
- **version**: `1.0.0`
- **main**: `dist/index.js` (ES module entry)
- **types**: `dist/index.d.ts` (TypeScript tanımları)
- **files**: Sadece `dist/` klasörü npm'de yayınlanır

### 2. NPM'e Yayınlama

```bash
# İlk kez yayınlamadan önce npm'e giriş yap
npm login

# Package'ı yayınla
npm publish --access public

# Scoped package olduğu için --access public gerekli
```

### 3. Package Versiyonlama

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Otomatik olarak git tag oluşturur
```

## 🧪 Test ve Doğrulama

### Build Testi

```bash
# Build yap
npm run build

# Benchmark çalıştır (test amaçlı)
npm run benchmark:prod

# Manual test
node dist/benchmark.js
```

### Package İçeriği Kontrolü

```bash
# Package'ın neyi içerdiğini görmek için
npm pack --dry-run

# Gerçek .tgz dosyası oluştur
npm pack

# Lokal test için kurulum
npm install ./beve-org-beve-1.0.0.tgz
```

## 📄 Dosya Yapısı

```
beve-js/
├── src/                    # Kaynak kodlar (npm'de yayınlanmaz)
│   ├── index.ts
│   ├── encoder.ts
│   ├── decoder.ts
│   ├── writer.ts
│   ├── utils.ts
│   └── benchmark.ts
├── dist/                   # Build çıktısı (npm'de yayınlanır)
│   ├── *.js               # ES modules
│   ├── *.d.ts             # Type definitions
│   ├── *.js.map           # Source maps
│   └── cjs/               # CommonJS build
│       ├── *.js
│       └── package.json   # {"type": "commonjs"}
├── examples/              # Kullanım örnekleri
│   └── basic-usage.ts
├── package.json           # NPM metadata
├── tsconfig.json          # TypeScript config
├── .npmignore            # NPM'den hariç tutulacaklar
├── .gitignore            # Git'ten hariç tutulacaklar
└── README.md             # Dökümantasyon
```

## 🔍 Önemli Notlar

### ES Modules vs CommonJS

Proje hem ES modules hem de CommonJS'i destekler:

```javascript
// ES modules (modern)
import { readBeve, writeBeve } from '@beve-org/beve';

// CommonJS (legacy)
const { readBeve, writeBeve } = require('@beve-org/beve');
```

### TypeScript Support

Package tam TypeScript desteği içerir:
- `.d.ts` dosyaları otomatik üretilir
- Source maps debug için mevcuttur
- Type-safe kullanım garantilidir

### Benchmark Komutları

```bash
# Development (TypeScript kaynak)
npm run benchmark

# Production (compiled JavaScript)
npm run benchmark:prod

# CLI tool olarak (npm install -g sonrası)
beve-benchmark
```

## 🚀 Production Checklist

Publish etmeden önce:

- [ ] `npm run build` başarılı
- [ ] `npm run benchmark` çalışıyor
- [ ] README.md güncel
- [ ] package.json version doğru
- [ ] LICENSE dosyası mevcut
- [ ] .npmignore yapılandırılmış
- [ ] Git repo temiz (committed)
- [ ] Test edilmiş (lokal npm install)

## 📚 Ek Kaynaklar

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [BEVE Specification](https://github.com/stephenberry/beve)
