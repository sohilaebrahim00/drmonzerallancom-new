# مراجعة كاملة للكود — Dr. Monzer Allan
**التاريخ:** 22 أغسطس 2026 · **آخر كوميت مراجَع:** `a5e386a` Fix Gemini AI assistant integration

> كل بند هنا **متحقَّق منه** بقراءة الكود المصدري مباشرة، مش استنتاج.
> `tsc` و `eslint` و `build` **لم تُشغَّل** (الـ npm registry محجوب في بيئة المراجعة) —
> بديلها: فحص شامل لكل الـ imports المحلية في 279 ملف TS، وكلها تُحَلّ صحيحًا.
> لازم تشغّلي `npm run typecheck && npm run lint && npm run build:web && npm run build:app` محليًا قبل أي نشر.

---

## الترتيب المقترح للتنفيذ

1. **P0-أمان** — تسريب بيانات مرضى فعلي + endpoints مفتوحة للإساءة. تتصلح قبل أي مستخدم حقيقي.
2. **P0-دفع** — الدفع هيتكسر في أول عملية شراء حقيقية. تتصلح قبل ما تشغّلي Stripe live.
3. **P1-تطبيق** — التطبيق بيعرض حاجات غلط للعميل اللي دفع فعلاً.
4. **P2** — SEO، كاش، تلميع.

---

# P0 — أمان (٨ بنود)

### A1. `doctor_patient_activity_summary` بتتخطى الـ RLS ومتاحة لكل مستخدم مسجّل 🔴
**المكان:** `supabase/PHASE_H_DAILY_NUTRITION_COMPANION_MIGRATION.sql:349-367`
الـ view اتعملت **من غير** `security_invoker = true`، وبعدها `grant select ... to authenticated`.
في Postgres، الـ view العادية بتقرأ بصلاحيات **مالكها** (`postgres`) — يعني الـ RLS على `meal_logs` / `weight_logs` / `messages` / `doctor_patient_relationships` **مش بتتطبق أصلاً**. التعليق المكتوب فوقها في الملف (سطر 361-366) بيدّعي العكس.
وكمان `src/services/doctorService.ts:152-154` بتعمل `select` من غير أي فلتر على `doctor_id`.

**السيناريو:** أي مستخدم عادي بياخد الـ anon key من الـ JS bundle (موجود في أي بيلد) ويعمل
`GET /rest/v1/doctor_patient_activity_summary?select=*` بالتوكن بتاعه → بيرجعله **كل** علاقات الدكتور بمرضاه + آخر وجبة/وزن/رسالة لكل مريض.

**الإصلاح:**
```sql
create or replace view public.doctor_patient_activity_summary
  with (security_invoker = true) as
select ...;
```
وكمان ضيفي `.eq("doctor_id", me)` في `getPatientsNeedingReview`.

---

### A2. الشخص المحظور يقدر يلغي الحظر عن نفسه 🔴
**المكان:** `supabase/PHASE_G_SOCIAL_NUTRITION_MIGRATION.sql:420-441`
```sql
delete from public.friendships where pair_key = v_pair;   -- بدون أي شرط على blocked_by
```
الدالة `security definer`، فأي طرف يقدر يمسح صف الحظر بتاع الطرف التاني ويحطّ مكانه صف حظر منه هو — وبعدين يعمل `unblock_user` (اللي بيتحقق من `blocked_by = auth.uid()` فبينجح).

**السيناريو:** A بيحظر B. B (اللي مش المفروض يشوف الصف أصلاً) يفتح بروفايل A ويضغط Block → بعدين Unblock. الحظر اتمسح. B رجع يظهر في نتايج بحث A ويقدر يبعت طلب صداقة تاني، وقايمة المحظورين عند A فضيت من غير أي إشعار.

**الإصلاح:** خلّي `block_user` تعمل upsert على الصف الموجود بدل الحذف، أو امنعي الحذف لو `status='blocked' and blocked_by <> auth.uid()`.

