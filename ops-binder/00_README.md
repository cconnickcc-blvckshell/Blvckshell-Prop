# Operations Binder

**Binder Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Tier-1 Operations Binder for BLVCKSHELL Facilities Services (Ontario, Canada). Contains contracts, SOPs, policies, QA forms, and supporting checklists. Structured for immediate operational use and future portal integration.

---

## Overview

This operations binder provides complete operational documentation for running condo and rental/common-area cleaning services with subcontractors. All documents are structured to be:

1. **Immediately usable** for day-to-day operations
2. **Portal-loadable** for future integration into the Workforce Operations Portal
3. **Deterministic** with clear procedures, decision rules, and acceptance criteria

---

## Structure

### 01_Client_Contract/

**Master Service Agreement and Schedules**

- `01_Master_Service_Agreement.md` — Master service agreement (Ontario law)
- `Schedule_A_Site_Scope_Template.md` — Site-specific scope, frequency, pricing
- `Schedule_B_Add_On_Menu_and_Pricing_Template.md` — Add-on services and pricing
- `Schedule_C_Access_and_Site_Rules_Template.md` — Access credentials and site rules
- `Schedule_D_QA_and_Evidence_Requirements.md` — Photo requirements and QA standards
- `Schedule_E_Insurance_Compliance.md` — Insurance and compliance requirements
- `Work_Order_Template.md` — Work order template for add-ons and maintenance
- `Schedule_08_Credit_and_Reclean_Policy_Addendum.md` — Credit and reclean policies

---

### 02_Subcontractor_Contract/

**Subcontractor Agreements and Onboarding**

- `01_Independent_Subcontractor_Agreement_Longform.md` — Full subcontractor agreement
- `02_Subcontractor_One_Page_Summary.md` — Quick reference summary
- `03_Rate_Sheet_Template.md` — Payment rates and terms
- `04_Sub_Scope_Will_Wont_Do.md` — Clear scope boundaries
- `05_Sub_Onboarding_Checklist.md` — Onboarding checklist

---

### 03_SOPs/

**Standard Operating Procedures**

- `SOP_01_Common_Area_Cleaning.md` — Step-by-step cleaning procedures
- `SOP_02_Site_Access_And_Conduct.md` — Access and worker conduct
- `SOP_03_Completion_Proof_And_Submission.md` — Photo evidence and submission
- `SOP_04_Issue_Escalation_And_Incident_Response.md` — Incident handling
- `SOP_05_Add_On_Services_Execution.md` — Add-on service procedures
- `SOP_06_Light_Maintenance_Scope_And_Workflow.md` — Light maintenance triage

---

### 04_Policies/

**Operational Policies**

- `POL_01_Quality_Standard_and_Rework.md` — Quality standards and rework
- `POL_02_Health_Safety_and_PPE.md` — Health, safety, and PPE requirements
- `POL_03_Privacy_Photo_Handling_and_Data.md` — Privacy and data handling
- `POL_04_Subcontractor_Conduct_and_NonSolicit.md` — Conduct and non-solicitation
- `POL_05_Communications_and_Client_Contact.md` — Communication boundaries
- `POL_06_Billing_Collection_and_Service_Holds.md` — Billing and collections

---

### 05_QA_Forms/

**Quality Assurance Forms**

- `QA_01_Site_Inspection_Form.md` — Site inspection with scoring (0–100)
- `QA_02_Job_Completion_Checklist_Form.md` — Admin completion review
- `QA_03_Reclean_Authorization_Form.md` — Reclean authorization
- `QA_04_Incident_Report_Form.md` — Incident reporting
- `QA_05_Monthly_Board_Ready_Summary_Template.md` — Monthly board summary
- `QA_06_Supply_And_Consumables_Log.md` — Supply inventory tracking

---

### 06_Checklists_Library/

**Checklist Templates (Portal-Loadable)**

- `CL_01_Lobby_Checklist.md` — Lobby cleaning checklist
- `CL_02_Hallway_Checklist.md` — Hallway cleaning checklist
- `CL_03_Stairwell_Checklist.md` — Stairwell cleaning checklist
- `CL_04_Elevator_Checklist.md` — Elevator cleaning checklist
- `CL_05_Garbage_Room_Checklist.md` — Garbage room cleaning checklist
- `CL_06_Glass_Doors_Spot_Checklist.md` — Glass door cleaning checklist
- `CL_07_Washroom_Common_Area_Checklist.md` — Washroom cleaning checklist
- `CL_08_Seasonal_Deep_Clean_Checklist.md` — Seasonal deep clean checklist
- `checklist-manifest.json` — Stable checklist item IDs for portal seed

