---
title: Data Processing Addendum
description: The terms under which Fabrique-Futur LLC processes form submissions as a processor for Formhaus Cloud customers.
sidebar: false
---

# Formhaus Cloud Data Processing Addendum

**Effective date: October 12, 2026**

This Data Processing Addendum ("**DPA**") is part of the [Terms of Service](./terms.md) or other written agreement (the "**Agreement**") between **Fabrique-Futur LLC**, a Wyoming limited liability company ("**Fabrique-Futur**," "**we**," "**Processor**"), and the customer that accepts the Agreement ("**Customer**," "**Controller**," "**you**"). It governs the processing of Personal Data in **Formhaus Cloud** (the "**Service**").

When you use the Service to process Personal Data subject to Data Protection Laws, you and we agree to this DPA. If you need a signed copy, write to legal@formhaus.dev. Where this DPA conflicts with the rest of the Agreement on data protection, this DPA controls.

---

## 1. Definitions

- **Data Protection Laws**: all laws that apply to the processing of Personal Data under the Agreement, including the EU General Data Protection Regulation 2016/679 ("**EU GDPR**"), the UK GDPR and Data Protection Act 2018 as amended by the Data (Use and Access) Act 2025 ("**UK GDPR**"), the Swiss Federal Act on Data Protection ("**FADP**"), and the California Consumer Privacy Act as amended by the CPRA ("**CCPA**"), each where applicable.
- **Controller**, **Processor**, **Data Subject**, **Personal Data**, **Processing**, **Personal Data Breach**, **Special Categories of Personal Data** and **Supervisory Authority** have the meanings given in the EU GDPR. For the CCPA, **Business**, **Service Provider**, **Personal Information** and **Sell/Share** apply and map to Controller, Processor, Personal Data and the corresponding activities.
- **Customer Personal Data**: Personal Data that we process for you in the Service, contained in your Forms and in Submission Data, including Personal Data that Respondents submit.
- **Form**, **Respondent**, **Submission Data**, **API Key**, **Agent Key**, **Agent**, **Unclaimed Form** and **Workspace** have the meanings given in the Terms.
- **Sub-processor**: a third party we engage to process Customer Personal Data, as listed on the [Sub-processors](./sub-processors.md) page.
- **SCCs**: the Standard Contractual Clauses approved by the European Commission on 4 June 2021 (Commission Implementing Decision (EU) 2021/914).
- **UK Addendum**: the International Data Transfer Addendum to the EU SCCs issued by the UK Information Commissioner under section 119A of the Data Protection Act 2018, version B1.0, in force from 21 March 2022, as revised under its Section 18.

---

## 2. Roles and scope

- For Customer Personal Data, **you are the Controller (or Business)** and **we are the Processor (or Service Provider)**. If you act as a processor for another controller, you appoint us as your sub-processor and confirm that you have authority to do so.
- For Personal Data that we process as a controller (account data, billing data, security and operations data, and website visit data), our [Privacy Policy](./privacy.md) applies instead of this DPA.
- **Unclaimed Forms.** Before a claim, no Workspace holds an Unclaimed Form, and we are the controller of its Submission Data for a limited purpose: to provide the Form, return the Submission Data to the Agent Key that created the Form, apply abuse controls and delete it on expiry. Section 2 of the [Privacy Policy](./privacy.md) describes this, and we act on a Respondent's requests directly. From the moment of the claim, the Submission Data becomes Customer Personal Data of the Customer that claims the Form, and this DPA applies to it.

---

## 3. Processing instructions

- We process Customer Personal Data only on your documented instructions, including the Agreement and this DPA, and as needed to **provide, secure, support and debug the Service** for you (the "**Permitted Purposes**"), as Annex I describes, unless the law requires otherwise. In that case we will tell you before processing, unless the law forbids it.
- Your configuration of the Service is an instruction. This includes the fields of your Forms, your plan's retention period, email notifications, webhook URLs, API Keys, Agent Keys you keep at a claim, and the Agents that you let use them. When you send Submission Data to a webhook or an Agent, you instruct us to deliver it there.
- We will tell you if, in our opinion, an instruction breaks Data Protection Laws.
- **We do not use Customer Personal Data to train AI or machine-learning models.** We send it to an AI agent only when you give that agent an API Key or keep its Agent Key. We do not use it for advertising.
- **CCPA service-provider terms.** For Personal Information governed by the CCPA, we act as a **Service Provider** and:
  - do not **sell** or **share** Customer Personal Data;
  - do not retain, use or disclose it for any purpose other than the business purposes listed in Annex I, or outside our direct business relationship with you;
  - do not combine it with personal information from other sources, except as the CCPA permits;
  - give it the level of privacy protection the CCPA requires of businesses;
  - will tell you if we can no longer meet our CCPA obligations;
  - allow you, on notice, to take reasonable and appropriate steps to stop and fix unauthorized use, whether or not we have told you that we cannot comply;
  - allow you to take reasonable and appropriate steps to make sure we use it in line with your CCPA obligations;
  - impose the same restrictions on our Sub-processors.

  We certify that we understand and will comply with these restrictions.

