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
/**
 * ── THE RULE, when a word could go either way ──────────────────────────
 * THE ARABIC MUST NOT ASSERT MORE THAN THE ENGLISH DOES.
 *
 * Worked example, because it is counter-intuitive. `testimonials.eyebrow` is
 * "Client Reviews". Arabic offers "العملاء" (clients) or "المراجعين" (those
 * who attend a clinic). "المراجعين" reads as the safer, more clinical,
 * more medical-sounding choice — and it is the wrong one. The English says
 * "clients" and not "patients" deliberately, because a patient relationship
 * carries different regulatory weight. Arabic that says "المراجعين" claims a
 * clinical relationship the English is careful not to claim.
 *
 * So the test is not "which word sounds more professional". It is "does this
 * word claim anything the English does not". If it does, use the plainer one
 * and flag it.
 *
 * ── THE SECOND RULE ────────────────────────────────────────────────────
 * A TRANSLATED STRING IS NEVER AN IDENTITY.
 *
 * Never compare it, never use it as an object key, never put it in a URL or a
 * query parameter, never store it in the database. It changes with the locale,
 * so every one of those breaks the moment someone switches language.
 *
 * And it is worse than it looks here, because of this module's own bidi
 * isolation: interpolate() wraps every substituted value in invisible
 * U+2068/U+2069 characters. A string that LOOKS identical to its English self,
 * character for character on screen, will still fail `===`. Anyone debugging
 * that from the rendered output alone will not see why.
 *
 * The pattern instead — the same one the nav uses — is that the data carries a
 * stable, untranslated IDENTIFIER, and the component renders `t(key)` from it:
 *
 *     const CATEGORY_LABELS: Record<ArticleCategory, SimpleTranslationKey> = {
 *       "Weight Management": "articleCategory.weightManagement", ...
 *     };
 *     filter:  article.category === activeCategory   // identity, English
 *     render:  t(CATEGORY_LABELS[article.category])  // display, translated
 *
 * Categories are the live example: the same string was doing gradient lookup,
 * filtering, related-content scoring and search matching. Translating it in
 * place would have returned zero results, dropped every card to the default
 * gradient, and silently broken search.
 */
