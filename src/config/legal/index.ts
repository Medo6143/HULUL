import { siteConfig } from "../site";

// Draft legal texts. They describe only what the site technically does today. Every legal fact that was not
// supplied (legal name, registration, address, retention periods, governing law) stays as a visible placeholder
// until the owner provides it; nothing here was invented. A lawyer must review before launch (MISSING_CONTENT.md).

export type LegalLocale = "ar" | "en";
export type LegalKind = "privacy" | "terms" | "cookies";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export const TBD: Record<LegalLocale, string> = { ar: "[يُحدَّد]", en: "[To be set]" };

const fact = (value: string | null, locale: LegalLocale) => value ?? TBD[locale];

/** Who is responsible for the site, built only from confirmed values in siteConfig. */
function operator(locale: LegalLocale): string[] {
  const ar = locale === "ar";
  return [
    `${ar ? "الاسم التجاري" : "Trade name"}: ${siteConfig.name[locale]}`,
    `${ar ? "المدينة" : "City"}: ${siteConfig.city[locale]}, ${siteConfig.country[locale]}`,
    `${ar ? "الاسم القانوني" : "Legal name"}: ${TBD[locale]}`,
    `${ar ? "السجل التجاري" : "Commercial registration"}: ${fact(siteConfig.crNumber, locale)}`,
    `${ar ? "العنوان الوطني" : "National address"}: ${fact(siteConfig.nationalAddress, locale)}`,
    `${ar ? "البريد الإلكتروني للخصوصية" : "Privacy contact email"}: ${fact(siteConfig.email, locale)}`,
  ];
}

