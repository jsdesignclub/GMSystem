# Automated Beneficiary Selection Scoring System

This document provides a comprehensive breakdown of the automated evaluation and scoring framework used to select beneficiaries for the **Self-Employment Equipment Distribution Program (50% Contribution Scheme)**. 

By converting manual verification processes into objective, data-driven parameters, this scoring system ensures complete transparency, eliminates subjective bias, and accelerates administrative workflows.

---

## 📊 System Overview & Total Allocation
The evaluation matrix operates on a maximum total score of **100 Marks**, evenly distributed across 5 core dimensional pillars of business health, individual capability, and socio-economic impact.

```
Total Allocation (100 Marks)
├── 1. Business Stability & Growth Potential : 25 Marks (25%)
├── 2. Professional Competency                : 25 Marks (25%)
├── 3. Household Economic & Social Status    : 15 Marks (15%)
├── 4. Economic Contribution & Innovation     : 25 Marks (25%)
└── 5. Special Awards & Recognition           : 10 Marks (10%)
```

---

## 🔍 Detailed Component Breakdown & Automation Rules

### 1. Business Stability & Growth Potential (Max: 25 Marks)
*Evaluates the operational legitimacy and financial trajectory of the enterprise.*

* **Business Name Registration (10 Marks):** * *Automation Rule:* Binary check. Verified valid registration document = **10 marks**; None = **0 marks**.
* **Trade License (5 Marks):** * *Automation Rule:* Binary check. Active municipal/local authority license = **5 marks**; None = **0 marks**.
* **Growth Source / Monthly Income (5 Marks):**
    * *Automation Rule:* Step-threshold matching based on audited or certified average monthly revenue:
        * `LKR 5,000 to LKR 10,000` ➡️ **1 Mark**
        * `LKR 10,001 to LKR 15,000` ➡️ **2 Marks**
        * `LKR 15,001 to LKR 20,000` ➡️ **3 Marks**
        * `LKR 20,001 to LKR 30,000` ➡️ **4 Marks**
        * `> LKR 30,000` ➡️ **5 Marks**
* **Financial Discipline / Bookkeeping (5 Marks):**
    * *Automation Rule:* Verified existence of formal financial journals, ledgers, or digital POS transaction logs = **5 marks**; Poor/absent records = **0 marks**.

### 2. Professional Competency (Max: 25 Marks)
*Assesses the technical foundation and execution capacity of the applicant.*

* **NVQ Level 3 or Equivalent Recognition (5 Marks):**
    * *Automation Rule:* Verified National Vocational Qualification (NVQ) Level 3 or verified technical diploma from a recognized vocational body.
* **NVQ Level 4 / University Degree (10 Marks):**
    * *Automation Rule:* Higher education tier qualification. *(Note: System prioritizes the highest certificate submitted up to 10 marks max).*
* **Industry Experience (10 Marks):**
    * *Automation Rule:* Calculated duration from the date of initial operation or professional practice:
        * `1 to 5 Years` ➡️ **5 Marks**
        * `5 to 7 Years` ➡️ **7 Marks**
        * `7 to 10 Years` ➡️ **10 Marks**

### 3. Household Economic Status & Social Demographics (Max: 15 Marks)
*Targets social equity, inclusivity, and entrepreneurial demographic incentives.*

* **Youth Entrepreneurship (10 Marks):**
    * *Automation Rule:* Derived directly from the applicant's national identity database profile. `Age < 35 Years` = **10 marks**; `Age ≥ 35 Years` = **0 marks**.
* **Special Social Considerations (5 Marks):**
    * *Automation Rule:* Direct inclusion for vulnerable or marginalized categories (e.g., Widowed or Differently-abled individuals) backed by social services certification = **5 marks**.

### 4. Economic Contribution & Innovation (Max: 25 Marks)
*Measures macro-environmental benefits, employment generation, and sector modernization.*

* **Job Creation / Employment Generation (10 Marks):**
    * *Automation Rule:* Headcount calculation of active employees on payroll (excluding the business owner):
        * `1 to 5 Employees` ➡️ **5 Marks**
        * `5 to 7 Employees` ➡️ **7 Marks**
        * `7 to 10 Employees` ➡️ **10 Marks**
* **Non-Traditional Industries (10 Marks):**
    * *Automation Rule:* Categorization filter. If the business sector is **NOT** Tailoring/Garments and **NOT** Furniture/Woodwork = **10 marks**. Traditional baseline fields receive **0 marks** to encourage modernization.
* **Product Quality Improvement / Value Addition (5 Marks):**
    * *Automation Rule:* Verification of quality certifications (e.g., SLS, ISO, organic packaging, or technical processing upgrades) = **5 marks**.

### 5. Special Awards & Recognition (Max: 10 Marks)
*Acknowledges verified excellence and validated community market success.*

* **Regional Level Recognition:** Verified local governance/divisional reward = **2 Marks**
* **District / Provincial Level Recognition:** Verified regional award = **3 Marks**
* **National Level Recognition:** Apex state or national institutional award = **5 Marks**

---

## ⚙️ How the Automation Logic Works

```
[Applicant Submission] 
       │
       ▼
┌────────────────────────────────────────────────────────┐
│               Data Extraction & Validation             │
│  - OCR scanning of Business Registration & Licenses   │
│  - National Identity Database lookup for age check    │
│  - Document verification for NVQ & Awards             │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│               Conditional Scoring Engine               │
│  - Evaluates inputs against mathematical inequalities  │
│    (e.g., If Age < 35 -> Assign 10 Marks)              │
│  - Maps tiered values (Income ranges, Employee counts) │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│             Aggregation & Ranking Algorithm            │
│  - Total Score = Sum of Components (Max 100)           │
│  - Automatic Rank sorting from highest to lowest score │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
[Final Approved Grantee List]
```

1.  **Standardized Ingestion:** Applicants submit numerical data (e.g., monthly revenue, years of experience, employee headcounts) and qualifying verification files.
2.  **Deterministic Rules:** The system eliminates manual guesswork by implementing conditional routing (e.g., `IF industry != "tailoring" AND industry != "furniture" THEN score += 10`).
3.  **Tier Aggregation:** Variable metrics like revenue are bucketed automatically into distinct score segments, ensuring strict consistency across every applicant profile.
4.  **Instant Ranking:** The final scores are auto-calculated, generating an unbiased, prioritized ledger of recommended beneficiaries sorted cleanly by maximum score matrix execution.
