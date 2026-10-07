# ERD وربطه بـ Firestore

الرسم: `erd.png` / `erd.svg` (مصدره `erd.mmd`، يُعدّل ثم يُعاد توليده بـ `npx @mermaid-js/mermaid-cli -i erd.mmd -o erd.svg`).

الـ ERD **منطقي** (علاقات الكيانات). Firestore مستندات وليس جداول، فنترجم كل كيان بقرارين: هل هو مجموعة جذرية (Root) أو مجموعة فرعية (Subcollection) أو مضمّن (Embedded)؟ القاعدة: نضمّن لو كان صغيراً ويُقرأ دائماً مع أبيه ولا يُستعلم عنه منفرداً. نفصل لو كبر أو يُستعلم عنه عبر الأب.

## 1) خريطة الكيانات إلى Firestore

| الكيان | التخزين | المسار | السبب |
|---|---|---|---|
| ADMIN_USER | Root | `admins/{uid}` | قراءة سريعة للدور، `uid` هو معرف المستند |
| CLIENT | Root | `clients/{clientId}` | استعلام وحده، `clientId` = `auth.uid` عند تفعيل البوابة |
| LEAD | Root | `leads/{leadId}` | الكيان المحوري، يُستعلم بالحالة والمصدر والتاريخ |
| LEAD_SOURCE | مضمّن | `leads/{id}.source` (map) | علاقة 1:1، يُقرأ دائماً مع العميل المحتمل |
| LEAD_ATTACHMENT | مضمّن (مصفوفة صغيرة) | `leads/{id}.attachments[]` | بيانات وصفية فقط (الحد 5 ملفات) والملف نفسه في Storage |
| LEAD_NOTE | Subcollection | `leads/{id}/notes/{noteId}` | قد تكثر، وتُضاف بدون إعادة كتابة المستند الأب |
| LEAD_STATUS_HISTORY | Subcollection | `leads/{id}/statusHistory/{hid}` | سجل تدقيق يُلحق فقط (append-only) |
| CONSENT | Root | `consents/{id}` | يُستعلم عنه بالموضوع والنوع، ويُحفظ لأغراض قانونية |
| CONSULTATION | Root | `consultations/{id}` | يُستعلم بالتاريخ (جدول الفريق) |
| PROPOSAL | Root | `proposals/{id}` | يُستعلم بالحالة والعميل |
| PROPOSAL_ITEM | مضمّن | `proposals/{id}.items[]` | يُقرأ دائماً مع العرض، ولا يتجاوز عشرات البنود |
| PROPOSAL_MILESTONE | مضمّن | `proposals/{id}.milestones[]` | نفس السبب |
| CONTRACT | Root | `contracts/{id}` | دورة توقيع مستقلة |
| PROJECT | Root | `projects/{id}` | يُستعلم بالعميل والحالة |
| PROJECT_STAGE | Subcollection | `projects/{id}/stages/{sid}` | تحدَّث باستمرار، ويُرتب بـ `sortOrder` |
| WEEKLY_REPORT | Subcollection | `projects/{id}/reports/{rid}` | تتراكم أسبوعياً |
| PROJECT_FILE | Subcollection | `projects/{id}/files/{fid}` | مع حقل `visibility` (internal/client) |
| PAYMENT | Root | `payments/{id}` | تقارير مالية عبر المشاريع |
| TICKET | Root | `tickets/{id}` | طابور دعم مرتب حسب SLA عبر العملاء |
| TICKET_MESSAGE | Subcollection | `tickets/{id}/messages/{mid}` | محادثة تتزايد |
| MAINTENANCE_PLAN | Root | `maintenancePlans/{id}` | تجديدات واستعلام بتاريخ التجديد |
| NOTIFICATION_LOG | Root | `notificationLogs/{id}` | تدقيق التسليم، ينظف دورياً (TTL) |
| CASE_STUDY | Root | `caseStudies/{slug}` | معرّف المستند هو الـ slug |
| TESTIMONIAL | Root | `testimonials/{id}` | عرض عام بعد `published = true` |
| SITE_SETTING | Root (مفرد) | `settings/site` | إعدادات عامة قابلة للتعديل بدون نشر |
| إحصاءات مجمّعة | Root | `stats/daily-YYYY-MM-DD` | تُكتب بدالة مجدولة ليلاً، لتخفيف تكلفة لوحة التحاليل |

## 2) قواعد البيانات (Invariants) تفرضها طبقة domain