/**
 * ── THE THIRD RULE ─────────────────────────────────────────────────────
 * ONE VOICE PER PAGE: ADDRESS THE READER.
 *
 * Where a string refers to the person reading it, use the second person —
 * حياتك, جدولك, يساعدك — not "the client" in the third person. Arabic feels a
 * shift between the two far more sharply than English does, and the two land
 * on the same screen: a heading saying "واقع حياتك" above a paragraph saying
 * "ما يأكله العميل" reads as two different documents.
 *
 * THE EXCEPTION, and it is not a violation: strings about OTHER clients stay
 * third person, because the reader is not the subject. "آراء العملاء" and
 * "تقدّم العملاء" are correct as they are — the reader is being shown what
 * other people said and did.
 *
 * Test: is this sentence ABOUT the reader, or about someone else?
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
  "services.title": "رعاية تغذوية متخصصة في كل مرحلة من مراحل الحياة",
  "services.description":
    "اثنا عشر برنامجاً متخصصاً، كل منها مصمّم ليناسب جسمك وأهدافك وحالتك الطبية.",

  "programs.eyebrow": "البرامج",
  "programs.title": "اختر مسارك",
  "programs.description":
    "برنامج علاجي مع متابعة طبية عن قرب — اختر مستوى الدعم الاستشاري الذي تحتاجه، دون أي اشتراك متكرر.",

  "howItWorks.eyebrow": "البرامج",
  "howItWorks.title": "كيف يسير البرنامج",
  "howItWorks.description":
    "من اختيار البرنامج إلى استشارتك الأولى — خطوات بسيطة وواضحة، وبدفعة واحدة.",

  "products.eyebrow": "المنتجات",
  "products.title": "منتجات صحية مختارة",
  "products.description": "منتجات مختارة بعناية لدعم روتينك اليومي الصحي.",

  "blog.eyebrow": "المقالات",
  "blog.title": "تعرّف على العلم وراء النصيحة",
  "blog.description": "مقالات مجانية قائمة على الأدلة، تتناول المواضيع الأكثر أهمية لصحتك.",

  "discovery.eyebrow": "تصفّح حسب الموضوع",
  "discovery.title": "إرشادات حول ما يهمّك أكثر",

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

  // --- page furniture ---------------------------------------------------
  "faqPage.eyebrow": "مركز المعرفة",
  "faqPage.description":
    "ابحث أو صفِّ حسب الموضوع للعثور على إجابات حول البرامج والاستشارات والفواتير وغيرها.",
  "faqPage.searchPlaceholder": "ابحث في الأسئلة…",
  "faqPage.searchAriaLabel": "البحث في الأسئلة الشائعة",
  "faqPage.categoryAll": "الكل",
  "faqPage.noResults": "لا توجد أسئلة تطابق بحثك. جرّب كلمة أخرى أو تصنيفاً آخر.",
  "faqPage.stillHaveQuestion": "هل لديك سؤال آخر؟",
  "faqPage.stillHaveQuestionBody": "اسأل مباشرة، أو تصفّح البرامج لمعرفة ما يتضمنه كل برنامج.",
  "faqPage.explorePrograms": "تصفّح البرامج",
  "faqPage.contactUs": "تواصل معنا",

  "productsPage.searchPlaceholder": "ابحث في المنتجات…",
  "productsPage.searchAriaLabel": "البحث في المنتجات",

  "blogPage.searchPlaceholder": "ابحث في المقالات…",
  "blogPage.searchAriaLabel": "البحث في المقالات",
  "blogPage.featured": "مقال مختار",
  "blogPage.readArticle": "اقرأ المقال",

  "common.minRead": "دقائق قراءة",
  "common.read": "اقرأ",
  "common.home": "الرئيسية",

  // --- taxonomy labels --------------------------------------------------
  // DISPLAY ONLY — see the second rule at the top of this file.
  "faqCategory.programs": "البرامج",
  "faqCategory.consultations": "الاستشارات",
  "faqCategory.consultationCredits": "أرصدة الاستشارات",
  "faqCategory.onlineMeetings": "الجلسات عبر الإنترنت",
  "faqCategory.accountBilling": "الحساب والفواتير",
  "faqCategory.products": "المنتجات",
  "faqCategory.nutritionServices": "خدمات التغذية",
  "faqCategory.generalQuestions": "أسئلة عامة",

  "articleCategory.weightManagement": "إدارة الوزن",
  "articleCategory.clinicalNutrition": "التغذية السريرية",
  "articleCategory.sportsNutrition": "تغذية الرياضيين",
  "articleCategory.womensHealth": "صحة المرأة",
  "articleCategory.familyNutrition": "تغذية الأسرة",
  "articleCategory.digestiveHealth": "صحة الجهاز الهضمي",
  "articleCategory.heartHealth": "صحة القلب",

  "productCategory.supplements": "المكمّلات الغذائية",
  "productCategory.vitaminsMinerals": "الفيتامينات والمعادن",
  "productCategory.herbalWellness": "الأعشاب الطبيعية",
  "productCategory.healthMonitoringDevices": "أجهزة المتابعة الصحية",

  "videoCategory.nutrition": "التغذية",
  "videoCategory.wellness": "الصحة العامة",
  "videoCategory.education": "توعية",
  "videoCategory.lifestyle": "نمط الحياة",
  "videoCategory.metabolicHealth": "صحة الأيض",

  // --- gallery page -----------------------------------------------------
  "galleryPage.storyInPractice": "من داخل العيادة",
  "galleryPage.storyInPracticeBody": "لقطات من استشارات حقيقية ومن يوميات العمل.",
  "galleryPage.storyBehindKnowledge": "ما وراء المعرفة",
  "galleryPage.storyBehindKnowledgeBody": "كيف يشكّل البحث والتدريب السريري كل توصية.",
  "galleryPage.storyEducational": "لحظات تثقيفية",
  "galleryPage.storyEducationalBody": "لقطات من محاضرات وجلسات وتثقيف مجتمعي.",
  "galleryPage.storyEvents": "الفعاليات والمجتمع",
  "galleryPage.storyEventsBody": "مبادرات مجتمعية وفعاليات صحية.",
  "galleryPage.storyJourney": "المسيرة المهنية",
  "galleryPage.storyJourneyBody": "محطات في التخصص السريري والتغذوي.",

  // --- About page -------------------------------------------------------
  // ALL FLAGGED. See the English side for why.
  "aboutPage.eyebrow": "عن {name}",
  "aboutPage.title": "نهج سريري في التغذية، قائم على واقع حياتك",
  "aboutPage.lede":
    "{name} هو {title} يساعدك على بناء عادات غذائية دائمة قائمة على الأدلة — لا حميات قاسية قصيرة الأمد.",
  "aboutPage.philosophyEyebrow": "فلسفة الرعاية",
  "aboutPage.philosophyTitle": "إرشاد يبدأ من واقع حياتك",
  "aboutPage.philosophyBody":
    "تبدأ كل خطة مما تأكله فعلاً، لا من قالب مفروض من الخارج. وبالجمع بين التدريب السريري للصيدلي وعلم التغذية المتخصص، يبقى الهدف واحداً: إرشاد يحترم جدولك وثقافتك وتفضيلاتك، ويظل في الوقت نفسه قائماً على الأدلة. التغيير الذي يدوم يأتي من تعديلات صغيرة وواقعية — لا من انقلابات جذرية يصعب الاستمرار عليها.",
  "aboutPage.backgroundEyebrow": "الخلفية المهنية",
  "aboutPage.backgroundTitle": "المؤهلات",
  "aboutPage.focusEyebrow": "مجالات التركيز",
  "aboutPage.focusTitle": "دعم متخصص في كل مرحلة من مراحل الحياة",
  "aboutPage.ctaTitle": "ابدأ رحلتك الغذائية",
  "aboutPage.ctaBody": "اختر برنامجاً للحصول على متابعة، أو تواصل معنا لطرح سؤال قبل أن تبدأ.",
  "aboutPage.mission": "الرسالة",
  "aboutPage.vision": "الرؤية",
  "aboutPage.bio1":
    "يجمع منذر علان بين الخبرة السريرية والتغذوية في كل استشارة — فبتدريبه كصيدلي وتخصصه في التغذية، يتعامل مع الصحة من زاويتين: علم الجسم، وواقع ما نأكله كل يوم.",
  "aboutPage.bio2":
    "بدلاً من خطط غذائية جاهزة تصلح للجميع، يبني منذر إرشاده حول حياتك كما هي: جدولك وثقافتك وتفضيلاتك وأهدافك. والهدف واحد دائماً — تغيير يدوم دون أن يبدو تضحية.",
  "aboutPage.bio3":
    "تجمع مقاربته بين علم التغذية القائم على الأدلة والدعم المستمر الحقيقي، عبر البرامج المتخصصة الموضحة أدناه.",
  "aboutPage.missionBody":
    "أن نجعل الإرشاد التغذوي المتخصص القائم على الأدلة متاحاً وقابلاً للاستمرار فعلاً — بمساعدتك على بناء علاقة أفضل مع الطعام، خطوة واقعية في كل مرة.",
  "aboutPage.visionBody":
    "مجتمع تنبع فيه الخيارات الأفضل من الفهم لا من الحرمان — وتكون فيه الرعاية التغذوية شخصية ومبنية على المعرفة ومصمّمة لتدوم مدى الحياة.",
  "credential.licensedPharmacist": "صيدلي مرخّص",
  "credential.licensedPharmacistBody": "أساس سريري في علم الأدوية وكيفية تفاعل التغذية مع العلاج.",
  "credential.nutritionSpecialist": "أخصائي تغذية",
  "credential.nutritionSpecialistBody":
    "تدريب متخصص في علم التغذية القائم على الأدلة وتغيير السلوك.",

  // --- footer prose -----------------------------------------------------
  "footer.tagline": "إرشاد موثوق في التغذية والصحة من {title} — افهم أكثر، اختر أفضل، عش بصحة.",
  "footer.disclaimer": "محتوى تثقيفي فقط، ولا يغني عن استشارة طبية متخصصة.",

  // --- index page headings ----------------------------------------------
  "productsPage.title": "منتجات صحية وأجهزة طبية",
  "blogPage.title": "معرفة تغذوية يمكنك الوثوق بها",

  // --- packages: how credits work ---------------------------------------
  "packagesPage.eyebrow": "البرامج",
  "packagesPage.title": "اختر برنامجك",
  "packagesPage.detailsEyebrow": "التفاصيل",
  "packagesPage.detailsTitle": "كيف تعمل أرصدة الاستشارات والجلسات",
  "packagesPage.creditsTitle": "أرصدة البرنامج",
  "packagesPage.meetTitle": "Google Meet",
  "packagesPage.lede":
    "دفعة واحدة لبرنامج تغذوي أو علاجي مع متابعة — والفرق بين المستويات هو عدد استشارات الطبيب المتضمنة فقط. بلا اشتراك متكرر وبلا فواتير دورية.",
  "productsPage.lede":
    "تصفّح مجموعة {name} من منتجات العناية الصحية والمكمّلات وأجهزة المتابعة المنزلية.",
  "blogPage.lede": "مقالات عملية قائمة على الأدلة تساعدك على فهم التغذية واتخاذ قرارات واثقة.",
};