function privacy(locale: LegalLocale): LegalSection[] {
  if (locale === "ar") {
    return [
      { heading: "من نحن", paragraphs: ["هذي السياسة توضح كيف نتعامل مع بياناتك الشخصية عند استخدام هذا الموقع."], items: operator("ar") },
      {
        heading: "البيانات اللي نجمعها",
        paragraphs: ["نجمع فقط اللي تكتبه بنفسك في النماذج، وبعض البيانات التقنية:"],
        items: [
          "نموذج طلب مشروع أو استشارة: الاسم، رقم الجوال، البريد (اختياري)، الخدمة المطلوبة، طريقة التواصل المفضلة، نوع النشاط، موعد البدء، ووصف المشروع.",
          "حجز موعد استشارة: الموعد المختار مع بيانات التواصل أعلاه.",
          "نموذج تواصل معنا: الاسم والبريد ونص الرسالة.",
          "مصدر الزيارة: صفحة الدخول والموقع المحيل ومعاملات الحملات (UTM) لنعرف من أين جاء الطلب.",
          "سجل الموافقة: نوعها ونسخة السياسة ووقتها، مع بصمة مشفرة (hash) من عنوان الشبكة بدل العنوان نفسه.",
        ],
      },
      {
        heading: "ليش نستخدمها",
        items: [
          "الرد على طلبك والتواصل معك وترتيب الاستشارة.",
          "إدارة طلبات العملاء داخل فريقنا.",
          "إرسال تأكيد الموعد أو الإلغاء ودعوات الاستشارة.",
          "حماية الموقع من الرسائل المزعجة وإساءة الاستخدام.",
          "فهم أداء الموقع وحملاتنا، وذلك فقط بعد موافقتك على ملفات التحليلات والتسويق.",
        ],
      },
      {
        heading: "الجهات اللي تعالج البيانات معنا",
        paragraphs: ["نستخدم مزودي خدمة لتشغيل الموقع، وكل مزود يعالج البيانات اللازمة لخدمته فقط:"],
        items: [
          "Google Firebase / Google Cloud: تخزين الطلبات والحجوزات وتشغيل لوحة التحكم.",
          "Google reCAPTCHA: التحقق من أن النموذج يُرسل من شخص حقيقي.",
          "Resend: إرسال رسائل البريد الإلكتروني (تأكيدات وتنبيهات).",
          "Vercel: استضافة الموقع.",
          "Cloudinary: استضافة صور أعمالنا (لا تُرسل لها بيانات الزوار).",
          "Google Analytics وMicrosoft Clarity وMeta وSnapchat وTikTok: تحليلات وتسويق، وتعمل فقط بعد موافقتك.",
          "قناة تنبيهات داخلية اختيارية (مثل Telegram) تصل لفريقنا عند وصول طلب جديد.",
        ],
      },
      {
        heading: "مدة الاحتفاظ بالبيانات",
        paragraphs: [`مدة الاحتفاظ: ${TBD.ar}. نحذف البيانات أو نجعلها مجهولة الهوية بعد انتهاء الغرض منها.`],
      },
      {
        heading: "حقوقك",
        paragraphs: ["بحسب نظام حماية البيانات الشخصية في المملكة، لك حقوق منها:"],
        items: ["معرفة البيانات اللي نحتفظ بها عنك والاطلاع عليها.", "تصحيح بياناتك أو تحديثها.", "طلب إتلافها لما ينتهي الغرض منها.", "سحب موافقتك في أي وقت، وما يؤثر ذلك على ما سبق."],
      },
      { heading: "ملفات الكوكيز", paragraphs: ["تفاصيل الملفات اللي نستخدمها وكيف تتحكم فيها في صفحة ملفات الكوكيز."] },
      { heading: "التواصل معنا", paragraphs: [`لممارسة حقوقك أو أي استفسار عن الخصوصية: ${fact(siteConfig.email, "ar")}.`] },
      { heading: "تعديل هذي السياسة", paragraphs: ["قد نحدّث السياسة عند تغيّر طريقة عملنا، وننشر النسخة الجديدة في هذي الصفحة."] },
    ];
  }
  return [
    { heading: "Who we are", paragraphs: ["This policy explains how we handle your personal data when you use this website."], items: operator("en") },
    {
      heading: "Data we collect",
      paragraphs: ["We collect only what you type into our forms, plus some technical data:"],
      items: [
        "Project or consultation request: name, phone number, email (optional), requested service, preferred contact method, business type, start timing, and project description.",
        "Consultation booking: the chosen time together with the contact details above.",
        "Contact form: your name, email, and message.",
        "Visit source: landing page, referrer, and campaign parameters (UTM) so we know where a request came from.",
        "Consent record: its type, the policy version, and time, with a hash of the network address instead of the address itself.",
      ],
    },
    {
      heading: "Why we use it",
      items: [
        "To answer your request, contact you, and arrange the consultation.",
        "To manage customer requests inside our team.",
        "To send booking confirmations, cancellations, and consultation invitations.",
        "To protect the site from spam and abuse.",
        "To understand site and campaign performance, only after you accept analytics and marketing cookies.",
      ],
    },
    {
      heading: "Who processes data for us",
      paragraphs: ["We use service providers to run the site; each processes only the data its service needs:"],
      items: [
        "Google Firebase / Google Cloud: storing requests and bookings and running the admin panel.",
        "Google reCAPTCHA: checking that a form is sent by a real person.",
        "Resend: sending email (confirmations and alerts).",
        "Vercel: hosting the site.",
        "Cloudinary: hosting images of our work (no visitor data is sent to it).",
        "Google Analytics, Microsoft Clarity, Meta, Snapchat, and TikTok: analytics and marketing, active only after you consent.",
        "An optional internal alert channel (such as Telegram) that notifies our team of a new request.",
      ],
    },
    { heading: "How long we keep data", paragraphs: [`Retention period: ${TBD.en}. We delete data or make it anonymous once its purpose is over.`] },
    {
      heading: "Your rights",
      paragraphs: ["Under the Kingdom's Personal Data Protection Law you have rights that include:"],
      items: ["Knowing what data we hold about you and accessing it.", "Having your data corrected or updated.", "Asking for it to be destroyed once its purpose is over.", "Withdrawing consent at any time, without affecting what happened before."],
    },
    { heading: "Cookies", paragraphs: ["The files we use and how to control them are described on the cookies page."] },
    { heading: "Contact us", paragraphs: [`To use your rights or ask about privacy: ${fact(siteConfig.email, "en")}.`] },
    { heading: "Changes to this policy", paragraphs: ["We may update this policy when the way we work changes, and we publish the new version on this page."] },
  ];
}

