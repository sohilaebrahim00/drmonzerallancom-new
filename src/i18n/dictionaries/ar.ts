import type { Entry } from "../types";
import type { TranslationKey } from "./en";

/**
 * Arabic is `Partial` on purpose: a key with no Arabic form falls back to the
 * English string at runtime rather than breaking the build. Requiring
 * completeness would mean every new English string blocks `npm run build`
 * until someone who reads Arabic is available — which, on a live site, means
 * the enforcement gets deleted the first time it is inconvenient.
 *
 * The gap is reported instead of hidden: see `missingArabicKeys()` in
 * ../coverage.ts, which the language switcher logs in development.
 *
 * TRANSLATION STATUS: these are UI microcopy only, written to demonstrate the
 * six plural forms, and they need the doctor's review before launch. Long-form
 * prose — articles, service descriptions, FAQs (FIX_PLAN 5.2) — is NOT
 * translated here and must not be machine-translated: it is medical copy under
 * his name.
 */
export const ar: Partial<Record<TranslationKey, Entry>> = {
  // Six forms, because Arabic has six. `two` is a real dual noun
  // ("سؤالين"), not the plural with a 2 in front of it.
  "faq.resultCount": {
    zero: "لم يتم العثور على أسئلة",
    one: "تم العثور على سؤال واحد",
    two: "تم العثور على سؤالين",
    few: "تم العثور على {count} أسئلة",
    many: "تم العثور على {count} سؤالاً",
    other: "تم العثور على {count} سؤال",
  },
  "products.resultCount": {
    zero: "لم يتم العثور على منتجات",
    one: "تم العثور على منتج واحد",
    two: "تم العثور على منتجين",
    few: "تم العثور على {count} منتجات",
    many: "تم العثور على {count} منتجاً",
    other: "تم العثور على {count} منتج",
  },
  "notifications.coverageDays": {
    zero: "لا يغطي أي أيام حالياً.",
    one: "يغطي حالياً اليوم التالي.",
    two: "يغطي حالياً اليومين التاليين.",
    few: "يغطي حالياً {count} أيام تالية.",
    many: "يغطي حالياً {count} يوماً تالياً.",
    other: "يغطي حالياً {count} يوم تالٍ.",
  },
  "consultations.creditsRemaining": {
    zero: "لم يتبقَ أي رصيد من {limit}",
    one: "متبقٍ رصيد واحد من {limit}",
    two: "متبقٍ رصيدان من {limit}",
    few: "متبقٍ {count} أرصدة من {limit}",
    many: "متبقٍ {count} رصيداً من {limit}",
    other: "متبقٍ {count} رصيد من {limit}",
  },

  "common.language": "اللغة",
  "consultations.title": "الاستشارات",
  "faq.searchPlaceholder": "ابحث في الأسئلة",

  // --- global navigation ----------------------------------------------
  "nav.about": "من نحن",
  "nav.packages": "البرامج",
  "nav.shop": "المتجر",
  "nav.blog": "المقالات",
  "nav.gallery": "معرض الصور",
  "nav.faq": "الأسئلة الشائعة",
  "nav.contact": "تواصل معنا",

  // --- header -----------------------------------------------------------
  "header.homeAriaLabel": "منذر علان — الصفحة الرئيسية",
  "header.logoAlt": "شعار منذر علان",
  "header.openMenu": "فتح القائمة",
  "header.menuTitle": "القائمة",
  "header.primaryNavLabel": "التنقل الرئيسي",
  "header.mobileNavLabel": "تنقل الهاتف",
  "header.signIn": "تسجيل الدخول",
  "header.createAccount": "إنشاء حساب",
  "header.myAccount": "حسابي",

  // --- footer -----------------------------------------------------------
  "footer.navigation": "التنقل",
  "footer.popularServices": "الخدمات الأكثر طلباً",
  "footer.getInTouch": "تواصل معنا",
  "footer.reachOut": "تواصل معنا عبر",
  "footer.contactPage": "صفحة التواصل",
  "footer.privacy": "سياسة الخصوصية",
  "footer.terms": "شروط الخدمة",
  "footer.medicalDisclaimer": "إخلاء المسؤولية الطبية",

  // --- shared controls --------------------------------------------------
  "cta.bookSession": "احجز جلسة",
  "cta.viewPrograms": "تصفّح البرامج",
  "cta.backToTop": "العودة إلى الأعلى",

  // --- home sections: heading blocks ------------------------------------
  "services.eyebrow": "الخدمات",
  "services.title": "رعاية تغذوية متخصصة في كل مرحلة من مراحل العمر",
  "services.description":
    "اثنا عشر برنامجاً متخصصاً، كل منها مصمّم ليناسب جسمك وأهدافك وحالتك الطبية.",

  "programs.eyebrow": "البرامج",
  "programs.title": "اختر مسارك",
  "programs.description":
    "برنامج علاجي مع متابعة طبية عن قرب — اختر مستوى الدعم الاستشاري الذي تحتاجه، دون أي اشتراك متكرر.",

  "howItWorks.eyebrow": "البرامج",
  "howItWorks.title": "كيف تسير الأمور",
  "howItWorks.description":
    "من اختيار البرنامج إلى استشارتك الأولى — خطوات بسيطة وواضحة، وبدفعة واحدة.",

  "products.eyebrow": "المنتجات",
  "products.title": "منتجات صحية مختارة",
  "products.description": "منتجات مختارة بعناية لدعم روتينك اليومي الصحي.",

  "blog.eyebrow": "المقالات",
  "blog.title": "تعرّف على العلم وراء النصيحة",
  "blog.description": "مقالات مجانية قائمة على الأدلة، تتناول المواضيع الأكثر أهمية لصحتك.",

  "discovery.eyebrow": "تصفّح حسب الموضوع",
  "discovery.title": "اعثر على الإرشاد فيما يهمّك أكثر",

  "gallery.eyebrow": "معرض الصور",
  "gallery.title": "لمحة من داخل العيادة",

  "testimonials.eyebrow": "آراء العملاء",
  "testimonials.title": "ماذا يقول العملاء",

  "videos.eyebrow": "شاهد وتعلّم",
  "videos.title": "معلومات تغذوية بالفيديو",
  "videos.description": "معلومات تغذوية عملية، مشروحة ببساطة.",

  "community.eyebrow": "المجتمع",
  "community.title": "انضم إلى المجتمع",

  "contactSection.eyebrow": "تواصل معنا",
  "contactSection.title": "لنبدأ رحلتك الغذائية",
  "contactSection.description":
    "تواصل معنا لأي استفسار، أو احجز جلستك الأولى مباشرة — أيهما أسهل بالنسبة لك.",

  "beforeAfter.eyebrow": "ما الذي يتغيّر",
  "beforeAfter.title": "الطاولة نفسها، في مساءين مختلفين",
  "beforeAfter.description": "اسحب الشريط للمقارنة. الحديث هنا عمّا في الطبق — لا عن جسد أحد.",
  "beforeAfter.storiesEyebrow": "تقدّم حقيقي",
  "beforeAfter.storiesTitle": "قصص التحوّل",
  "beforeAfter.storiesDescription":
    "لمحات توضيحية عن تقدّم العملاء. اسحب الشريط للمقارنة بين ما قبل وما بعد.",

  "faqSection.eyebrow": "الأسئلة الشائعة",
  "faqSection.title": "الأسئلة الشائعة",
};
