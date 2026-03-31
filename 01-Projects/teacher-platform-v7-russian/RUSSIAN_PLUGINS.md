# 🇷🇺 Russian Platform Plugins for Teacher's Command Center v7

> **Adding Russian platforms to the v7 blueprint — minimal, clean integration**

---

## 🎯 Scope (Fits v7 Exactly)

**Original v7 Plugins:**
- ✅ ClassIn (live)
- ✅ Canva (design)
- ✅ Skool (community)
- ✅ Twinkl (worksheets)
- ✅ Pinterest (pinning)
- ✅ Social Share (X, FB, IG, TikTok, LinkedIn)

**NEW Russian Additions:**
- 🆕 **VKontakte (VK)** — Russia's Facebook (social sharing + live)
- 🆕 **Telegram** — Messaging + Channels (global but huge in Russia)
- 🆕 **Yandex.Zen** — Content publishing platform
- 🆕 **Odnoklassniki (OK.ru)** — Social network (older demographic)

---

## 📦 Plugin Specifications

### 1. VKontakte (VK) Plugin

**Purpose**: Russia's largest social network — 70M+ users

**Features**:
- Share lessons to VK wall
- Post to VK Groups (teacher communities)
- VK Live streaming (alternative to ClassIn for Russian teachers)
- VK Pay integration (Phase 2 funding option)

**API**: VK API v5.131+ (https://vk.com/dev/manuals)

```typescript
// types/platform.ts addition
interface VKShareData {
  message: string;
  attachments?: string;  // Link to lesson/content
  lat?: number;          // Optional: location
  long?: number;
}

interface VKLiveStream {
  streamId: string;
  serverUrl: string;
  streamKey: string;
  joinUrl: string;
}
```

**Implementation**:
```typescript
// lib/content-plugins.ts addition
export const vkPlugin = {
  id: 'vk',
  name: 'VKontakte',
  category: 'social',
  icon: 'vk-icon',
  capabilities: ['share', 'live', 'community'],
  
  async share(content: ShareContent): Promise<void> {
    const vkContent: VKShareData = {
      message: `${content.title}\n\n${content.description}`,
      attachments: content.url,
    };
    
    await vkApi.wall.post(vkContent);
  },
  
  async startLive(title: string): Promise<VKLiveStream> {
    const stream = await vkApi.video.startStreaming({ name: title });
    return {
      streamId: stream.id,
      serverUrl: stream.server_url,
      streamKey: stream.stream_key,
      joinUrl: `https://vk.com/video${stream.owner_id}_${stream.id}`,
    };
  },
};
```

---

### 2. Telegram Plugin (Enhanced for Russia)

**Purpose**: Messaging app with 50M+ users in Russia, perfect for parent communication

**Features**:
- **Bot API**: Send notifications to parents
- **Channels**: Broadcast lessons to channel subscribers
- **Groups**: Class group management
- **Mini Apps**: Embedded learning experiences

**API**: Telegram Bot API + Telegram Login Widget

```typescript
// types/platform.ts addition
interface TelegramShareData {
  chatId: string;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: InlineKeyboardMarkup;
}

interface TelegramChannel {
  channelId: string;
  name: string;
  subscriberCount: number;
}
```

**Implementation**:
```typescript
// lib/content-plugins.ts addition
export const telegramPlugin = {
  id: 'telegram',
  name: 'Telegram',
  category: 'communication',
  icon: 'telegram-icon',
  capabilities: ['message', 'broadcast', 'bot', 'mini-app'],
  
  async sendMessage(data: TelegramShareData): Promise<void> {
    await telegramBot.sendMessage(data.chatId, data.text, {
      parse_mode: data.parseMode,
      reply_markup: data.replyMarkup,
    });
  },
  
  async broadcastToChannel(channelId: string, content: ShareContent): Promise<void> {
    const message = `📚 *${content.title}*\n\n${content.description}\n\n[View Lesson](${content.url})`;
    
    await telegramBot.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
    });
  },
  
  // Parent notification system
  async notifyParents(classId: string, message: string): Promise<void> {
    const parents = await getParentsForClass(classId);
    
    for (const parent of parents) {
      if (parent.telegramChatId) {
        await this.sendMessage({
          chatId: parent.telegramChatId,
          text: message,
        });
      }
    }
  },
};
```

---

### 3. Yandex.Zen Plugin

**Purpose**: Content publishing platform (like Medium + News) — 90M monthly users

**Features**:
- Publish lesson articles
- Create educational publications
- SEO-optimized content discovery
- Monetization (Phase 2)

**API**: Yandex.Zen API (https://yandex.com/dev/zen/)

```typescript
// types/platform.ts addition
interface YandexZenArticle {
  title: string;
  content: string;  // HTML or Markdown
  coverImage?: string;
  tags: string[];
  monetization?: boolean;
}

