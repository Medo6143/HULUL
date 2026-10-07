# System Design — حلول تك

## 1) الأهداف والقيود

| البند | القيمة |
|---|---|
| الهدف الأساسي | موقع تسويقي يجذب عملاء ويحوّلهم لطلب خدمة أو استشارة، ثم يدير دورة العميل: استشارة، بروبوزل، عمل، دعم |
| المستخدمون | زائر / عميل محتمل (عام)، عميل (بوابة، المرحلة 2)، فريق الأدمن (owner, agent) |
| اللغات | عربي (افتراضي ومرجعي) + إنجليزي |
| الحجم المتوقع | آلاف قليلة من الزيارات شهرياً في البداية، عشرات إلى مئات العملاء المحتملين شهرياً. لا حاجة لتعقيد توسّع كبير |
| الأولويات | سرعة الجوال، الأمان والخصوصية (PDPL)، سهولة التعديل، تكلفة تشغيل منخفضة، قابلية القياس |
| قيود | Next.js + Firebase (قرار العميل)، بدون إيموجي، بدون أسعار معلنة في الموقع |

الحمل منخفض، فالتصميم يفضّل **البساطة التشغيلية** (Serverless بالكامل) مع **حدود طبقات صارمة** تسمح بالنمو لاحقاً.

## 2) المعمارية العامة (C4 — مستوى الحاويات)

```mermaid
flowchart LR
    V[Visitor / Lead<br/>browser or phone] -->|HTTPS| EDGE[Vercel Edge Network<br/>CDN + Middleware locale]
    EDGE --> NEXT[Next.js App<br/>Server Components + Route Handlers]
    C[Client portal user<br/>phase 2] --> NEXT
    A[Admin team] --> NEXT

    NEXT -->|firebase-admin| FS[(Firestore)]
    NEXT -->|signed URLs| ST[(Cloud Storage)]
    NEXT --> AUTH[Firebase Auth<br/>+ Custom Claims]
    FS -->|onDocumentCreated / scheduler| FN[Cloud Functions]
    FN --> MAIL[Email provider<br/>Resend]
    FN --> TG[Telegram bot<br/>optional]
    FN --> FS

    V -.->|click-to-chat| WA[WhatsApp wa.me]
    NEXT -.-> GA[GA4 / Clarity / Pixels<br/>after cookie consent]
    NEXT --> APPCHK[Firebase App Check<br/>reCAPTCHA]
```

| الحاوية | المسؤولية | لماذا |
|---|---|---|
| Vercel (Edge + Node) | تقديم الصفحات، middleware اللغة والحماية، Route Handlers | سرعة وCDN عالمي، نشر معاينات لكل PR |
| Next.js | العرض (SSG/ISR للتسويقي، SSR للأدمن والبوابة) | SEO + سرعة |
| Firestore | بيانات التشغيل (leads، proposals...) | بلا خوادم، Realtime للأدمن |
| Cloud Storage | مرفقات، PDF البروبوزل، ملفات المشروع | ملفات خاصة بروابط موقّعة |
| Firebase Auth | هوية الأدمن والعميل، Custom Claims للأدوار | جاهز وآمن |
| Cloud Functions | أعمال خلفية: إشعارات، SLA، تذكيرات | منفصلة عن الواجهة، تعمل عند الأحداث |
| App Check | منع الاستخدام غير المشروع للـ API | يقلل السبام |
| مزود إيميل | رسائل تأكيد وتنبيه وتقارير | موثوقية التسليم |

