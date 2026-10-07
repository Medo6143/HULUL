# المبادئ الهندسية والقواعد التقنية (Engineering Principles, SOLID, Technical Rules)

هذا الملف هو "الدستور التقني" للمشروع. أي مراجعة كود (Code Review) تقيس عليه. القواعد مصنفة: **[يجب]** إلزامية وتفشل CI، **[يُفضّل]** توصية قوية يحتاج الخروج عنها تبرير مكتوب.

---

## 1) مبادئ عليا

1. **البساطة أولاً (KISS / YAGNI).** لا نبني بوابة العميل في المرحلة 1، ولا طبقة تجريد ما فيها أكتر من تنفيذ واحد وقتها. نضيف التجريد لما يظهر سبب حقيقي، لكن حدود الطبقات (القسم 3) ثابتة من اليوم الأول لأنها رخيصة الآن ومكلفة لاحقاً.
2. **لا تكرار للمعرفة (DRY).** القاعدة التجارية الواحدة تُكتب في مكان واحد (domain). التكرار في الشكل مقبول، التكرار في المعنى مرفوض.
3. **الفشل المبكر والواضح (Fail fast).** التحقق عند الحدود (طلب HTTP، متغيرات البيئة، بيانات Firestore) بـ Zod، وداخل النظام نثق بالأنواع.
4. **الأمان افتراضي (Secure by default).** لا نثق في العميل أبداً. كل قاعدة أمان تُفرض في الخادم وفي Firestore Rules معاً.
5. **المحتوى للعميل أولاً.** أي قرار تقني يضر بالسرعة على الجوال أو بتجربة العربية RTL يُرفض حتى لو كان أنظف في الكود.
6. **قابلية الاختبار شرط قبول.** لو الكود صعب الاختبار، التصميم غلط.

---

## 2) مبادئ SOLID مطبّقة على مشروعنا

### S — مسؤولية واحدة (Single Responsibility)

**القاعدة [يجب]:** الوحدة (ملف/كلاس/دالة) لها سبب واحد للتغيير.

| ما يغيّر | أين يعيش | لا يختلط بـ |
|---|---|---|
| شكل الفورم وتحققه | `schemas.ts` (Zod) | تخزين Firestore |
| قواعد الانتقال بين حالات العميل المحتمل | `lead-status.machine.ts` | واجهة المستخدم |
| تخزين العميل المحتمل | `firestore-lead.repository.ts` | الإيميلات |
| إرسال الإشعارات | `notifications/*` | حفظ البيانات |
| تسجيل الأحداث التحليلية | `analytics/*` | منطق الأعمال |

مثال: `create-lead.usecase.ts` يحفظ الطلب ويطلب الإشعار فقط. لا يعرف شيئاً عن HTTP ولا عن Firestore ولا عن Resend.

### O — مفتوح للتوسعة، مغلق للتعديل (Open/Closed)

**القاعدة [يجب]:** نضيف سلوكاً جديداً بإضافة كود جديد، لا بتعديل كود يعمل.

- **قنوات الإشعار:** واجهة `Notifier` وقائمة قنوات. إضافة Telegram = ملف جديد + تسجيله في `container.ts`، بدون لمس `create-lead.usecase.ts`.
- **مزودو التحليلات:** `AnalyticsProvider` (GA4، Clarity، Meta، Snap، TikTok). إضافة مزود = Adapter جديد.
- **الشرائح والخدمات:** بيانات في `config/` (انظر هيكل المشروع قسم 4).
- **حقول الـ Wizard:** مصفوفة وصف حقول لكل خدمة بدل `switch` ضخم.

### L — استبدال ليسكوف (Liskov Substitution)

**القاعدة [يجب]:** أي تنفيذ لواجهة يمكن استخدامه مكان آخر بدون كسر العقد.

- `FirestoreLeadRepository` و`InMemoryLeadRepository` يجتازان نفس مجموعة اختبارات العقد (Contract Tests) في `tests/integration/lead-repository.contract.ts`. لو نجح الأول وفشل الثاني، الثاني مكسور.
- لا ترمي دالة تنفيذ استثناءً غير موثّق في الواجهة. الأخطاء المتوقعة تُرجع `Result.err(...)`.

### I — فصل الواجهات (Interface Segregation)

**القاعدة [يجب]:** واجهات صغيرة محددة الغرض، لا واجهة عملاقة.