---

### A3. `contact-submit` قابلة للاستخدام كأداة قصف بريدي 🔴
**المكان:** `supabase/functions/contact-submit/index.ts:86-88`
```ts
const rateKey = email.toLowerCase();   // القيمة جاية من body الطلب
```
الـ rate limit مبني على إيميل **المُرسِل نفسه بيحدده**، وبعد ما يعدّي بتتبعت رسالة "شكرًا لتواصلك" **للإيميل ده** من الدومين الموثّق بتاعكم (سطر 134).

**السيناريو:** سكربت يبعت الفورم بـ `victim+1@…` و `victim+2@…` … كل طلب يعدّي الـ limit، ويتبعت إيميل لضحية عشوائية من دومين الدكتور → سمعة الإرسال (deliverability) تتدمر وممكن الدومين يتبلوك.

**الإصلاح:** الـ rate limit على IP الحقيقي (`cf-connecting-ip` أو أول عنصر موثوق في `x-forwarded-for`) + CAPTCHA، ومتبعتيش تأكيد قبل ما يكون فيه تحقق من الإيميل.

---

### A4. الـ rate limit على `ai-chat` و `food-search` قابل للتخطي بهيدر 🔴
**المكان:** `supabase/functions/ai-chat/index.ts:332` و `food-search/index.ts:30`
```ts
const rateLimitKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
```
الهيدر ده بيتحكم فيه العميل. كل طلب بقيمة عشوائية = دلو جديد = مفيش حد أقصى.

**السيناريو:** `curl -H 'X-Forwarded-For: <random>' .../ai-chat` في لوب → مكالمات Gemini غير محدودة على مفتاح الدكتور. وكمان `_shared/rateLimit.ts` مش بيمسح المفاتيح القديمة، فالـ Map بتكبر بلا حدود.

**الإصلاح:** مفتاح موثوق من المنصة، وللمجهولين اعتمدي على IP حقيقي + سقف عام للدالة نفسها.

---

### A5. `siteUrl` جاي من العميل وبيتحط كـ `success_url` في Stripe 🔴
**المكان:** `create-checkout-session/index.ts:83,127-128` و `create-consultation-checkout-session/index.ts:138,196-197`
الدالتين مفتوحتين (مفيش auth، مفيش rate limit، CORS `*`).

**السيناريو:** أي حد يبعت `{"siteUrl":"https://evil.example", ...}` → Stripe بينشئ جلسة دفع **حقيقية على حساب العيادة** والريدايركت بعد الدفع بيروح لموقع المهاجم ومعاه `session_id`. الضحية دفعت على صفحة Stripe أصلية باسم الدكتور.

**الإصلاح:** استخدمي الـ secret الموجود أصلاً `SITE_URL` (زي ما `contact-submit/index.ts:27` بيعمل) وتجاهلي القيمة الجاية من العميل تمامًا.

---

### A6. `Access-Control-Allow-Origin: *` على كل الدوال
**المكان:** `supabase/functions/_shared/cors.ts:2` — بتستخدمها كل الدوال بما فيها `delete-account` و `admin-availability`.
أي موقع تاني يقدر ينده الشات بتاعكم من المتصفح ويعرض الردود = شات بوت مجاني على حساب الدكتور. ومفيش أي فحص origin يسند البنود A3-A5.
**الإصلاح:** allowlist للأصول (`monzerallan.com`, `app.monzerallan.com`, `capacitor://localhost`).

---

### A7. جدول `profiles` مقروء بالكامل لأي مستخدم مسجّل
**المكان:** `PHASE_G_...sql:253-256` — `using (deleted_at is null)` على كل الأعمدة وكل الصفوف.
ده بيلغي فايدة فلتر الحظر في `search_users` (سطر 503-521)، وبيكشف عمود `is_admin` — يعني أي حد يعرف بالظبط أنهي حساب هو الأدمن.
**الإصلاح:** قصري الـ policy على الأعمدة العامة عن طريق view، أو خلّي كل البحث/العرض يمرّ من RPCs.

