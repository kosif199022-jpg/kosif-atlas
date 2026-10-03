# cv-craft: evidence behind the rules

Where the rules in [SKILL.md](SKILL.md) and [REFERENCE.md](REFERENCE.md) come from, and how much weight each one carries. Compiled from a research pass in September 2026 (six research agents, an independent re-verification of the claims that changed rules, and an adversarial review). Read this before changing a rule, and re-check sources older than about two years.

**Tiers:** T1 peer-reviewed. T2 vendor documentation, regulators, platform data with a stated sample. T3 reputable journalism, practitioner books. T4 career-coach and resume-builder content (commercial incentive; used only as claims to test).

**Status:** *verified* means a second agent re-opened the source and the figure matched.

Most resume knowledge is T2 to T4. Where evidence is missing either way, a rule is kept or dropped on asymmetric risk: what does being wrong cost the candidate?

## ATS parsing

| Claim | Tier | Status | Source |
|---|---|---|---|
| Parsing fails on files over 2.5MB, tables, columns, headers/footers, contact info in a header/footer/text box, graphics, letter-spaced text, inconsistent sections, abbreviated titles | T2 | verified | support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse |
| Image-based resumes are a hard parse failure with a dedicated error code | T2 | verified | developers.smartrecruiters.com/reference/candidatesresumeparse |
| No 2024–2026 vendor documentation prefers DOCX over PDF (or the reverse) | T2 | verified as absence | Greenhouse and SmartRecruiters docs above |
| Modern Textkernel parsing detects column gaps far better than it used to, so "columns always break" is overstated; legacy parsers still fail | T2 | vendor claim | Textkernel product material (see research file 01) |
| PDF ligature glyphs (fi, fl, ff) break keyword search | mechanism | reproduced locally | `verify-pdf.py`; see REFERENCE.md PDF stylesheet |

Rule consequence: single column and no graphics stay, justified by "you cannot know the parser". File type is chosen per submission, never "DOCX is the ATS-safe one".

## Screening and ranking

| Claim | Tier | Status | Source |
|---|---|---|---|
| Greenhouse Talent Matching is assistive, does not auto-advance or auto-reject, and highlights exact and similar keywords in qualitative tiers, not a numeric score | T2 | verified | support.greenhouse.io/hc/en-us/articles/41396009937307-Talent-Matching |
| Ashby's AI review is assistive, frames requirements as Meets / Does Not Meet, and humans make the advance/reject call | T2 | verified | ashbyhq.com/product-updates/ai-assisted-application-review |
| Workday HiredScore grades applicants; framed as assistive | T2 | verified (hedged) | workday.com/en-gb/products/talent-management/ai-recruiting.html |
| Humans shown a biased AI recommendation followed it up to 90% of the time, even when they rated it low quality (n=528) | T1 (preprint, AIES) | as cited | arxiv.org/html/2509.04404v1 |
| LLM resume screening favored white-associated names 85% of the time (3M+ comparisons) | T1 | verified | washington.edu/news/2024/10/31/ai-bias-resume-screening-race-gender/ |

Caveat: vendors have a legal incentive (NYC Local Law 144, EU AI Act) to describe their AI as assistive. Combined with the 90% anchoring finding, the skill treats the first automated pass as an effective gate, not a formality. The "80% verbatim keyword coverage" threshold the skill used to cite has no source; the rubric's first category now scores requirement evidence instead.

Recruiter boolean search and LinkedIn Recruiter search still match literal terms, so exact JD vocabulary stays.

## Referrals

| Claim | Tier | Status | Source |
|---|---|---|---|
| Referrals are about 1–2% of applications but reach interview at about 40%, against about 3% for inbound (38M applications) | T2 | verified | ashbyhq.com/talent-trends-report/reports/referrals |

The strongest single data point found. It is why `check` asks about a referral path before any CV work.

## Length

| Claim | Tier | Status | Source |
|---|---|---|---|
| Hiring simulation (n=482): 2-page resumes preferred 2.3x, even at entry level | T4 (commercial vendor, behavioral design) | verified | resumego.net/research/one-or-two-page-resumes/ |
| Survey (n=418): 92% advise one page; most want 10+ years before two; 84% flag irregular lengths such as 1.5 pages | T4 | verified | resumego.net/research/how-long-should-a-resume-be/ |
| "6 to 7 seconds" skim time | T4 (Ladders, sells resume services, method unpublished) | not verifiable | secondary reporting only |

Both length sources are one vendor and disagree. The rule keeps the 1-page / 2-page structure, moves the switch to "when content fills it", and bans a partial second page, which both sources agree reads badly.

## AI-written resumes