interface ZenPublication {
  publicationId: string;
  url: string;
  views: number;
  revenue?: number;  // If monetized
}
```

**Implementation**:
```typescript
// lib/content-plugins.ts addition
export const yandexZenPlugin = {
  id: 'yandex-zen',
  name: 'Yandex.Zen',
  category: 'content',
  icon: 'zen-icon',
  capabilities: ['publish', 'monetize'],
  
  async publishArticle(article: YandexZenArticle): Promise<ZenPublication> {
    const response = await yandexApi.zen.publish({
      title: article.title,
      content: article.content,
      cover: article.coverImage,
      tags: article.tags,
      monetize: article.monetization ?? false,
    });
    
    return {
      publicationId: response.id,
      url: `https://zen.yandex.ru/media/${response.public_id}`,
      views: 0,
    };
  },
  
  // Convert lesson plan to Zen article
  async convertLessonToArticle(lesson: Lesson): Promise<YandexZenArticle> {
    return {
      title: lesson.title,
      content: `
        <h2>Learning Objectives</h2>
        <ul>${lesson.objectives.map(o => `<li>${o}</li>`).join('')}</ul>
        <h2>Lesson Content</h2>
        <p>${lesson.content}</p>
        <h2>Activities</h2>
        <p>${lesson.activities}</p>
      `,
      tags: [lesson.subject, `grade-${lesson.grade}`, 'education'],
    };
  },
};
```

---

### 4. Odnoklassniki (OK.ru) Plugin

**Purpose**: Social network with 45M users (popular with 30+ demographic — parents!)

**Features**:
- Share to OK feed
- Post to OK Groups
- Target parent demographic specifically

**API**: OK API (https://apiok.ru/)

```typescript
// types/platform.ts addition
interface OKShareData {
  attachment: {
    type: 'link';
    content: string;  // JSON string with link data
  };
  text?: string;
}
```

**Implementation**:
```typescript
// lib/content-plugins.ts addition
export const odnoklassnikiPlugin = {
  id: 'odnoklassniki',
  name: 'Odnoklassniki',
  category: 'social',
  icon: 'ok-icon',
  capabilities: ['share', 'group-post'],
  
  async share(content: ShareContent): Promise<void> {
    const attachment = {
      type: 'link',
      content: JSON.stringify({
        url: content.url,
        title: content.title,
        description: content.description,
        imageUrl: content.imageUrl,
      }),
    };
    
    await okApi.mediatopic.post({
      attachment,
      text: content.title,
    });
  },
};
```

---

## 🔌 Integration into v7 Structure

### Updated types/platform.ts

```typescript
// Add to ContentSource
type ContentSource = 
  | 'uploaded' 
  | 'canva' 
  | 'skool' 
  | 'twinkl' 
  | 'pinterest'
  | 'yandex-zen';  // NEW

// Add to SocialPlatform
type SocialPlatform = 
  | 'native' 
  | 'twitter' 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'whatsapp' 
  | 'email'
  | 'vk'           // NEW
  | 'telegram'     // NEW (enhanced)
  | 'odnoklassniki'; // NEW

// Add Russian-specific types
interface VKData {
  postId: string;
  ownerId: number;
  url: string;
}

interface TelegramData {
  messageId: number;
  chatId: string;
  channelUsername?: string;
}

interface YandexZenData {
  publicationId: string;
  url: string;
  monetizationEnabled: boolean;
}

interface OdnoklassnikiData {
  topicId: string;
  groupId?: string;
  url: string;
}

// Update ContentItem to include Russian plugins
interface ContentItem {
  // ... existing fields ...
  pluginData?: 
    | CanvaData 
    | SkoolData 
    | TwinklData 
    | PinterestData
    | VKData           // NEW
    | TelegramData     // NEW
    | YandexZenData    // NEW
    | OdnoklassnikiData; // NEW
}
```

### Updated lib/feature-flags.ts

```typescript
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Phase 1 (Live)
  phase1LiveStudio: true,
  phase1CanvaPlugin: true,
  phase1SkoolPlugin: true,
  phase1TwinklPlugin: true,
  phase1PinterestPlugin: true,
  phase1SocialShare: true,
  phase1AiAgents: true,
  
  // NEW: Russian Plugins (Phase 1 - enabled)
  phase1VKPlugin: true,
  phase1TelegramPlugin: true,  // Enhanced
  phase1YandexZenPlugin: true,
  phase1OdnoklassnikiPlugin: true,
  
  // Phase 2 (ICP)
  phase2FundingPool: false,
  phase2Governance: false,
  phase2CkUsdc: false,
  
  // NEW: Phase 2 Russian-specific
  phase2VKPay: false,  // Russian payment option
  phase2ZenMonetization: false,  // Yandex.Zen revenue sharing
};
```

### Updated lib/content-plugins.ts

```typescript
// Import Russian plugins
import { vkPlugin } from './plugins/vk';
import { telegramPlugin } from './plugins/telegram';
import { yandexZenPlugin } from './plugins/yandex-zen';
import { odnoklassnikiPlugin } from './plugins/odnoklassniki';

