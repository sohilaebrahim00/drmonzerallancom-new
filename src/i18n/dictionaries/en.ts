import type { Entry } from "../types";

/**
 * English is the source dictionary: its keys ARE the key type, so a typo in a
 * `t()` call is a compile error rather than a string that renders as its own
 * key in production.
 *
 * Keys are flat and dotted (`faq.resultCount`) rather than nested objects.
 * With the surface in FIX_PLAN 5.2 — around 280 files — a nested shape needs
 * recursive template-literal path types to stay type-safe, which is slow to
 * compile and produces unreadable errors. Flat keys are greppable: the string
 * in the editor is the string in the file.
 *
 * Convention: `<area>.<thing>`, and a plural entry is named for what it
 * counts, not for the sentence it appears in.
 *
 * SEEDED, NOT COMPLETE. These are the entries needed to prove the mechanism —
 * each one lifted from a string that exists in the tree today. Component
 * conversion is the next step, not this one.
 */
export const en = {
  // --- plural entries -------------------------------------------------
  // src/pages/FaqPage.tsx:115 — `{n} {n === 1 ? "question" : "questions"} found`
  "faq.resultCount": {
    one: "{count} question found",
    other: "{count} questions found",
  },
  // src/pages/ProductsIndexPage.tsx:84
  "packages.consultationCount": {
    one: "{count} Consultation",
    other: "{count} Consultations",
  },
  "common.minRead": {
    one: "{count} min read",
    other: "{count} min read",
  },
  "products.resultCount": {
    one: "{count} product found",
    other: "{count} products found",
  },
  // src/app-native/screens/NativeNotificationSettings.tsx:74 — was "day(s)"
  "notifications.coverageDays": {
    one: "Currently covering the next day.",
    other: "Currently covering the next {count} days.",
  },
  // src/pages/AccountConsultationsPage.tsx:253 and three sibling screens
  "consultations.creditsRemaining": {
    one: "{count} of {limit} credit remaining",
    other: "{count} of {limit} credits remaining",
  },

  // --- simple entries -------------------------------------------------
  "common.language": "Language",
  "consultations.title": "Consultations",
  "faq.searchPlaceholder": "Search questions",

  // --- global navigation ----------------------------------------------
  "nav.about": "About",
  "nav.packages": "Packages",
  "nav.shop": "Shop",
  "nav.blog": "Blog",
  "nav.gallery": "Gallery",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",

  // --- header -----------------------------------------------------------
  "header.homeAriaLabel": "Monzer Allan home",
  "header.logoAlt": "Monzer Allan logo",
  "header.openMenu": "Open menu",
  "header.menuTitle": "Menu",
  "header.primaryNavLabel": "Primary",
  "header.mobileNavLabel": "Mobile",
  "header.signIn": "Sign In",
  "header.createAccount": "Create Account",
  "header.myAccount": "My Account",

  // --- footer -----------------------------------------------------------
  "footer.navigation": "Navigation",
  "footer.popularServices": "Popular Services",
  "footer.getInTouch": "Get in Touch",
  "footer.reachOut": "Reach out via the",
  "footer.contactPage": "Contact page",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.medicalDisclaimer": "Medical Disclaimer",

  // --- shared controls --------------------------------------------------
  "cta.bookSession": "Book a Session",
  "cta.viewPrograms": "View Programs",
  "cta.backToTop": "Back to top",

  // --- home sections: heading blocks ------------------------------------
  "services.eyebrow": "Services",
  "services.title": "Specialized Nutrition Care For Every Stage Of Life",
  "services.description":
    "Twelve focused programs, each tailored to your body, your goals, and your medical needs.",

  "programs.eyebrow": "Programs",
  "programs.title": "Choose Your Path Forward",
  "programs.description":
    "A treatment program with close medical follow-up — pick the level of consultation support you need, with no recurring billing.",

  "howItWorks.eyebrow": "Programs",
  "howItWorks.title": "How It Works",
  "howItWorks.description":
    "From choosing a program to your first consultation — a simple, transparent, one-time process.",

  "products.eyebrow": "Products",
  "products.title": "Featured Wellness Products",
  "products.description":
    "Carefully selected products designed to support a healthier daily routine.",

  "blog.eyebrow": "Blog",
  "blog.title": "Learn The Science Behind The Advice",
  "blog.description":
    "Free, evidence-based articles covering the topics that matter most to your health.",

  "discovery.eyebrow": "Explore by Topic",
  "discovery.title": "Find Guidance For What Matters Most to You",

  "gallery.eyebrow": "Gallery",
  "gallery.title": "A Look Inside the Practice",

  "testimonials.eyebrow": "Client Reviews",
  "testimonials.title": "What Clients Are Saying",

  "videos.eyebrow": "Watch & Learn",
  "videos.title": "Nutrition Insights on Video",
  "videos.description": "Practical nutrition insights, explained clearly.",

  "community.eyebrow": "Community",
  "community.title": "Join the Community",

  "contactSection.eyebrow": "Contact",
  "contactSection.title": "Let's Start Your Nutrition Journey",
  "contactSection.description":
    "Reach out with questions, or book your first session directly — whichever is easiest for you.",

  "beforeAfter.eyebrow": "What Changes",
  "beforeAfter.title": "The same table, two different evenings",
  "beforeAfter.description":
    "Drag the slider to compare. This is about what is on the plate — not about anyone's body.",
  "beforeAfter.storiesEyebrow": "Real Progress",
  "beforeAfter.storiesTitle": "Transformation Stories",
  "beforeAfter.storiesDescription":
    "Illustrative snapshots of client progress. Drag the slider to compare before and after results.",

  "faqSection.eyebrow": "FAQ",
  "faqSection.title": "Frequently Asked Questions",

  // --- page furniture ---------------------------------------------------
  "faqPage.eyebrow": "Knowledge Center",
  "faqPage.description":
    "Search or filter by topic to find answers about programs, consultations, billing, and more.",
  "faqPage.searchPlaceholder": "Search questions…",
  "faqPage.searchAriaLabel": "Search FAQs",
  "faqPage.categoryAll": "All",
  "faqPage.noResults": "No questions match your search. Try another keyword or category.",
  "faqPage.stillHaveQuestion": "Still Have a Question?",
  "faqPage.stillHaveQuestionBody":
    "Ask directly, or explore programs to see what's included in each package.",
  "faqPage.explorePrograms": "Explore Programs",
  "faqPage.contactUs": "Contact Us",

  "productsPage.searchPlaceholder": "Search products…",
  "productsPage.searchAriaLabel": "Search products",

  "blogPage.searchPlaceholder": "Search articles…",
  "blogPage.searchAriaLabel": "Search articles",
  "blogPage.featured": "Featured Article",
  "blogPage.readArticle": "Read the Article",

  "article.byline": "By {name}",
  "common.read": "Read",
  "common.home": "Home",

  // --- taxonomy labels --------------------------------------------------
  // DISPLAY ONLY. The identity stays the English string in the data files —
  // see the second rule at the top of ar.ts. Filtering, gradient lookup,
  // related-content scoring and search all compare the identity, never these.
  "faqCategory.programs": "Programs",
  "faqCategory.consultations": "Consultations",
  "faqCategory.consultationCredits": "Consultation Credits",
  "faqCategory.onlineMeetings": "Online Meetings",
  "faqCategory.accountBilling": "Account & Billing",
  "faqCategory.products": "Products",
  "faqCategory.nutritionServices": "Nutrition Services",
  "faqCategory.generalQuestions": "General Questions",

  "articleCategory.weightManagement": "Weight Management",
  "articleCategory.clinicalNutrition": "Clinical Nutrition",
  "articleCategory.sportsNutrition": "Sports Nutrition",
  "articleCategory.womensHealth": "Women's Health",
  "articleCategory.familyNutrition": "Family Nutrition",
  "articleCategory.digestiveHealth": "Digestive Health",
  "articleCategory.heartHealth": "Heart Health",

  "productCategory.supplements": "Supplements",
  "productCategory.vitaminsMinerals": "Vitamins & Minerals",
  "productCategory.herbalWellness": "Herbal Wellness",
  "productCategory.healthMonitoringDevices": "Health Monitoring Devices",

  "videoCategory.nutrition": "Nutrition",
  "videoCategory.wellness": "Wellness",
  "videoCategory.education": "Education",
  "videoCategory.lifestyle": "Lifestyle",
  "videoCategory.metabolicHealth": "Metabolic Health",

  // --- gallery page -----------------------------------------------------
  "galleryPage.storyInPractice": "In Practice",
  "galleryPage.storyInPracticeBody": "Moments from real consultations and everyday practice life.",
  "galleryPage.storyBehindKnowledge": "Behind the Knowledge",
  "galleryPage.storyBehindKnowledgeBody":
    "How research and clinical training shape each recommendation.",
  "galleryPage.storyEducational": "Educational Moments",
  "galleryPage.storyEducationalBody": "Snapshots from talks, sessions, and community education.",
  "galleryPage.storyEvents": "Events & Community",
  "galleryPage.storyEventsBody": "Community initiatives and wellness events.",
  "galleryPage.storyJourney": "Professional Journey",
  "galleryPage.storyJourneyBody": "Milestones in clinical and nutrition specialization.",

  // --- About page -------------------------------------------------------
  // EVERY string in this block is in the flagged list regardless of
  // confidence. This is the doctor describing himself — his philosophy, his
  // mission, his credentials framing. A man's own account of his practice
  // should not reach patients in a language he has not read it in.
  "aboutPage.eyebrow": "About {name}",
  "aboutPage.title": "A Clinical Approach To Nutrition, Built Around Real Life",
  "aboutPage.lede":
    "{name} is a {title} helping clients build lasting, evidence-based habits — not restrictive, short-lived diets.",
  "aboutPage.philosophyEyebrow": "Philosophy of Care",
  "aboutPage.philosophyTitle": "Guidance That Starts With Your Actual Life",
  "aboutPage.philosophyBody":
    "Every plan begins with what a client is already eating, not a template imposed from the outside. By combining a pharmacist's clinical training with specialized nutrition science, the goal is always the same: guidance that respects a person's schedule, culture, and preferences while still being grounded in evidence. Change that lasts comes from small, realistic adjustments — not dramatic overhauls that are hard to sustain.",
  "aboutPage.backgroundEyebrow": "Professional Background",
  // F-6: "Verified" was removed. about.ts records in its own comment that none
  // of these credentials have been verified, so the heading asserted something
  // nothing in the repo supports. Removing an unsupported claim needs nobody's
  // permission; adding one does. Restore the word only with documentation.
  "aboutPage.backgroundTitle": "Credentials",
  "aboutPage.focusEyebrow": "Areas of Focus",
  "aboutPage.focusTitle": "Specialized Support Across Every Stage of Life",
  "aboutPage.ctaTitle": "Start Your Nutrition Journey",
  "aboutPage.ctaBody":
    "Choose a program for guided support, or reach out to ask a question before you begin.",
  "aboutPage.mission": "Mission",
  "aboutPage.vision": "Vision",
  "aboutPage.bio1":
    "Monzer Allan brings a combination of clinical and nutritional expertise to every consultation — trained as a pharmacist and specialized in nutrition, he approaches health from both the science of the body and the reality of everyday eating.",
  "aboutPage.bio2":
    "Rather than one-size-fits-all diet plans, Monzer builds guidance around each client's actual life: their schedule, culture, preferences, and goals. The aim is always the same — lasting change that doesn't feel like a sacrifice.",
  "aboutPage.bio3":
    "His approach blends evidence-based nutrition science with genuine, ongoing support, across the specialized programs described below.",
  "aboutPage.missionBody":
    "To make expert, evidence-based nutrition guidance accessible and genuinely sustainable — helping every client build a healthier relationship with food, one realistic step at a time.",
  "aboutPage.visionBody":
    "A community where healthier choices come from understanding, not restriction — where nutrition care is personal, informed, and built to last a lifetime.",
  "credential.licensedPharmacist": "Licensed Pharmacist",
  "credential.licensedPharmacistBody":
    "A clinical foundation in pharmacology and how nutrition interacts with treatment.",
  "credential.nutritionSpecialist": "Nutrition Specialist",
  "credential.nutritionSpecialistBody":
    "Focused training in evidence-based dietary science and behavior change.",

  // --- footer prose -----------------------------------------------------
  "footer.tagline":
    "Trusted nutrition, health, and wellness guidance from a {title} — understand more, choose better, live healthier.",
  "footer.disclaimer":
    "Educational content only and not a substitute for professional medical consultation.",

  // --- index page headings ----------------------------------------------
  "productsPage.title": "Wellness Products & Health Devices",
  "blogPage.title": "Nutrition Knowledge You Can Trust",

  // --- packages: how credits work ---------------------------------------
  "packagesPage.eyebrow": "Programs",
  "packagesPage.title": "Choose Your Program",
  "packagesPage.detailsEyebrow": "The Details",
  "packagesPage.detailsTitle": "How Consultation Credits & Meetings Work",
  "packagesPage.creditsTitle": "Program Credits",
  "packagesPage.meetTitle": "Google Meet",
  "packagesPage.lede":
    "A one-time payment for a guided nutrition or treatment program — the difference between tiers is simply how many doctor consultations are included. No recurring billing, no subscription.",
  "productsPage.lede":
    "Explore {name}2019s selection of branded wellness products, supplements, and home health-monitoring devices.",
  "blogPage.lede":
    "Practical, evidence-based articles to help you understand nutrition and make confident choices.",
  // --- patient screens: auth --------------------------------------------
  "auth.emailLabel": "Email",
  "auth.passwordLabel": "Password",
  "auth.newPasswordLabel": "New password",
  "auth.confirmPasswordLabel": "Confirm new password",
  "auth.emailInvalid": "Please enter a valid email address.",
  "auth.passwordRequired": "Please enter your password.",
  "auth.passwordTooShort": "Password must be at least 8 characters.",
  "auth.passwordsDoNotMatch": "Passwords do not match.",
  "auth.signInTitle": "Sign In",
  "auth.signInBody": "Access your Monzer Allan member account.",
  "auth.forgotTitle": "Forgot Password",
  "auth.forgotBody": "Enter your email and we'll send you reset instructions.",
  "auth.forgotUnavailable": "Password reset isn't connected yet.",
  "auth.resetTitle": "Set a New Password",
  "auth.resetBody": "Choose a new password for your member account.",

  // --- patient screens: after checkout ----------------------------------
  "membership.confirming": "We're confirming your payment…",
  "membership.checkingStatus": "Checking your current account status.",
  "membership.allSet": "You're All Set",
  "membership.allSetBody":
    "Thank you. Head to your account to see your consultation credits and request your first session.",
  "membership.settingUp": "Payment Received — Setting Up Your Account",
  "membership.settingUpBody":
    "Your payment was submitted to Stripe. We are now confirming it and setting up your account — this usually takes just a few minutes. Check your email for a message inviting you to set your password and sign in.",
  "membership.cancelledTitle": "Checkout Cancelled",
  "membership.cancelledBody":
    "No payment was made and nothing was charged — whether you cancelled or the card was declined. You can pick up where you left off anytime.",

  // --- 404 ---------------------------------------------------------------
  "notFound.title": "We couldn't find that page",
  "notFound.body":
    "The page you're looking for may have been moved or no longer exists. Let's get you back on track.",
  // --- consultation intake (ALL FLAGGED — a clinician signs these off) ----
  // The QUESTIONS are not here: promptAr in data/intakeQuestions.ts is the
  // doctor own Arabic and is rendered directly. These are the short labels.
  "intake.label1": "Reason for the consultation",
  "intake.label2": "Current symptoms",
  "intake.label3": "Recent tests, medicines and supplements",
  "intake.label4": "Vitamin and mineral levels",
  "intake.label5": "A normal day of eating",
  "intake.label6": "Stress level",
  "intake.label7": "Physical activity",
  "intake.label8": "Sleep",
  "intake.optionalNote": "A few optional questions before your consultation.",
  // --- legal notice (ALL FLAGGED) ----------------------------------------
  // Privacy, Terms and the Medical Disclaimer are NOT translated. A translated
  // legal document creates ambiguity about which version governs in a dispute.
  // Only this notice is, and it says exactly that.
  "legal.englishAuthoritative":
    "This page is available in English only. The English text is the authoritative version and is the one that applies.",
  // --- package copy (ALL FLAGGED — product copy, sold to patients) --------
  "pkg.dietBasic.name": "Diet Basic",
  "pkg.dietBasic.tagline": "Start your nutrition program with expert guidance",
  "pkg.dietPlus.name": "Diet Plus",
  "pkg.dietPlus.tagline": "More check-ins to keep your program on track",
  "pkg.dietPremium.name": "Diet Premium",
  "pkg.dietPremium.tagline": "The most guided path to your goal",
  "pkg.treatmentBasic.name": "Treatment Basic",
  "pkg.treatmentBasic.tagline": "Begin your treatment plan with a first consultation",
  "pkg.treatmentPlus.name": "Treatment Plus",
  "pkg.treatmentPlus.tagline": "Closer follow-up through your treatment plan",
  "pkg.treatmentPremium.name": "Treatment Premium",
  "pkg.treatmentPremium.tagline": "The closest level of medical follow-up available",
  "pkg.feature.nutritionProgram": "Nutrition program",
  "pkg.feature.treatmentPlan": "Treatment plan",
  "pkg.feature.monthlyFollowUp": "Monthly follow-up",
  "pkg.feature.doctorConsultations": {
    one: "{count} doctor consultation",
    other: "{count} doctor consultations",
  },
  "pkg.cta.startProgram": "Start Your Program",
  // --- FAQ content (ALL FLAGGED — product copy a buyer relies on) --------
  "faqItem.q1": "What's included in a program?",
  "faqItem.a1":
    "Every program is a one-time purchase that includes a set number of doctor consultation credits, access to your account and consultation history, and ongoing treatment support. Treatment programs come in Basic, Plus, and Premium tiers that differ only in how many consultations are included — compare them on the Packages page.",
  "faqItem.q2": "Is this a subscription? Will I be billed again?",
  "faqItem.a2":
    "No. Every program is a single, one-time payment — there is no recurring billing, and nothing renews automatically. If you'd like more consultations later, you can purchase another program at any time.",
  "faqItem.q3": "What happens in the first consultation?",
  "faqItem.a3":
    "Your first session is a full assessment of your health history, current eating habits, lifestyle, and goals. By the end, you'll leave with a clear picture of your plan and next steps — no guesswork.",
  "faqItem.q4": "Do you offer online consultations?",
  "faqItem.a4":
    "Yes. Program consultations are conducted online over Google Meet, and every service can also be booked in person — choose whichever fits your schedule and comfort best.",
  "faqItem.q5": "How do consultation credits work?",
  "faqItem.a5":
    "Each program includes a fixed number of consultation credits, granted once when you purchase (2, 3, or 4, depending on the tier you choose). You use one credit each time you request an online consultation from your account.",
  "faqItem.q6": "What happens if I don't use all my credits?",
  "faqItem.a6":
    "Your credits stay on your account — they're granted once at purchase and don't expire on a monthly cycle, since there's no recurring billing to tie them to. They are tied to your account and are non-transferable.",
  "faqItem.q7": "How do I join my online consultation?",
  "faqItem.a7":
    "Once a consultation request is approved, a Google Meet link is attached to that appointment in your account. You'll be able to join directly from there at your scheduled time.",
  "faqItem.q8": "How do I create an account?",
  "faqItem.a8":
    "Creating an account happens automatically when you purchase a program. Visit the Packages page, choose a Treatment program, and complete secure payment — your account activates and you'll set your password from there.",
  "faqItem.q9": "Is my payment information secure?",
  "faqItem.a9":
    "Payments are processed through Stripe, a secure, PCI-compliant payment provider — this website will never ask you to send card details directly, and we never see or store them.",
  "faqItem.q10": "Can I purchase products directly on the site?",
  "faqItem.a10":
    "All products currently listed are marked Out of Stock. You're welcome to ask about availability from any product page, and we'll follow up directly with updates.",
  "faqItem.q11": "How soon will I see results?",
  "faqItem.a11":
    "It depends on your goal and starting point, but most clients notice meaningful changes in energy and habits within 2–3 weeks, with visible physical results typically building over 4–8 weeks.",
  "faqItem.q12": "Is the plan built around foods I already eat?",
  "faqItem.a12":
    "Always. Every plan starts from your current lifestyle, preferences, and culture — it's adapted to you, not a generic template you're forced to follow.",
  "faqItem.q13": "Can you work with an existing medical condition?",
  "faqItem.a13":
    "Yes, clinical nutrition for conditions like diabetes, hypertension, and high cholesterol is a core part of the practice. Plans are coordinated with your physician's guidance when needed.",
  "faqItem.q14": "Do you provide guidance for seniors?",
  "faqItem.a14":
    "Yes — senior nutrition is a dedicated service, covering bone and muscle support, appetite-friendly menus, and medication-aware planning for later life.",
  "faqItem.q15": "Do you support patients going through cancer treatment?",
  "faqItem.a15":
    "Yes — nutrition support for cancer patients is a dedicated service, for during and after treatment. It focuses on maintaining weight and muscle, and on managing appetite loss, nausea, and taste changes so you can keep eating well through side effects. It is supportive nutritional care that works alongside your oncology team and complements — never replaces — the treatment plan from your oncologist. Questions about your treatment, prognosis, or whether a specific food or supplement is safe during chemotherapy need to go to the doctor together with your oncology team, not to a general answer.",
  "faqItem.q16": "How do I book a session?",
  "faqItem.a16":
    "Use the “Book a Session” button anywhere on the site to choose your service, preferred date and time, and session type. You'll receive a confirmation immediately after booking.",
  "faqItem.q17": "What is your cancellation policy?",
  "faqItem.a17":
    "We ask for at least 24 hours' notice to reschedule or cancel a session so the time slot can be offered to another client. Reach out via WhatsApp or the Contact page and we'll take care of it.",
  // --- product copy (ALL FLAGGED — a buyer relies on this) ----------------
  "product.omega3KrillOil.name": "Omega-3 Krill Oil",
  "product.omega3KrillOil.short":
    "A Monzer Allan-branded krill oil dietary supplement providing about 240 mg of omega-3s per serving.",
  "product.irishMossBladderwrack.name": "Irish Moss + Bladderwrack",
  "product.irishMossBladderwrack.short":
    "A Monzer Allan-branded sea mineral blend supplement combining Irish moss and bladderwrack.",
  "product.resveratrol.name": "Resveratrol",
  "product.resveratrol.short":
    "A Monzer Allan-branded resveratrol supplement positioned for antioxidant and cellular support.",
  "product.betaCarotene.name": "Beta Carotene",
  "product.betaCarotene.short":
    "A Monzer Allan-branded beta carotene supplement, a vitamin A precursor.",
  "product.norwegianCodLiverOil60.name": "Norwegian Cod Liver Oil — 60 Capsules",
  "product.norwegianCodLiverOil60.short":
    "A Monzer Allan-branded Norwegian cod liver oil supplement with omega-3s and vitamins A & D.",
  "product.tudca.name": "TUDCA",
  "product.tudca.short":
    "A Monzer Allan-branded TUDCA supplement positioned for liver and digestive support.",
  "product.milkThistleExtract.name": "Milk Thistle Extract",
  "product.milkThistleExtract.short":
    "A Monzer Allan-branded milk thistle extract supplement standardized to 80% silymarin.",
  "product.glucosamineChondroitin.name": "Glucosamine Chondroitin",
  "product.glucosamineChondroitin.short":
    "A Monzer Allan-branded glucosamine and chondroitin supplement for joint and mobility support.",
  "product.berberinePlus.name": "Berberine Plus",
  "product.berberinePlus.short":
    "A Monzer Allan-branded berberine supplement positioned for metabolic and glucose support.",
  "product.alphaLipoicAcid.name": "Alpha Lipoic Acid",
  "product.alphaLipoicAcid.short":
    "A Monzer Allan-branded alpha lipoic acid supplement for cellular and metabolic support.",
  "product.potassiumGluconate.name": "Potassium Gluconate",
  "product.potassiumGluconate.short":
    "A Monzer Allan-branded potassium gluconate supplement for electrolyte and wellness support.",
  "product.spirulina.name": "Spirulina",
  "product.spirulina.short":
    "A Monzer Allan-branded spirulina supplement for greens and daily wellness support.",
  "product.shilajitExtraStrength.name": "Shilajit Extra Strength",
  "product.shilajitExtraStrength.short":
    "A Monzer Allan-branded Shilajit supplement labeled as a mineral vitality formula.",
  "product.stingingNettle.name": "Stinging Nettle",
  "product.stingingNettle.short":
    "A Monzer Allan-branded stinging nettle supplement labeled as a men's support formula.",
  "product.tongkatAli.name": "Tongkat Ali",
  "product.tongkatAli.short":
    "A Monzer Allan-branded Tongkat Ali (LJ100) supplement labeled as a strength and vitality formula.",
  "product.superMaleBComplex.name": "Super Male B-Complex",
  "product.superMaleBComplex.short":
    "A Monzer Allan-branded B-Complex supplement labeled as a performance formula.",
  "product.glutathione.name": "Glutathione",
  "product.glutathione.short":
    "A Monzer Allan-branded glutathione supplement for antioxidant and cellular defense support.",
  "product.grassFedBeefLiver.name": "Grass-Fed Beef Liver",
  "product.grassFedBeefLiver.short":
    "A Monzer Allan-branded grass-fed beef liver whole food supplement.",
  "product.vitaminD3K2.name": "Vitamin D3K2",
  "product.vitaminD3K2.short":
    "A Monzer Allan-branded Vitamin D3 + K2 (MK-7) supplement for bone, heart, and immune support.",
  "product.norwegianCodLiverOil120.name": "Norwegian Cod Liver Oil — 120 Capsules",
  "product.norwegianCodLiverOil120.short":
    "A Monzer Allan-branded Norwegian cod liver oil supplement with vitamins A & D and omega-3.",
  "product.coq10.name": "CoQ10",
  "product.coq10.short":
    "A Monzer Allan-branded CoQ10 supplement for heart and cellular energy support.",
  "product.advancedBComplex.name": "Advanced B-Complex",
  "product.advancedBComplex.short":
    "A Monzer Allan-branded B-Complex supplement labeled as a complete daily energy formula.",
  "product.nonContactInfraredThermometer.name": "Non-Contact Infrared Thermometer",
  "product.nonContactInfraredThermometer.short":
    "A Monzer Allan-branded non-contact infrared thermometer with a 3-color fever alert display.",
  "product.digitalThermometer.name": "Digital Thermometer",
  "product.digitalThermometer.short":
    "A Monzer Allan-branded digital thermometer for at-home temperature readings.",
  "product.digitalBloodPressureMonitor.name": "Digital Upper-Arm Blood Pressure Monitor",
  "product.digitalBloodPressureMonitor.short":
    "A Monzer Allan-branded digital upper-arm blood pressure monitor with a universal cuff.",
  "product.smartBodyCompositionScale.name": "Smart Body Composition Scale",
  "product.smartBodyCompositionScale.short":
    "A Monzer Allan-branded smart scale that tracks body composition metrics with Wi-Fi sync.",
  "product.bloodGlucoseMeterKit.name": "Blood Glucose Meter Kit",
  "product.bloodGlucoseMeterKit.short":
    "A Monzer Allan-branded blood glucose meter kit for at-home glucose testing.",
  // --- videos, and the rest of the product surface -------------------
  "video.vitaminDDeficiencySigns.title": "10 Signs of Vitamin D Deficiency You Shouldn't Ignore.",
  "video.vitaminDDeficiencySigns.caption":
    "A rundown of common signs linked to low vitamin D — from fatigue and difficulty concentrating to joint stiffness and mood changes — plus general guidance on supplementation and target levels.",
  "video.ironStoresDrop.title": "What Happens When Your Iron Stores Drop?",
  "video.ironStoresDrop.caption":
    "An overview of symptoms tied to low iron stores, such as fatigue, dizziness, and hair loss, along with practical guidance on testing and supporting healthy iron levels.",
  "video.magnesiumTypesTiming.title": "Types of Magnesium and Best Times to Take Them",
  "video.magnesiumTypesTiming.caption":
    "A quick guide to the different forms of magnesium and when to take each one.",
  "video.candidaTreatmentStageThree.title":
    "Stage Three of Kandida Treatment: Essential Remedies and Vitamins for Both Spouses",
  "video.candidaTreatmentStageThree.caption":
    "A look at a later stage of a Candida-support protocol, covering natural remedies and the vitamins commonly recommended alongside it.",
  "video.candidaTreatmentBoneBroth.title":
    "Candida Treatment: Bone Broth, Steamed Veggies, and Herbal Remedies",
  "video.candidaTreatmentBoneBroth.caption":
    "A walkthrough of an early-stage Candida-support approach built around bone broth, steamed vegetables, and supportive herbs.",
  "video.candidaFoodsToAvoid.title": "Candida Treatment: Foods to Avoid for Healing",
  "video.candidaFoodsToAvoid.caption":
    "Practical guidance on the foods commonly avoided during a Candida-support protocol, and why they can work against progress.",
  "video.autoimmunePathBeforeMedication.title":
    "The Path to Treating Autoimmune Diseases: Essential Steps Before Medication",
  "video.autoimmunePathBeforeMedication.caption":
    "A discussion on the foundational steps — digestion, diet, exercise, sleep, and stress management — often addressed before or alongside autoimmune treatment.",
  "video.oneSimpleHabit.title": "One simple habit can support a healthier lifestyle.",
  "video.oneSimpleHabit.caption":
    "A short, practical habit that can make everyday healthy living easier to sustain.",
  "product.omega3KrillOil.full":
    "A Monzer Allan-branded omega-3 krill oil dietary supplement presented in capsule form, providing approximately 240 mg of omega-3s per the label. Strength and capsule count are shown on the product packaging.",
  "product.irishMossBladderwrack.full":
    "A Monzer Allan-branded Irish Moss + Bladderwrack sea mineral blend, presented as an ocean greens and wellness support capsule. Capsule count is shown on the packaging.",
  "product.resveratrol.full":
    "A Monzer Allan-branded resveratrol dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.betaCarotene.full":
    "A Monzer Allan-branded Beta Carotene dietary supplement, labeled as a vitamin A precursor. Strength and capsule count are shown on the packaging.",
  "product.norwegianCodLiverOil60.full":
    "A Monzer Allan-branded Norwegian Cod Liver Oil dietary supplement in the 60-capsule size, with per-capsule amounts for omega-3, EPA, DHA, vitamin D3, vitamin A, and vitamin E printed on the label. This is a separate listing from the 120-capsule size.",
  "product.tudca.full":
    "A Monzer Allan-branded TUDCA dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.milkThistleExtract.full":
    "A Monzer Allan-branded Milk Thistle Extract dietary supplement, standardized to 80% silymarin per the label, positioned for liver detox and protection support. Strength and capsule count are shown on the packaging.",
  "product.glucosamineChondroitin.full":
    "A Monzer Allan-branded Glucosamine with Chondroitin dietary supplement. Strength and capsule count are shown on the packaging.",
  "product.berberinePlus.full":
    "A Monzer Allan-branded Berberine Plus dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.alphaLipoicAcid.full":
    "A Monzer Allan-branded Alpha Lipoic Acid dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.potassiumGluconate.full":
    "A Monzer Allan-branded Potassium Gluconate dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.spirulina.full":
    "A Monzer Allan-branded Spirulina dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.shilajitExtraStrength.full":
    "A Monzer Allan-branded Shilajit Extra Strength dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
  "product.stingingNettle.full":
    "A Monzer Allan-branded Stinging Nettle dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.tongkatAli.full":
    "A Monzer Allan-branded Tongkat Ali dietary supplement using the LJ100 extract per the label. Strength and capsule count are displayed on the packaging.",
  "product.superMaleBComplex.full":
    "A Monzer Allan-branded Super Male B-Complex dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
  "product.glutathione.full":
    "A Monzer Allan-branded Glutathione dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.grassFedBeefLiver.full":
    "A Monzer Allan-branded Grass-Fed Beef Liver whole food formula dietary supplement, presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.vitaminD3K2.full":
    "A Monzer Allan-branded Vitamin D3K2 dietary supplement using the MK-7 form of vitamin K2 per the label. Strength and tablet count are displayed on the packaging.",
  "product.norwegianCodLiverOil120.full":
    "A Monzer Allan-branded Norwegian Cod Liver Oil dietary supplement in the 120-capsule size, labeled Vitamins A & D + 3-Omega. This is a separate listing from the 60-capsule size and is not merged with it.",
  "product.coq10.full":
    "A Monzer Allan-branded CoQ10 dietary supplement presented in capsule form. Strength and capsule count are displayed on the packaging.",
  "product.advancedBComplex.full":
    "A Monzer Allan-branded Advanced B-Complex dietary supplement presented in capsule form. Capsule count is displayed on the packaging.",
  "product.nonContactInfraredThermometer.full":
    "A Monzer Allan-branded non-contact infrared thermometer for convenient at-home temperature checks. Refer to the included product instructions for correct setup and use.",
  "product.digitalThermometer.full":
    "A Monzer Allan-branded digital thermometer designed for convenient at-home measurements. Refer to the included product instructions for correct setup and use.",
  "product.digitalBloodPressureMonitor.full":
    "A Monzer Allan-branded digital upper-arm blood pressure monitor designed for convenient at-home measurements, including a universal-fit cuff. Refer to the included product instructions for correct setup and use.",
  "product.smartBodyCompositionScale.full":
    "A Monzer Allan-branded smart body composition scale designed for convenient at-home tracking, with Wi-Fi sync and support for unlimited user profiles per the label. Refer to the included product instructions for correct setup and use.",
  "product.bloodGlucoseMeterKit.full":
    "A Monzer Allan-branded blood glucose meter kit designed for convenient at-home testing. Refer to the included product instructions for correct setup and use.",
  "productHighlight.epaDha": "EPA & DHA",
  "productHighlight.heartCellularEnergy": "Heart & Cellular Energy (label claim)",
  "productHighlight.immuneHeartSupport": "Immune + Heart Support (label claim)",
  "productHighlight.vitaminAD": "Vitamin A & D",
  "productHighlight.seaweedPower": "Seaweed Power",
  "productHighlight.oceanNourished": "Ocean Nourished",
  "productHighlight.mineralRichPlain": "Mineral Rich",
  "productHighlight.dailyWellnessPlain": "Daily Wellness",
  "productHighlight.antioxidantDefense": "Antioxidant defense (label claim)",
  "productHighlight.healthyAging": "Healthy aging (label claim)",
  "productHighlight.cellularSupport": "Cellular support (label claim)",
  "productHighlight.visionSkinImmune":
    "Supports vision, skin health, and immune function (label claim)",
  "productHighlight.omega3Support": "Omega-3 Support",
  "productHighlight.vitaminsAD": "Vitamins A & D",
  "productHighlight.immuneHeart": "Immune + Heart (label claim)",
  "productHighlight.liverHealth": "Liver health (label claim)",
  "productHighlight.digestiveSupport": "Digestive support (label claim)",
  "productHighlight.liverSupport": "Liver support (label claim)",
  "productHighlight.detoxSupport": "Detox support (label claim)",
  "productHighlight.antioxidantSupport": "Antioxidant support (label claim)",
  "productHighlight.jointComfort": "Joint comfort (label claim)",
  "productHighlight.cartilageSupport": "Cartilage support (label claim)",
  "productHighlight.mobilitySupport": "Mobility support (label claim)",
  "productHighlight.metabolicBalance": "Supports metabolic balance (label claim)",
  "productHighlight.dailyWellnessClaim": "Daily wellness (label claim)",
  "productHighlight.supportsAntioxidantDefense": "Supports antioxidant defense (label claim)",
  "productHighlight.hydrationBalance": "Hydration balance (label claim)",
  "productHighlight.mineralSupport": "Mineral support (label claim)",
  "productHighlight.mineralRichClaim": "Mineral-rich (label claim)",
  "productHighlight.plantBasedNutrition": "Plant-based nutrition (label claim)",
  "productHighlight.power": "Power (label claim)",
  "productHighlight.endurance": "Endurance (label claim)",
  "productHighlight.vitality": "Vitality (label claim)",
  "productHighlight.balance": "Balance (label claim)",
  "productHighlight.wellness": "Wellness (label claim)",
  "productHighlight.stamina": "Stamina (label claim)",
  "productHighlight.performance": "Performance (label claim)",
  "productHighlight.energy": "Energy (label claim)",
  "productHighlight.focus": "Focus (label claim)",
  "productHighlight.cellularDefense": "Cellular defense (label claim)",
  "productHighlight.nutrientDense":
    "Nutrient-dense support for energy, immunity, and vitality (label claim)",
  "productHighlight.boneHeartImmune":
    "Supports bone, heart, and immune system health (label claim)",
  "productHighlight.dailyEnergySupport": "Daily Energy Support (label claim)",
  "productHighlight.fastReading": "Fast Reading (label claim)",
  "productHighlight.nonContact": "Non-Contact",
  "productHighlight.threeColorFeverAlert": "3-Color Fever Alert (label claim)",
  "productHighlight.highAccuracy": "High Accuracy (label claim)",
  "productHighlight.beepAlert": "Beep Alert (label claim)",
  "productHighlight.safeHygienic": "Safe & Hygienic (label claim)",
  "productHighlight.irregularHeartbeat": "Irregular Heartbeat Detection (label claim)",
  "productHighlight.comfortFitCuff": "ComfortFit Universal Cuff",
  "productHighlight.memories120Users2": "120 Memories, 2 Users",
  "productHighlight.oneTouchOperation": "One Touch Operation",
  "productHighlight.bodyMetrics":
    "Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %",
  "productHighlight.wifiSync": "Wi-Fi Sync",
  "productHighlight.multiUser": "Multi-User",
  "productHighlight.fiveSecondTest": "5 Second Test Time (label claim)",
  "productHighlight.highAccuracyIso": "High Accuracy — EN ISO 15197:2015 (label claim)",
  "productHighlight.testMemory500": "500 Test Memory",
  "spec.strength": "Strength",
  "spec.omega3Content": "Omega-3 content",
  "spec.count": "Count",
  "spec.form": "Form",
  "spec.formula": "Formula",
  "spec.type": "Type",
  "spec.omega3": "Omega-3",
  "spec.epa": "EPA",
  "spec.dha": "DHA",
  "spec.vitaminD3": "Vitamin D3",
  "spec.vitaminA": "Vitamin A",
  "spec.vitaminE": "Vitamin E",
  "spec.standardization": "Standardization",
  "spec.glucosamine": "Glucosamine",
  "spec.chondroitin": "Chondroitin",
  "spec.extract": "Extract",
  "spec.k2Form": "K2 Form",
  "spec.display": "Display",
  "spec.normalRange": "Normal range shown",
  "spec.lowFeverRange": "Low fever range shown",
  "spec.highFeverRange": "High fever range shown",
  "spec.cuff": "Cuff",
  "spec.memory": "Memory",
  "spec.operation": "Operation",
  "spec.metricsTracked": "Metrics tracked",
  "spec.connectivity": "Connectivity",
  "spec.users": "Users",
  "spec.testTime": "Test time",
  "spec.sampleSize": "Sample size",
  "spec.standard": "Standard",
  "spec.kitIncludes": "Kit includes",
  "product.qty.capsules60": "60 Capsules",
  "product.qty.capsules120": "120 Capsules",
  "product.qty.tablets120": "120 Tablets",
  "product.qty.piece1": "1 Piece",
  "product.priceLabel.contact": "Contact for Price",
  "videos.emptyTitle": "Video Library Coming Soon",
  "videos.emptyBody": "Featured videos will appear here directly from the channel.",
  // --- product detail page furniture ---------------------------------
  "product.breadcrumb": "Products",
  "product.specificationsHeading": "Specifications",
  // --- specification values that contain English words ---------------
  "specValue.microlitres06": "0.6 µL (label)",
  "specValue.piece1": "1 Piece",
  "specValue.mcg1250": "1,250 mcg (label)",
  "specValue.mg110": "110 mg (label)",
  "specValue.capsules120": "120 Capsules",
  "specValue.memories120Users2": "120 Memories / 2 Users (label)",
  "specValue.tablets120": "120 Tablets",
  "specValue.mg125": "125 mg (label)",
  "specValue.bodyMetrics13":
    "13 Body Metrics (label): Body Fat %, BMI, Muscle Mass, Body Water %, Bone Mass, Protein %",
  "specValue.iu13": "13 IU (label)",
  "specValue.mg235": "235 mg (label)",
  "specValue.iu3125": "3,125 IU (label)",
  "specValue.threeColorFeverAlert": "3-Color Fever Alert (label)",
  "specValue.fiveSecondTest": "5 Second Test Time (label)",
  "specValue.testMemory500": "500 Test Memory (label)",
  "specValue.capsules60": "60 Capsules",
  "specValue.silymarin80": "80% Silymarin",
  "specValue.capsule": "Capsule",
  "specValue.comfortFitCuff": "ComfortFit Universal Cuff (label)",
  "specValue.completeFormula": "Complete Formula",
  "specValue.digital": "Digital",
  "specValue.digitalUpperArm": "Digital Upper-Arm",
  "specValue.enIso15197": "EN ISO 15197:2015 (label)",
  "specValue.mensSupportFormula": "Men's Support Formula",
  "specValue.glucoseKitContents":
    "Meter, lancing pen, lancets, test strips, batteries, user manual, quick start guide (per label)",
  "specValue.mineralVitalityFormula": "Mineral Vitality Formula",
  "specValue.nonContactInfrared": "Non-Contact Infrared",
  "specValue.oneTouch": "One Touch (label)",
  "specValue.performanceFormula": "Performance Formula",
  "specValue.seaMineralBlend": "Sea Mineral Blend",
  "specValue.tablet": "Tablet",
  "specValue.unlimitedUsers": "Unlimited Users (label)",
  "specValue.vitaminAPrecursor": "Vitamin A Precursor",
  "specValue.wholeFoodFormula": "Whole Food Formula",
  "specValue.wifiSync": "Wi-Fi Sync",
  "specValue.mg240PerLabel": "~240 mg per label",
  // --- the twelve services ------------------------------------------
  "service.nutritionConsultation.title": "Nutrition Consultation",
  "service.nutritionConsultation.desc":
    "A personalized one-on-one assessment of your eating habits, lifestyle, and health goals to build a plan that actually fits your life.",
  "service.nutritionConsultation.h1": "Full dietary assessment",
  "service.nutritionConsultation.h2": "Custom nutrition plan",
  "service.nutritionConsultation.h3": "Ongoing follow-up",
  "service.weightLoss.title": "Weight Loss",
  "service.weightLoss.desc":
    "Sustainable, medically sound weight management built around real food, not extremes or fad diets that don't last.",
  "service.weightLoss.h1": "Metabolic evaluation",
  "service.weightLoss.h2": "Realistic meal structure",
  "service.weightLoss.h3": "Progress tracking",
  "service.weightGain.title": "Weight Gain",
  "service.weightGain.desc":
    "Structured calorie and nutrient plans to help you build healthy mass safely, whether for health, strength, or recovery.",
  "service.weightGain.h1": "Caloric surplus planning",
  "service.weightGain.h2": "Nutrient-dense menus",
  "service.weightGain.h3": "Strength-friendly guidance",
  "service.clinicalNutrition.title": "Clinical Nutrition",
  "service.clinicalNutrition.desc":
    "Evidence-based nutrition therapy that works alongside your medical treatment for chronic or complex conditions.",
  "service.clinicalNutrition.h1": "Condition-specific plans",
  "service.clinicalNutrition.h2": "Coordination with physicians",
  "service.clinicalNutrition.h3": "Lab-informed adjustments",
  "service.sportsNutrition.title": "Sports Nutrition",
  "service.sportsNutrition.desc":
    "Fueling strategies for athletes and active people to improve performance, recovery, and endurance.",
  "service.sportsNutrition.h1": "Performance fueling",
  "service.sportsNutrition.h2": "Recovery nutrition",
  "service.sportsNutrition.h3": "Hydration strategy",
  "service.diabetesNutrition.title": "Diabetes Nutrition",
  "service.diabetesNutrition.desc":
    "Blood-sugar-conscious meal planning designed to help you manage diabetes with confidence and enjoy your food again.",
  "service.diabetesNutrition.h1": "Glycemic load planning",
  "service.diabetesNutrition.h2": "Carb-balanced menus",
  "service.diabetesNutrition.h3": "Lifestyle coaching",
  "service.hypertension.title": "Hypertension",
  "service.hypertension.desc":
    "Heart-healthy, low-sodium nutrition strategies tailored to help manage blood pressure naturally.",
  "service.hypertension.h1": "Sodium-conscious planning",
  "service.hypertension.h2": "Heart-healthy swaps",
  "service.hypertension.h3": "Lifestyle support",
  "service.cholesterol.title": "Cholesterol",
  "service.cholesterol.desc":
    "Targeted dietary changes to help improve your lipid profile and support long-term cardiovascular health.",
  "service.cholesterol.h1": "Lipid-friendly menus",
  "service.cholesterol.h2": "Fiber & fat balance",
  "service.cholesterol.h3": "Progress monitoring",
  "service.digestiveHealth.title": "Digestive Health",
  "service.digestiveHealth.desc":
    "Gut-focused nutrition to ease discomfort, improve digestion, and identify food sensitivities.",
  "service.digestiveHealth.h1": "Elimination guidance",
  "service.digestiveHealth.h2": "Gut-friendly menus",
  "service.digestiveHealth.h3": "Symptom tracking",
  "service.pregnancyNutrition.title": "Pregnancy Nutrition",
  "service.pregnancyNutrition.desc":
    "Safe, nutrient-rich guidance to support you and your baby through every trimester.",
  "service.pregnancyNutrition.h1": "Trimester-based planning",
  "service.pregnancyNutrition.h2": "Micronutrient focus",
  "service.pregnancyNutrition.h3": "Safe-food guidance",
  "service.seniorNutrition.title": "Senior Nutrition",
  "service.seniorNutrition.desc":
    "Thoughtful nutrition care that supports strength, immunity, and quality of life in later years.",
  "service.seniorNutrition.h1": "Bone & muscle support",
  "service.seniorNutrition.h2": "Appetite-friendly menus",
  "service.seniorNutrition.h3": "Medication-aware planning",
  "service.oncologyNutrition.title": "Nutrition Support for Cancer Patients",
  "service.oncologyNutrition.desc":
    "Nutritional support during and after cancer treatment, working alongside your oncology team. The focus is practical: keeping your weight and strength up, and helping you keep eating when treatment makes that hard. This is supportive care that complements — never replaces — the treatment plan from your oncologist.",
  "service.oncologyNutrition.h1": "Weight & muscle maintenance",
  "service.oncologyNutrition.h2": "Appetite loss, nausea & taste changes",
  "service.oncologyNutrition.h3": "Eating through side effects",
  "service.oncologyNutrition.h4": "Coordinated with your oncology team",
  // --- services section furniture -----------------------------------
  "services.spotlightEyebrow": "Where Every Plan Starts",
  "services.bookThis": "Book this service",
  // --- global chrome ------------------------------------------------
  "a11y.skipToContent": "Skip to main content",
  "footer.rights": "© {year} {name}. All rights reserved.",
  "footer.disclaimerConsult":
    "Always consult a qualified healthcare provider before making changes to your diet, especially if you have an existing medical condition.",
  // --- compare slider labels ----------------------------------------
  "beforeAfter.before": "Before",
  "beforeAfter.after": "After",
  // --- how the programs work — six steps -----------------------------
  "howItWorks.step1.title": "Choose Your Program",
  "howItWorks.step1.desc":
    "Pick a Treatment program, and a tier based on how many consultations you need.",
  "howItWorks.step2.title": "Complete Secure Payment",
  "howItWorks.step2.desc":
    "A one-time payment, handled securely by Stripe — your card details never touch our servers.",
  "howItWorks.step3.title": "Activate Your Account",
  "howItWorks.step3.desc":
    "Once payment is confirmed, your account activates and you set your password.",
  "howItWorks.step4.title": "Access Your Consultation Credits",
  "howItWorks.step4.desc":
    "Your program's consultation credits are ready as soon as your account is active.",
  "howItWorks.step5.title": "Request an Online Consultation",
  "howItWorks.step5.desc":
    "Use a credit to request a session directly from your dashboard, whenever you need it.",
  "howItWorks.step6.title": "Meet Through Google Meet",
  "howItWorks.step6.desc": "Approved consultations happen over a secure Google Meet link.",
  // --- member experience preview (illustrative, signed-out only) -----
  "cta.explorePrograms": "Explore Programs",
  "memberPreview.eyebrow": "Member Experience",
  "memberPreview.title": "Your Program, All in One Place",
  "memberPreview.description":
    "Once you start a program, your dashboard keeps your consultation credits and upcoming sessions organized in a single, simple view.",
  "memberPreview.illustrative": "Illustrative Preview — Not Real Account Data",
  "memberPreview.samplePlan": "Treatment Plus Program",
  "memberPreview.credits": "Consultation Credits",
  "memberPreview.creditsSample": "2 of 3 Remaining",
  "memberPreview.next": "Next Consultation",
  "memberPreview.nextSample": "Request Anytime",
  "memberPreview.card1.title": "Your Program",
  "memberPreview.card1.detail": "Program type and consultation credits at a glance",
  "memberPreview.card2.title": "Consultation Credits",
  "memberPreview.card2.detail": "See how many credits you have left to use",
  "memberPreview.card3.title": "Upcoming Consultation",
  "memberPreview.card3.detail": "Your next confirmed Google Meet session",
  "memberPreview.card4.title": "Request Consultation",
  "memberPreview.card4.detail": "Use a credit to request a new session anytime",
  "memberPreview.card5.title": "Educational Resources",
  "memberPreview.card5.detail": "Articles and videos picked for your goals",
  // --- contact section and page -------------------------------------
  "contact.phoneLabel": "Phone",
  "contact.emailLabel": "Email",
  "contact.beingFinalized":
    "Direct contact details are being finalized. In the meantime, use the form or WhatsApp to reach us.",
  "contact.followUs": "Follow us",
  "contact.online": "Online consultations available worldwide",
  "contact.inPerson": "In-person location details are shared upon booking confirmation.",
  "contact.sentTitle": "Message sent",
  "contact.sentBody":
    "Thanks for reaching out — we've received your message and will get back to you soon.",
  "contact.errorTitle": "Something went wrong",
  "contact.errorBody": "{message} Nothing you entered has been sent — please try again.",
  "contact.emailReadyTitle": "Message ready to send",
  "contact.emailReadyBody":
    "Your email app should have opened with your message pre-filled. Hit send there, and we'll get back to you soon.",
  "contact.whatsappTitle": "Opening WhatsApp",
  "contact.whatsappBody":
    "We've opened WhatsApp with your message pre-filled — send it there and we'll reply as soon as we can.",
  "contact.unavailableTitle": "Online submission isn't connected yet",
  "contact.backToForm": "Back to form",
  "contact.fieldName": "Full name",
  "contact.fieldPhone": "Phone",
  "contact.fieldEmail": "Email",
  "contact.fieldMethod": "Preferred contact method",
  "contact.fieldSubject": "Subject (optional)",
  "contact.fieldMessage": "Message",
  "contact.namePlaceholder": "Jane Doe",
  "contact.subjectPlaceholder": "What's this about?",
  "contact.messagePlaceholder": "Tell us about your goals…",
  "contact.privacyNote":
    "Please avoid sharing detailed medical history here — a nutrition specialist will follow up to discuss specifics privately.",
  "contact.send": "Send Message",
  "contact.methodWhatsapp": "WhatsApp",
  "contact.methodEmail": "Email",
  "contact.methodEither": "Either",
  "contactPage.heading": "Get in Touch",
  // --- product page furniture ---------------------------------------
  "product.outOfStock": "Out of Stock",
  "product.currentlyOutOfStock": "Currently Out of Stock",
  "product.askAvailability": "Ask About Availability",
  "product.askAvailabilityAria": "Ask about availability for {name}",
  "product.viewDetails": "View Details",
  "product.related": "Related Products",
  "product.packagingNote":
    "Real product packaging supplied by {name}. Additional gallery angles will appear here once provided.",
  "product.disclaimer":
    "Product information is provided for general informational purposes only. Dietary supplements are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified healthcare professional before using a supplement, especially if you are pregnant, nursing, taking medication, managing a medical condition, or considering use for a child. Use health-monitoring devices according to their official instructions and seek professional medical advice when needed.",
  "productsPage.questionsTitle": "Have Questions About Any Product?",
  "productsPage.questionsBody":
    "Book a consultation with Dr. Monzer Allan to talk through what fits your routine, or reach out about a specific product directly.",
  "productsPreview.viewAll": "View All Products",
  "productsPreview.disclaimer":
    "Products shown here are wellness-support items and are not intended to diagnose, treat, cure, or prevent any disease.",
  "cta.bookConsultation": "Book a Consultation",
  "product.strength.glucosamineChondroitin": "1500 mg Glucosamine / 1200 mg Chondroitin",
  // --- packages, gallery, blog index and contact page ---------------
  "packages.mostPopular": "Most Popular",
  "packages.previousPrice": "Previous price:",
  "packages.currentPrice": "Current price:",
  "packages.oneTime": "one-time",
  "packages.dialogSummary": "{price} one-time · {consultations}",
  "packagesPage.creditsBody":
    "Each program includes a fixed number of consultation credits, granted once at purchase. Request a consultation from your account, and one credit is used per confirmed session.",
  "packagesPage.meetBody":
    "Approved consultations are conducted online over Google Meet. Once confirmed, your meeting link appears with the appointment in your account.",
  "packagesPage.noBillingTitle": "No Recurring Billing",
  "packagesPage.noBillingBody":
    "Every program is a single, one-time payment. There is nothing to cancel and nothing that renews automatically.",
  "packagesPage.faqTitle": "Program Questions",
  "packagesPage.viewAllFaqs": "View All FAQs",
  "packagesPage.notSureTitle": "Not Sure Which Program Fits?",
  "packagesPage.notSureBody":
    "Choose your program above, or reach out and we'll help you pick the right one.",
  "packages.legalNote":
    "Program credits do not expire on a monthly cycle like membership credits, but are tied to your account and are non-transferable. Treatment programs are educational and supportive in nature and are not a replacement for emergency care, medical diagnosis, or treatment from a licensed physician. Treatment programs include a maximum of 4 consultations.",
  "cta.contactUs": "Contact Us",
  "gallery.videoStoriesComingTitle": "Video Stories Coming Soon",
  "gallery.videoStoriesComingBody":
    "Featured video stories from the real channel will appear here.",
  "gallery.comingSoon": "Coming Soon",
  "gallery.watchOnYouTube": "Watch on YouTube",
  "gallery.watchMore": "Watch More in the Gallery",
  "gallery.description":
    "Photography and video from consultations, education, and community life. Every image and video here is real — before-and-after content is only ever published with a client's explicit consent.",
  "gallery.storiesEyebrow": "Visual Stories",
  "gallery.storiesTitle": "Photography From the Practice",
  "gallery.storiesDescription":
    "We're preparing approved photography for each of these categories. Nothing shown here is a placeholder photo — real images will appear once available.",
  "blogPage.eyebrow": "Blog",
  "blogPage.topicExplorer": "Topic Explorer",
  "blogPage.latestArticles": "Latest Articles",
  "contactPage.subheading": "Let's Talk",
  // --- last four -----------------------------------------------------
  "productsPage.eyebrow": "Products",
  "cta.requestConsultation": "Request Consultation",
  // --- home page sections -------------------------------------------
  "hero.eyebrowNutrition": "Nutrition",
  "hero.eyebrowHealth": "Health",
  "hero.eyebrowWellness": "Wellness",
  "hero.titleLead": "Healthier Choices Start With",
  "hero.titleAccent": "Better Knowledge.",
  "hero.lede":
    "Personalized nutrition programs and one-to-one online consultations from {name}, {title} — grounded in clinical expertise, delivered with real accountability.",
  "hero.secureVideo": "Secure Video Consultations",
  "hero.viewPackages": "View Packages",
  "hero.instagram": "Follow along on Instagram",
  "aboutPreview.eyebrow": "About Monzer",
  "aboutPreview.title": "Nutrition Guidance Rooted In Real Clinical Expertise",
  "aboutPreview.discover": "Discover My Story",
  "aboutPreview.figcaption":
    "Nutrition first, with a pharmacist's understanding of medicine behind it.",
  "aboutPreview.approachEyebrow": "The Approach",
  "aboutPreview.approachTitle": "Built around your life, not a template",
  "educationPreview.readBlog": "Read the Blog",
  "galleryTeaser.view": "View the Gallery",
  "programCta.title": "Ready to Start Your Personalized Nutrition Journey?",
  "programCta.body":
    "Choose a one-time Treatment program and get access to consultation credits and ongoing guidance from {name} — no recurring billing.",
  "beforeAfter.illustrationNote":
    "An illustration of a change in eating, photographed for this website. It is not a client photograph and does not show anyone's results.",
  // --- social community ---------------------------------------------
  "community.description":
    "Follow {name} for daily nutrition tips, behind-the-scenes updates, and educational content.",
  // --- article titles and excerpts (ALL FLAGGED) --------------------
  "article.sustainableWeightLoss.title": "Sustainable Weight Loss Without Crash Diets",
  "article.sustainableWeightLoss.excerpt":
    "Why extreme restriction backfires, and what a realistic weight-loss plan looks like in practice.",
  "article.type2Diabetes.title": "Eating Well With Type 2 Diabetes",
  "article.type2Diabetes.excerpt":
    "A practical look at managing blood sugar through food choices, meal timing, and carbohydrate balance.",
  "article.athleticPerformance.title": "Fueling Athletic Performance and Recovery",
  "article.athleticPerformance.excerpt":
    "How pre- and post-workout nutrition choices affect energy, endurance, and how quickly you bounce back.",
  "article.pregnancyTrimesters.title": "Nutrition Through Every Trimester of Pregnancy",
  "article.pregnancyTrimesters.excerpt":
    "What changes nutritionally from the first trimester to the third, and the nutrients worth paying closer attention to.",
  "article.digestiveComfort.title": "Understanding Food and Digestive Comfort",
  "article.digestiveComfort.excerpt":
    "How to approach bloating, discomfort, and food sensitivities without cutting out entire food groups unnecessarily.",
  "article.heartHealthy.title": "Heart-Healthy Eating for Cholesterol and Blood Pressure",
  "article.heartHealthy.excerpt":
    "The dietary patterns most consistently linked to better cardiovascular numbers, explained simply.",
  "article.howMuchProtein.title": "How Much Protein Do You Actually Need?",
  "article.howMuchProtein.excerpt":
    "Cutting through the noise around protein intake, timing, and sources for different goals.",
  // --- article page furniture ---------------------------------------
  "article.disclaimer":
    "This article is for general educational purposes only and is not a substitute for personalized medical or nutritional advice. Please consult a qualified healthcare provider before making changes to your diet.",
  "article.related": "Related Articles",
  "article.share": "Share:",
  // --- purchase dialog — the payment form --------------------------
  "purchase.fullName": "Full name",
  "purchase.email": "Email",
  "purchase.phone": "Phone number",
  "purchase.namePlaceholder": "Jane Doe",
  "purchase.emailPlaceholder": "jane@email.com",
  "purchase.phonePlaceholder": "+971 50 123 4567",
  "purchase.phoneReason": "So Dr. Monzer Allan can reach you about your program.",
  "purchase.submit": "Continue to Secure Payment",
  "purchase.submitting": "Redirecting to secure payment…",
  "purchase.stripeNote":
    "Payment is handled securely by Stripe. We never see or store your card details.",
  "purchase.unavailable":
    "Checkout isn't connected yet. Please check back soon, or contact us directly.",
  "purchase.viaWhatsapp": "Continue via WhatsApp",
  "purchase.close": "Close",
  "purchase.errName": "Please enter your full name.",
  "purchase.errEmail": "Please enter a valid email address.",
  "purchase.errPhoneChars": "Please enter a phone number we can reach you on.",
  "purchase.errPhoneLong": "That phone number looks too long.",
  // --- purchase dialog validation ----------------------------------
  "purchase.errPhoneChars2": "Use digits, spaces, and + ( ) - only.",
  "purchase.errPhoneDigits":
    "Please include the full number, with country code if you're outside the UAE.",
  // --- the doctor name with honorific ------------------------------
  "common.doctorNameFormal": "Dr. Monzer Allan",
  // --- the wordmark name -------------------------------------------
  "common.doctorName": "Monzer Allan",
  // --- articles are English only (ALL FLAGGED) ---------------------------
  "blog.englishOnly":
    "The articles are written by Dr. Monzer Allan and are available in English only.",
} as const satisfies Record<string, Entry>;

/** Every key that exists. Arabic is checked against this, and so is `t()`. */
export type TranslationKey = keyof typeof en;

/**
 * Only the keys whose entry is a plain string.
 *
 * Needed because `t()` requires a `count` for plural keys, and that requirement
 * is decided per key. Hand it a VARIABLE of the full union — a nav item's
 * `labelKey`, say — and the conditional type has to assume the value might be
 * a plural key, so it demands `count` for something that will never need one.
 *
 * Data structures that carry a key should use this type, which says at the
 * type level "this slot never holds a plural key".
 */
export type SimpleTranslationKey = {
  [K in TranslationKey]: (typeof en)[K] extends string ? K : never;
}[TranslationKey];