function terms(locale: LegalLocale): LegalSection[] {
  if (locale === "ar") {
    return [
      { heading: "عن هذي الشروط", paragraphs: ["باستخدامك هذا الموقع توافق على الشروط التالية. إذا ما وافقت، نرجو عدم استخدام الموقع."], items: operator("ar") },
      { heading: "وش نقدم", paragraphs: ["حلول تك شركة برمجيات في الرياض، نقدم تطوير المواقع وتطبيقات الجوال والتصميم والهوية. المحتوى في الموقع للتعريف بخدماتنا وليس عرضًا ملزمًا."] },
      { heading: "الاستشارة", paragraphs: ["الاستشارة الأولى مجانية وبدون التزام. أي اتفاق على عمل أو سعر يتم بعرض مكتوب منفصل يوضح النطاق والمخرجات."] },
      { heading: "الطلبات والحجوزات", items: ["تتحمل مسؤولية صحة البيانات اللي تكتبها.", "الموعد المحجوز يصير مؤكد بعد ظهور تأكيده لك، وتقدر تلغيه من الرابط في رسالة التأكيد.", "نحتفظ بحق إلغاء أو إعادة ترتيب موعد عند الضرورة، ونبلغك بذلك."] },
      { heading: "الاستخدام المقبول", items: ["لا تستخدم الموقع لإرسال محتوى مسيء أو مضلل أو ضار.", "لا تحاول تعطيل الموقع أو الوصول لما لا يخصك."] },
      { heading: "الملكية الفكرية", paragraphs: [`شروط ملكية الأعمال المسلّمة للعملاء: ${TBD.ar}. محتوى الموقع وشعاره ملك لحلول تك ولا يجوز نسخه بدون إذن.`] },
      { heading: "المقابل المالي والدفع", paragraphs: [`شروط الدفع والاسترجاع: ${TBD.ar}.`] },
      { heading: "حدود المسؤولية", paragraphs: [`حدود مسؤوليتنا: ${TBD.ar}.`] },
      { heading: "النظام المطبق والاختصاص", paragraphs: [`النظام المطبق والجهة المختصة بالنزاعات: ${TBD.ar}.`] },
      { heading: "الخصوصية", paragraphs: ["طريقة تعاملنا مع بياناتك موضحة في سياسة الخصوصية."] },
      { heading: "تعديل الشروط", paragraphs: ["قد نحدّث هذي الشروط، واستمرارك في استخدام الموقع بعد النشر يعني موافقتك على النسخة الجديدة."] },
    ];
  }
  return [
    { heading: "About these terms", paragraphs: ["By using this website you agree to the terms below. If you do not agree, please do not use the website."], items: operator("en") },
    { heading: "What we offer", paragraphs: ["HULOL TECH is a software company in Riyadh offering website development, mobile apps, and design and branding. The content on this site introduces our services and is not a binding offer."] },
    { heading: "Consultation", paragraphs: ["The first consultation is free and without obligation. Any agreement on work or price is made in a separate written proposal that states the scope and deliverables."] },
    { heading: "Requests and bookings", items: ["You are responsible for the accuracy of the data you submit.", "A booked time is confirmed once its confirmation is shown to you, and you can cancel it from the link in the confirmation email.", "We keep the right to cancel or rearrange a time when necessary, and we will tell you."] },
    { heading: "Acceptable use", items: ["Do not use the site to send offensive, misleading, or harmful content.", "Do not try to disrupt the site or reach anything that is not yours."] },
    { heading: "Intellectual property", paragraphs: [`Ownership terms for work delivered to clients: ${TBD.en}. The site content and logo belong to HULOL TECH and may not be copied without permission.`] },
    { heading: "Fees and payment", paragraphs: [`Payment and refund terms: ${TBD.en}.`] },
    { heading: "Limits of liability", paragraphs: [`Our limits of liability: ${TBD.en}.`] },
    { heading: "Governing law and jurisdiction", paragraphs: [`Governing law and the body that handles disputes: ${TBD.en}.`] },
    { heading: "Privacy", paragraphs: ["How we handle your data is described in the privacy policy."] },
    { heading: "Changes to the terms", paragraphs: ["We may update these terms, and continuing to use the site after they are published means you accept the new version."] },
  ];
}