// Plugin registry
export const plugins = {
  // Original v7
  canva: canvaPlugin,
  skool: skoolPlugin,
  twinkl: twinklPlugin,
  pinterest: pinterestPlugin,
  
  // Russian additions
  vk: vkPlugin,
  telegram: telegramPlugin,
  yandexZen: yandexZenPlugin,
  odnoklassniki: odnoklassnikiPlugin,
};

// Get plugins by region
export function getPluginsByRegion(region: 'global' | 'russia' | 'all') {
  if (region === 'global') {
    return [canvaPlugin, skoolPlugin, twinklPlugin, pinterestPlugin];
  }
  if (region === 'russia') {
    return [vkPlugin, telegramPlugin, yandexZenPlugin, odnoklassnikiPlugin];
  }
  return Object.values(plugins);
}
```

### New API Routes

```typescript
// app/api/content/vk/route.ts
export async function POST(req: Request) {
  const { content, action } = await req.json();
  
  if (action === 'share') {
    const result = await vkPlugin.share(content);
    return Response.json({ success: true, data: result });
  }
  
  if (action === 'start-live') {
    const stream = await vkPlugin.startLive(content.title);
    return Response.json({ success: true, data: stream });
  }
}

// app/api/content/telegram/route.ts
export async function POST(req: Request) {
  const { content, action, chatId } = await req.json();
  
  if (action === 'send') {
    await telegramPlugin.sendMessage({ chatId, ...content });
    return Response.json({ success: true });
  }
  
  if (action === 'broadcast') {
    await telegramPlugin.broadcastToChannel(chatId, content);
    return Response.json({ success: true });
  }
}

// app/api/content/yandex-zen/route.ts
export async function POST(req: Request) {
  const { article } = await req.json();
  const publication = await yandexZenPlugin.publishArticle(article);
  return Response.json({ success: true, data: publication });
}

// app/api/content/odnoklassniki/route.ts
export async function POST(req: Request) {
  const { content } = await req.json();
  await odnoklassnikiPlugin.share(content);
  return Response.json({ success: true });
}
```

---

## 🎨 UI Integration (Content Studio)

```tsx
// components/content/PluginGrid.tsx
const plugins = [
  // Original v7
  { id: 'twinkl', name: 'Twinkl', color: 'var(--terracotta)' },
  { id: 'pinterest', name: 'Pinterest', color: 'var(--live)' },
  { id: 'canva', name: 'Canva', color: 'var(--sage)' },
  { id: 'skool', name: 'Skool', color: 'var(--gold)' },
  
  // Russian additions
  { id: 'vk', name: 'VKontakte', color: '#0077FF', region: 'russia' },
  { id: 'telegram', name: 'Telegram', color: '#0088CC', region: 'russia' },
  { id: 'yandex-zen', name: 'Yandex.Zen', color: '#000000', region: 'russia' },
  { id: 'odnoklassniki', name: 'Odnoklassniki', color: '#EE8208', region: 'russia' },
];

// Group by region
<PluginSection title="Global" plugins={plugins.filter(p => !p.region)} />
<PluginSection title="Russia" plugins={plugins.filter(p => p.region === 'russia')} />
```

---

## 🔐 Authentication Setup

### VK OAuth
```typescript
// app/api/auth/vk/route.ts
export async function GET(req: Request) {
  const vkAuthUrl = `https://oauth.vk.com/authorize?
    client_id=${VK_APP_ID}
    &redirect_uri=${CALLBACK_URL}
    &scope=wall,groups,video
    &response_type=code`;
  
  redirect(vkAuthUrl);
}
```

### Telegram Login Widget
```tsx
// components/auth/TelegramLogin.tsx
<script 
  async 
  src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="YourBotName"
  data-size="large"
  data-auth-url="/api/auth/telegram"
/>
```

---

## 📊 Russian Market Context

| Platform | Users | Audience | Use Case |
|----------|-------|----------|----------|
| **VK** | 70M+ | All ages | Primary social network |
| **Telegram** | 50M+ | Tech-savvy | Parent comms, broadcasting |
| **Yandex.Zen** | 90M monthly | Content consumers | SEO, article publishing |
| **Odnoklassniki** | 45M | 30+ (parents!) | Target parent demographic |

**Why These Matter**:
- VK = Facebook alternative (everyone uses it)
- Telegram = Secure messaging (sanctions resilience)
- Zen = Content discovery (organic reach)
- OK = Parents (decision makers for education spending)

---

## ✅ Integration Checklist

- [ ] Add VK API credentials to `.env`
- [ ] Add Telegram Bot token to `.env`
- [ ] Add Yandex OAuth credentials to `.env`
- [ ] Add OK API credentials to `.env`
- [ ] Update `types/platform.ts` with Russian types
- [ ] Update `feature-flags.ts` with Russian flags
- [ ] Create 4 new API routes
- [ ] Add plugin icons to UI
- [ ] Test OAuth flows
- [ ] Add Russian language translations (if needed)

---

**This keeps v7 exactly as specified — just adds 4 Russian platforms seamlessly.** 🇷🇺