---

### A8. حقن HTML في إيميل الإشعار للأدمن + حقن تعليمات في الـ AI
- `supabase/functions/_shared/email.ts:99,151` — `mailto:${input.email}` بيتحط **من غير** `escapeHtml` بينما باقي الحقول بتتفلتر. والتحقق الوحيد من الإيميل هو `includes("@")` (`contact-submit:79`) → ممكن حقن لينك تصيّد جوّه إيميل الدكتور نفسه.
- `supabase/functions/ai-chat/index.ts:364,403` — `currentPath` (٢٠٠ حرف من العميل) بيتحط في **الـ system instruction** بعد الأسوار اللي بتقول "عامل ده كبيانات". يعني ممكن حقن توجيه جديد للموديل.

---

# P0 — الدفع (٨ بنود، كلها هتظهر أول عملية شراء)

### B1. الـ `onConflict` مش هيلاقي الفهرس → المشتري يدفع ومياخدش حاجة 🔴
**المكان:** `stripe-webhook/index.ts:294` + `PHASE_I_...sql:64-66`
الويبهوك بيعمل `upsert(..., { onConflict: "stripe_checkout_session_id" })`، لكن الميجريشن بتعمل فهرس **جزئي**:
```sql
create unique index ... on public.subscriptions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
```
PostgREST بيبعت `ON CONFLICT (col)` من غير الـ predicate، و Postgres مش بيقدر يطابقه بفهرس جزئي → خطأ `42P10`.

**السيناريو:** بعد ما تشغّلي الميجريشن وتنشري الدوال، عميل يدفع $159 → الـ upsert يفشل → الكود يعمل `return` في سطر 296 → `payments` تفضل `pending`، مفيش `subscriptions`، مفيش credits، مفيش إيميل — **والويبهوك يرجّع 200** فـ Stripe مش هتعيد المحاولة. العميل اتخصم منه ومخدش حاجة.

**الإصلاح:** شيلي الـ `where` من الفهرس (أو حطي constraint كامل)، أو استبدلي الـ upsert بـ select-then-insert/update.

---

### B2. مفيش فهرس فريد على `stripe_subscription_id` أصلاً 🔴
**المكان:** `stripe-webhook/index.ts:198` + `supabase/schema.sql:65`
العمود معرّف كـ `text` عادي، ومفيش `unique` عليه في أي ملف SQL. نفس خطأ `42P10` بس على مسار الاشتراكات الشهرية — يعني أي حدث `customer.subscription.*` (بما فيه التجديد الشهري للأعضاء الحاليين) بيفشل بصمت.

---

### B3. اسم متغير خاطئ في دالتين → عميل Supabase بمفتاح فاضي 🔴
**المكان:** `stripe-webhook/index.ts:43` و `create-consultation-checkout-session/index.ts:39`
```ts
Deno.env.get("SERVICE_ROLE_KEY")   // ← الاسم الصح: SUPABASE_SERVICE_ROLE_KEY
```
باقي الـ ٨ دوال كلها بتستخدم `SUPABASE_SERVICE_ROLE_KEY` (اللي المنصة بتحقنه أوتوماتيك)، والـ `.env.example:29` و `STRIPE_SETUP.md` بيوثّقوا الاسم الصح كمان.

**النتيجة:** الدالتين دول بيبنوا العميل بمفتاح `""` → كل عملية كتابة على قاعدة البيانات ترجع 401 → المشتري يشوف "Could not start checkout. Please try again." لكل الـ 6 باقات.

---

### B4. الويبهوك هيترفض بـ 401 قبل ما يشتغل 🔴
مفيش `supabase/config.toml` في المشروع، والأمر الموثّق في `STRIPE_SETUP.md:281` هو `supabase functions deploy stripe-webhook` من غير `--no-verify-jwt`. Supabase بتطلب JWT افتراضيًا، و Stripe مش بتبعت واحد.
**الإصلاح:** انشري بـ `--no-verify-jwt`، أو اعملي `supabase/config.toml`:
```toml
[functions.stripe-webhook]
verify_jwt = false
```