---

## 4. Confidentiality and personnel

Personnel who can access Customer Personal Data are bound by confidentiality obligations and access it only when needed to operate, support or secure the Service.

---

## 5. Security

We implement and maintain the technical and organizational measures in **Annex II**. We review them regularly and may update them, provided the overall protection is not materially reduced.

The Service is not designed for payment card data, credentials, Special Categories of Personal Data, data about criminal convictions or offences, government identification numbers, personal data collected from children or protected health information subject to HIPAA, and Section 7 of the Terms forbids collecting them, except protected health information under our prior written agreement. Hosted pages and the embed do not render password or file upload fields.

---

## 6. Sub-processors

- You give **general authorization** for us to engage Sub-processors. The current list is on the [Sub-processors](./sub-processors.md) page.
- We impose data-protection obligations on each Sub-processor that are no less protective than this DPA, and we remain responsible for their performance.
- We will give notice of a new or replacement Sub-processor that processes Customer Personal Data at least **15 days** before it starts, by updating the [Sub-processors](./sub-processors.md) page **and** by email to the owners of your Workspace.
- **Objection.** You may object on reasonable data-protection grounds by writing to **legal@formhaus.dev within 15 days** of the notice. We will work with you in good faith to address the concern within 30 days, for example by not using that Sub-processor for your data. If we cannot, you may end the affected subscription and receive a pro-rata refund of prepaid, unused fees for it.
- **Urgent replacement.** If a Sub-processor must be replaced urgently because of an outage, a security issue or a legal issue, we will give notice as soon as we can and, where the SCCs or Data Protection Laws require it, we will not let the replacement process Customer Personal Data before the notice period ends. Where the affected processing cannot wait, we may suspend it until then. We will not engage a replacement in a way that breaks the authorization requirements of the SCCs.

---

## 7. Data-subject requests

We will help you, by appropriate technical and organizational measures and as far as possible, to answer Data Subjects' requests to exercise their rights. You can find and export submissions yourself in the dashboard, the REST API and the MCP server, and delete a Form with all of its submissions. The Service has no control to delete or correct a single submission; on your instruction from the address of a Workspace owner, we delete or correct individual submissions within 30 days. If a Respondent sends a request about Customer Personal Data to us, we will, where the law permits, forward it to you and tell the Respondent that we have done so. We do not answer the request on your behalf unless you instruct us to.

---

## 8. Personal Data Breaches

- We will notify you **without undue delay** after we become aware of a Personal Data Breach affecting Customer Personal Data, and we aim to do so within **72 hours**. We will not wait until our investigation is complete.
- The notice will describe, as far as known: the nature of the breach, the categories and approximate number of Data Subjects and records affected, the likely consequences, the measures taken or proposed, and a contact point. If we cannot give all the information at once, we will give it in phases without further undue delay, with updates until the breach is contained.
- We send the notice by email to every owner of the affected Workspace. You can name a security contact by writing to legal@formhaus.dev, and we will copy it. The contact point for the breach is legal@formhaus.dev.
- We will contain the breach, preserve the evidence, cooperate with you and give you the information you need to meet your own notification duties.
- A notice is not an admission of fault.

---

## 9. Impact assessments and consultations

Taking into account the nature of the processing and the information available to us, we will give reasonable help with your data-protection impact assessments and prior consultations with Supervisory Authorities that relate to the Service.

---

## 10. International transfers

- Customer Personal Data is stored in the EU (DigitalOcean region fra1, Frankfurt, Germany). Transfers happen when our personnel access the Service from outside the EU to operate it, and when Sub-processors outside the EEA process it, as listed on the [Sub-processors](./sub-processors.md) page.
- Where processing involves a transfer from the EEA, UK or Switzerland to a country without an adequacy decision, the **SCCs** apply and are incorporated by reference, completed as set out in **Annex III**. **Module Two** (Controller to Processor) applies where you are a controller; **Module Three** (Processor to Processor) applies where you are a processor. For UK transfers the **UK Addendum** applies; for Swiss transfers the SCCs apply with the changes in Annex III.
- Where a Sub-processor is certified under the EU-US Data Privacy Framework (and its UK Extension), that framework may apply as an additional basis. The SCCs are the primary safeguard between you and us.
- The SCCs and the UK Addendum prevail over any conflicting term of the Agreement or this DPA.
- If a transfer mechanism is invalidated or must be replaced, the parties will work in good faith to put a lawful alternative in place.

