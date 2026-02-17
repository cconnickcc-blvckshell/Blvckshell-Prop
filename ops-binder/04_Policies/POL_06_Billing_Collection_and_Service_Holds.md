# POL_06: Billing Collection and Service Holds

**Policy Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Define billing terms, collection procedures, service hold policies, and dispute handling. Ensures clear payment expectations and procedures.

---

## Billing Terms

### Standard Billing

**Monthly service:**
- **Payment:** Monthly in advance
- **Due date:** First of month (or per contract)
- **Invoice:** Issued [X] days before due date
- **Payment method:** Per contract (check, EFT, credit card)

**Add-ons:**
- **Billing:** Separate from monthly service
- **Timing:** After completion and approval
- **Invoice:** Issued after work order marked INVOICED
- **Payment terms:** Net 30 (or per contract)

---

### Pricing Structure

**Monthly service:**
- **Flat monthly fee:** Per site Schedule A
- **No hourly billing:** Flat fee regardless of time spent
- **Frequency:** Per contract (2x/week, 3x/week, 5x/week, daily)

**Add-ons:**
- **Per-service pricing:** Per site Schedule B
- **Emergency surcharge:** May apply (after-hours, urgent requests)
- **Minimum call-out:** Per Schedule B (for light maintenance)

---

## Payment Terms

### Standard Terms

**Payment due:**
- **Monthly service:** First of month (or per contract)
- **Add-ons:** Net 30 from invoice date (or per contract)

**Late fees:**
- **Policy:** Per contract (may include late fees after [X] days)
- **Amount:** Per contract (e.g., 1.5% per month)
- **Grace period:** [X] days (per contract)

---

### HST

**HST included:**
- All invoices include HST (13% Ontario)
- HST number: [HST NUMBER]
- HST shown separately on invoices

---

## Service Holds

### When Service Hold Applied

**Service hold triggered if:**

1. **Non-payment:**
   - Payment overdue by [X] days (per contract, typically 30 days)
   - No payment arrangement in place
   - No response to payment reminders

2. **Client request:**
   - Client requests temporary hold (with written authorization)
   - Hold duration per client request (maximum [X] days)

---

### Service Hold Procedure

**Step 1:** Payment overdue:
- Invoice past due
- Payment reminders sent (per contract)
- No payment received

**Step 2:** Admin initiates hold:
- Sets site `isActive = false` (or hold flag)
- Stops job scheduling for site
- Notifies client of hold

**Step 3:** Client notification:
- Email notification: "Service hold due to non-payment"
- Explanation: Payment required to resume service
- Contact: Admin contact information

**Step 4:** Service resumes:
- Payment received
- Admin removes hold (`isActive = true`)
- Service resumes (jobs scheduled)

---

### Service Hold Duration

**Maximum hold:**
- **Non-payment:** Until payment received
- **Client request:** Maximum [X] days (per contract, typically 90 days)

**After maximum hold:**
- If payment not received: Contract termination process begins
- If client request exceeds maximum: Contract renegotiation or termination

---

## Collection Procedures

### Payment Reminders

**Reminder schedule:**

1. **First reminder:** [X] days before due date
   - Email: "Invoice [number] due [date]"
   - Friendly reminder

2. **Second reminder:** [X] days after due date
   - Email: "Invoice [number] overdue"
   - Payment required

3. **Final reminder:** [X] days after due date
   - Email: "Final notice: Invoice [number] overdue"
   - Service hold warning

4. **Service hold:** [X] days after due date
   - Service hold applied
   - Email: "Service hold due to non-payment"

---

### Collection Escalation

**If payment not received:**

**Step 1:** Payment reminders (per schedule above)  
**Step 2:** Service hold applied  
**Step 3:** Collection agency (if per contract):
- After [X] days of hold
- Per contract terms

**Step 4:** Legal action (if per contract):
- After collection agency attempts
- Per contract terms

---

## Dispute Handling

### Dispute Timeline

**Dispute process:**

1. **Dispute raised:** Client contacts admin with dispute
2. **Admin acknowledges:** Within 1 business day
3. **Investigation:** Within 5 business days
4. **Resolution:** Within 10 business days
5. **Appeal:** If client not satisfied, per contract dispute resolution

---

### Dispute Types

**Common disputes:**

1. **Quality issues:**
   - Client reports incomplete or substandard work
   - Admin investigates (reviews completion, photos, notes)
   - Resolution: Reclean, credit, or explanation

2. **Billing disputes:**
   - Client disputes invoice amount
   - Admin reviews (contract, work performed, pricing)
   - Resolution: Credit, correction, or explanation

3. **Scope disputes:**
   - Client expects work not in scope
   - Admin reviews (contract Schedule A, work performed)
   - Resolution: Explanation, add-on quote, or contract update

---

### Dispute Resolution

**Step 1:** Client raises dispute:
- Via email or phone
- Admin documents dispute

**Step 2:** Admin investigates:
- Reviews contract, work performed, photos, notes
- Gathers evidence

**Step 3:** Admin responds:
- Acknowledges dispute
- Provides resolution (credit, reclean, explanation)
- Timeline for resolution

**Step 4:** Client accepts or appeals:
- If accepts: Resolution implemented
- If appeals: Per contract dispute resolution (mediation, arbitration)

---

## Credit Policy

### When Credits Issued

**Credits issued if:**

1. **Service not performed:**
   - Job cancelled by company (not client)
   - Job missed (no-show by worker)
   - Service hold applied (company-initiated)

2. **Service below standard:**
   - Repeated failures not corrected
   - Client complaint validated
   - Quality audit identifies deficiencies

3. **Billing errors:**
   - Incorrect invoice amount
   - Duplicate billing
   - Work not performed but billed

**Credit amount:**
- Full credit: If service not performed
- Partial credit: Pro-rated if partially performed
- Per site Schedule A or credit policy addendum

---

### Credit Process

**Step 1:** Credit authorized:
- Admin authorizes credit
- Amount determined (per credit policy)

**Step 2:** Credit applied:
- Applied to next invoice
- Or refunded (per client preference)

**Step 3:** Client notified:
- Email: "Credit applied to account"
- Amount and reason

---

## Add-On Approvals

### Approval Required

**Add-ons require approval:**

1. **Client requests add-on:**
   - Via property management
   - Admin creates work order (status: REQUESTED)

2. **Admin approves:**
   - Verifies scope and pricing (per Schedule B)
   - Approves work order (status: APPROVED)
   - Assigns to worker (if applicable)

3. **Worker executes:**
   - Per SOP_05 (Add-On Services Execution)
   - Completes add-on
   - Submits completion

4. **Admin invoices:**
   - Reviews completion
   - Marks work order INVOICED
   - Issues invoice to client

---

### Emergency Add-Ons

**Emergency add-ons:**

- **Bio cleanup:** May include emergency surcharge
- **After-hours work:** May include after-hours premium
- **Urgent requests:** May include urgency surcharge

**Approval:**
- Admin may approve immediately (per Schedule B)
- Client notified of surcharge
- Invoice includes surcharge

---

## References

- Billing terms: Schedule A (Site Scope Template) and Schedule B (Add-On Menu)
- Credit policy: Schedule 08 (Credit and Reclean Policy Addendum)
- Contract terms: 01_Client_Contract/01_Master_Service_Agreement.md

---

**This policy ensures clear billing and collection procedures. Service holds protect company from non-payment. Disputes handled promptly and fairly.**