## 3) تدفق الطلب (Sequence): من الزائر إلى الأدمن

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor
    participant W as Next.js (Wizard UI)
    participant API as POST /api/leads
    participant UC as CreateLead use-case
    participant DB as Firestore
    participant FN as Cloud Function
    participant M as Email / Telegram
    participant AD as Admin dashboard

    U->>W: fills 3-step form (consent unchecked by default)
    W->>W: validate (Zod) + analytics: form_step_complete
    W->>API: submit + App Check token
    API->>API: schema validation, honeypot, rate limit
    API->>UC: execute(input)
    UC->>DB: save lead (status=new) + consent record
    UC-->>API: Result.ok(leadId)
    API-->>W: 201 {ok:true}
    W->>U: success page + WhatsApp follow-up button
    W->>W: analytics: generate_lead
    DB-->>FN: onDocumentCreated(leads/{id})
    FN->>M: confirmation to lead (ar/en) + alert to team
    FN->>DB: notification_log + start SLA timer (first reply within 1 business hour)
    DB-->>AD: realtime listener shows new lead badge
```

## 4) دورة حياة العميل المحتمل (State Machine)

```mermaid
stateDiagram-v2
    [*] --> new
    new --> contacted: first reply sent
    contacted --> consultation: call booked
    consultation --> proposal: proposal drafted
    proposal --> negotiation: client asks changes
    proposal --> won: accepted and signed
    negotiation --> won
    negotiation --> lost
    proposal --> lost
    contacted --> lost
    consultation --> lost
    new --> parked: not now
    contacted --> parked
    parked --> contacted: reactivated
    lost --> contacted: reopened (needs reason)
    won --> [*]
```

القاعدة تعيش في `lead-status.machine.ts` (domain) كجدول انتقالات مسموحة، ولا يمكن لأي طبقة تغيير الحالة خارجه. كل انتقال يسجل سطراً في `LEAD_STATUS_HISTORY` ويتطلب سبباً عند الخسارة.

## 5) من الفوز إلى الدعم (المرحلة 2)

```mermaid
flowchart TD
    W[Lead won] --> PR[Proposal accepted + e-signed]
    PR --> CT[Contract + deposit invoice]
    CT --> PJ[Project created from proposal milestones]
    PJ --> ST[Stages and weekly reports in client portal]
    ST --> UAT[UAT sign-off]
    UAT --> HO[Handover pack + training]
    HO --> WR[Warranty window<br/>tickets with SLA]
    WR --> MP[Maintenance plan<br/>monthly report + renewal]
