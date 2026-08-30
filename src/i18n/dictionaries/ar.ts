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
  "common.minRead": {
    zero: "أقل من دقيقة قراءة",
    one: "دقيقة قراءة واحدة",
    two: "دقيقتا قراءة",
    few: "{count} دقائق قراءة",
    many: "{count} دقيقة قراءة",
    other: "{count} دقيقة قراءة",
  },
  "packages.consultationCount": {
    zero: "بدون استشارات",
    one: "استشارة واحدة",
    two: "استشارتان",
    few: "{count} استشارات",
    many: "{count} استشارة",
    other: "{count} استشارة",
  },
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

  "article.byline": "بقلم {name}",
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
  // --- patient screens: auth --------------------------------------------
  "auth.emailLabel": "البريد الإلكتروني",
  "auth.passwordLabel": "كلمة المرور",
  "auth.newPasswordLabel": "كلمة المرور الجديدة",
  "auth.confirmPasswordLabel": "تأكيد كلمة المرور الجديدة",
  "auth.emailInvalid": "الرجاء إدخال بريد إلكتروني صحيح.",
  "auth.passwordRequired": "الرجاء إدخال كلمة المرور.",
  "auth.passwordTooShort": "يجب ألا تقل كلمة المرور عن 8 أحرف.",
  "auth.passwordsDoNotMatch": "كلمتا المرور غير متطابقتين.",
  "auth.signInTitle": "تسجيل الدخول",
  "auth.signInBody": "ادخل إلى حسابك لدى منذر علان.",
  "auth.forgotTitle": "نسيت كلمة المرور",
  "auth.forgotBody": "أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين.",
  "auth.forgotUnavailable": "خدمة إعادة تعيين كلمة المرور غير مفعّلة بعد.",
  "auth.resetTitle": "تعيين كلمة مرور جديدة",
  "auth.resetBody": "اختر كلمة مرور جديدة لحسابك.",

  // --- patient screens: after checkout ----------------------------------
  "membership.confirming": "نؤكّد عملية الدفع…",
  "membership.checkingStatus": "نتحقق من حالة حسابك الحالية.",
  "membership.allSet": "كل شيء جاهز",
  "membership.allSetBody": "شكراً لك. انتقل إلى حسابك لعرض أرصدة الاستشارات وطلب جلستك الأولى.",
  "membership.settingUp": "تم استلام الدفعة — جارٍ تجهيز حسابك",
  "membership.settingUpBody":
    "تم إرسال دفعتك إلى Stripe. نؤكّدها الآن ونجهّز حسابك — وعادةً لا يستغرق ذلك سوى بضع دقائق. تحقّق من بريدك الإلكتروني، ستجد رسالة تدعوك لتعيين كلمة المرور وتسجيل الدخول.",
  "membership.cancelledTitle": "تم إلغاء عملية الدفع",
  "membership.cancelledBody":
    "لم تتم أي عملية دفع ولم يُخصم أي مبلغ — سواء ألغيت العملية أو رُفضت البطاقة. يمكنك المتابعة من حيث توقفت في أي وقت.",

  // --- 404 ---------------------------------------------------------------
  "notFound.title": "تعذّر العثور على هذه الصفحة",
  "notFound.body":
    "قد تكون الصفحة التي تبحث عنها نُقلت أو لم تعد موجودة. لنعُد بك إلى المسار الصحيح.",
  // --- consultation intake (ALL FLAGGED) ---------------------------------
  "intake.label1": "سبب الاستشارة",
  "intake.label2": "الأعراض الحالية",
  "intake.label3": "التحاليل والأدوية والمكمّلات الأخيرة",
  "intake.label4": "مستويات الفيتامينات والمعادن",
  "intake.label5": "يوم اعتيادي من الطعام",
  "intake.label6": "مستوى التوتر",
  "intake.label7": "النشاط البدني",
  "intake.label8": "النوم",
  "intake.optionalNote": "بعض الأسئلة الاختيارية قبل استشارتك.",
  // --- legal notice (ALL FLAGGED) ----------------------------------------
  "legal.englishAuthoritative":
    "هذه الصفحة متاحة باللغة الإنجليزية فقط. النص الإنجليزي هو النسخة المعتمدة وهو المعمول به.",
  // --- package copy (ALL FLAGGED) ----------------------------------------
  "pkg.dietBasic.name": "برنامج التغذية — أساسي",
  "pkg.dietBasic.tagline": "ابدأ برنامجك الغذائي بإشراف متخصص",
  "pkg.dietPlus.name": "برنامج التغذية — بلَس",
  "pkg.dietPlus.tagline": "متابعة أكثر تبقي برنامجك على المسار",
  "pkg.dietPremium.name": "برنامج التغذية — بريميوم",
  "pkg.dietPremium.tagline": "المسار الأكثر متابعة نحو هدفك",
  "pkg.treatmentBasic.name": "البرنامج العلاجي — أساسي",
  "pkg.treatmentBasic.tagline": "ابدأ خطتك العلاجية باستشارة أولى",
  "pkg.treatmentPlus.name": "البرنامج العلاجي — بلَس",
  "pkg.treatmentPlus.tagline": "متابعة أقرب خلال خطتك العلاجية",
  "pkg.treatmentPremium.name": "البرنامج العلاجي — بريميوم",
  "pkg.treatmentPremium.tagline": "أعلى مستوى متابعة طبية متاح",
  "pkg.feature.nutritionProgram": "برنامج غذائي",
  "pkg.feature.treatmentPlan": "خطة علاجية",
  "pkg.feature.monthlyFollowUp": "متابعة شهرية",
  "pkg.feature.doctorConsultations": {
    zero: "بدون استشارات",
    one: "استشارة واحدة مع الطبيب",
    two: "استشارتان مع الطبيب",
    few: "{count} استشارات مع الطبيب",
    many: "{count} استشارة مع الطبيب",
    other: "{count} استشارة مع الطبيب",
  },
  "pkg.cta.startProgram": "ابدأ برنامجك",
  // --- FAQ content (ALL FLAGGED) -----------------------------------------
  "faqItem.q1": "ما الذي يتضمنه البرنامج؟",
  "faqItem.a1":
    "كل برنامج هو عملية شراء لمرة واحدة تشمل عدداً محدداً من أرصدة الاستشارات مع الطبيب، والوصول إلى حسابك وسجل استشاراتك، ودعماً علاجياً مستمراً. تأتي البرامج العلاجية بمستويات أساسي وبلَس وبريميوم، ولا تختلف إلا في عدد الاستشارات المتضمنة — يمكنك مقارنتها في صفحة البرامج.",
  "faqItem.q2": "هل هذا اشتراك؟ وهل سيتم تحصيل مبلغ مني مرة أخرى؟",
  "faqItem.a2":
    "لا. كل برنامج هو دفعة واحدة فقط — لا توجد فوترة متكررة ولا يتجدد شيء تلقائياً. وإذا رغبت لاحقاً في استشارات إضافية، يمكنك شراء برنامج آخر في أي وقت.",
  "faqItem.q3": "ماذا يحدث في الاستشارة الأولى؟",
  "faqItem.a3":
    "جلستك الأولى هي تقييم شامل لتاريخك الصحي وعاداتك الغذائية الحالية ونمط حياتك وأهدافك. وفي نهايتها ستخرج بصورة واضحة عن خطتك والخطوات التالية — دون تخمين.",
  "faqItem.q4": "هل تقدّمون استشارات عبر الإنترنت؟",
  "faqItem.a4":
    "نعم. تُجرى استشارات البرامج عبر الإنترنت من خلال Google Meet، ويمكن أيضاً حجز أي خدمة حضورياً — اختر ما يناسب جدولك وراحتك.",
  "faqItem.q5": "كيف تعمل أرصدة الاستشارات؟",
  "faqItem.a5":
    "يتضمن كل برنامج عدداً ثابتاً من أرصدة الاستشارات، تُمنح مرة واحدة عند الشراء (2 أو 3 أو 4 بحسب المستوى الذي تختاره). وتُستخدم رصيداً واحداً في كل مرة تطلب فيها استشارة عبر الإنترنت من حسابك.",
  "faqItem.q6": "ماذا يحدث إن لم أستخدم كل أرصدتي؟",
  "faqItem.a6":
    "تبقى أرصدتك في حسابك — فهي تُمنح مرة واحدة عند الشراء ولا تنتهي صلاحيتها بدورة شهرية، إذ لا توجد فوترة متكررة ترتبط بها. وهي مرتبطة بحسابك وغير قابلة للتحويل.",
  "faqItem.q7": "كيف أنضم إلى استشارتي عبر الإنترنت؟",
  "faqItem.a7":
    "بمجرد الموافقة على طلب الاستشارة، يُرفق رابط Google Meet بذلك الموعد في حسابك. وستتمكن من الانضمام مباشرة من هناك في الوقت المحدد.",
  "faqItem.q8": "كيف أنشئ حساباً؟",
  "faqItem.a8":
    "يُنشأ الحساب تلقائياً عند شرائك برنامجاً. انتقل إلى صفحة البرامج، واختر برنامجاً علاجياً، وأكمل الدفع الآمن — عندها يُفعَّل حسابك وتقوم بتعيين كلمة المرور من هناك.",
  "faqItem.q9": "هل معلومات الدفع الخاصة بي آمنة؟",
  "faqItem.a9":
    "تتم معالجة المدفوعات عبر Stripe، وهي جهة دفع آمنة ومتوافقة مع معيار PCI — لن يطلب منك هذا الموقع إرسال بيانات بطاقتك مباشرة، ونحن لا نراها ولا نخزّنها إطلاقاً.",
  "faqItem.q10": "هل يمكنني شراء المنتجات مباشرة من الموقع؟",
  "faqItem.a10":
    "جميع المنتجات المعروضة حالياً مسجّلة بأنها غير متوفرة. ويسعدنا أن تسأل عن توفرها من أي صفحة منتج، وسنوافيك بالمستجدات مباشرة.",
  "faqItem.q11": "متى سأرى النتائج؟",
  "faqItem.a11":
    "يعتمد ذلك على هدفك ونقطة انطلاقك، لكن معظم العملاء يلاحظون تغيّراً ملموساً في الطاقة والعادات خلال أسبوعين إلى ثلاثة، مع نتائج جسدية مرئية تتراكم عادةً على مدى 4 إلى 8 أسابيع.",
  "faqItem.q12": "هل تُبنى الخطة على أطعمة أتناولها فعلاً؟",
  "faqItem.a12":
    "دائماً. تبدأ كل خطة من نمط حياتك وتفضيلاتك وثقافتك الحالية — فهي تتكيّف معك، وليست قالباً عاماً تُجبر على اتباعه.",
  "faqItem.q13": "هل يمكنكم التعامل مع حالة طبية قائمة؟",
  "faqItem.a13":
    "نعم، التغذية السريرية لحالات مثل السكري وارتفاع ضغط الدم وارتفاع الكوليسترول جزء أساسي من عمل العيادة. وتُنسَّق الخطط مع إرشادات طبيبك المعالج عند الحاجة.",
  "faqItem.q14": "هل تقدّمون إرشاداً لكبار السن؟",
  "faqItem.a14":
    "نعم — تغذية كبار السن خدمة مخصصة، تشمل دعم العظام والعضلات، وقوائم طعام تناسب ضعف الشهية، وتخطيطاً يراعي الأدوية في هذه المرحلة من العمر.",
  "faqItem.q15": "هل تدعمون المرضى الذين يخضعون لعلاج السرطان؟",
  "faqItem.a15":
    "نعم — الدعم التغذوي لمرضى السرطان خدمة مخصصة، أثناء العلاج وبعده. وتركّز على الحفاظ على الوزن والكتلة العضلية، وعلى التعامل مع فقدان الشهية والغثيان وتغيّر حاسة التذوق حتى تتمكن من الاستمرار في الأكل الجيد رغم الأعراض الجانبية. وهي رعاية تغذوية داعمة تعمل إلى جانب فريق الأورام المعالج لك، وتكمّل خطة العلاج التي وضعها طبيب الأورام — ولا تحل محلها أبداً. أما الأسئلة المتعلقة بعلاجك أو بمآل حالتك أو بما إذا كان طعام أو مكمّل معيّن آمناً أثناء العلاج الكيميائي، فيجب توجيهها إلى الطبيب مع فريق الأورام المتابع لك، لا الاكتفاء بإجابة عامة.",
  "faqItem.q16": "كيف أحجز جلسة؟",
  "faqItem.a16":
    "استخدم زر «احجز جلسة» في أي مكان على الموقع لاختيار الخدمة والتاريخ والوقت المفضّل ونوع الجلسة. وستصلك رسالة تأكيد فور الحجز.",
  "faqItem.q17": "ما هي سياسة الإلغاء لديكم؟",
  "faqItem.a17":
    "نرجو إشعارنا قبل 24 ساعة على الأقل لإعادة جدولة الجلسة أو إلغائها، حتى يتسنى إتاحة الموعد لعميل آخر. تواصل معنا عبر واتساب أو صفحة التواصل وسنتولى الأمر.",
  // --- product copy (ALL FLAGGED) ----------------------------------------
  "product.omega3KrillOil.name": "زيت الكريل أوميغا-3",
  "product.omega3KrillOil.short":
    "مكمّل غذائي من زيت الكريل بعلامة منذر علان، يوفّر نحو 240 ملغ من أوميغا-3 في الجرعة الواحدة.",
  "product.irishMossBladderwrack.name": "طحلب إيرلندي + عشب المثانة",
  "product.irishMossBladderwrack.short":
    "مكمّل من مزيج المعادن البحرية بعلامة منذر علان، يجمع بين الطحلب الإيرلندي وعشب المثانة.",
  "product.resveratrol.name": "ريسفيراترول",
  "product.resveratrol.short":
    "مكمّل ريسفيراترول بعلامة منذر علان، مخصص لدعم مضادات الأكسدة وصحة الخلايا.",
  "product.betaCarotene.name": "بيتا كاروتين",
  "product.betaCarotene.short": "مكمّل بيتا كاروتين بعلامة منذر علان، وهو طليعة فيتامين A.",
  "product.norwegianCodLiverOil60.name": "زيت كبد سمك القد النرويجي — 60 كبسولة",
  "product.norwegianCodLiverOil60.short":
    "مكمّل زيت كبد سمك القد النرويجي بعلامة منذر علان، يحتوي على أوميغا-3 وفيتاميني A وD.",
  "product.tudca.name": "TUDCA",
  "product.tudca.short": "مكمّل TUDCA بعلامة منذر علان، مخصص لدعم الكبد والجهاز الهضمي.",
  "product.milkThistleExtract.name": "مستخلص شوك الحليب",
  "product.milkThistleExtract.short":
    "مكمّل مستخلص شوك الحليب بعلامة منذر علان، مقنّن بنسبة 80% سيليمارين.",
  "product.glucosamineChondroitin.name": "جلوكوزامين وكوندرويتين",
  "product.glucosamineChondroitin.short":
    "مكمّل جلوكوزامين وكوندرويتين بعلامة منذر علان، لدعم المفاصل والحركة.",
  "product.berberinePlus.name": "بربرين بلَس",
  "product.berberinePlus.short": "مكمّل بربرين بعلامة منذر علان، مخصص لدعم الأيض ومستوى الغلوكوز.",
  "product.alphaLipoicAcid.name": "حمض ألفا ليبويك",
  "product.alphaLipoicAcid.short": "مكمّل حمض ألفا ليبويك بعلامة منذر علان، لدعم الخلايا والأيض.",
  "product.potassiumGluconate.name": "غلوكونات البوتاسيوم",
  "product.potassiumGluconate.short":
    "مكمّل غلوكونات البوتاسيوم بعلامة منذر علان، لدعم الأملاح والصحة العامة.",
  "product.spirulina.name": "سبيرولينا",
  "product.spirulina.short":
    "مكمّل سبيرولينا بعلامة منذر علان، لدعم الخضراوات الغذائية والصحة اليومية.",
  "product.shilajitExtraStrength.name": "شيلاجيت — تركيز مضاعف",
  "product.shilajitExtraStrength.short":
    "مكمّل شيلاجيت بعلامة منذر علان، مصنّف كتركيبة معدنية للحيوية.",
  "product.stingingNettle.name": "نبات القرّاص",
  "product.stingingNettle.short":
    "مكمّل نبات القرّاص بعلامة منذر علان، مصنّف كتركيبة داعمة للرجال.",
  "product.tongkatAli.name": "تونغكات علي",
  "product.tongkatAli.short":
    "مكمّل تونغكات علي (LJ100) بعلامة منذر علان، مصنّف كتركيبة للقوة والحيوية.",
  "product.superMaleBComplex.name": "سوبر مِيل بي-كومبلكس",
  "product.superMaleBComplex.short":
    "مكمّل فيتامينات ب المركّبة بعلامة منذر علان، مصنّف كتركيبة للأداء.",
  "product.glutathione.name": "غلوتاثيون",
  "product.glutathione.short":
    "مكمّل غلوتاثيون بعلامة منذر علان، لدعم مضادات الأكسدة ودفاعات الخلايا.",
  "product.grassFedBeefLiver.name": "كبد بقري مرعي طبيعياً",
  "product.grassFedBeefLiver.short":
    "مكمّل غذائي كامل من كبد البقر المرعي طبيعياً بعلامة منذر علان.",
  "product.vitaminD3K2.name": "فيتامين D3 وK2",
  "product.vitaminD3K2.short":
    "مكمّل فيتامين D3 + K2 (MK-7) بعلامة منذر علان، لدعم العظام والقلب والمناعة.",
  "product.norwegianCodLiverOil120.name": "زيت كبد سمك القد النرويجي — 120 كبسولة",
  "product.norwegianCodLiverOil120.short":
    "مكمّل زيت كبد سمك القد النرويجي بعلامة منذر علان، يحتوي على فيتاميني A وD وأوميغا-3.",
  "product.coq10.name": "إنزيم CoQ10",
  "product.coq10.short": "مكمّل CoQ10 بعلامة منذر علان، لدعم القلب وطاقة الخلايا.",
  "product.advancedBComplex.name": "بي-كومبلكس المتقدّم",
  "product.advancedBComplex.short":
    "مكمّل فيتامينات ب المركّبة بعلامة منذر علان، مصنّف كتركيبة يومية متكاملة للطاقة.",
  "product.nonContactInfraredThermometer.name": "ميزان حرارة بالأشعة تحت الحمراء دون لمس",
  "product.nonContactInfraredThermometer.short":
    "ميزان حرارة بالأشعة تحت الحمراء دون لمس بعلامة منذر علان، بشاشة تنبيه للحمّى بثلاثة ألوان.",
  "product.digitalThermometer.name": "ميزان حرارة رقمي",
  "product.digitalThermometer.short":
    "ميزان حرارة رقمي بعلامة منذر علان، لقياس درجة الحرارة في المنزل.",
  "product.digitalBloodPressureMonitor.name": "جهاز قياس ضغط الدم الرقمي للذراع",
  "product.digitalBloodPressureMonitor.short":
    "جهاز رقمي لقياس ضغط الدم من أعلى الذراع بعلامة منذر علان، مع سوار مقاس عالمي.",
  "product.smartBodyCompositionScale.name": "ميزان ذكي لتحليل تكوين الجسم",
  "product.smartBodyCompositionScale.short":
    "ميزان ذكي بعلامة منذر علان يتتبّع مؤشرات تكوين الجسم مع مزامنة عبر الواي فاي.",
  "product.bloodGlucoseMeterKit.name": "طقم جهاز قياس سكر الدم",
  "product.bloodGlucoseMeterKit.short":
    "طقم جهاز قياس سكر الدم بعلامة منذر علان، لفحص مستوى السكر في المنزل.",
  // --- videos, and the rest of the product surface -------------------
  "video.vitaminDDeficiencySigns.title": "10 علامات على نقص فيتامين D لا ينبغي تجاهلها.",
  "video.vitaminDDeficiencySigns.caption":
    "استعراض للعلامات الشائعة المرتبطة بانخفاض فيتامين D — من الإرهاق وصعوبة التركيز إلى تيبّس المفاصل وتقلّب المزاج — مع إرشادات عامة حول المكمّلات والمستويات المستهدفة.",
  "video.ironStoresDrop.title": "ماذا يحدث عندما تنخفض مخازن الحديد لديك؟",
  "video.ironStoresDrop.caption":
    "نظرة عامة على الأعراض المرتبطة بانخفاض مخازن الحديد، مثل الإرهاق والدوخة وتساقط الشعر، مع إرشادات عملية حول الفحص ودعم مستويات حديد صحية.",
  "video.magnesiumTypesTiming.title": "أنواع المغنيسيوم وأفضل أوقات تناولها",
  "video.magnesiumTypesTiming.caption": "دليل سريع لأشكال المغنيسيوم المختلفة ووقت تناول كل منها.",
  "video.candidaTreatmentStageThree.title":
    "المرحلة الثالثة من علاج الكانديدا: العلاجات والفيتامينات الأساسية لكلا الزوجين",
  "video.candidaTreatmentStageThree.caption":
    "نظرة على مرحلة لاحقة من بروتوكول لدعم علاج الكانديدا، تتناول العلاجات الطبيعية والفيتامينات التي يُوصى بها عادةً إلى جانبه.",
  "video.candidaTreatmentBoneBroth.title":
    "علاج الكانديدا: مرق العظام والخضار المطهوّة على البخار والعلاجات العشبية",
  "video.candidaTreatmentBoneBroth.caption":
    "شرح لنهج في مرحلة مبكرة من دعم علاج الكانديدا يقوم على مرق العظام والخضار المطهوّة على البخار والأعشاب المساعدة.",
  "video.candidaFoodsToAvoid.title": "علاج الكانديدا: الأطعمة التي يجب تجنّبها للتعافي",
  "video.candidaFoodsToAvoid.caption":
    "إرشادات عملية حول الأطعمة التي يُتجنّب تناولها عادةً خلال بروتوكول دعم علاج الكانديدا، ولماذا قد تعيق التقدّم.",
  "video.autoimmunePathBeforeMedication.title":
    "الطريق إلى علاج أمراض المناعة الذاتية: خطوات أساسية قبل الدواء",
  "video.autoimmunePathBeforeMedication.caption":
    "نقاش حول الخطوات الأساسية — الهضم والتغذية والحركة والنوم وإدارة التوتر — التي تُعالَج غالبًا قبل علاج المناعة الذاتية أو إلى جانبه.",
  "video.oneSimpleHabit.title": "عادة واحدة بسيطة يمكن أن تدعم أسلوب حياة أكثر صحّة.",
  "video.oneSimpleHabit.caption":
    "عادة قصيرة وعملية يمكن أن تجعل الحياة الصحية اليومية أسهل في الاستمرار.",
  "videos.emptyTitle": "مكتبة الفيديو قريبًا",
  "videos.emptyBody": "ستظهر هنا مقاطع الفيديو المختارة مباشرةً من القناة.",
  "product.omega3KrillOil.full":
    "مكمّل غذائي من زيت الكريل أوميغا-3 بعلامة منذر علان، يُقدَّم على شكل كبسولات، ويوفّر نحو 240 mg من أوميغا-3 حسب الملصق. التركيز وعدد الكبسولات مذكوران على عبوة المنتج.",
  "product.irishMossBladderwrack.full":
    "خليط معادن بحرية من الطحلب الإيرلندي وعشب المثانة بعلامة منذر علان، يُقدَّم على شكل كبسولات لدعم العافية بخُضَر المحيط. عدد الكبسولات مذكور على العبوة.",
  "product.resveratrol.full":
    "مكمّل غذائي من الريسفيراترول بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.betaCarotene.full":
    "مكمّل غذائي من بيتا كاروتين بعلامة منذر علان، مُوصوف على الملصق بأنه طليعة فيتامين A. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.norwegianCodLiverOil60.full":
    "مكمّل غذائي من زيت كبد سمك القد النرويجي بعلامة منذر علان، بحجم 60 كبسولة، مع كميات كل كبسولة من أوميغا-3 وEPA وDHA وفيتامين D3 وفيتامين A وفيتامين E مطبوعة على الملصق. هذه قائمة منفصلة عن حجم 120 كبسولة.",
  "product.tudca.full":
    "مكمّل غذائي TUDCA بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.milkThistleExtract.full":
    "مكمّل غذائي من مستخلص شوك الحليب بعلامة منذر علان، مقيَّس إلى 80% سيليمارين حسب الملصق، مخصص لدعم إزالة سموم الكبد وحمايته. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.glucosamineChondroitin.full":
    "مكمّل غذائي من الجلوكوزامين مع الكوندرويتين بعلامة منذر علان. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.berberinePlus.full":
    "مكمّل غذائي بربرين بلَس بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.alphaLipoicAcid.full":
    "مكمّل غذائي من حمض ألفا ليبويك بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.potassiumGluconate.full":
    "مكمّل غذائي من غلوكونات البوتاسيوم بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.spirulina.full":
    "مكمّل غذائي من السبيرولينا بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.shilajitExtraStrength.full":
    "مكمّل غذائي من الشيلاجيت بتركيز مضاعف بعلامة منذر علان، يُقدَّم على شكل كبسولات. عدد الكبسولات مذكور على العبوة.",
  "product.stingingNettle.full":
    "مكمّل غذائي من نبات القرّاص بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.tongkatAli.full":
    "مكمّل غذائي من تونغكات علي بعلامة منذر علان، يستخدم مستخلص LJ100 حسب الملصق. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.superMaleBComplex.full":
    "مكمّل غذائي سوبر مِيل بي-كومبلكس بعلامة منذر علان، يُقدَّم على شكل كبسولات. عدد الكبسولات مذكور على العبوة.",
  "product.glutathione.full":
    "مكمّل غذائي من الغلوتاثيون بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.grassFedBeefLiver.full":
    "مكمّل غذائي من كبد بقري مرعي طبيعياً بتركيبة غذاء كامل بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.vitaminD3K2.full":
    "مكمّل غذائي من فيتامين D3 وK2 بعلامة منذر علان، يستخدم شكل MK-7 من فيتامين K2 حسب الملصق. التركيز وعدد الأقراص مذكوران على العبوة.",
  "product.norwegianCodLiverOil120.full":
    "مكمّل غذائي من زيت كبد سمك القد النرويجي بعلامة منذر علان، بحجم 120 كبسولة، مُوصوف على الملصق بأنه فيتامين A وD + 3-أوميغا. هذه قائمة منفصلة عن حجم 60 كبسولة ولا تُدمج معها.",
  "product.coq10.full":
    "مكمّل غذائي CoQ10 بعلامة منذر علان، يُقدَّم على شكل كبسولات. التركيز وعدد الكبسولات مذكوران على العبوة.",
  "product.advancedBComplex.full":
    "مكمّل غذائي بي-كومبلكس المتقدّم بعلامة منذر علان، يُقدَّم على شكل كبسولات. عدد الكبسولات مذكور على العبوة.",
  "product.nonContactInfraredThermometer.full":
    "ميزان حرارة بالأشعة تحت الحمراء دون لمس بعلامة منذر علان، لقياس درجة الحرارة في المنزل بسهولة. راجع تعليمات المنتج المرفقة للإعداد والاستخدام الصحيحين.",
  "product.digitalThermometer.full":
    "ميزان حرارة رقمي بعلامة منذر علان، مصمَّم للقياس المنزلي بسهولة. راجع تعليمات المنتج المرفقة للإعداد والاستخدام الصحيحين.",
  "product.digitalBloodPressureMonitor.full":
    "جهاز قياس ضغط الدم الرقمي للذراع بعلامة منذر علان، مصمَّم للقياس المنزلي بسهولة، ويتضمّن كُفّة عالمية المقاس. راجع تعليمات المنتج المرفقة للإعداد والاستخدام الصحيحين.",
  "product.smartBodyCompositionScale.full":
    "ميزان ذكي لتحليل تكوين الجسم بعلامة منذر علان، مصمَّم للمتابعة المنزلية بسهولة، مع مزامنة Wi-Fi ودعم عدد غير محدود من ملفات المستخدمين حسب الملصق. راجع تعليمات المنتج المرفقة للإعداد والاستخدام الصحيحين.",
  "product.bloodGlucoseMeterKit.full":
    "طقم جهاز قياس سكر الدم بعلامة منذر علان، مصمَّم للفحص المنزلي بسهولة. راجع تعليمات المنتج المرفقة للإعداد والاستخدام الصحيحين.",
  "productHighlight.epaDha": "EPA وDHA",
  "productHighlight.heartCellularEnergy": "طاقة القلب والخلايا (ادّعاء مذكور على الملصق)",
  "productHighlight.immuneHeartSupport": "دعم المناعة والقلب (ادّعاء مذكور على الملصق)",
  "productHighlight.vitaminAD": "فيتامين A وD",
  "productHighlight.seaweedPower": "قوّة الأعشاب البحرية",
  "productHighlight.oceanNourished": "تغذية من المحيط",
  "productHighlight.mineralRichPlain": "غني بالمعادن",
  "productHighlight.dailyWellnessPlain": "عافية يومية",
  "productHighlight.antioxidantDefense": "دفاع مضاد للأكسدة (ادّعاء مذكور على الملصق)",
  "productHighlight.healthyAging": "شيخوخة صحية (ادّعاء مذكور على الملصق)",
  "productHighlight.cellularSupport": "دعم خلوي (ادّعاء مذكور على الملصق)",
  "productHighlight.visionSkinImmune":
    "يدعم البصر وصحة البشرة ووظيفة المناعة (ادّعاء مذكور على الملصق)",
  "productHighlight.omega3Support": "دعم أوميغا-3",
  "productHighlight.vitaminsAD": "فيتامينا A وD",
  "productHighlight.immuneHeart": "المناعة والقلب (ادّعاء مذكور على الملصق)",
  "productHighlight.liverHealth": "صحة الكبد (ادّعاء مذكور على الملصق)",
  "productHighlight.digestiveSupport": "دعم الهضم (ادّعاء مذكور على الملصق)",
  "productHighlight.liverSupport": "دعم الكبد (ادّعاء مذكور على الملصق)",
  "productHighlight.detoxSupport": "دعم إزالة السموم (ادّعاء مذكور على الملصق)",
  "productHighlight.antioxidantSupport": "دعم مضاد للأكسدة (ادّعاء مذكور على الملصق)",
  "productHighlight.jointComfort": "راحة المفاصل (ادّعاء مذكور على الملصق)",
  "productHighlight.cartilageSupport": "دعم الغضاريف (ادّعاء مذكور على الملصق)",
  "productHighlight.mobilitySupport": "دعم الحركة (ادّعاء مذكور على الملصق)",
  "productHighlight.metabolicBalance": "يدعم التوازن الأيضي (ادّعاء مذكور على الملصق)",
  "productHighlight.dailyWellnessClaim": "عافية يومية (ادّعاء مذكور على الملصق)",
  "productHighlight.supportsAntioxidantDefense":
    "يدعم الدفاع المضاد للأكسدة (ادّعاء مذكور على الملصق)",
  "productHighlight.hydrationBalance": "توازن الترطيب (ادّعاء مذكور على الملصق)",
  "productHighlight.mineralSupport": "دعم المعادن (ادّعاء مذكور على الملصق)",
  "productHighlight.mineralRichClaim": "غني بالمعادن (ادّعاء مذكور على الملصق)",
  "productHighlight.plantBasedNutrition": "تغذية نباتية المصدر (ادّعاء مذكور على الملصق)",
  "productHighlight.power": "قوّة (ادّعاء مذكور على الملصق)",
  "productHighlight.endurance": "تحمّل (ادّعاء مذكور على الملصق)",
  "productHighlight.vitality": "حيوية (ادّعاء مذكور على الملصق)",
  "productHighlight.balance": "توازن (ادّعاء مذكور على الملصق)",
  "productHighlight.wellness": "عافية (ادّعاء مذكور على الملصق)",
  "productHighlight.stamina": "قدرة على التحمّل (ادّعاء مذكور على الملصق)",
  "productHighlight.performance": "أداء (ادّعاء مذكور على الملصق)",
  "productHighlight.energy": "طاقة (ادّعاء مذكور على الملصق)",
  "productHighlight.focus": "تركيز (ادّعاء مذكور على الملصق)",
  "productHighlight.cellularDefense": "دفاع خلوي (ادّعاء مذكور على الملصق)",
  "productHighlight.nutrientDense":
    "دعم غني بالعناصر الغذائية للطاقة والمناعة والحيوية (ادّعاء مذكور على الملصق)",
  "productHighlight.boneHeartImmune":
    "يدعم صحة العظام والقلب وجهاز المناعة (ادّعاء مذكور على الملصق)",
  "productHighlight.dailyEnergySupport": "دعم الطاقة اليومي (ادّعاء مذكور على الملصق)",
  "productHighlight.fastReading": "قراءة سريعة (ادّعاء مذكور على الملصق)",
  "productHighlight.nonContact": "بدون تلامس",
  "productHighlight.threeColorFeverAlert": "تنبيه حمّى بثلاثة ألوان (ادّعاء مذكور على الملصق)",
  "productHighlight.highAccuracy": "دقة عالية (ادّعاء مذكور على الملصق)",
  "productHighlight.beepAlert": "تنبيه صوتي (ادّعاء مذكور على الملصق)",
  "productHighlight.safeHygienic": "آمن وصحّي (ادّعاء مذكور على الملصق)",
  "productHighlight.irregularHeartbeat": "كشف عدم انتظام ضربات القلب (ادّعاء مذكور على الملصق)",
  "productHighlight.comfortFitCuff": "كُفّة ComfortFit عالمية المقاس",
  "productHighlight.memories120Users2": "120 ذاكرة، مستخدمان",
  "productHighlight.oneTouchOperation": "تشغيل بلمسة واحدة",
  "productHighlight.bodyMetrics":
    "نسبة دهون الجسم، ومؤشر كتلة الجسم، والكتلة العضلية، ونسبة ماء الجسم، وكتلة العظام، ونسبة البروتين",
  "productHighlight.wifiSync": "مزامنة Wi-Fi",
  "productHighlight.multiUser": "متعدد المستخدمين",
  "productHighlight.fiveSecondTest": "زمن فحص 5 ثوانٍ (ادّعاء مذكور على الملصق)",
  "productHighlight.highAccuracyIso": "دقة عالية — EN ISO 15197:2015 (ادّعاء مذكور على الملصق)",
  "productHighlight.testMemory500": "ذاكرة 500 فحص",
  "spec.strength": "التركيز",
  "spec.omega3Content": "محتوى أوميغا-3",
  "spec.count": "العدد",
  "spec.form": "الشكل",
  "spec.formula": "التركيبة",
  "spec.type": "النوع",
  "spec.omega3": "أوميغا-3",
  "spec.epa": "EPA",
  "spec.dha": "DHA",
  "spec.vitaminD3": "فيتامين D3",
  "spec.vitaminA": "فيتامين A",
  "spec.vitaminE": "فيتامين E",
  "spec.standardization": "التقييس",
  "spec.glucosamine": "جلوكوزامين",
  "spec.chondroitin": "كوندرويتين",
  "spec.extract": "المستخلص",
  "spec.k2Form": "شكل K2",
  "spec.display": "الشاشة",
  "spec.normalRange": "النطاق الطبيعي المعروض",
  "spec.lowFeverRange": "نطاق الحمى المنخفضة المعروض",
  "spec.highFeverRange": "نطاق الحمى المرتفعة المعروض",
  "spec.cuff": "الكُفّة",
  "spec.memory": "الذاكرة",
  "spec.operation": "التشغيل",
  "spec.metricsTracked": "المؤشرات المقاسة",
  "spec.connectivity": "الاتصال",
  "spec.users": "المستخدمون",
  "spec.testTime": "زمن الفحص",
  "spec.sampleSize": "حجم العينة",
  "spec.standard": "المعيار",
  "spec.kitIncludes": "تتضمّن العدّة",
  "product.qty.capsules60": "60 كبسولة",
  "product.qty.capsules120": "120 كبسولة",
  "product.qty.tablets120": "120 قرص",
  "product.qty.piece1": "قطعة واحدة",
  "product.priceLabel.contact": "تواصل لمعرفة السعر",
  // --- product detail page furniture ---------------------------------
  "product.breadcrumb": "المنتجات",
  "product.specificationsHeading": "المواصفات",
  // --- specification values that contain English words ---------------
  "specValue.microlitres06": "0.6 µL (حسب الملصق)",
  "specValue.piece1": "قطعة واحدة",
  "specValue.mcg1250": "1,250 mcg (حسب الملصق)",
  "specValue.mg110": "110 mg (حسب الملصق)",
  "specValue.capsules120": "120 كبسولة",
  "specValue.memories120Users2": "120 ذاكرة / مستخدمان (حسب الملصق)",
  "specValue.tablets120": "120 قرص",
  "specValue.mg125": "125 mg (حسب الملصق)",
  "specValue.bodyMetrics13":
    "13 مؤشرًا للجسم (حسب الملصق): نسبة دهون الجسم، ومؤشر كتلة الجسم، والكتلة العضلية، ونسبة ماء الجسم، وكتلة العظام، ونسبة البروتين",
  "specValue.iu13": "13 IU (حسب الملصق)",
  "specValue.mg235": "235 mg (حسب الملصق)",
  "specValue.iu3125": "3,125 IU (حسب الملصق)",
  "specValue.threeColorFeverAlert": "تنبيه حمّى بثلاثة ألوان (حسب الملصق)",
  "specValue.fiveSecondTest": "زمن فحص 5 ثوانٍ (حسب الملصق)",
  "specValue.testMemory500": "ذاكرة 500 فحص (حسب الملصق)",
  "specValue.capsules60": "60 كبسولة",
  "specValue.silymarin80": "80% سيليمارين",
  "specValue.capsule": "كبسولة",
  "specValue.comfortFitCuff": "كُفّة ComfortFit عالمية المقاس (حسب الملصق)",
  "specValue.completeFormula": "تركيبة كاملة",
  "specValue.digital": "رقمي",
  "specValue.digitalUpperArm": "رقمي للذراع",
  "specValue.enIso15197": "EN ISO 15197:2015 (حسب الملصق)",
  "specValue.mensSupportFormula": "تركيبة لدعم الرجال",
  "specValue.glucoseKitContents":
    "الجهاز، وقلم الوخز، والمشارط، وشرائط الفحص، والبطاريات، ودليل المستخدم، ودليل البدء السريع (حسب الملصق)",
  "specValue.mineralVitalityFormula": "تركيبة الحيوية المعدنية",
  "specValue.nonContactInfrared": "أشعة تحت حمراء دون لمس",
  "specValue.oneTouch": "بلمسة واحدة (حسب الملصق)",
  "specValue.performanceFormula": "تركيبة الأداء",
  "specValue.seaMineralBlend": "خليط معادن بحرية",
  "specValue.tablet": "قرص",
  "specValue.unlimitedUsers": "عدد غير محدود من المستخدمين (حسب الملصق)",
  "specValue.vitaminAPrecursor": "طليعة فيتامين A",
  "specValue.wholeFoodFormula": "تركيبة غذاء كامل",
  "specValue.wifiSync": "مزامنة Wi-Fi",
  "specValue.mg240PerLabel": "نحو 240 mg حسب الملصق",
  // --- the twelve services ------------------------------------------
  "service.nutritionConsultation.title": "استشارة تغذية",
  "service.nutritionConsultation.desc":
    "تقييم شخصي فردي لعاداتك الغذائية ونمط حياتك وأهدافك الصحية، لبناء خطة تناسب حياتك فعلًا.",
  "service.nutritionConsultation.h1": "تقييم غذائي شامل",
  "service.nutritionConsultation.h2": "خطة تغذية مخصصة",
  "service.nutritionConsultation.h3": "متابعة مستمرة",
  "service.weightLoss.title": "إنقاص الوزن",
  "service.weightLoss.desc":
    "إدارة وزن مستدامة وسليمة طبيًا، مبنية على طعام حقيقي، لا على أساليب متطرفة أو حميات رائجة لا تدوم.",
  "service.weightLoss.h1": "تقييم الأيض",
  "service.weightLoss.h2": "بنية وجبات واقعية",
  "service.weightLoss.h3": "تتبّع التقدّم",
  "service.weightGain.title": "زيادة الوزن",
  "service.weightGain.desc":
    "خطط منظّمة للسعرات والعناصر الغذائية تساعدك على بناء كتلة صحية بأمان، سواء للصحة أو القوة أو التعافي.",
  "service.weightGain.h1": "تخطيط فائض السعرات",
  "service.weightGain.h2": "قوائم غنية بالعناصر الغذائية",
  "service.weightGain.h3": "إرشاد داعم للقوة",
  "service.clinicalNutrition.title": "التغذية السريرية",
  "service.clinicalNutrition.desc":
    "علاج تغذوي قائم على الأدلة يعمل إلى جانب علاجك الطبي للحالات المزمنة أو المعقّدة.",
  "service.clinicalNutrition.h1": "خطط خاصة بكل حالة",
  "service.clinicalNutrition.h2": "تنسيق مع الأطباء",
  "service.clinicalNutrition.h3": "تعديلات وفق نتائج التحاليل",
  "service.sportsNutrition.title": "تغذية رياضية",
  "service.sportsNutrition.desc":
    "استراتيجيات تغذية للرياضيين والأشخاص النشطين لتحسين الأداء والتعافي والتحمّل.",
  "service.sportsNutrition.h1": "تغذية الأداء",
  "service.sportsNutrition.h2": "تغذية التعافي",
  "service.sportsNutrition.h3": "استراتيجية الترطيب",
  "service.diabetesNutrition.title": "تغذية مرضى السكري",
  "service.diabetesNutrition.desc":
    "تخطيط وجبات يراعي سكر الدم، مصمَّم ليساعدك على إدارة السكري بثقة والاستمتاع بطعامك من جديد.",
  "service.diabetesNutrition.h1": "تخطيط الحمل الغلايسيمي",
  "service.diabetesNutrition.h2": "قوائم متوازنة الكربوهيدرات",
  "service.diabetesNutrition.h3": "إرشاد لنمط الحياة",
  "service.hypertension.title": "ارتفاع ضغط الدم",
  "service.hypertension.desc":
    "استراتيجيات تغذية صحية للقلب وقليلة الصوديوم، مصمَّمة للمساعدة في إدارة ضغط الدم بطرق طبيعية.",
  "service.hypertension.h1": "تخطيط يراعي الصوديوم",
  "service.hypertension.h2": "بدائل صحية للقلب",
  "service.hypertension.h3": "دعم نمط الحياة",
  "service.cholesterol.title": "الكوليسترول",
  "service.cholesterol.desc":
    "تغييرات غذائية موجّهة للمساعدة في تحسين صورة الدهون لديك ودعم صحة القلب والأوعية على المدى الطويل.",
  "service.cholesterol.h1": "قوائم مناسبة للدهون",
  "service.cholesterol.h2": "توازن الألياف والدهون",
  "service.cholesterol.h3": "متابعة التقدّم",
  "service.digestiveHealth.title": "صحة الجهاز الهضمي",
  "service.digestiveHealth.desc":
    "تغذية تركّز على الأمعاء لتخفيف الانزعاج وتحسين الهضم والتعرّف على حساسيات الطعام.",
  "service.digestiveHealth.h1": "إرشاد الحمية الإقصائية",
  "service.digestiveHealth.h2": "قوائم لطيفة على الأمعاء",
  "service.digestiveHealth.h3": "تتبّع الأعراض",
  "service.pregnancyNutrition.title": "تغذية الحامل",
  "service.pregnancyNutrition.desc":
    "إرشاد آمن وغني بالعناصر الغذائية لدعمك ودعم طفلك خلال كل مرحلة من مراحل الحمل.",
  "service.pregnancyNutrition.h1": "تخطيط حسب مرحلة الحمل",
  "service.pregnancyNutrition.h2": "تركيز على المغذيات الدقيقة",
  "service.pregnancyNutrition.h3": "إرشاد حول الأطعمة الآمنة",
  "service.seniorNutrition.title": "تغذية كبار السن",
  "service.seniorNutrition.desc":
    "رعاية تغذوية مدروسة تدعم القوة والمناعة وجودة الحياة في السنوات المتأخرة.",
  "service.seniorNutrition.h1": "دعم العظام والعضلات",
  "service.seniorNutrition.h2": "قوائم تناسب ضعف الشهية",
  "service.seniorNutrition.h3": "تخطيط يراعي الأدوية",
  "service.oncologyNutrition.title": "الدعم التغذوي لمرضى السرطان",
  "service.oncologyNutrition.desc":
    "دعم تغذوي أثناء علاج السرطان وبعده، بالعمل إلى جانب فريق الأورام المعالج لك. التركيز عملي: الحفاظ على وزنك وقوتك، ومساعدتك على مواصلة الأكل عندما يجعل العلاج ذلك صعبًا. هذه رعاية داعمة تُكمّل خطة العلاج من طبيب الأورام الخاص بك — ولا تحل محلها أبدًا.",
  "service.oncologyNutrition.h1": "الحفاظ على الوزن والكتلة العضلية",
  "service.oncologyNutrition.h2": "فقدان الشهية والغثيان وتغيّر حاسة التذوّق",
  "service.oncologyNutrition.h3": "الأكل رغم الأعراض الجانبية",
  "service.oncologyNutrition.h4": "بالتنسيق مع فريق الأورام المعالج لك",
  // --- services section furniture -----------------------------------
  "services.spotlightEyebrow": "من هنا تبدأ كل خطة",
  "services.bookThis": "احجز هذه الخدمة",
  // --- global chrome ------------------------------------------------
  "a11y.skipToContent": "تخطَّ إلى المحتوى الرئيسي",
  "footer.rights": "© {year} {name}. جميع الحقوق محفوظة.",
  "footer.disclaimerConsult":
    "يُنصح دائمًا باستشارة مختص صحي مؤهل قبل إجراء أي تغييرات على النظام الغذائي، وخاصةً في وجود حالة طبية قائمة.",
  // --- compare slider labels ----------------------------------------
  "beforeAfter.before": "قبل",
  "beforeAfter.after": "بعد",
  // --- how the programs work — six steps -----------------------------
  "howItWorks.step1.title": "اختر برنامجك",
  "howItWorks.step1.desc": "اختر برنامج علاج، ثم فئة بحسب عدد الاستشارات التي تحتاجها.",
  "howItWorks.step2.title": "أتمم الدفع الآمن",
  "howItWorks.step2.desc":
    "دفعة واحدة، تُعالَج بأمان عبر Stripe — بيانات بطاقتك لا تمر بخوادمنا إطلاقًا.",
  "howItWorks.step3.title": "فعّل حسابك",
  "howItWorks.step3.desc": "بمجرد تأكيد الدفع، يُفعَّل حسابك وتضع كلمة المرور الخاصة بك.",
  "howItWorks.step4.title": "استخدم رصيد استشاراتك",
  "howItWorks.step4.desc": "يصبح رصيد استشارات برنامجك جاهزًا فور تفعيل حسابك.",
  "howItWorks.step5.title": "اطلب استشارة عبر الإنترنت",
  "howItWorks.step5.desc":
    "استخدم رصيدًا لطلب جلسة مباشرةً من لوحة حسابك، في أي وقت تحتاج فيه إلى ذلك.",
  "howItWorks.step6.title": "قابِل الطبيب عبر Google Meet",
  "howItWorks.step6.desc": "تجري الاستشارات المعتمدة عبر رابط Google Meet آمن.",
  // --- member experience preview (illustrative, signed-out only) -----
  "cta.explorePrograms": "تصفّح البرامج",
  "memberPreview.eyebrow": "تجربة العضوية",
  "memberPreview.title": "برنامجك كله في مكان واحد",
  "memberPreview.description":
    "بمجرد أن تبدأ برنامجًا، تحفظ لوحة حسابك رصيد استشاراتك وجلساتك القادمة منظّمةً في عرض واحد بسيط.",
  "memberPreview.illustrative": "عرض توضيحي — ليست بيانات حساب حقيقية",
  "memberPreview.samplePlan": "برنامج العلاج بلَس",
  "memberPreview.credits": "رصيد الاستشارات",
  "memberPreview.creditsSample": "2 من 3 متبقية",
  "memberPreview.next": "الاستشارة القادمة",
  "memberPreview.nextSample": "اطلبها في أي وقت",
  "memberPreview.card1.title": "برنامجك",
  "memberPreview.card1.detail": "نوع البرنامج ورصيد الاستشارات في لمحة",
  "memberPreview.card2.title": "رصيد الاستشارات",
  "memberPreview.card2.detail": "اطّلع على عدد الاستشارات المتبقية لديك",
  "memberPreview.card3.title": "الاستشارة القادمة",
  "memberPreview.card3.detail": "جلستك المؤكَّدة القادمة عبر Google Meet",
  "memberPreview.card4.title": "طلب استشارة",
  "memberPreview.card4.detail": "استخدم رصيدًا لطلب جلسة جديدة في أي وقت",
  "memberPreview.card5.title": "مصادر تثقيفية",
  "memberPreview.card5.detail": "مقالات ومقاطع فيديو مختارة بحسب أهدافك",
  // --- contact section and page -------------------------------------
  "contact.phoneLabel": "الهاتف",
  "contact.emailLabel": "البريد الإلكتروني",
  "contact.beingFinalized":
    "يجري استكمال بيانات التواصل المباشر. في هذه الأثناء، استخدم النموذج أو واتساب للوصول إلينا.",
  "contact.followUs": "تابعنا",
  "contact.online": "استشارات عبر الإنترنت متاحة في جميع أنحاء العالم",
  "contact.inPerson": "تُشارَك تفاصيل الموقع للزيارات الحضورية عند تأكيد الحجز.",
  "contact.sentTitle": "تم إرسال الرسالة",
  "contact.sentBody": "شكرًا لتواصلك — وصلتنا رسالتك وسنعود إليك قريبًا.",
  "contact.errorTitle": "حدث خطأ ما",
  "contact.errorBody": "{message} لم يُرسَل أي شيء مما أدخلته — يرجى المحاولة مرة أخرى.",
  "contact.emailReadyTitle": "الرسالة جاهزة للإرسال",
  "contact.emailReadyBody":
    "من المفترض أن يكون تطبيق البريد لديك قد فُتح ورسالتك معبّأة مسبقًا. أرسلها من هناك وسنعود إليك قريبًا.",
  "contact.whatsappTitle": "جارٍ فتح واتساب",
  "contact.whatsappBody":
    "فتحنا واتساب ورسالتك معبّأة مسبقًا — أرسلها من هناك وسنرد في أقرب وقت ممكن.",
  "contact.unavailableTitle": "الإرسال عبر الإنترنت غير مفعّل بعد",
  "contact.backToForm": "العودة إلى النموذج",
  "contact.fieldName": "الاسم الكامل",
  "contact.fieldPhone": "رقم الهاتف",
  "contact.fieldEmail": "البريد الإلكتروني",
  "contact.fieldMethod": "طريقة التواصل المفضّلة",
  "contact.fieldSubject": "الموضوع (اختياري)",
  "contact.fieldMessage": "الرسالة",
  "contact.namePlaceholder": "مثال: أحمد محمد",
  "contact.subjectPlaceholder": "ما موضوع رسالتك؟",
  "contact.messagePlaceholder": "أخبرنا عن أهدافك…",
  "contact.privacyNote":
    "يرجى تجنّب مشاركة تفاصيل تاريخك الطبي هنا — سيتواصل معك أخصائي تغذية لمناقشة التفاصيل بشكل خاص.",
  "contact.send": "إرسال الرسالة",
  "contact.methodWhatsapp": "واتساب",
  "contact.methodEmail": "البريد الإلكتروني",
  "contact.methodEither": "أيّهما",
  "contactPage.heading": "تواصل معنا",
  // --- product page furniture ---------------------------------------
  "product.outOfStock": "نفد المخزون",
  "product.currentlyOutOfStock": "غير متوفّر حاليًا",
  "product.askAvailability": "اسأل عن التوفّر",
  "product.askAvailabilityAria": "اسأل عن توفّر {name}",
  "product.viewDetails": "عرض التفاصيل",
  "product.related": "منتجات ذات صلة",
  "product.packagingNote":
    "عبوة المنتج الحقيقية مقدَّمة من {name}. ستظهر هنا زوايا تصوير إضافية فور توفّرها.",
  "product.disclaimer":
    "معلومات المنتج مقدَّمة لأغراض تثقيفية عامة فقط. المكمّلات الغذائية ليست مخصصة لتشخيص أي مرض أو علاجه أو الشفاء منه أو الوقاية منه. ويُنصح باستشارة مختص صحي مؤهل قبل استخدام أي مكمّل، وخاصةً في حالات الحمل أو الرضاعة، أو مع تناول أدوية، أو في وجود حالة طبية، أو عند التفكير في استخدامه لطفل. ويُرجى استخدام أجهزة المتابعة الصحية وفق تعليماتها الرسمية، وطلب المشورة الطبية المتخصصة عند الحاجة.",
  "productsPage.questionsTitle": "لديك أسئلة عن أي منتج؟",
  "productsPage.questionsBody":
    "احجز استشارة مع الدكتور منذر علان لمناقشة ما يناسب روتينك، أو تواصل معنا بشأن منتج محدد مباشرةً.",
  "productsPreview.viewAll": "عرض جميع المنتجات",
  "productsPreview.disclaimer":
    "المنتجات المعروضة هنا هي مواد داعمة للعافية، وليست مخصصة لتشخيص أي مرض أو علاجه أو الشفاء منه أو الوقاية منه.",
  "cta.bookConsultation": "احجز استشارة",
  "product.strength.glucosamineChondroitin": "1500 mg جلوكوزامين / 1200 mg كوندرويتين",
  // --- packages, gallery, blog index and contact page ---------------
  "packages.mostPopular": "الأكثر اختيارًا",
  "packages.previousPrice": "السعر السابق:",
  "packages.currentPrice": "السعر الحالي:",
  "packages.oneTime": "دفعة واحدة",
  "packages.dialogSummary": "{price} دفعة واحدة · {consultations}",
  "packagesPage.creditsBody":
    "يتضمّن كل برنامج عددًا ثابتًا من الاستشارات، يُمنح مرة واحدة عند الشراء. اطلب استشارة من حسابك، ويُخصم رصيد واحد عن كل جلسة مؤكَّدة.",
  "packagesPage.meetBody":
    "تجري الاستشارات المعتمدة عبر الإنترنت من خلال Google Meet. وبمجرد التأكيد، يظهر رابط الاجتماع مع الموعد في حسابك.",
  "packagesPage.noBillingTitle": "لا فوترة متكرّرة",
  "packagesPage.noBillingBody":
    "كل برنامج هو دفعة واحدة فقط. لا يوجد ما يُلغى ولا ما يتجدّد تلقائيًا.",
  "packagesPage.faqTitle": "أسئلة حول البرامج",
  "packagesPage.viewAllFaqs": "عرض جميع الأسئلة الشائعة",
  "packagesPage.notSureTitle": "لست متأكدًا أي برنامج يناسبك؟",
  "packagesPage.notSureBody":
    "اختر برنامجك من الأعلى، أو تواصل معنا وسنساعدك في اختيار البرنامج المناسب.",
  "packages.legalNote":
    "لا ينتهي رصيد البرنامج على أساس دورة شهرية كما هو الحال مع رصيد العضوية، لكنه مرتبط بحسابك وغير قابل للتحويل. برامج العلاج ذات طابع تثقيفي وداعم، وليست بديلًا عن رعاية الطوارئ أو التشخيص الطبي أو العلاج من طبيب مرخَّص. تتضمّن برامج العلاج 4 استشارات كحد أقصى.",
  "cta.contactUs": "تواصل معنا",
  "gallery.videoStoriesComingTitle": "قصص مصوّرة بالفيديو قريبًا",
  "gallery.videoStoriesComingBody": "ستظهر هنا قصص الفيديو المختارة من القناة الحقيقية.",
  "gallery.comingSoon": "قريبًا",
  "gallery.watchOnYouTube": "شاهد على يوتيوب",
  "gallery.watchMore": "شاهد المزيد في المعرض",
  "gallery.description":
    "صور ومقاطع فيديو من الاستشارات والتثقيف والحياة المجتمعية. كل صورة وكل مقطع هنا حقيقي — ولا يُنشر أي محتوى قبل وبعد إلا بموافقة صريحة من العميل.",
  "gallery.storiesEyebrow": "قصص مصوّرة",
  "gallery.storiesTitle": "تصوير من داخل العيادة",
  "gallery.storiesDescription":
    "نعمل على تجهيز صور معتمدة لكل فئة من هذه الفئات. لا شيء معروض هنا صورة مؤقتة — ستظهر الصور الحقيقية فور توفّرها.",
  "blogPage.eyebrow": "المدوّنة",
  "blogPage.topicExplorer": "استكشاف المواضيع",
  "blogPage.latestArticles": "أحدث المقالات",
  "contactPage.subheading": "لنتحدّث",
  // --- last four -----------------------------------------------------
  "productsPage.eyebrow": "المنتجات",
  "cta.requestConsultation": "اطلب استشارة",
  // --- home page sections -------------------------------------------
  "hero.eyebrowNutrition": "تغذية",
  "hero.eyebrowHealth": "صحة",
  "hero.eyebrowWellness": "عافية",
  "hero.titleLead": "خيارات أكثر صحّة تبدأ من",
  "hero.titleAccent": "معرفة أفضل.",
  "hero.lede":
    "برامج تغذية مخصصة واستشارات فردية عبر الإنترنت من {name}، {title} — مبنية على خبرة سريرية، ومقدَّمة بمتابعة حقيقية.",
  "hero.secureVideo": "استشارات فيديو آمنة",
  "hero.viewPackages": "تصفّح الباقات",
  "hero.instagram": "تابعنا على إنستغرام",
  "aboutPreview.eyebrow": "عن منذر",
  "aboutPreview.title": "إرشاد تغذوي قائم على خبرة سريرية حقيقية",
  "aboutPreview.discover": "اقرأ قصتي",
  "aboutPreview.figcaption": "التغذية أولًا، مع فهم صيدلاني للدواء من خلفها.",
  "aboutPreview.approachEyebrow": "النهج",
  "aboutPreview.approachTitle": "مبني على حياتك، لا على قالب جاهز",
  "educationPreview.readBlog": "اقرأ المدوّنة",
  "galleryTeaser.view": "تصفّح المعرض",
  "programCta.title": "مستعد لبدء رحلتك الغذائية المخصصة؟",
  "programCta.body":
    "اختر برنامج علاج بدفعة واحدة، واحصل على رصيد استشارات ومتابعة مستمرة من {name} — بلا فوترة متكرّرة.",
  "beforeAfter.illustrationNote":
    "صورة توضيحية لتغيّر في نمط الأكل، التُقطت خصيصًا لهذا الموقع. ليست صورة لأحد العملاء ولا تُظهر نتائج أي شخص.",
  // --- social community ---------------------------------------------
  "community.description":
    "تابع {name} للحصول على نصائح غذائية يومية، ولقطات من كواليس العمل، ومحتوى تثقيفي.",
  // --- article titles and excerpts (ALL FLAGGED) --------------------
  "article.sustainableWeightLoss.title": "إنقاص وزن مستدام دون حميات قاسية",
  "article.sustainableWeightLoss.excerpt":
    "لماذا يأتي التقييد الشديد بنتائج عكسية، وكيف تبدو خطة إنقاص الوزن الواقعية على أرض الواقع.",
  "article.type2Diabetes.title": "الأكل الجيد مع السكري من النوع الثاني",
  "article.type2Diabetes.excerpt":
    "نظرة عملية على إدارة سكر الدم من خلال اختيارات الطعام وأوقات الوجبات وتوازن الكربوهيدرات.",
  "article.athleticPerformance.title": "تغذية الأداء الرياضي والتعافي",
  "article.athleticPerformance.excerpt":
    "كيف تؤثر اختياراتك الغذائية قبل التمرين وبعده على الطاقة والتحمّل وسرعة تعافيك.",
  "article.pregnancyTrimesters.title": "التغذية في كل مرحلة من مراحل الحمل",
  "article.pregnancyTrimesters.excerpt":
    "ما الذي يتغيّر غذائيًا من المرحلة الأولى إلى الثالثة، وأي العناصر الغذائية تستحق انتباهًا أكبر.",
  "article.digestiveComfort.title": "فهم الطعام وراحة الجهاز الهضمي",
  "article.digestiveComfort.excerpt":
    "كيف تتعامل مع الانتفاخ والانزعاج وحساسيات الطعام دون استبعاد مجموعات غذائية كاملة دون داعٍ.",
  "article.heartHealthy.title": "الأكل الصحي للقلب: الكوليسترول وضغط الدم",
  "article.heartHealthy.excerpt":
    "الأنماط الغذائية الأكثر ارتباطًا باطّراد بتحسّن مؤشرات القلب والأوعية، مشروحة ببساطة.",
  "article.howMuchProtein.title": "كم من البروتين تحتاج فعلًا؟",
  "article.howMuchProtein.excerpt":
    "تبديد الضجيج حول كمية البروتين وتوقيت تناوله ومصادره لأهداف مختلفة.",
  // --- article page furniture ---------------------------------------
  "article.disclaimer":
    "هذا المقال لأغراض تثقيفية عامة فقط، وليس بديلًا عن استشارة طبية أو غذائية مخصصة. ويُرجى استشارة مختص صحي مؤهل قبل إجراء أي تغييرات على النظام الغذائي.",
  "article.related": "مقالات ذات صلة",
  "article.share": "شارك:",
  // --- purchase dialog — the payment form --------------------------
  "purchase.fullName": "الاسم الكامل",
  "purchase.email": "البريد الإلكتروني",
  "purchase.phone": "رقم الهاتف",
  "purchase.namePlaceholder": "مثال: أحمد محمد",
  "purchase.emailPlaceholder": "ahmed@email.com",
  "purchase.phonePlaceholder": "+971 50 123 4567",
  "purchase.phoneReason": "ليتمكن الدكتور منذر علان من التواصل معك بشأن برنامجك.",
  "purchase.submit": "تابع إلى الدفع الآمن",
  "purchase.submitting": "جارٍ التحويل إلى الدفع الآمن…",
  "purchase.stripeNote":
    "تتم معالجة الدفع بأمان عبر Stripe. نحن لا نرى بيانات بطاقتك ولا نحتفظ بها إطلاقًا.",
  "purchase.unavailable":
    "الدفع الإلكتروني غير مفعّل بعد. يرجى المحاولة لاحقًا، أو التواصل معنا مباشرةً.",
  "purchase.viaWhatsapp": "تابع عبر واتساب",
  "purchase.close": "إغلاق",
  "purchase.errName": "يرجى إدخال اسمك الكامل.",
  "purchase.errEmail": "يرجى إدخال بريد إلكتروني صحيح.",
  "purchase.errPhoneChars": "يرجى إدخال رقم هاتف يمكننا التواصل معك عليه.",
  "purchase.errPhoneLong": "رقم الهاتف هذا يبدو طويلًا أكثر من اللازم.",
  // --- purchase dialog validation ----------------------------------
  "purchase.errPhoneChars2": "استخدم الأرقام والمسافات والرموز + ( ) - فقط.",
  "purchase.errPhoneDigits": "يرجى إدخال الرقم كاملاً، مع رمز الدولة إن كنت خارج الإمارات.",
  // --- the doctor name with honorific ------------------------------
  "common.doctorNameFormal": "الدكتور منذر علان",
  // --- the wordmark name -------------------------------------------
  "common.doctorName": "منذر علان",
  // --- auth and post-payment pages ---------------------------------
  "notFound.backHome": "العودة إلى الرئيسية",
  "notFound.browseArticles": "تصفّح المقالات",
  "membership.askQuestion": "اطرح سؤالًا",
  "membership.goToAccount": "الذهاب إلى حسابي",
  "membership.goToSignIn": "الذهاب إلى تسجيل الدخول",
  "membership.contactUs": "تواصل معنا",
  "nav.myAccount": "حسابي",
  "auth.chooseProgram": "اختر برنامجًا",
  "auth.signInUnavailable":
    "تسجيل دخول الأعضاء غير مفعّل بعد. يرجى المحاولة لاحقًا، أو التواصل معنا عبر صفحة التواصل.",
  "auth.forgotPassword": "نسيت كلمة المرور؟",
  "auth.signingIn": "جارٍ تسجيل الدخول…",
  "auth.logIn": "تسجيل الدخول",
  "auth.backToSignIn": "العودة إلى تسجيل الدخول",
  "auth.passwordUpdated": "تم تحديث كلمة المرور. جارٍ تحويلك إلى حسابك…",
  "auth.resetUnavailable":
    "إعادة تعيين كلمة المرور غير مفعّلة بعد. يجب فتح هذا الرابط من رسالة إعادة تعيين حقيقية بعد إعداد Supabase.",
  "auth.sendYourselfLink": "أرسل لنفسك رابط إعادة تعيين",
  "auth.updating": "جارٍ التحديث…",
  "auth.updatePassword": "تحديث كلمة المرور",
  "auth.resetSent":
    "إن كان هناك حساب مسجَّل بهذا البريد الإلكتروني، فقد أُرسلت إليه تعليمات إعادة تعيين كلمة المرور.",
  "auth.sending": "جارٍ الإرسال…",
  "auth.sendResetInstructions": "إرسال تعليمات إعادة التعيين",
  // --- account area — English by decision ---------------------------
  "account.englishOnlyNotice": "هذا القسم من الموقع متاح حاليًا باللغة الإنجليزية فقط.",
  // --- articles are English only (ALL FLAGGED) ---------------------------
  "blog.englishOnly": "المقالات بقلم الدكتور منذر علان ومتاحة باللغة الإنجليزية فقط.",
};