---

### B5. البحث عن المستخدم بالإيميل حسّاس لحالة الأحرف 🔴
**المكان:** `supabase/schema.sql:385` — `select id from auth.users where email = p_email`
GoTrue بيخزّن الإيميل بحروف صغيرة دايمًا. لو المشتري كتب `Jane@Example.com`:
البحث يفشل → `inviteUserByEmail` يفشل (الإيميل موجود) → البحث التاني يفشل بنفس الطريقة → `findOrInviteUser` ترجع `null` → الويبهوك يعمل `return`. **الدفع تم ومفيش أي أثر.**
**الإصلاح:** `where lower(email) = lower(p_email)` + نورمالة الإيميل في الويبهوك.

---

### B6. منح الرصيد قبل تأكيد الدفع، ومفيش تعامل مع الاسترداد
- `stripe-webhook/index.ts:407` — بيمنح credits على `checkout.session.completed` من غير ما يتأكد `session.payment_status === "paid"`. أي وسيلة دفع مؤجلة (ACH / SEPA / Klarna — Stripe بتفعّلها افتراضيًا في الـ dynamic payment methods) هتمنح الرصيد قبل ما الفلوس توصل، ومفيش handler لـ `async_payment_failed`.
- مفيش handler لـ `charge.refunded` ولا `charge.dispute.created`. قيمة `'refunded'` معرّفة في الـ enum (`PHASE_I:80`) ومحدش بيكتبها. يعني بعد ما الدكتور يعمل استرداد، العميل يفضل يحجز استشاراته مجانًا.

---

### B7. إيميلات مكررة عند كل تجديد
**المكان:** `stripe-webhook/index.ts:212-216` — بيعدّ الصفوف **بعد** الـ upsert، فالنتيجة دايمًا 1 و `isFirstActivation` دايمًا `true`. العميل بياخد "Welcome" ٣ مرات في أول اشتراك، والدكتور بياخد ٣ تنبيهات — وبيتكرر كل شهر.

---

### B8. الشراء التاني بيجمّد رصيد الشراء الأول
**المكان:** `supabase/schema.sql:166-172` — `book_consultation_slot` بتختار صف اشتراك واحد `order by current_period_start desc limit 1`. لكن كل شراء مرة واحدة بيعمل **صف جديد**.
**السيناريو:** عميل يشتري Diet Premium (٣ credits)، يستخدم واحدة، بعدين يشتري Treatment Basic (١ credit). النظام يشوف الصف الأحدث بس → يقدر يحجز حجز واحد، والـ ٢ الباقيين ضاعوا للأبد. و `getMySubscription` والـ view `my_active_subscription` بنفس الـ `limit 1` فالواجهة بتقول "1 of 1".

---

# P1 — التطبيق (١١ بند)

### C1. انقسام في نموذج الباقات: التطبيق يعرف السلجات القديمة، الموقع يعرف الجديدة 🔴
**التطبيق** (`NativeConsultations.tsx:103`, `NativeAccount.tsx:113`, `NativeBookConsultation.tsx:94`) بيدوّر في `src/data/packages.ts` — فيها `basic|premium|vip-elite` بس.
**الموقع** (`AccountPage.tsx:82`, `AccountConsultationsPage.tsx:92`) بيدوّر بـ `getProgramPackageBySlug` — فيها الـ 6 الجداد بس.
و `membershipService.ts:13` لسه معرّف النوع على السلجات القديمة.

**النتيجة:** عميل اشترى `diet_plus` يفتح التطبيق → "No active membership — Choose a plan"، وزر الحجز مش بيظهر خالص. وعضو `vip-elite` قديم يفتح `/account` على الموقع → يشوف "No active program". **كل صفحة بتكذّب التانية.**