**Note:** All checklists use stable item IDs (e.g., LOB-001, HLY-001) for portal integration.

---

### 07_State_Machines_and_Roles/

**State Machines and RBAC**

- `01_Roles_and_RBAC.md` — Portal roles and permissions
- `02_State_Machines_Jobs_WorkOrders_Invoices_Payouts.md` — State machine definitions
- `03_Audit_Log_Requirements.md` — Audit log schema and requirements

---

### 08_Sales_Enablement/

**Sales Tools**

- `SE_01_Discovery_Script_Property_Managers.md` — Discovery script for PMs
- `SE_02_Site_Walk_Checklist.md` — Site walk checklist
- `SE_03_Proposal_QA_Accountability_Insert.md` — Proposal QA insert

---

## Portal Integration

**This binder is structured for portal integration:**

- **Checklist templates:** Stable item IDs (CL_01 through CL_08) with `checklist-manifest.json`
- **State machines:** Defined in `07_State_Machines_and_Roles/`
- **RBAC:** Defined in `07_State_Machines_and_Roles/01_Roles_and_RBAC.md`
- **Audit log:** Schema defined in `07_State_Machines_and_Roles/03_Audit_Log_Requirements.md`
- **Forms:** QA forms structured for portal form templates
- **Contracts:** Schedules structured for portal site configuration

**Portal seed data:**
- Use `checklist-manifest.json` for ChecklistTemplate seed
- Use state machine definitions for portal state enforcement
- Use RBAC definitions for portal role configuration

---

## Key Terms

**Definitions used throughout:**

- **Common area:** Shared spaces (lobby, hallways, stairwells, etc.), not inside units
- **Photo evidence:** Photos proving completion (minimum count per site, mandatory items)
- **Completion:** Job completion with checklist + photos (status: COMPLETED_PENDING_APPROVAL)
- **Approval:** Admin approval of completion (status: APPROVED_PAYABLE)
- **Rework:** Correction of deficiencies (no additional payment)
- **Reclean:** Re-cleaning at no charge (per credit policy)
- **Add-on:** Optional service beyond standard cleaning (per Schedule B)
- **Light maintenance:** Non-licensed, common-area maintenance (per Schedule B)

---

## Usage

**For operations:**

1. **New site onboarding:** Use `01_Client_Contract/` templates to create site-specific contracts
2. **Subcontractor onboarding:** Use `02_Subcontractor_Contract/05_Sub_Onboarding_Checklist.md`
3. **Daily operations:** Follow SOPs (`03_SOPs/`) and policies (`04_Policies/`)
4. **Quality assurance:** Use QA forms (`05_QA_Forms/`) for inspections and reviews
5. **Checklist assignment:** Assign checklist templates (`06_Checklists_Library/`) per site

**For portal integration:**

1. **Import checklists:** Use `checklist-manifest.json` for ChecklistTemplate seed
2. **Configure state machines:** Use `07_State_Machines_and_Roles/02_State_Machines_*.md`
3. **Configure RBAC:** Use `07_State_Machines_and_Roles/01_Roles_and_RBAC.md`
4. **Configure audit log:** Use `07_State_Machines_and_Roles/03_Audit_Log_Requirements.md`

---

## Document Standards

**All documents follow these standards:**

- **No TBDs:** All core content complete (bracket fields for site-specific details)
- **Deterministic:** Clear procedures, decision rules, acceptance criteria
- **Actionable:** Every section provides actionable guidance
- **Ontario/Canada terms:** HST, WSIB, COI, PIPEDA compliance
- **Professional tone:** Legal/ops tone, concise but complete

---

## Cross-Reference Alignment

**Key alignments across documents:**

- **Photo requirements:** Schedule D (QA and Evidence Requirements) aligns with SOP_03 (Completion Proof)
- **Scope boundaries:** Schedule A (Site Scope) aligns with `04_Sub_Scope_Will_Wont_Do.md`
- **Communication boundaries:** POL_05 (Communications) aligns with client and sub contracts
- **Quality standards:** POL_01 (Quality Standard) aligns with QA_01 (Site Inspection) and QA_02 (Job Completion)
- **State machines:** `07_State_Machines_and_Roles/` aligns with portal implementation requirements

---

## Version History

**Version 1.0 (February 16, 2026):**
- Initial operations binder creation
- All contracts, SOPs, policies, QA forms, and checklists complete
- Portal integration structure established

---

## Contact

**For questions or updates:**

- **Operations:** [OPERATIONS CONTACT]
- **Legal:** [LEGAL CONTACT]
- **Portal Integration:** [TECH CONTACT]

---

**This operations binder is the single source of truth for BLVCKSHELL Facilities Services operations. All procedures, policies, and standards are documented here.**