| Claim | Tier | Status | Source |
|---|---|---|---|
| 41% of job seekers admit trying hidden prompt injection in a resume (n=4,136) | T2 | verified | greenhouse.com/newsroom (AI trust crisis survey) |
| Recruiters identify AI-written resumes at about chance (50%) in blind tests | T4 (self-published newsletter; 1,072 raters but only 8 resumes) | not a primary study | newsletter.jobsearch.guide/p/recruiters-cant-spot-ai-resumes |
| Em-dashes get resumes flagged ("92%") | T4 | not traceable | marketing blogs |
| Specific words (leverage, delve, spearhead) are penalized by screening software | none | no evidence found | n/a |

Rule consequence: the word list and the em-dash ban stay because removing them is free, but the stated reason is human perception, not an automated penalty. The rubric now weighs generic, templated content (the pattern readers do catch) above individual words.

## Content and framing

| Claim | Tier | Status | Source |
|---|---|---|---|
| XYZ formula; a percentage without its baseline misleads | T3 | verified | linkedin.com/pulse/20140929001534-24454816-my-personal-formula-for-a-better-resume (Laszlo Bock, 2014) |
| "Quantified bullets get 3.2x callbacks" and similar | none | untraceable | appears only in resume-builder marketing |
| Tailored cover letters raised callbacks about 53% over none (n=7,287 applications); 87% of 236 recruiters say they read them | T2/T4 (vendor field experiment) | verified | resumego.net/research/cover-letters/ |
| Tailored beats generic | many | direction consistent, magnitudes (1.3x to 3x) do not reconcile | research file 04 |
| Employment gaps carry a ~20% selection penalty regardless of explanation (pre-registered, n=974, hospitality roles, pandemic context) | T1 | as cited | pmc.ncbi.nlm.nih.gov/articles/PMC10019729/ |
| Dropping degree requirements changed under 1 in 700 actual hires; 37% of employers are genuine skills-based leaders | T2 | verified via HR Dive | burningglassinstitute.org/research/skills-based-hiring-2024 |

Evidence deserts (practitioner opinion only): framing non-quantifiable engineering work, staff-level signals, AI-tooling presentation, side-project presentation, concurrent-contract presentation. The skill's guidance on these is labeled as convention.

## Recruiter screen

| Claim | Tier | Status | Source |
|---|---|---|---|
| Structured interviews remain the strongest single predictor (validity .42, revised down from .51) | T1 | verified via secondary sources | Sackett, Zhang, Berry & Lievens (2022), Journal of Applied Psychology 107(11) |
| Screen calls are transcribed and auto-summarized into scorecards | T2 | vendor product pages | metaview.ai, brighthire.com |
| 16+ US states and DC have pay-transparency or salary-history rules | T3 | as cited | Foley pay-transparency tracker (May 2026) |
| EU Pay Transparency Directive transposition deadline (7 June 2026) missed by most member states | T2 | verified | morganlewis.com/pubs/2026/06/eu-pay-transparency-directive-the-deadline-for-transposition-has-passed-what-now |
| Employers are adding identity checks against fake remote IT workers | T2 | verified | ic3.gov/PSA/2025/PSA250723-4; justice.gov press releases |

No study supports a specific answer length; the 120-word cap is a practical proxy.

## LinkedIn

| Claim | Tier | Status | Source |
|---|---|---|---|
| Hiring Assistant uses sourcing and evaluation agents that read the full profile plus resume | T2 | engineering blog | linkedin.com/blog/engineering (Hiring Assistant, October 2025) |
| Recruiter search standardizes to canonical titles and skills | T2 | engineering blog, 2019, likely partly stale | linkedin.com/blog/engineering (Recruiter search ranking) |
| Open to Work increases InMails by some percentage | T4 | attributed to LinkedIn, sourced to a career blog | not used |
| CV/LinkedIn inconsistency hurts candidates | none | widely repeated, no study | kept as hygiene, not as a measured effect |

## Regulation (context, not rules)

- EU AI Act high-risk obligations for employment AI deferred from August 2026 to December 2027 (T2, verified: DLA Piper on the Digital Omnibus).
- A December 2025 New York State audit found NYC Local Law 144 enforcement ineffective (T3).
- Disclosure of automated screening is increasing; remedies remain weak. Nothing here relaxes a resume rule.

## Known gaps in this evidence

- Workday's parser vendor and Taleo's format sensitivity were not examined.
- How agency recruiters reformat CVs was not studied; the DOCX-for-agencies rule rests on how that workflow is described, not data.
- Timing effects (how much applying early matters) were not researched.
- No Brazil-specific correspondence study was found.
- Two statistics from search-engine summaries (a Textkernel "87% vs 62%", a Jobscan "37% rejected over dates") did not exist on the pages they were attributed to. Treat any number seen only in a search summary as unverified.
