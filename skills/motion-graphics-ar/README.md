# مهارات الموشن العربية لـ Claude

حزمة أصلية من **13 مهارة**: مهارة رئيسية لاختيار الاستايل و12 مهارة فئات اختيارية، تتشارك **120 فكرة أصلية** و**14 اتجاهًا بصريًا**. ابدأ بـ[motion-style-director](motion-style-director/SKILL.md)؛ تكفي وحدها للوصول إلى المكتبة كاملة.

## التثبيت

### Claude Code
انسخ مجلد المهارة كاملًا مع `references/` إلى `~/.claude/skills/` للاستخدام الشخصي، أو `.claude/skills/` داخل مشروع واحد. مثلًا:
`~/.claude/skills/motion-style-director/SKILL.md`

استدعِ `/motion-style-director` أو اطلب استخدام المهارة بالاسم. لا تنسخ `SKILL.md` وحده، ولا تستبدل نسخة معدّلة لديك دون حفظها.

### واجهة Skills في Claude
حمّل مجلد المهارة كاملًا، ثم أنشئ ZIP يحتوي مجلدًا واحدًا باسمها وفيه `SKILL.md` ومجلد `references/`. ارفعه من واجهة إنشاء/رفع Skill في Claude وفعّله. لا ترفع مجلد الحزمة الذي يضم المهارات الـ13 كأنه مهارة واحدة. مجرد إرفاق الملفات في المحادثة لا يثبتها كمهارة دائمة. التوفر والصلاحيات تتبع الحساب والمؤسسة؛ راجع [تعليمات Claude الرسمية](https://support.claude.com/en/articles/12512180-use-skills-in-claude).

## جرّب هذا الطلب

«استخدم motion-style-director. إعلان عطر 12 ثانية عمودي، عندي صور العبوة والشعار، على After Effects. رشّح لي استايلات وانتظر اختياري».

تعرض المهارة 3–5 خيارات، ثم تنتظر اختيارك قبل التخطيط. لو حدّدت استايلًا صراحةً في الطلب الأول، تتابع دون إعادة السؤال. رمز الفكرة MG لا يعادل اختيار الاستايل S.

## المهارات

| المهارة | الفئة | الأفكار |
|---|---|---|
| [motion-style-director](motion-style-director/SKILL.md) | بوابة الاستايل والمكتبة الكاملة | MG-001–MG-120 |
| [motion-transitions](motion-transitions/SKILL.md) | انتقالات | MG-001–MG-010 |
| [motion-typography](motion-typography/SKILL.md) | نصوص متحركة | MG-011–MG-020 |
| [motion-brand-identity](motion-brand-identity/SKILL.md) | شعارات وهوية | MG-021–MG-030 |
| [motion-product-ads](motion-product-ads/SKILL.md) | إعلانات منتجات | MG-031–MG-040 |
| [motion-data-infographics](motion-data-infographics/SKILL.md) | بيانات وإنفوغرافيك | MG-041–MG-050 |
| [motion-tracking-compositing](motion-tracking-compositing/SKILL.md) | تتبع وتركيب | MG-051–MG-060 |
| [motion-social-clips](motion-social-clips/SKILL.md) | مقاطع اجتماعية | MG-061–MG-070 |
| [motion-cinematic-titles](motion-cinematic-titles/SKILL.md) | افتتاحيات سينمائية | MG-071–MG-080 |
| [motion-explainers](motion-explainers/SKILL.md) | شرح وتعليم | MG-081–MG-090 |
| [motion-music-sports](motion-music-sports/SKILL.md) | موسيقى ورياضة | MG-091–MG-100 |
| [motion-collage-textures](motion-collage-textures/SKILL.md) | كولاج وخامات | MG-101–MG-110 |
| [motion-loops-backgrounds](motion-loops-backgrounds/SKILL.md) | حلقات وخلفيات | MG-111–MG-120 |

المهارات المتخصصة تكرر فئات المكتبة لسهولة الاستدعاء، ولا تمثل أفكارًا إضافية. [CSV الأصلي](motion-style-director/references/original-120-ideas.csv) و[الأوامر الأصلية](motion-style-director/references/original-120-prompts.txt) محفوظان دون تغيير.

## الحدود والتحقق

هذه تعليمات ومراجع نصية فقط، بلا برامج تنفيذ أو مفاتيح API أو فيديوهات أو قوالب مونتاج جاهزة. بعض الأفكار تحتاج أصولًا وتتبعًا أو عزلًا يدويًا. لا تمنح المهارات تراخيص برامج أو إضافات مدفوعة.

جرى فحص البنية وYAML والمراجع والتغطية محليًا. لم يُنفذ اختبار داخل Claude أو عملية رندر؛ أمثلة الحوار توضح السلوك المتوقع فقط. هذا المجلد إضافة مستقلة ولا يعدّل مهارات المرآة أو فهارسها السابقة.

المصدر وملاحظات الحقوق في [SOURCE.md](SOURCE.md). تاريخ إعداد الحزمة: 2026-10-03.