**الإصلاح:** كتالوج موحّد واحد يعرف الـ 9 سلجات، ويكون هو المصدر الوحيد للاتنين.

---

### C2. مفيش أي مسار شراء جوّه التطبيق
`ProgramPackages` مش مستوردة في `src/app-native/` نهائيًا. كل أزرار "View Memberships" / "Upgrade" بتروح `/join`، و `NativeFreeSignUp.tsx:88` بيعمل `<Navigate to="/" replace/>` لأي مستخدم مسجّل. و `DeepLinkHandler.tsx:68` بيحوّل `/packages` لـ `/consultations`.
**النتيجة:** مستخدم رصيده خلص يضغط "Upgrade" → يترمي على الصفحة الرئيسية من غير أي رسالة. مفيش طريقة يشتري من التطبيق.
> ملاحظة: لو التطبيق هيدخل App Store، بيع المحتوى الرقمي جوّه التطبيق له قواعد خاصة — يستحسن نقرر ده بدري.

---

### C3. تبويبَي "Program" و "Scan" بيوقّعوا شريط التنقل السفلي
`NativeMyProgram.tsx` و `NativeFoodScanner.tsx` بيمرّروا `back` من غير `tabBar` لـ `AppScreen`، والعكس: `NativeProgress` / `NativeProducts` / `NativeHealth` / `NativeConsultations` بيمرّروا `tabBar` وهُمّ مش تبويبات.
**النتيجة:** تضغطي "Program" → الشريط يختفي ويتحول لسهم رجوع، ومش تقدري توصلي Social أو Account من غير Back. والعكس: توصلي Progress من Account فمفيش زر رجوع.

---

### C4. طلب الاتصال بالدكتور مرة واحدة بس — في الأونبوردنج
`requestDoctorConnection` مستدعاة في مكان واحد: `ConnectDoctorStep.tsx:19`. وبعد كده ٣ شاشات بتقول للمستخدم يعمل كده: `NativeHome.tsx:264` → `/account`، `NativeMyProgram.tsx:132`، و `NativeAccount.tsx:183` → `/account/help` (صفحة دعم عامة).
**النتيجة:** مستخدم ضغط "Not Now" في الأونبوردنج مش هيقدر يتصل بالدكتور أبدًا → ميزة البرنامج مقفولة عليه للأبد.

---

### C5. ثلاث شاشات غير قابلة للوصول في التطبيق
مفيش أي حاجة بتنقل لـ `/health` (`AppExperience.tsx:141`)، و `NativeHealth` هي المدخل الوحيد لـ `/videos` و `/products` و `/blog`.
**النتيجة:** Watch & Learn والمنتجات وفهرس المدونة مش موجودين عمليًا في التطبيق.

---

### C6. الدكتور بيتحط في أونبوردنج المريض
`AppExperience.tsx:125` بيفحص `onboardingComplete` بس، من غير `role`. و `getPracticeDoctor()` بترجع أول حساب دوره doctor/admin — اللي هو الدكتور نفسه.
**النتيجة:** د. منذر يسجّل دخول من جهاز جديد → يتطلب منه يختار username ويدخل وزنه وطوله وهدفه، وفي الآخر زرار "Connect" بيبعت طلب اتصال **من حسابه لحسابه**.

---

### C7. استعلامات "بياناتي أنا" من غير فلتر `user_id`
`bodyProfileService.ts:37,95` · `weightService.ts:17` · `hydrationService.ts:34` · `checkinService.ts:32` · `activityService.ts:69,151` · `progressPhotoService.ts:32` · `NativeProgress.tsx:96`
كلها بتعتمد على الـ RLS، لكن الـ RLS متعمّد يكون أوسع من "صفوفي أنا" (الدكتور يشوف مرضاه، الأصدقاء يشوفوا الخطوات المشتركة).
**النتيجة:** شاشة "ملفي الصحي" عند الدكتور بتعرض بيانات مريض (وزن، طول، **أدوية**) على إنها بتاعته. ولو عنده مريضين، `.maybeSingle()` بترجع خطأ PGRST116 والشاشة تفضل فاضية للأبد. وعند مستخدم عادي، متوسط خطواته بيتحسب مع خطوات صحابه.

