# Lengacher & Partner – Career Portal

**Isolated from main L&P website.**

- GitHub source: `moritzlengacher-oss/SDR-Recruiting`, career pages under `/karriere`. Existing SDR landing at `/index.html` remains unchanged.
- Careers Vercel target: `sdr-recruiting`, distinct from main website Vercel project `ic`.
- Public intended domain: `jobs.lengacher-partner.ch` (domain assignment only after successful QA).
- 21 role pages with canonical URLs and JobPosting schema, brand-specific design and localized forms.
- Application API: same-origin `/api/career-application` validates payload, forwards only to existing L&P ATS endpoint. **Never counts a submission as delivered unless upstream confirms `{ok:true}`.**
- Backend is deliberately shared with the original L&P ATS to preserve database and notification routing; GitHub/Vercel website projects are separated.
- Audit and release gates: preview page/filter/form checks, bad origin rejection, PDF rejection, consent required, downstream confirmation, SEO/redirect checks, mobile QA, SDR root unchanged, and rollback procedure.
- No existing applicant data was migrated or modified.
