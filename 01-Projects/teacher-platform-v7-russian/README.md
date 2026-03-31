# 🇷🇺 Russian Plugins for Teacher's Command Center v7

> **Adding VK, Telegram, Yandex.Zen, and Odnoklassniki to the existing v7 blueprint**

---

## 🎯 Corrected Context

**Original v7 Blueprint (Confirmed):**
- ✅ ClassIn (live streaming - primary)
- ✅ Canva (design)
- ✅ Skool (community)
- ✅ Twinkl (worksheets)
- ✅ Pinterest (pinning)
- ✅ Social Share (X, FB, IG, TikTok, LinkedIn)
- ✅ paricall (optional privacy)
- ✅ ICP Phase 2 (ckUSDC, governance)

**ADDITIONS (This File):**
- 🆕 VKontakte (VK)
- 🆕 Telegram (enhanced)
- 🆕 Yandex.Zen
- 🆕 Odnoklassniki (OK.ru)

---

## 📁 Files

| File | Description |
|------|-------------|
| `RUSSIAN_PLUGINS.md` | Complete plugin specs + code for VK, Telegram, Yandex.Zen, OK.ru |

---

## 🔌 Quick Integration

### 1. Update Types
```typescript
// packages/shared/src/types/platform.ts
// Add Russian types (see RUSSIAN_PLUGINS.md)
```

### 2. Update Feature Flags
```typescript
// apps/web/lib/feature-flags.ts
// Add Russian plugin flags (all true for Phase 1)
```

### 3. Add API Routes
```typescript
// apps/web/app/api/content/vk/route.ts
// apps/web/app/api/content/telegram/route.ts
// apps/web/app/api/content/yandex-zen/route.ts
// apps/web/app/api/content/odnoklassniki/route.ts
```

### 4. Update Content Studio UI
```tsx
// Add Russian plugins to plugin grid
```

---

## 🌍 Why Russian Platforms?

| Platform | Users | Why It Matters |
|----------|-------|----------------|
| **VK** | 70M | Russia's Facebook — essential |
| **Telegram** | 50M | Secure, parent communication |
| **Yandex.Zen** | 90M | Content discovery & SEO |
| **Odnoklassniki** | 45M | Parents (30+ demographic) |

---

## ✅ No Changes to v7 Core

- Same project structure
- Same 8 priority files
- Same deployment plan
- Same warm color palette
- Same Phase 1/Phase 2 split
- Just **4 additional plugins**

---

**See `RUSSIAN_PLUGINS.md` for complete implementation.**