---

### C8. رسايل الشات مش بتظهر
مفيش `alter publication supabase_realtime add table public.messages;` في أي ملف SQL، و`NativeMessageThread.tsx:34-38` بيضيف الرسايل **فقط** من حدث الـ realtime (مفيش optimistic append).
**النتيجة:** تبعتي رسالة → الصف بيتحفظ فعلاً، بس **مش بتظهر عندك ولا عند الطرف التاني** إلا لما تخرجي من الشاشة وترجعي.

---

### C9. زرار "Change" في المهمة الرياضية مش بيتحفظ
`NativeActivityTask.tsx:231-236` بيغيّر `task.activity` في الـ state بس، و`completeActivityTask` بتقرأ `activity_id` من الداتابيز تاني.
**النتيجة:** المستخدم يشوف "Wall Sit — 40 kcal"، يعملها، يضغط Done → يتسجّل "20-Minute Walk" بسعراته. النشاط والسعرات الاتنين غلط.

---

### C10. سكانر الأكل بيرمي النتيجة لغير المسجّلين
`NativeFoodResult.tsx:320,375` — كل أزرار الحفظ متوقفة على وجود `user`، من غير أي فرع للزائر ولا دعوة لتسجيل الدخول. و`/food-scanner` مسار مفتوح.
**النتيجة:** زائر يصوّر وجبة، يستنى تحليل Gemini، وفي الآخر مفيش زرار حفظ ولا تفسير ليه.

---

### C11. أعطال React صغيرة مؤكدة
- `NativeSocial.tsx:87-97` و `NativeFoodSearch.tsx:40-56` — `setSearching(true)` قبل الـ debounce، والـ early return لما النص أقصر من الحد الأدنى مش بيرجّعها `false` → **spinner بيلف للأبد**.
- `NativeBackHandler.tsx:7` — `ROOT_TAB_PATHS` لسه التبويبات القديمة (`/health`, `/ai`, `/consultations`) مش الحالية → زرار الرجوع في أندرويد بيتصرف غلط.
- `AppBootContext.tsx:101-109` — `setProfile(prev => prev ? … : prev)`؛ لو `getFullProfile` رجّعت `null` (بتفشل بصمت عند أي خطأ) الحالة مش هتتغير أبدًا → **لوب لا نهائي في الأونبوردنج**.

---

# P2 — بنية ونشر و SEO

### D1. الـ service worker بيتكاش سنة كاملة
`scripts/write-app-htaccess.cjs:44-56` بتكتب `no-cache` لـ `sw.js`، وبعدين سطر 74-76 بيكتب `Header set Cache-Control "public, max-age=31536000, immutable"` على `\.(css|js|…)$` — واللي بعدين بيغلب.
**النتيجة:** أي تحديث للتطبيق ممكن يفضل مختفي ورا service worker متكاش على الـ CDN، وبانر "Update Available" ميظهرش.
**الإصلاح:** استثني `sw.js` من الـ FilesMatch الأخير، أو انقلي بلوك الـ no-cache تحته.

### D2. كل صفحة بتشارَك بتبان كأنها الصفحة الرئيسية
`index.html:17` فيه `<link rel="canonical" href="https://monzerallan.com/">` ثابت، وكل الميتا الحقيقية بتتكتب في `useEffect` بعد الهيدريشن (`Seo.tsx:55`). واتساب/فيسبوك/لينكدإن/سلاك مش بينفّذوا JS.
**النتيجة:** أي مقالة أو منتج تتشارك بتبان بعنوان وصورة الصفحة الرئيسية، وكل الروابط بتعلن نفسها canonical للرئيسية. محتاجة prerender أو SSG في `netlify.toml`.

