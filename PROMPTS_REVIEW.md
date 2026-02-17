# In-Depth Review of Prompts File

**Date:** February 16, 2026  
**Reviewer:** AI Code Assistant  
**File:** `prompts`

---

## Executive Summary

The prompts file contains three project specifications for BLVCKSHELL Facilities Services:
1. **Subcontractor Portal MVP** - Internal operations portal
2. **Marketing Website** - Public-facing lead generation site
3. **Operations Binder** - Contracts, SOPs, policies, QA forms, checklists, state machines, sales enablement (Markdown; portal-loadable)

Prompts 1 and 2 demonstrate strong structure and clear scope boundaries. Prompt 3 is a document-production prompt with a fixed folder structure and alignment requirements for portal import. However, several areas need clarification, additional detail, or explicit decisions to ensure successful implementation.

---

## PROMPT 1: Subcontractor Portal MVP

### ✅ Strengths

1. **Clear Goal Statement** - The 4-question framework is excellent for maintaining focus
2. **Explicit Scope Limits** - "DO NOT DRIFT" sections prevent feature creep
3. **State Machine Definition** - Well-defined job status workflow
4. **Security-First Approach** - RBAC, IDOR prevention, input validation requirements
5. **Audit Trail** - AuditLog requirement ensures compliance and debugging

### ⚠️ Critical Issues & Gaps

#### 1. **Missing Data Model Specifications**

**Issue:** Several models lack complete field definitions:

- **AuditLog** (line 54): Mentioned but not fully specified
  - Missing: `id`, `updatedAt`, `ipAddress`, `userAgent`
  - `metadata JSON` - what structure? Should be documented

- **ChecklistTemplate.items** (line 33): JSON structure undefined
  - Should specify: `[{ itemId: string, label: string, type?: 'pass/fail' | 'text' | 'number', required: boolean }]`
  - Versioning strategy unclear - how are itemIds maintained across versions?

- **JobCompletion.checklistResults** (line 35): Validation rules missing
  - Current: "JSON keyed by itemId with values: PASS/FAIL/NA + optional note"
  - Should specify: `{ [itemId: string]: { result: 'PASS' | 'FAIL' | 'NA', note?: string } }`

- **Evidence.fileType** (line 36): Should be enum
  - Recommend: `IMAGE | VIDEO | DOCUMENT` or specific MIME types

**Recommendation:** Add a complete Prisma schema section with all fields, types, relations, and constraints.

#### 2. **State Machine Gaps**

**Issue:** Incomplete state transition rules:

- **CANCELLED state** (line 47):
  - Who can cancel? (ADMIN only? Subcontractor?)
  - When can it be cancelled? (Before completion? After?)
  - What happens to payoutAmountCents?
  - Can cancelled jobs be reactivated?

- **Rejection Flow** (line 52 mentions approval, but what about rejection?):
  - What state does COMPLETED_PENDING_APPROVAL go to when rejected?
  - Should it go back to SCHEDULED? New state REJECTED?
  - Can subcontractor resubmit after rejection?

- **Missing Transitions:**
  - Can ADMIN edit SCHEDULED jobs? (reschedule, reassign, change payout?)
  - What if a job is APPROVED_PAYABLE but payout amount changes?

**Recommendation:** Add complete state transition matrix with all valid transitions and who can trigger them.

#### 3. **Security & Validation Gaps**

**Issue:** Several security concerns not addressed:

- **File Upload Security:**
  - No file size limits specified
  - No MIME type validation beyond "fileType"
  - No virus scanning mentioned
  - No filename sanitization requirements
  - Image processing (resize, compression) not mentioned

- **Password Management:**
  - No password reset flow
  - No password complexity requirements
  - No account lockout after failed attempts

- **Session Management:**
  - Session timeout not specified
  - Refresh token strategy not mentioned
  - Concurrent session limits?

- **Rate Limiting:**
  - No mention of API rate limiting
  - File upload rate limits?

**Recommendation:** Add a dedicated "SECURITY DETAILS" section with all security requirements.

#### 4. **Data Integrity Issues**

**Issue:** Missing database constraints and relationships:

- **Cascade Deletes:**
  - What happens when Site is deleted? (Jobs? Checklists?)
  - What happens when User is deleted? (Jobs? Completions?)
  - Should be explicit: `onDelete: Cascade | SetNull | Restrict`