---

## 11. Retention, deletion and return

- During the Agreement, Customer Personal Data is kept for the retention period of your plan, as stated in the [Terms](./terms.md): 90 days per submission on the Free plan, and until you delete it on the Pro and Team plans. After a move from a paid plan to Free, submissions older than 90 days are kept for 60 days after the change and then deleted.
- You can export submissions as CSV from the dashboard, or read them as JSON through the REST API and the MCP server, at any time before deletion. This is how we return Customer Personal Data.
- When you delete Forms or your account, we delete the data from the live database at once. Backups that contain it expire within **30 days**, and stay protected by this DPA until then. If we restore a backup, we delete again the data that was deleted after the backup was taken.
- **At the end of the Agreement**, you may choose to export your data and then have it deleted, or to have it deleted. If your dashboard access is disabled, we provide an export on a verified request to legal@formhaus.dev made within 30 days, unless the law forbids it. We delete Customer Personal Data within **30 days** of termination, and its backup copies expire within a further **30 days**, unless the law requires us to keep it. Data we must keep is limited to what the law requires and stays protected by this DPA.
- This Section controls over any conflicting deletion or retention statement in the Agreement or the Privacy Policy for Customer Personal Data.

---

## 12. Audits

- We will make available the information reasonably needed to show compliance with this DPA, including this DPA, its Annexes and any third-party reports we hold.
- Where that information does not satisfy an audit right that Data Protection Laws or the SCCs give you, you or an independent auditor bound by confidentiality may audit, on at least 30 days' written notice, at your own cost, during business hours and without disrupting the Service.
- Routine audits happen no more than once a year. Additional audits may happen after a Personal Data Breach that affects your data, where there is reasonable evidence of a material breach of this DPA, or where a Supervisory Authority or the law requires one.
- An audit may examine the controls that protect your Customer Personal Data, including controls shared with other customers, but not other customers' data or confidential information.

---

## 13. Liability

Each party's liability under this DPA is subject to the limitations in the Agreement. Nothing in the Agreement or this DPA limits liability, remedies or rights that cannot be limited under the SCCs or mandatory Data Protection Laws, and the SCCs prevail over any conflicting term. Data Subjects' rights under the SCCs and Data Protection Laws are not affected by any liability cap.

---

## Annex I: Description of processing

- **Subject matter:** hosting forms and receiving, validating, storing and delivering form submissions for the Customer.
- **Duration:** the term of the Agreement, plus the deletion period in Section 11.
- **Nature and purpose (the business purposes):** storing Form definitions; receiving submissions through the public endpoint, hosted pages and the embed; validating them against the Form definition; storing them; showing them in the dashboard; exporting them as CSV; returning them as JSON through the REST API and MCP server to the Customer and to Agents that hold the Customer's keys; sending them to the Customer by webhook; notifying the Customer by email of new submissions with form titles and counts only; applying rate limits, plan limits and abuse controls; backing them up; and securing, supporting and debugging the Service.
- **Types of Personal Data:** decided by the Customer through the fields of its Forms. Typically names, email addresses, phone numbers, company details and free-text answers. Submission metadata: submission time, user agent, referrer and skipped steps. The Service does not store Respondents' IP addresses. Section 7 of the Terms forbids collecting credentials, payment card data, Special Categories of Personal Data, data about criminal convictions or offences, government identification numbers, personal data collected from children, and protected health information subject to HIPAA without our prior written agreement.
- **Categories of Data Subjects:** Respondents to the Customer's Forms, and any people that Respondents mention in their answers.
- **Special Categories:** none.
- **Frequency:** continuous, while the Customer's Forms accept submissions.

---

## Annex II: Technical and organizational security measures