```

كل مرحلة لها: صاحب مسؤولية، وتاريخ مستهدف، وإشعار تلقائي، وعدّاد SLA تراقبه Cloud Function مجدولة (`sla-monitor`).

## 6) الأمان والخصوصية

| الطبقة | الإجراء |
|---|---|
| الحدود | Zod على كل طلب، حدود الأحجام، Honeypot، App Check، Rate limit (IP + جوال) |
| الهوية | Firebase Auth. الأدمن: Custom Claim `role`. العميل: رابط سحري أو OTP، ويقرأ فقط ما يخصه (`clientId == auth.uid`) |
| الصلاحيات | Firestore Rules "رفض افتراضي" + تحقق إضافي في الخادم (دفاع مزدوج). مصفوفة كاملة في `02-erd-and-firestore-mapping.md` |
| الملفات | Storage خاص، روابط موقّعة قصيرة العمر، قائمة أنواع بيضاء، حد 10MB |
| الأسرار | Vercel/Firebase Secrets، مفاتيح منفصلة لكل بيئة |
| PDPL | موافقة صريحة غير محددة مسبقاً مسجلة في `CONSENT` بنسخة السياسة، عدم تحميل Pixels قبل الموافقة، سياسة احتفاظ (مثلاً حذف العملاء المحتملين غير النشطين بعد 24 شهراً بقرار قانوني)، مسار طلب حذف |
| الرؤوس | CSP، HSTS، Referrer-Policy، Permissions-Policy |
| التدقيق | سجل `LEAD_STATUS_HISTORY`، و`NOTIFICATION_LOG`، وسجلات Cloud Functions |

**ملاحظة إقامة البيانات:** Firebase/Vercel خارج المملكة بشكل افتراضي. لو عميل حكومي أو مؤسسي يشترط إقامة البيانات داخل السعودية، يُبنى له نشر منفصل على سحابة محلية (قرار تجاري يُدوَّن في ADR ويُراجع قانونياً).

## 7) القابلية للمراقبة (Observability)

| ماذا | أين |
|---|---|
| أخطاء الواجهة والخادم | Vercel Logs + Sentry (موصى به) |
| أداء حقيقي (Web Vitals) | Vercel Analytics أو GA4 (RUM) |
| الدوال الخلفية | Cloud Logging + تنبيه عند فشل متكرر |
| تسليم الإيميل | `NOTIFICATION_LOG` + لوحة المزود |
| سلامة الخدمة | `/api/health` + Uptime check (فحص خارجي كل دقيقة) |
| نتائج الأعمال | لوحة التحاليل في الأدمن + GA4 (انظر `05-analytics-and-growth`) |

## 8) التوسع والأداء

- الصفحات التسويقية ثابتة (SSG/ISR) على CDN، فلا تتأثر بالحمل.
- الكتابة الوحيدة الحساسة هي إنشاء `leads`، وFirestore يتحمل أضعاف ما نحتاجه.
- فهارس Firestore مطلوبة لاستعلامات الأدمن (حالة + تاريخ، مسؤول + حالة، خدمة + تاريخ) في `firestore.indexes.json`.
- التقارير الثقيلة (تحاليل الأدمن) تُحسب بتجميعات مجدولة ليلاً في مستند `stats/daily-*` بدل مسح كل المستندات عند كل فتح.
- لو تعدت الحاجة حدود Firestore للتحليل، نصدّر لـ BigQuery (Extension جاهز) بدون تغيير الواجهة.

## 9) الاعتماد والتعافي

| الخطر | التخفيف |
|---|---|
| فشل إيميل التأكيد | إعادة محاولة تلقائية + قناة بديلة (Telegram) + زر واتساب دائماً متاح للعميل |
| فشل Firestore لحظياً | الواجهة تعرض رسالة واضحة وتعرض زر واتساب كبديل فوري، ولا تفقد بيانات الفورم (حفظ مؤقت في المتصفح) |
| تسريب مفتاح | تدوير المفاتيح، أسرار منفصلة لكل بيئة، `gitleaks` في CI |
| فقدان بيانات | نسخ احتياطي مجدول لـ Firestore (يومي) إلى Storage منفصل، واختبار استرجاع ربع سنوي |
| سبام | App Check + Rate limit + Honeypot + قائمة حظر |

## 10) البيئات والنشر

```mermaid
flowchart LR
    DEV[Local<br/>Firebase Emulator] --> PR[Pull Request<br/>Vercel Preview + staging Firebase]
    PR --> MAIN[main branch<br/>protected]
    MAIN --> PROD[Production<br/>Vercel + prod Firebase]
```

- ثلاث بيئات Firebase منفصلة (`dev`, `staging`, `prod`)، ولا بيانات حقيقية خارج `prod`.
- النشر: GitHub Actions: `lint, types, tests, rules tests, lighthouse` ثم Vercel، و`firebase deploy --only firestore:rules,functions` من نفس الخط.
- التراجع: Vercel Instant Rollback، وإصدارات Functions.

## 11) قرارات تصميمية مختصرة

| القرار | السبب | البديل المرفوض |
|---|---|---|
| Serverless كامل | حمل منخفض، تكلفة وصيانة أقل | خادم VPS (صيانة دائمة) |
| Firestore بدل SQL | Realtime للأدمن، لا خوادم، بيانات مستندية بسيطة | Postgres (أقوى للتقارير، أعقد تشغيلاً الآن) |
| ISR للصفحات التسويقية | سرعة قصوى وSEO | SSR لكل طلب (أبطأ وأغلى) |
| Ports & Adapters | نتحرر من Firebase إن لزم، اختبارات سريعة | استدعاء Firebase داخل المكونات |
| لا أسعار معلنة | قرار تجاري، التأهيل عبر سؤال الميزانية الاختياري | باقات معلنة (تُجرّب لاحقاً بـ A/B لو أسباب الخسارة بالسعر) |
