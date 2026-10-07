# هيكل المشروع (Project Structure)

المشروع Next.js (App Router) + TypeScript صارم + Firebase. الهيكل مبني على **Feature-based + Clean Architecture خفيفة (Ports & Adapters)**: الكود التجاري (القواعد وحالات الاستخدام) مستقل تماماً عن Next.js وعن Firebase، فيمكن اختباره بدون أي منهما، ويمكن استبدال Firebase لاحقاً بدون إعادة كتابة المنطق.

## 1) الشجرة الكاملة

```
hulol-tech/
├─ src/
│  ├─ app/                                   # طبقة العرض: التوجيه فقط (Next.js App Router)
│  │  ├─ [locale]/                           # ar (الافتراضي) | en
│  │  │  ├─ layout.tsx                       # dir/lang، الخطوط، Navbar، Footer، WhatsAppFloat، CookieBanner
│  │  │  ├─ page.tsx                         # الرئيسية
│  │  │  ├─ services/[slug]/page.tsx         # web | mobile | design
│  │  │  ├─ for/[segment]/page.tsx           # smes | startups | agencies | enterprise
│  │  │  ├─ work/page.tsx
│  │  │  ├─ work/[slug]/page.tsx
│  │  │  ├─ process/page.tsx
│  │  │  ├─ start/page.tsx                   # Wizard طلب المشروع
│  │  │  ├─ consultation/page.tsx
│  │  │  ├─ about/page.tsx
│  │  │  └─ (legal)/privacy|terms|cookies/page.tsx
│  │  ├─ portal/                             # بوابة العميل (المرحلة 2)
│  │  │  ├─ login/page.tsx
│  │  │  ├─ proposals/[id]/page.tsx
│  │  │  ├─ projects/[id]/page.tsx
│  │  │  └─ support/page.tsx
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ leads/page.tsx                   # جدول + Kanban
│  │  │  ├─ leads/[id]/page.tsx
│  │  │  ├─ proposals/ ...                   # المرحلة 2
│  │  │  ├─ projects/ ...                    # المرحلة 2
│  │  │  ├─ tickets/ ...                     # المرحلة 2
│  │  │  └─ analytics/page.tsx
│  │  ├─ api/
│  │  │  ├─ leads/route.ts                   # POST: يستدعي use-case فقط
│  │  │  ├─ consultations/route.ts
│  │  │  └─ health/route.ts
│  │  ├─ sitemap.ts  robots.ts  opengraph-image.tsx  not-found.tsx  error.tsx
│  │  └─ globals.css
│  │
│  ├─ features/                              # كل ميزة وحدة مستقلة (الأساس في المشروع)
│  │  ├─ leads/
│  │  │  ├─ domain/                          # كيانات وقواعد نقية، بدون أي استيراد من مكتبات خارجية
│  │  │  │  ├─ lead.ts                       # Lead entity + LeadStatus + قواعد الانتقال بين الحالات
│  │  │  │  ├─ lead.errors.ts
│  │  │  │  └─ lead-status.machine.ts
│  │  │  ├─ application/                     # حالات الاستخدام (use-cases) + المنافذ (ports)
│  │  │  │  ├─ ports.ts                      # LeadWriter, LeadReader, Notifier, Clock, IdGenerator
│  │  │  │  ├─ create-lead.usecase.ts
│  │  │  │  ├─ change-lead-status.usecase.ts
│  │  │  │  └─ list-leads.usecase.ts
│  │  │  ├─ infrastructure/                  # المحولات (adapters)
│  │  │  │  ├─ firestore-lead.repository.ts
│  │  │  │  └─ in-memory-lead.repository.ts  # للاختبارات
│  │  │  ├─ ui/                              # مكونات الميزة (Wizard, LeadsTable, LeadKanban)
│  │  │  ├─ schemas.ts                       # Zod: صيغة الإدخال عند الحدود
│  │  │  └─ index.ts                         # الواجهة العامة الوحيدة للميزة
│  │  ├─ consultations/        (نفس الطبقات)
│  │  ├─ proposals/            (المرحلة 2)
│  │  ├─ projects/             (المرحلة 2)
│  │  ├─ tickets/              (المرحلة 2)
│  │  ├─ content/              # خدمات، دراسات حالة، آراء العملاء، أسئلة شائعة
│  │  ├─ analytics/            # تعريف الأحداث + المزودات (GA4, Clarity, Pixels)
│  │  ├─ notifications/        # قنوات الإشعار: email, telegram, whatsapp-link
│  │  └─ auth/                 # أدوار الأدمن والعميل
│  │
│  ├─ components/                            # مكونات مشتركة لا تعرف شيئاً عن الميزات
│  │  ├─ ui/                   # Button, Input, Select, Card, Badge, Modal, Tabs, Toast
│  │  ├─ layout/               # Navbar, Footer, LangSwitch, WhatsAppFloat, CookieBanner
│  │  ├─ sections/             # Hero, Services, Work, Testimonials, Process, FAQ, FinalCta
│  │  └─ icons/                # أغلفة Lucide فقط (بدون إيموجي)
│  │
│  ├─ lib/                                   # أدوات عامة بدون منطق تجاري
│  │  ├─ container.ts          # Composition Root: ربط المنافذ بالمحولات (DI يدوي)
│  │  ├─ firebase/             # client.ts (متصفح) | admin.ts (server-only)
│  │  ├─ env.ts                # قراءة والتحقق من المتغيرات (Zod)، يفشل عند الإقلاع لو ناقصة
│  │  ├─ result.ts             # Result<T,E> بدل رمي الاستثناءات في المنطق
│  │  ├─ whatsapp.ts           # buildWaLink(locale, context)
│  │  ├─ phone.ts              # تطبيع الأرقام السعودية E.164
│  │  └─ rate-limit.ts
│  │
│  ├─ i18n/
│  │  ├─ routing.ts  request.ts
│  │  └─ messages/ ar.json  en.json            # كل النصوص هنا، لا نصوص ثابتة في المكونات
│  │
│  ├─ config/                                 # بيانات ثابتة قابلة للتعديل بدون لمس المنطق
│  │  ├─ site.ts  segments.ts  services.ts  process.ts  cost-factors.ts  seo.ts
│  │
│  ├─ styles/ tokens.css                       # متغيرات التصميم (من Design System)
│  └─ types/ global.d.ts
│
├─ functions/                                  # Cloud Functions (بيئة مستقلة)
│  ├─ src/ on-lead-created.ts  sla-monitor.ts  followup-reminders.ts  index.ts
│  └─ package.json  tsconfig.json
│
├─ tests/
│  ├─ unit/            # domain + use-cases (بدون Firebase)
│  ├─ integration/     # Firestore Emulator: repositories + rules
│  └─ e2e/             # Playwright: رحلة الطلب ar/en على الجوال وسطح المكتب
│
├─ public/ { icons/nav-logo.png, images/, fonts/ }
├─ firebase.json  firestore.rules  firestore.indexes.json  storage.rules  .firebaserc
├─ .env.example  .env.local (غير مرفوع)
├─ eslint.config.mjs  prettier.config.mjs  tsconfig.json  next.config.ts  tailwind.config.ts
├─ playwright.config.ts  vitest.config.ts  middleware.ts
└─ .github/workflows/ ci.yml  deploy-preview.yml
```