- **Unique Constraints:**
  - Can multiple active ChecklistTemplates exist per site?
  - Should `email` be unique in User table?
  - Can one Job have multiple JobCompletions? (probably not - should be 1:1)

- **Foreign Key Relationships:**
  - JobCompletion.completedByUserId - should this always match Job.assignedToUserId?
  - Approval.approvedByUserId - must be ADMIN, but no constraint specified

**Recommendation:** Add explicit Prisma schema with all relations and constraints.

#### 5. **UX & Error Handling**

**Issue:** User experience requirements missing:

- **Error States:**
  - What happens if file upload fails mid-submission?
  - How are validation errors displayed?
  - Network error handling?

- **Loading States:**
  - Should forms show loading indicators?
  - Optimistic updates for status changes?

- **Mobile Experience:**
  - Is mobile support required? (subcontractors may use phones)
  - Photo upload from mobile camera?

- **Accessibility:**
  - WCAG compliance level?
  - Screen reader support?

**Recommendation:** Add "UX REQUIREMENTS" section with error handling, loading states, and accessibility.

#### 6. **Technical Ambiguities**

**Issue:** Several technical decisions left open:

- **File Storage Interface:**
  - "Interface layer so we can swap to S3 later" - what pattern?
  - Should be: Repository pattern? Service abstraction?
  - File path structure? (`/uploads/{jobId}/{timestamp}-{filename}`?)

- **Auth Decision:**
  - "NextAuth OR custom JWT if simpler" - decision criteria?
  - Recommend: Use NextAuth for MVP (more secure, less code)

- **Photo Requirements:**
  - "minimum photo evidence count (configurable per site, default 4)"
  - What if subcontractor uploads 10 photos? All stored?
  - Maximum photo count?

**Recommendation:** Make explicit technical decisions or provide decision criteria.

#### 7. **Missing Features (May Be Intentional)**

- Email notifications (job assigned, approved, rejected, paid)
- Calendar integration (iCal export for jobs)
- Offline support (PWA?)
- Photo compression before upload
- Bulk operations (admin approve multiple jobs)

**Note:** These may be intentionally out of scope, but should be explicitly listed in "OUT OF SCOPE" section.

---

### 📋 Recommended Additions

1. **Complete Prisma Schema Section** with:
   - All models with full field definitions
   - Relations with cascade rules
   - Indexes for performance
   - Enums for status fields

2. **State Transition Matrix Table:**
   ```
   From State → To State | Who Can Do It | Requirements
   SCHEDULED → COMPLETED_PENDING_APPROVAL | SUBCONTRACTOR | Checklist + photos
   COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE | ADMIN | Review complete
   COMPLETED_PENDING_APPROVAL → SCHEDULED | ADMIN | Rejection
   ```

3. **File Upload Specification:**
   - Max file size: 10MB per image
   - Allowed types: JPEG, PNG, WebP
   - Storage path: `/uploads/jobs/{jobId}/{timestamp}-{hash}.{ext}`
   - Compression: Resize to max 2048px width, 80% quality

4. **Error Handling Requirements:**
   - All forms show validation errors inline
   - Server errors show user-friendly messages
   - Network errors show retry option

5. **Testing Requirements Clarification:**
   - "Minimal but real" is vague
   - Specify: Unit tests for state transitions, integration tests for RBAC, E2E tests for critical flows

---

## PROMPT 2: Marketing Website

### ✅ Strengths

1. **Clear Positioning** - Well-defined target audience and value proposition
2. **Scope Boundaries** - Explicit exclusions prevent scope creep
3. **Brand Guidelines** - Tone and visual direction clearly stated
4. **Page Structure** - Complete page list with content requirements
5. **SEO Requirements** - Basic SEO needs addressed

### ⚠️ Critical Issues & Gaps

#### 1. **Content Requirements Too Vague**

**Issue:** Content sections lack specificity:

- **FAQ Section** (line 170): "6–8 questions geared to property managers"
  - Which questions? Should be specified or at least provide examples
  - Examples: "How quickly can you start?", "What's included in common-area cleaning?", "How do you handle complaints?"

- **Copywriting Guidelines:**
  - No tone examples provided
  - No word count guidance
  - No content hierarchy specified

**Recommendation:** Add example FAQ questions and tone examples.