1. لا يوجد `LEAD` بدون هاتف صالح (E.164 سعودي أو دولي) وموافقة PDPL مسجلة.
2. انتقال حالة العميل المحتمل يتبع فقط جدول الانتقالات المسموحة (`01-system-design.md` قسم 4). الخسارة تتطلب `lostReason`.
3. `PROPOSAL.total = subtotal + vatAmount`، و`vatAmount = subtotal * vatPercent / 100`، ومجموع `milestones.percent` يساوي 100 بالضبط.
4. لا يُعدَّل بروبوزل بعد حالة `sent`: التعديل ينشئ `version + 1` جديداً، والقديم يبقى للتاريخ.
5. يُنشأ `PROJECT` فقط من `PROPOSAL` بحالة `accepted`، ويُنشأ لكل `milestone` سجل `PAYMENT` بحالة `pending`.
6. `TICKET.respondBy` و`resolveBy` تُحسب عند الإنشاء من الأولوية (SLA) وتُخزن (لا تُحسب عند القراءة).
7. `TESTIMONIAL` لا يُنشر إلا لو `consentToPublish = true` (موافقة العميل على نشر رأيه واسمه).
8. المبالغ تُخزن كأعداد صحيحة بأصغر وحدة (هللة) لتجنب أخطاء الفاصلة العائمة، وتُعرض بالريال. (حقول `decimal` في الرسم منطقية.)
9. كل التواريخ UTC في التخزين، وتعرض بتوقيت الرياض (UTC+3) في الواجهة.

## 3) مصفوفة الصلاحيات (قراءة)

الكتابة **دائماً من الخادم فقط** (Admin SDK عبر use-cases). قواعد Firestore تمنع أي كتابة من المتصفح.

| المجموعة | عام (زائر) | عميل (بوابة) | agent | owner |
|---|---|---|---|---|
| `leads` + فرعياتها | لا | لا | نعم | نعم |
| `clients` | لا | مستنده فقط | نعم | نعم |
| `consents` | لا | لا | نعم | نعم |
| `consultations` | لا | لا | نعم | نعم |
| `proposals` | لا | عروضه (`clientId == uid`) | نعم | نعم |
| `contracts` | لا | عقوده | نعم | نعم |
| `projects` + `stages` + `reports` | لا | مشاريعه | نعم | نعم |
| `projects/*/files` | لا | ملفات `visibility == client` | نعم | نعم |
| `payments` | لا | دفعات مشاريعه | نعم | نعم |
| `tickets` + `messages` | لا | تذاكره | نعم | نعم |
| `maintenancePlans` | لا | باقاته | نعم | نعم |
| `notificationLogs` | لا | لا | نعم | نعم |
| `caseStudies`, `testimonials` | المنشور فقط | المنشور | الكل | الكل |
| `settings/site` | نعم | نعم | نعم | نعم |
| `stats` | لا | لا | نعم | نعم |
| `admins` | لا | لا | مستنده فقط | الكل |

التنفيذ الفعلي في `07-starter-files/firebase/firestore.rules`، ويُختبر بـ Firebase Emulator (قبول ورفض لكل صف في الجدول).

## 4) الفهارس (Indexes)

مطلوبة لاستعلامات الأدمن، وموجودة في `firestore.indexes.json`:

| المجموعة | الحقول | الاستعلام |
|---|---|---|
| leads | `status` ↑, `createdAt` ↓ | لوحة Kanban والجدول |
| leads | `assignedTo` ↑, `status` ↑, `createdAt` ↓ | "عملائي" |
| leads | `service` ↑, `createdAt` ↓ | تحليل حسب الخدمة |
| leads | `segment` ↑, `createdAt` ↓ | تحليل حسب الشريحة |
| leads | `source.utm_source` ↑, `createdAt` ↓ | تحليل حسب المصدر |
| proposals | `leadId` ↑, `version` ↓ | آخر نسخة |
| proposals | `status` ↑, `validUntil` ↑ | تذكير بانتهاء الصلاحية |
| tickets | `status` ↑, `respondBy` ↑ | طابور SLA |
| projects | `clientId` ↑, `status` ↑ | مشاريع العميل |
| payments | `status` ↑, `dueAt` ↑ | المستحقات |
| maintenancePlans | `status` ↑, `renewsAt` ↑ | تجديدات قادمة |

## 5) الترحيل والإصدارات

- كل مستند يحمل `schemaVersion` (رقم). أي تغيير كاسر يرفع الرقم، وتُكتب دالة ترحيل واختبار لها.
- الحقول الاختيارية تقرأ بقيم افتراضية آمنة في طبقة المحول (`infrastructure`)، فلا ينكسر الكود على بيانات قديمة.
- لا حذف حقيقي للعملاء المحتملين والعروض: `deletedAt` (حذف ناعم)، والحذف النهائي فقط بقرار احتفاظ PDPL موثّق.