- **Location:** the application, database and backups are hosted by DigitalOcean in the fra1 region (Frankfurt, Germany).
- **Encryption in transit:** TLS on all public hosts (api.formhaus.dev, app.formhaus.dev, f.formhaus.dev), with HTTP Strict Transport Security. Webhooks are delivered only to HTTPS URLs.
- **Encryption at rest:** database backup archives are encrypted on the server with public-key encryption (age) before they are copied off-site. The decryption key is not stored on the server or with the archives. The server's local disk and DigitalOcean's server backup images are not encrypted by us.
- **Secrets and credentials:** sign-in tokens, session tokens, API Keys, Agent Keys, claim tokens and invite tokens are stored only as keyed hashes (HMAC-SHA256). Keys are shown once. Production secrets are kept out of source control.
- **Authentication and access:** passwordless sign-in with single-use links that expire after 15 minutes; sessions in HttpOnly, Secure, SameSite=Lax cookies that expire after 30 days; rate limits on sign-in per email and per IP; sign-in responses do not reveal whether an account exists. State-changing dashboard requests are checked against `Sec-Fetch-Site` and `Origin`. Members see only the Workspaces they belong to, with owner, editor or viewer rights. API Keys reach only their Workspace, and Agent Keys reach only the Forms they created.
- **Administrative access:** production access is limited to Fabrique-Futur personnel who need it, over SSH with keys only; password login is disabled. A host firewall denies all incoming traffic except SSH, HTTP and HTTPS, and repeated failed SSH logins are blocked. The application listens only on the local interface behind a TLS reverse proxy and runs as an unprivileged user with a restricted system profile. Releases are built and copied to the server over SSH by Fabrique-Futur personnel.
- **Data minimization:** Respondents' IP addresses are used in memory for rate limiting and are not stored. Abuse reports store a keyed hash of the reporter's network prefix with a key that changes daily. The claim email for an Unclaimed Form contains no form content. Notification emails contain form titles and counts, not submission values.
- **Input handling:** every submission is validated on the server against the Form definition, with limits on body size (64 KB) and definition size (32 KB). User-supplied patterns run in a sandbox with a time limit. Unknown fields are dropped. CSV exports escape cells that spreadsheets would run as formulas.
- **Webhook safety:** each Form has its own signing secret and every webhook is signed with HMAC-SHA256. The Service resolves the webhook host and refuses private, loopback, link-local and cloud-metadata addresses, connects to the resolved address, follows no redirects and reads at most 1 KB of the response.
- **Abuse controls:** rate limits per IP and per Form, a honeypot field and a minimum fill time on hosted pages, a notice and `noindex` on Unclaimed Forms, and automatic pausing of an Unclaimed Form after reports from 3 distinct networks within 24 hours.
- **Availability and recovery:** nightly database backups, checked to be readable before they are encrypted, kept on the server for 7 days and off-site for 30 days; daily DigitalOcean backup images of the server kept for 7 days. A submission and its notification and webhook jobs are committed in one database transaction. Recovery of data accepted after the last backup depends on the server's disk.
- **Development:** automated tests and dependency vulnerability scanning (govulncheck and npm audit) before each release.

---

## Annex III: SCC completion

- **Sub-processors:** as listed on the [Sub-processors](./sub-processors.md) page, which is part of this DPA.
- **Parties (Annex I.A of the SCCs):**
  - **Data exporter:** the Customer, acting as controller or processor of Customer Personal Data, with the name, address and contact email in its account and billing records. Its activities: use of the Service to collect form submissions.
  - **Data importer:** Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States, contact legal@formhaus.dev. Its activities: providing the Service as described in Annex I.
  - Each party signs the SCCs by accepting the Agreement, on the date of that acceptance.
- **Module:** Two (Controller to Processor) or Three (Processor to Processor), as applicable.
- **Clause 7 (docking):** applies.
- **Clause 9 (sub-processors):** Option 2 (general written authorization), with the notice period in Section 6 of this DPA.
- **Clause 11 (redress):** the optional independent dispute resolution wording does not apply.
- **Clause 13 (supervisory authority):** where the Customer is established in an EEA Member State, the supervisory authority of that Member State. Where the Customer is not established in the EEA but has appointed a representative under Article 27(1) of the EU GDPR, the supervisory authority of the Member State where the representative is established. Where the Customer is not established in the EEA and has no such representative, the supervisory authority of the Member State where the Data Subjects whose Personal Data is transferred are located.
- **Clause 17 (governing law):** the law of Ireland.
- **Clause 18 (forum):** the courts of Ireland, without affecting Data Subjects' rights.
- **Annexes I and II of the SCCs:** completed by Annexes I and II of this DPA.
- **Special Categories:** none. Section 7 of the Terms forbids collecting them.
- **UK transfers:** the UK Addendum applies to the SCCs. Table 1 (parties) is completed by the parties above. Table 2 (selected SCCs, modules and clauses) is completed by the selections in this Annex. Table 3 (appendix information) is completed by Annexes I, II and III of this DPA. Table 4: the importer may end the UK Addendum as set out in its Section 19. The mandatory clauses of the UK Addendum apply.
- **Swiss transfers:** the SCCs apply with these changes: the Swiss Federal Data Protection and Information Commissioner is the competent supervisory authority for transfers governed by the FADP; references to the EU GDPR include the FADP; "Member State" in Clause 18(c) includes Switzerland, so Data Subjects in Switzerland can bring claims in their place of habitual residence; Swiss law governs where the FADP alone applies.

---

## Contact

Data-protection contact: **legal@formhaus.dev**
Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States
