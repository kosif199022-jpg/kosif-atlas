# KOSIF Atlas — مكتبة المهارات

**بالعربية** · [English below](#english)

مرآة أونلاين للمهارات (Skills) الخارجية التي تعتمد عليها أداة **KOSIF Omni**. كل مهارة في مجلد مستقل **كاملاً بكل ملفاتها**:
SKILL.md، والمراجع، والسكربتات، والقوالب، والصور، والبيانات. وكلها مأخوذة من إضافات Claude وChatGPT منشورة بتراخيص تسمح
بإعادة التوزيع (MIT وApache-2.0 وBSD وغيرها).

## البنية
```
skills/<رقم>-<الإضافة>/SOURCE.md      مصدر الإضافة، والـ commit، والترخيص، ونتيجة فحص KOSIF الأمني
skills/<رقم>-<الإضافة>/LICENSE        نص الترخيص الأصلي (إن وُجد في الإضافة)
skills/<رقم>-<الإضافة>/<رقم>-<المهارة>/   المهارة كاملة كما هي في المصدر
index.json · index.csv                  فهرس كل المهارات: الاسم، والوصف، والترخيص، والمسار، وعلامات الخطر
NOTICES.md                              قائمة كل الإضافات بتراخيصها ومصادرها
EXCLUDED.md                             ملفات لم تُنشر (اشتباه بوجود مفتاح سري، أو مسار طويل جداً)

skills/x<رقم>-<الإضافة>/                إضافات بتراخيص "الحقوق المتروكة" (GPL وAGPL وMPL وCC-BY-SA...) مع نص ترخيصها
index-copyleft.json · index-copyleft.csv · EXCLUDED-copyleft.md   فهرسها وملفاتها المستبعدة
```

**تراخيص الحقوق المتروكة (المجلدات التي تبدأ بـ `x`):** يُسمح بإعادة نشرها، لكن أي عمل مشتق منها يجب أن يُنشر بالترخيص
نفسه (مثل GPL). لذلك لا تُدمج في KOSIF Omni نفسها، وهي هنا للقراءة والرجوع فقط.

## الاستخدام
- **من KOSIF Omni:** نتائج `kosif_atlas_search` و`kosif_atlas_read` تحمل رابطاً مباشراً (`online_url`) للمهارة هنا.
- **يدوياً:** ابحث في `index.csv` (يفتح في Excel) أو بالبحث داخل GitHub، ثم افتح مجلد المهارة.
- **برمجياً:** `https://raw.githubusercontent.com/kosif199022-jpg/kosif-atlas/main/index.json`

## تنبيهات
- هذا محتوى طرف ثالث **لم يُراجع سطراً بسطر**. اقرأه كمرجع، و**لا تشغّل أي سكربت** قبل مراجعته.
  نتيجة الفحص الأمني الآلي لكل إضافة مذكورة في `SOURCE.md`.
- الحقوق محفوظة لأصحابها الأصليين بموجب تراخيصهم. هذه مرآة غير رسمية للرجوع إليها.
- لم تُنشر الإضافات ذات التراخيص المقيّدة (غير التجارية أو المملوكة) أو غير المحددة، ولا الإضافات التي رفضها الفحص الأمني.

---

## English

An online mirror of the third-party skills used by **KOSIF Omni**'s Atlas. Each skill is a complete folder (SKILL.md,
references, scripts, templates, images, data), taken from Claude/ChatGPT plugins whose licenses permit redistribution
(MIT, Apache-2.0, BSD, ...).

- `index.json` / `index.csv`: every skill with its plugin, description, license, path, risk flags and the KOSIF
  inspection verdict.
- `skills/<pid>-<plugin>/SOURCE.md` + `LICENSE`: upstream source, commit and license text.
- `NOTICES.md` lists all plugins. `EXCLUDED.md` lists files withheld (likely credentials or over-long paths); their
  content is not reproduced.
- `skills/x<pid>-<plugin>/`: copyleft plugins (GPL, AGPL, LGPL, MPL, EPL, CC-BY(-SA)...), each with its license text,
  indexed in `index-copyleft.json` / `index-copyleft.csv` (withheld files in `EXCLUDED-copyleft.md`). They are
  redistributed under their own licenses; derivative works must follow the same terms, which is why KOSIF Omni does not
  embed them.

This is unreviewed third-party content: treat it as reference material and read any script before running it. All
rights remain with the original authors under their licenses. This is an unofficial mirror. Non-commercial, proprietary
and unidentified-license plugins, and plugins that failed KOSIF's static inspection, are not included.