### D3. روابط في الموقع
- `Hero.tsx:68` — أهم CTA في الموقع بيروح `/booking` اللي بقى redirect قديم لـ `/packages`. باقي الأزرار كلها بتروح `/packages` مباشرة.
- `Footer.tsx:82` — الست روابط تحت "Popular Services" كلهم بيروحوا `/#services`.

### D4. إدخال مباشر مفتوح على جدولين
`schema.sql:346-348` و `:370-372` — `membership_leads` و `contact_inquiries` عندهم `with check (true)` للإدخال بدون تسجيل. الواجهة بتستخدم الـ Edge Functions، فالمسار المباشر ده موجود للمهاجم بس (وبيتخطى أي rate limit).

### D5. `_shared/rateLimit.ts` بيسرّب ذاكرة
الـ `Map` مش بيتنضّف أبدًا — كل مفتاح جديد بيفضل مخزّن طول عمر الـ isolate.

### D6. فيكسترز الديمو برّه آلية الاستبدال
`src/services/privacyService.ts:14` فيه `DEMO_PRIVACY_SETTINGS`، وهو مش تحت `src/dev/` فمش داخل قايمة الـ prod-stub aliases في `vite.config.ts:108-131`. و`DemoModeBanner.tsx` بيتستورد بدون شرط في `AppExperience.tsx:14`. السلوك وقت التشغيل آمن (الـ stub بيخلي `getDemoMode()` تساوي false) لكن ضمانة "grep الـ dist" المكتوبة في الملف مش صحيحة فعليًا.

### D7. باقي من التقارير السابقة
- `NativeBilling.tsx` — placeholder، مفيش Stripe billing portal.
- واجهة الماكروز — الخدمة جاهزة، الـ UI ناقص.
- HealthKit / Health Connect — مش متعملين.
- شنكات كبيرة (`index-*.js` ~550 kB) — محتاجة code-splitting على مستوى المسارات.
- `cancel_my_consultation` (`schema.sql:300`) بتلغي الحجز من غير ما ترجّع الـ credit ولا تحدّث `credit_status`.
- إيميل الترحيب بيقول "N consultation credits **per month**" ودي مش صحيحة لباقات المرة الواحدة.
- `PHASE_I_...sql:80,124` بيستخدموا `create type` / `create policy` بدون حماية → الملف بيفشل لو اتشغّل مرتين.

---

## اللي اتفحص وطلع سليم

- **مفيش أي سر بيوصل للمتصفح.** كل الـ `VITE_*` في الكود عبارة عن معرّفات عامة (Supabase URL + publishable keys, WhatsApp, booking links). `.env.local` مغطّى بـ `.gitignore`.
- **الأسعار مش موثوقة من العميل** — الدالتين بيحوّلوا الـ slug لسعر من جهة السيرفر.
- **التحقق من توقيع Stripe صحيح** (`stripe-webhook:386-398`) — التوقيع الناقص والفاشل الاتنين بيرجّعوا 400 قبل أي معالجة، والـ raw body مستخدم صح.
- كل الجداول والـ RPCs اللي الواجهة بتناديها موجودة فعلاً في ملفات الـ SQL، وأسماء البارامترات كلها مطابقة.
- كاش الـ PWA مش بيكاش أي رد من `*.supabase.co` أو `/functions/`.
- مسارات الـ AI actions فيها allowlist من جهة السيرفر، فمفيش `javascript:` ممكن يوصل لـ `<Link to>`.
- كل الـ imports المحلية في 279 ملف بتتحلّ صح.

---

## نقطة تنفيذية مهمة

`.env.local` فيه مفتاح Stripe **live** (`pk_live_`). يُفضّل تشتغلي على مفاتيح **test** لحد ما بنود B1–B6 كلها تتصلح وتعملي عملية شراء تجريبية كاملة من الأول للآخر.