## 2) قواعد الاعتماد (Dependency Rule)

الاتجاه الوحيد المسموح للاستيراد:

```
app (التوجيه)  ->  features/*/ui  ->  features/*/application  ->  features/*/domain
                                              ^
              features/*/infrastructure  ----+   (يطبّق المنافذ، ويُربط في lib/container.ts فقط)
```

| الطبقة | يسمح لها تستورد | ممنوع تستورد |
|---|---|---|
| `domain` | لا شيء (TypeScript نقي) | Next, React, Firebase, Zod, أي مكتبة |
| `application` | `domain` فقط | Firebase، Next، React |
| `infrastructure` | `application` (المنافذ) + `domain` + Firebase | React، Next |
| `ui` | `application` (عبر `index.ts`)، `components` | `infrastructure` مباشرة |
| `app` | `features/*/index.ts`، `components`، `lib/container` | `domain` الداخلي لميزة أخرى |
| ميزة ← ميزة أخرى | عبر `index.ts` العام فقط | استيراد من داخل مجلد ميزة أخرى |

تُفرض هذه القواعد آلياً بـ `eslint-plugin-boundaries` (أو `eslint-plugin-import` مع `no-restricted-paths`) في CI، وأي مخالفة تفشل البناء.

## 3) قواعد التسمية والملفات

- الملفات: `kebab-case`. المكونات: `PascalCase` داخل ملف `kebab-case`. الأنواع والواجهات: `PascalCase`. الدوال والمتغيرات: `camelCase`. الثوابت: `UPPER_SNAKE_CASE`.
- لاحقة الدور: `*.usecase.ts`, `*.repository.ts`, `*.schema.ts`, `*.errors.ts`, `*.test.ts`.
- ملف واحد = مسؤولية واحدة. الحد الأقصى المرن: 200 سطر للملف، 40 سطر للدالة، 5 معاملات للدالة (أكثر من كده نمرر كائن).
- كل ميزة لها `index.ts` يصدّر الواجهة العامة فقط، وما عداه خاص.
- Server Components افتراضياً. `"use client"` فقط عند الحاجة لحالة أو أحداث متصفح، وبأصغر مكوّن ممكن.
- كل ملف server فقط يبدأ بـ `import "server-only"`.

## 4) مجلد `config/` بدل الشروط (If/else)

أي محتوى يتغير بتغير الشريحة أو الخدمة (عناوين، مراحل، أسئلة، حقول) يكون **بيانات** في `config/` وليس شروطاً في المكونات. مثال: إضافة شريحة جديدة = إضافة عنصر في `segments.ts` + نصوص في `messages/*.json`، بدون تعديل أي مكوّن.

## 5) المتغيرات (Environment)

`lib/env.ts` يقرأ ويتحقق بـ Zod ويفصل بين `NEXT_PUBLIC_*` (متصفح) والأسرار (server فقط). أي متغير ناقص يوقف التطبيق عند الإقلاع برسالة واضحة. القائمة الكاملة في `07-starter-files/config/.env.example`.