```ts
// application/ports.ts
export interface LeadWriter {
  save(lead: Lead): Promise<void>;
}
export interface LeadReader {
  findById(id: LeadId): Promise<Lead | null>;
  list(query: LeadQuery): Promise<Page<Lead>>;
}
export interface Notifier {
  notify(event: DomainEvent): Promise<void>;
}
```

`CreateLead` يحتاج `LeadWriter` و`Notifier` فقط، فلا يُجبر على معرفة `list`. لوحة الأدمن تحتاج `LeadReader` فقط.

### D — الاعتماد على التجريد (Dependency Inversion)

**القاعدة [يجب]:** حالات الاستخدام تعتمد على المنافذ (interfaces)، لا على Firebase مباشرة. الربط يتم في مكان واحد: `lib/container.ts` (Composition Root).

```ts
// features/leads/application/create-lead.usecase.ts
export class CreateLead {
  constructor(
    private readonly writer: LeadWriter,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateLeadInput): Promise<Result<LeadId, CreateLeadError>> {
    const lead = Lead.create({ ...input, id: this.ids.next(), now: this.clock.now() });
    if (!lead.ok) return lead;
    await this.writer.save(lead.value);
    await this.notifier.notify({ type: "lead.created", leadId: lead.value.id });
    return ok(lead.value.id);
  }
}
```

```ts
// lib/container.ts  (المكان الوحيد الذي يعرف Firebase + الحالات معاً)
export const createLead = new CreateLead(
  new FirestoreLeadRepository(adminDb),
  new CompositeNotifier([new EmailNotifier(resend), new TelegramNotifier(env)]),
  systemClock,
  uuidGenerator,
);
```

الفائدة: الاختبار بـ `InMemoryLeadRepository` و`FakeNotifier` بلا شبكة وبلا Firebase، ويمكن نقل التخزين لقاعدة أخرى بدون لمس المنطق.

---

## 3) قواعد الطبقات والحدود

انظر `01-project-structure.md` قسم 2. ملخصها:

- `domain` نقي، `application` يعتمد عليه فقط، `infrastructure` يطبّق المنافذ، `ui` و`app` أطراف خارجية.
- **[يجب]** لا استيراد من `firebase` أو `firebase-admin` خارج `infrastructure` و`lib/firebase` و`functions`. يفرضه ESLint.
- **[يجب]** صفحات `app/` ومسارات `api/` رفيعة: تحقق ثم استدعاء use-case ثم تحويل النتيجة إلى استجابة. لا منطق أعمال فيها.

---

## 4) معالجة الأخطاء

- **[يجب]** الأخطاء المتوقعة (تحقق، تعارض حالة، غير موجود) تُمثّل بـ `Result<T, E>` وأنواع خطأ مُسمّاة (`LeadInvalidTransition`, `ValidationFailed`). الاستثناءات للأعطال غير المتوقعة فقط (انقطاع الشبكة، خطأ برمجي).
- **[يجب]** واجهات HTTP ترجع شكلاً موحداً: `{ ok: true, data } | { ok: false, error: { code, message_key } }`. رسالة المستخدم تُترجم بمفتاح (`message_key`) من ملفات i18n، لا نصوص إنجليزية مباشرة للمستخدم.
- **[يجب]** لا نكشف تفاصيل داخلية (stack, مسارات Firestore) للعميل. تُسجّل في الخادم فقط.
- **[يُفضّل]** نقاط حدود خطأ (`error.tsx`) لكل جزء كبير، برسالة عربية/إنجليزية وزر إعادة المحاولة وزر واتساب.

---

## 5) الأمان

