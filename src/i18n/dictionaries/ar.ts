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
  // --- articles are English only (ALL FLAGGED) ---------------------------
  "blog.englishOnly": "المقالات بقلم الدكتور منذر علان ومتاحة باللغة الإنجليزية فقط.",
};