#### 2. **Lead Capture Ambiguity**

**Issue:** Decision left to implementer:

- **"SMTP OR stores to DB"** (line 132, 204):
  - No decision criteria provided
  - Recommendation: Use DB for MVP (easier to query, no email server setup)
  - But should also send email notification to admin

- **Email Notifications:**
  - Should admin receive email when lead submitted?
  - Auto-responder to lead submitter?
  - Not mentioned but likely needed

- **Spam Protection:**
  - No CAPTCHA mentioned
  - No rate limiting
  - No honeypot fields

**Recommendation:** Specify lead capture method and add spam protection requirements.

#### 3. **SEO Gaps**

**Issue:** Basic SEO mentioned but incomplete:

- **Structured Data:**
  - No Schema.org markup requirements (LocalBusiness, Service, FAQPage)
  - Important for local SEO

- **Keyword Strategy:**
  - No target keywords specified
  - No content optimization guidance

- **Technical SEO:**
  - No canonical URL strategy
  - No redirect strategy (what if pages move?)
  - No XML sitemap structure specified

- **Local SEO:**
  - No Google Business Profile integration
  - No location-specific pages mentioned

**Recommendation:** Add structured data requirements and local SEO considerations.

#### 4. **Performance Requirements Missing**

**Issue:** "Performance-focused" is vague:

- **No Specific Targets:**
  - Lighthouse scores? (should target 90+)
  - Core Web Vitals thresholds?
  - Page load time target?

- **Image Optimization:**
  - "next/image" mentioned but no guidelines
  - Should specify: max dimensions, formats (WebP), lazy loading

- **Caching Strategy:**
  - Static page caching?
  - API route caching?
  - CDN requirements?

**Recommendation:** Add specific performance targets and optimization guidelines.

#### 5. **Analytics & Tracking**

**Issue:** Not mentioned but likely needed:

- Google Analytics?
- Conversion tracking?
- Form abandonment tracking?
- Heatmaps?

**Recommendation:** Add analytics requirements or explicitly state "no tracking" if privacy-focused.

#### 6. **Integration Requirements**

**Issue:** Lead management not specified:

- **CRM Integration:**
  - How do leads flow to sales team?
  - Webhook to external system?
  - Manual export?

- **Email Marketing:**
  - Should leads be added to email list?
  - Double opt-in required?

**Recommendation:** Specify lead management workflow.

#### 7. **Legal & Compliance**

**Issue:** Privacy page mentioned but requirements vague:

- **Privacy Policy Content:**
  - What must be included? (GDPR? PIPEDA for Canada?)
  - Cookie policy?
  - Data retention policy?

- **Consent Management:**
  - "I agree to be contacted" checkbox - sufficient?
  - GDPR requires explicit consent for marketing

- **Accessibility:**
  - WCAG level? (should be AA minimum)
  - Screen reader testing?

**Recommendation:** Add legal/compliance requirements section.

#### 8. **Asset Management**

**Issue:** PDF download mentioned but unclear:

- **PDF Generation:**
  - Static file or dynamically generated?
  - If static, who creates it? (not developer's job)

- **Other Assets:**
  - Logo files? Brand assets?
  - Stock photos? (should specify source or "use placeholder")

**Recommendation:** Clarify asset requirements and sources.

---

### 📋 Recommended Additions

1. **FAQ Questions Examples:**
   ```
   - How quickly can you start service at a new property?
   - What's included in your standard common-area cleaning?
   - How do you handle resident complaints about cleaning quality?
   - Do you provide your own supplies and equipment?
   - What happens if a cleaner doesn't show up?
   - How do you prove the work was completed?
   - Can you handle emergency cleanups?
   - What's your service area?
   ```

2. **Lead Capture Specification:**
   - Store in DB table `Lead`
   - Send email notification to admin@blvckshell.com
   - Auto-responder: "Thank you for your inquiry. We'll contact you within 1 business day."
   - Add invisible honeypot field for spam protection
   - Rate limit: 3 submissions per IP per hour

3. **Structured Data Requirements:**
   - LocalBusiness schema on homepage
   - Service schema on service pages
   - FAQPage schema on FAQ section
   - Organization schema in footer

4. **Performance Targets:**
   - Lighthouse Performance: 90+
   - LCP: < 2.5s
   - FID: < 100ms
   - CLS: < 0.1

5. **Content Guidelines:**
   - Hero headlines: 8-12 words
   - Section headings: H2, descriptive
   - Body copy: 2-3 sentences per paragraph
   - CTA buttons: Action-oriented ("Request Quote", not "Learn More")

---

## CROSS-CUTTING ISSUES

### 1. **File Organization**

**Issue:** Two prompts in one file without clear separation.

**Recommendation:**
- Split into `prompt-1-subcontractor-portal.md` and `prompt-2-marketing-website.md`
- OR add clear section dividers with page breaks
- Add table of contents if keeping in one file

### 2. **Version Control**

**Issue:** No version history or change tracking.

**Recommendation:**
- Add version number and date to each prompt
- Consider using separate files for easier git diff tracking

### 3. **Dependencies & Environment**

**Issue:** Missing dependency and environment details:

- **Package Versions:**
  - "Next.js 14+" - which exact version? (14.2.0? Latest?)
  - Prisma version?
  - Tailwind version?

- **Environment Variables:**
  - What env vars are needed?
  - Database connection string format?
  - Auth secrets?

- **Development Setup:**
  - Node version?
  - Database setup instructions?
  - Local file storage directory?

**Recommendation:** Add "SETUP REQUIREMENTS" section with versions and env vars.

### 4. **Documentation Requirements**

**Issue:** README requirements are vague:

- **Prompt 1:** "README with setup steps" - what level of detail?
- **Prompt 2:** "README with setup + deploy steps" - deployment to where?

**Recommendation:** Specify README sections:
- Installation
- Environment variables
- Database setup
- Running locally
- Running tests
- Deployment instructions

### 5. **Testing Strategy**

**Issue:** Testing requirements inconsistent:

- **Prompt 1:** Mentions "minimal but real" tests
- **Prompt 2:** No testing requirements

**Recommendation:** Add consistent testing requirements or explicitly state "no tests required for MVP".

---

## PRIORITY RECOMMENDATIONS

### 🔴 High Priority (Must Fix Before Implementation)

1. **Prompt 1:**
   - Complete Prisma schema with all fields and relations
   - Define complete state transition matrix
   - Specify file upload security requirements
   - Add rejection flow to state machine

2. **Prompt 2:**
   - Specify lead capture method (DB vs email)
   - Add spam protection requirements
   - Define FAQ questions (at least examples)
   - Add email notification requirements

### 🟡 Medium Priority (Should Fix)

1. **Prompt 1:**
   - Add error handling requirements
   - Specify mobile support requirements
   - Add password reset flow
   - Define file storage abstraction pattern

2. **Prompt 2:**
   - Add structured data requirements
   - Specify performance targets
   - Add analytics requirements (or explicitly exclude)
   - Define legal/compliance requirements

### 🟢 Low Priority (Nice to Have)

1. Both:
   - Split prompts into separate files
   - Add version numbers
   - Add dependency versions
   - Expand documentation requirements

---

## CONCLUSION

Both prompts are well-structured and provide a solid foundation for implementation. The main gaps are:

1. **Incomplete data model specifications** (especially Prompt 1)
2. **Ambiguous technical decisions** (file storage, auth, lead capture)
3. **Missing security details** (file uploads, rate limiting)
4. **Vague content requirements** (especially Prompt 2 FAQs)

**Overall Assessment:** 7.5/10
- Strong structure and scope definition
- Good security awareness
- Needs more technical detail and explicit decisions

**Recommendation:** Address high-priority items before starting implementation to avoid mid-project clarifications and rework.

**Execution:** For a comprehensive plan to execute all three prompts (order, dependencies, phases, deliverables), see **EXECUTION_PLAN.md**.

---

## SUGGESTED NEXT STEPS

1. **Clarify Technical Decisions:**
   - Choose auth method (recommend NextAuth)
   - Choose lead capture method (recommend DB + email notification)
   - Define file storage interface pattern

2. **Complete Data Models:**
   - Write full Prisma schema
   - Define all JSON structures
   - Specify all constraints

3. **Add Missing Requirements:**
   - State transition matrix
   - File upload security
   - Error handling patterns
   - Testing strategy

4. **Create Implementation Checklist:**
   - Break down each prompt into specific tasks
   - Add acceptance criteria for each feature
   - Define "done" criteria