| القاعدة | التنفيذ |
|---|---|
| **[يجب]** التحقق عند الحدود | Zod لكل `POST`، حد أقصى للأطوال والأحجام، تنظيف النصوص قبل العرض |
| **[يجب]** Firestore Rules مبدأ "رفض افتراضي" | لا كتابة مباشرة من المتصفح إطلاقاً: كل الكتابات عبر الخادم (Admin SDK). القراءة محدودة: الأدمن بـ Custom Claim، والعميل لبياناته فقط، والعامة للمحتوى المنشور فقط |
| **[يجب]** حماية الأدمن | Firebase Auth + Custom Claims (`role: owner|agent`)، `middleware.ts` + تحقق في الخادم لكل طلب، ليس في الواجهة فقط |
| **[يجب]** منع السبام | Honeypot + Firebase App Check (reCAPTCHA v3/Enterprise) + Rate limit بالـ IP والجوال |
| **[يجب]** الأسرار | في Vercel/Firebase Secrets فقط، لا في الريبو، ولا `NEXT_PUBLIC_` لأي سر |
| **[يجب]** رفع الملفات | حد 10MB، قائمة أنواع بيضاء (pdf, png, jpg, docx)، مسار عشوائي، لا قراءة عامة |
| **[يجب]** رؤوس الأمان | CSP، `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS عبر `next.config.ts` |
| **[يجب]** خصوصية (PDPL) | موافقة صريحة غير محددة مسبقاً، لا Pixels قبل موافقة الكوكيز، مدة احتفاظ، طلبات حذف |
| **[يُفضّل]** أقل صلاحية | حساب خدمة Firebase Admin بصلاحيات محدودة، مفاتيح منفصلة لكل بيئة |
| **[يجب]** تدقيق الاعتماديات | `npm audit` + Dependabot في CI |

---

## 6) الترجمة والعربية (i18n / RTL)

- **[يجب]** لا نصوص ثابتة في المكونات. كل نص مفتاح في `messages/ar.json` و`en.json`، ويفحص CI تطابق المفاتيح بين اللغتين.
- **[يجب]** العربية هي اللغة المرجعية (الافتراضية، تُكتب أولاً)، والإنجليزية ترجمة وليست مصدراً.
- **[يجب]** `<html lang dir>` يتغير حسب اللغة. نستخدم خصائص CSS المنطقية (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`)، ويُمنع `left/right/ml/mr` إلا باستثناء موثّق (مثل أرقام LTR).
- **[يجب]** الأرقام الغربية (0-9) في الهاتف والتواريخ والأرقام التجارية. رقم الهاتف دائماً داخل عنصر `dir="ltr"`.
- **[يجب]** الأيقونات الاتجاهية (سهم، رجوع) تنعكس في RTL، الأيقونات غير الاتجاهية لا تنعكس.
- **[يجب]** لا إيموجي في أي نص: لا في الواجهة ولا الرسائل ولا قوالب الإيميل ولا رسائل الواتساب الجاهزة. الأيقونات SVG فقط. يفحصه سكربت CI (قسم 12).
- **[يُفضّل]** نبرة النصوص تتبع دليل الصوت في `04-design/02-voice-and-tone.md`.

---

## 7) الأداء (ميزانية إلزامية)

| المقياس | الهدف | القياس |
|---|---|---|
| LCP (جوال، p75) | 2.5 ثانية أو أقل | Lighthouse CI + RUM (GA4/Vercel) |
| INP | 200ms أو أقل | RUM |
| CLS | 0.1 أو أقل | Lighthouse CI |
| JS في الصفحة الرئيسية | 150KB أو أقل (gzip) | Bundle analyzer في CI |
| وزن الصور في الشاشة الأولى | 300KB أو أقل | فحص يدوي + CI |

قواعد: Server Components افتراضياً، `next/image` لكل الصور (AVIF/WebP) بأبعاد صريحة، خط واحد عبر `next/font` مع `display: swap`، Dynamic import لكل مكوّن ثقيل (مخططات الأدمن، منشئ PDF)، لا مكتبات حركة كبيرة في الشاشة الأولى، السكربتات التحليلية `afterInteractive` وبعد الموافقة.

---

## 8) إمكانية الوصول (Accessibility)

- **[يجب]** تباين لوني WCAG AA كحد أدنى، وAAA لنصوص الفورم قدر الإمكان.
- **[يجب]** كل عنصر تفاعلي بالكيبورد مع تركيز ظاهر، وأهداف لمس 44px أو أكثر على الجوال.
- **[يجب]** حقول الفورم مع `label` حقيقي ورسائل خطأ مرتبطة بـ `aria-describedby`، ولا نعتمد على اللون وحده.
- **[يجب]** نحترم `prefers-reduced-motion`.
- **[يُفضّل]** اختبار آلي بـ axe في Playwright لكل صفحة رئيسية بالعربي والإنجليزي.

---

## 9) الاختبارات