function cookies(locale: LegalLocale): LegalSection[] {
  if (locale === "ar") {
    return [
      { heading: "وش هي ملفات الكوكيز", paragraphs: ["ملفات صغيرة تُخزَّن في متصفحك لتشغيل الموقع أو لتذكر اختيارك أو لقياس الاستخدام."] },
      {
        heading: "الملفات الضرورية",
        paragraphs: ["لازمة لتشغيل الموقع وما نقدر نطفّيها:"],
        items: ["اختيارك لملفات التحليلات والتسويق، يُحفظ في تخزين المتصفح (hulol.consent.v1).", "جلسة الدخول للوحة التحكم، وتخص فريقنا فقط ولا تُنشأ للزوار."],
      },
      {
        heading: "ملفات التحليلات (بموافقتك)",
        paragraphs: ["تساعدنا نفهم كيف يُستخدم الموقع، وتعمل فقط بعد موافقتك:"],
        items: ["Google Analytics", "Microsoft Clarity"],
      },
      {
        heading: "ملفات التسويق (بموافقتك)",
        paragraphs: ["تقيس أداء حملاتنا الإعلانية، وتعمل فقط بعد موافقتك:"],
        items: ["Meta Pixel", "Snapchat Pixel", "TikTok Pixel"],
      },
      { heading: "حماية النماذج", paragraphs: ["نستخدم Google reCAPTCHA لحماية النماذج من الرسائل المزعجة، وقد يضع ملفاته الخاصة بحسب سياسة Google."] },
      { heading: "كيف تتحكم فيها", paragraphs: ["تقدر تغيّر اختيارك أو تسحب موافقتك في أي وقت من رابط ملفات الكوكيز في أسفل أي صفحة، أو من إعدادات متصفحك."] },
    ];
  }
  return [
    { heading: "What cookies are", paragraphs: ["Small files stored in your browser to run the site, remember your choice, or measure usage."] },
    {
      heading: "Necessary files",
      paragraphs: ["Needed to run the site, and cannot be turned off:"],
      items: ["Your analytics and marketing choice, kept in browser storage (hulol.consent.v1).", "The admin panel sign-in session, which belongs to our team only and is not created for visitors."],
    },
    {
      heading: "Analytics files (with your consent)",
      paragraphs: ["They help us understand how the site is used, and run only after you consent:"],
      items: ["Google Analytics", "Microsoft Clarity"],
    },
    {
      heading: "Marketing files (with your consent)",
      paragraphs: ["They measure our advertising campaigns, and run only after you consent:"],
      items: ["Meta Pixel", "Snapchat Pixel", "TikTok Pixel"],
    },
    { heading: "Form protection", paragraphs: ["We use Google reCAPTCHA to protect forms from spam; it may set its own files under Google's policy."] },
    { heading: "How to control them", paragraphs: ["You can change your choice or withdraw consent at any time from the cookies link at the bottom of any page, or from your browser settings."] },
  ];
}

export function legalSections(kind: LegalKind, locale: LegalLocale): LegalSection[] {
  return { privacy, terms, cookies }[kind](locale);
}