| المستوى | الأداة | يغطي | الهدف |
|---|---|---|---|
| Unit | Vitest | domain + use-cases بالـ In-Memory | تغطية 90% لـ domain وapplication |
| Contract | Vitest | كل تنفيذ لـ LeadRepository | نجاح كامل |
| Integration | Firebase Emulator | Firestore Rules + المحولات | كل قاعدة أمان لها اختبار قبول ورفض |
| Component | Testing Library | مكونات الفورم والـ Wizard | الحالات: صحيح، خطأ، تحميل، RTL |
| E2E | Playwright | رحلة: فتح، اختيار خدمة، إرسال، رسالة نجاح؛ + دخول الأدمن + تغيير حالة | ar و en، جوال وسطح مكتب |
| Accessibility | axe | الصفحات الأساسية | صفر مخالفات خطيرة |

قاعدة: **كل باغ يُصلح يضاف له اختبار يفشل قبل الإصلاح.**

---

## 10) سير العمل والـ Git

- **الفروع:** `main` (محمي، دائماً قابل للنشر) ← `feat/…`, `fix/…`, `chore/…`. Pull Request إلزامي، مراجعة واحدة على الأقل، وCI أخضر.
- **الرسائل:** Conventional Commits: `feat(leads): add consultation booking`.
- **PR صغير:** أقل من 400 سطر قدر الإمكان، ووصف يشرح "لماذا".
- **كل PR** ينتج رابط معاينة (Vercel Preview) وفيه Firebase Emulator أو مشروع `staging`.
- **البيئات:** `local` (Emulator) ← `preview/staging` (مشروع Firebase منفصل) ← `production`. لا بيانات حقيقية في غير الإنتاج.
- **الإصدارات:** وسم لكل إطلاق، وملف `CHANGELOG.md` تلقائي.

---

## 11) تعريف الإنجاز (Definition of Done)

لا تُغلق أي مهمة إلا لو تحقق كل التالي:

1. الكود يحترم الطبقات وSOLID ومراجَع.
2. اختبارات (وحدة + ما يلزم) كتبت وتنجح، و CI أخضر.
3. يعمل بالعربية (RTL) والإنجليزية، على جوال وسطح مكتب.
4. لا نصوص ثابتة، لا إيموجي، لا ألوان أو مسافات خارج الـ tokens.
5. أحداث التحليلات المطلوبة مسجلة وتم التحقق منها في GA4 DebugView.
6. أداء ضمن الميزانية، وصفر مخالفات وصول خطيرة.
7. الأمان: التحقق عند الحدود + قواعد Firestore مراجعة.
8. التوثيق محدّث (README أو ملف الميزة) وأي قرار معماري كبير مكتوب في `docs/adr/`.

---

## 12) فحوصات CI الإلزامية

| الفحص | الأداة |
|---|---|
| أنواع TypeScript صارمة (`strict`, `noUncheckedIndexedAccess`) | `tsc --noEmit` |
| تنسيق وجودة | ESLint + Prettier |
| حدود الطبقات | `eslint-plugin-boundaries` |
| منع الاستيراد الممنوع (Firebase خارج infrastructure) | ESLint `no-restricted-imports` |
| تطابق مفاتيح الترجمة | سكربت `scripts/check-i18n.ts` |
| **منع الإيموجي** | سكربت `scripts/check-no-emoji.ts` يفشل لو وجد أي رمز Emoji في `src/` أو `messages/` أو القوالب |
| منع `left/right/ml/mr` | قاعدة ESLint مخصصة (Tailwind logical) |
| اختبارات | Vitest + Emulator + Playwright |
| أداء | Lighthouse CI بميزانية القسم 7 |
| أمان الاعتماديات | `npm audit --omit=dev` + Dependabot |
| اكتشاف الأسرار | `gitleaks` |

---

## 13) قرارات معمارية موثّقة (ADR)

كل قرار كبير يُكتب في `docs/adr/NNNN-title.md` بصيغة: السياق، القرار، البدائل، النتائج. القرارات الأولى المقترحة:

1. ADR-0001: Next.js App Router + Server Components.
2. ADR-0002: Firebase (Firestore/Auth/Storage/Functions) بدل قاعدة SQL، وحدود الانتقال لاحقاً.
3. ADR-0003: Ports & Adapters وحدود الطبقات.
4. ADR-0004: next-intl، العربية افتراضية ومرجعية.
5. ADR-0005: لا أسعار معلنة في الموقع (قرار تجاري، يُراجع بأرقام التحاليل).
6. ADR-0006: Vercel للواجهة + Firebase للبيانات، وخيار إقامة بيانات محلية لعملاء المؤسسات.
