---
title: Terms of Service
description: The contract for using Formhaus Cloud, the hosted form backend operated by Fabrique-Futur LLC.
sidebar: false
---

# Formhaus Cloud Terms of Service

**Effective date: October 12, 2026**

These Terms of Service ("**Terms**") are a binding agreement between **Fabrique-Futur LLC**, a Wyoming limited liability company ("**Fabrique-Futur**," "**we**," "**us**," "**our**"), and the person or organization that uses **Formhaus Cloud** (the "**Service**").

You accept these Terms when you sign in to the Service, claim a Form, or create an API Key. The sign-in page and the claim page say that continuing accepts these Terms and the [Privacy Policy](./privacy.md), and we record the version you accepted and when. When an Agent publishes a Form without an account, the person who instructs the Agent accepts the parts of these Terms listed in Section 4 for that Form. If you accept on behalf of a company or other entity, you represent that you have authority to bind it, and "**you**" and "**Customer**" mean that entity.

If you do not agree to these Terms, do not use the Service.

---

## 1. Definitions

- **Service**: the hosted Formhaus Cloud service, including the submission endpoint and REST API at api.formhaus.dev, the remote MCP server at api.formhaus.dev/mcp, the dashboard at app.formhaus.dev, hosted form pages and the embed script at f.formhaus.dev, and related email notifications and webhooks.
- **Open-Source Project**: the Formhaus form definition format, `@formhaus/core`, `@formhaus/react`, `@formhaus/vue`, `@formhaus/mcp`, the Figma plugin and the JSON Schema, published under the MIT License.
- **Form**: a form definition published to the Service, with its versions and settings.
- **Respondent**: a person who fills in or submits a Form.
- **Submission Data**: the values a Respondent submits to a Form, and the metadata the Service records with them (submission time, user agent, referrer and skipped steps).
- **Customer Data**: your Forms and their Submission Data.
- **Account Data**: the data about you that we need to run your account, such as your email address, sessions, plan, billing records, records of your acceptance of these Terms and API Key metadata.
- **Agent**: software, including an AI model or coding assistant, that calls the Service on behalf of a person.
- **API Key**: a secret key (prefix `fh_live_`) that a Workspace owner creates in the dashboard. It authenticates requests to the REST API and the MCP server for that Workspace, including requests from an Agent that you give it to.
- **Agent Key**: a secret key (prefix `fh_agent_`) that the Service returns once to an Agent that publishes a Form without any key. Section 4 describes its scope, limits and expiry.
- **Unclaimed Form**: a Form published without an API Key that is not yet linked to a Workspace.
- **Workspace**: the space in the dashboard that holds Forms, API Keys and a plan, and that one or more accounts belong to as members.
- **Owner**: the account that has claimed or created a Form, and the owners of the Workspace that holds it.
- **Consumer**: an individual who uses the Service for purposes outside their trade, business, craft or profession.
- **Sub-processor**: a third party we engage to process Customer Data, as listed on the [Sub-processors](./sub-processors.md) page.

---

## 2. The Service and the Open-Source Project

These Terms apply only to the Service. The Open-Source Project is licensed under the MIT License. Its license, not these Terms, governs your use of it, and you can use it without the Service.

We grant you a non-exclusive, non-transferable, revocable right to use the Service while these Terms are in effect, subject to these Terms and the limits of your plan.

We may add, change or remove features. Section 10 describes what happens if a change reduces what a paid plan includes.

---

## 3. Eligibility and accounts

- You must be at least 18 years old to use the Service. You may use the Service for business or personal purposes. Nothing in these Terms limits rights that mandatory law gives you as a Consumer.
- You sign in with a one-time link sent to your email address. You must use an email address that you control and keep it current. Anyone with access to that mailbox can access your account.
- You are responsible for activity under your account, including activity through your API Keys and through Agents that you let act for you. You are not responsible for activity caused by our breach of these Terms or by a security failure on our side.
- A Workspace owner can invite members and give them the owner, editor or viewer role. The owners of a Workspace are responsible for its members, Forms, API Keys and plan.
- Tell us at legal@formhaus.dev without delay if you suspect unauthorized use of your account, an API Key or an Agent Key.

---

## 4. AI agents, keys and Unclaimed Forms

**Agents act for you.** The Service is designed to be used by Agents. When an Agent publishes a Form, reads submissions or changes a Form for you, you are responsible for what it does as if you had done it yourself. We do not verify that an Agent has authority to act for anyone.

**API Keys.**

- An API Key gives an Agent or a program editor access to the Forms and Submission Data of its Workspace through the REST API and the MCP server. It works only while the owner who created it is still an owner of the Workspace. We show a key once and store only a keyed hash of it.
- Keep API Keys secret. Do not put an API Key in a web page, a client-side bundle or a public repository. Only the public form id belongs in a page.
- If you give an API Key to an Agent, the Agent can read your Submission Data. Data that an Agent reads leaves the Service and is processed by that Agent and its model provider under your own agreements with them. We are not responsible for that processing.
- Revoke an API Key in the dashboard as soon as you no longer need it or think it is exposed.

**Agent Keys.**

- The Service returns an Agent Key once, in the result of the first publish without any key. It reaches only the Forms that it created. It can list them, read their Submission Data, publish new versions, pause, resume and delete them, and publish up to 3 Unclaimed Forms at a time. A Form it deletes counts toward the 3 for 24 hours. It cannot change other settings.
- An Agent Key expires when the last Unclaimed Form it created expires.
- **At a claim**, the claim page lists the Forms that move to the Workspace and says that the Agent Key can read their responses. By default, the claim turns the Agent Key off. If the person who claims chooses to let the Agent keep access, the key moves to the Workspace under API Keys. It then reaches only the Forms that it created, and any owner can revoke it there.

**Unclaimed Forms.**

- An Agent can publish a Form without an account. The person who instructs the Agent, or on whose behalf it publishes, accepts Sections 4, 5, 7, 8, 16, 17 and 18 of these Terms for that Form, and is responsible for the Form, for keeping the Agent Key secret, and for the Submission Data that the Agent reads. The publish result includes a link to these Terms and tells the Agent to pass it on.
- An Unclaimed Form accepts at most 100 submissions and expires 7 days after it is published. A daily job then deletes the Form and its Submission Data.
- The hosted page and the embed of an Unclaimed Form show this notice to Respondents: "Published by an AI agent and not yet linked to an account. Whoever runs the agent can read what you send. Don't enter passwords or payment details." with a "Report" link. The page is not indexed by search engines.
- Unclaimed Forms do not send email notifications or webhooks.
- **Our role before a claim.** Until a Form is claimed, no Workspace holds it, so we handle its Submission Data as a controller for a limited purpose: to run the Form, return the Submission Data to the Agent Key that created it, apply abuse controls and delete it on expiry. Section 2 of the [Privacy Policy](./privacy.md) and Section 2 of the [Data Processing Addendum](./dpa.md) describe this.
- To keep a Form, open the claim link and sign in. The account that claims a Form becomes its Owner, accepts these Terms for it, and takes responsibility for its Submission Data from the claim on, including the Submission Data the Form collected before the claim. Claiming a Form does not mean we have checked that it is legitimate.
- If an Agent gives an email address when it publishes, we send a claim email to that address. The email does not contain form content. If you did not ask for it, you can ignore it.

---

## 5. Your forms and your respondents

When you collect personal data with a Form, you decide what to collect and why. For that data you are the controller (or "business"), and we process it for you as your processor (or "service provider") under the [Data Processing Addendum](./dpa.md).

You are responsible for:

- having a lawful basis for collecting and using Submission Data, and getting any consent the law requires;
- telling Respondents who you are and how you use their data, in the Form's title or description or in a privacy notice the Form links to. Hosted pages show Formhaus branding, links to these Terms and our Privacy Policy, and a "Report abuse" link. They do not show who you are unless you put it in the Form;
- answering Respondents' requests to access, correct or delete their data. You can read and export submissions in the dashboard, the REST API and the MCP server, and delete a Form with all of its submissions. The Service has no control to delete or correct a single submission. For that, write to legal@formhaus.dev from the address of a Workspace owner, name the Form and the submission, and we will make the change within 30 days;
- the systems that receive Submission Data from you, including webhook endpoints and Agents. Our responsibility for a copy ends when we deliver it to an endpoint or address that you configured;
- the content, legality and accuracy of your Forms.

---

## 6. Customer Data

- **You own your Customer Data.** We do not claim ownership of it.
- You grant us a worldwide, non-exclusive license to host, copy, validate, transmit and display Customer Data **only** to provide, secure, support and debug the Service for you (the "**Permitted Purposes**"). The license ends when the Customer Data is deleted from the Service, including from backups as described in Section 14.
- **We do not sell Customer Data. We do not use Customer Data to train AI or machine-learning models, ours or anyone else's. We do not use Customer Data for advertising.**
- We may compute aggregate statistics about use of the Service, such as numbers of forms, submissions and errors, to operate and plan the Service. These statistics do not contain Submission Data and do not identify you or any Respondent.
- The Service is not a backup or archive. Export the data you need to keep, especially on the Free plan, where submissions are deleted after 90 days.

---

## 7. Acceptable use

You must not use the Service, and must not let an Agent or another person use it, to:

- collect passwords, one-time codes, recovery phrases or other credentials for any service;
- collect payment card numbers or card security codes. The Service is not certified under PCI DSS;
- impersonate a person, brand or organization, or run phishing or other deceptive forms;
- collect **special categories of personal data** (data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs or trade-union membership, genetic or biometric data used to identify a person, health data, or data about a person's sex life or sexual orientation), **personal data about criminal convictions or offences**, or **government identification numbers** (such as passport, national ID, driver's license, tax or social security numbers);
- direct a Form at children under 13, or under the age of digital consent where the Respondent lives (up to 16 in parts of the EU), or knowingly collect personal data from them;
- collect protected health information that is subject to the US Health Insurance Portability and Accountability Act (HIPAA), unless we have agreed to it in writing beforehand;
- collect personal data without the notices or consent the law requires;
- send spam or unsolicited messages, or use Forms or notifications to harass anyone;
- give the Service an email address that is not your own or your principal's when publishing a Form;
- host or distribute malware, or content that is illegal or infringes the rights of others;
- attack, probe or overload the Service, bypass rate limits, plan limits or abuse controls, or access another customer's data;
- use webhooks to make requests to systems you are not authorized to reach;
- create many accounts or Unclaimed Forms to avoid plan limits or abuse controls;
- resell the Service as a standalone form backend without our written permission.

Hosted pages and the embed do not render password fields or file upload fields. This does not make it lawful to collect the data listed above in other ways.

**Prohibited data received anyway.** If we learn that a Form collects data that this Section prohibits, we may pause the Form at once and will tell its Owner. The Owner must change the Form and delete the affected submissions, or ask us to delete them, within 14 days. If the Owner does not, or if the Form is unclaimed, we delete the affected submissions. We keep a copy only where the law requires it.

---

## 8. Abuse reports, notices and removal

- **How to report.** Anyone can report a Form through the "Report abuse" link on its hosted page, or by email to legal@formhaus.dev. The report link is anonymous and shows a confirmation on the page. An email notice should include the form link, an explanation of why the content is illegal or breaks these Terms, your name and email address, and a statement that you make the notice in good faith and that its content is accurate. We acknowledge email notices without undue delay.
- **What we do.** We review reports and may pause, disable or delete a Form, revoke API Keys or Agent Keys, or suspend an account, without liability, if we reasonably believe it breaks Section 7, puts Respondents or the Service at risk, or if the law requires it. For phishing, credential theft or other illegal activity, we may restrict any Form, claimed or unclaimed, at once on a credible report or other evidence. We do not need to wait for more reports or for the Owner's response. In other cases, where it is practical and lawful, we tell the Owner and give a chance to fix the issue first. A paused Form rejects new submissions.
- **Automatic controls.** An Unclaimed Form is paused automatically after reports from 3 different networks within 24 hours. A report on a claimed Form is emailed to its Owner. These controls do not limit what we can do under this Section.
- **Decisions and appeals.** When we restrict a Form, we tell the Owner by email which Form, what we did and why, unless the law forbids it. If you think we restricted a Form by mistake, or you sent a notice and disagree with our decision, write to legal@formhaus.dev. A person reviews every appeal.
- **Copyright complaints.** If you believe a Form infringes your copyright, send a notice to legal@formhaus.dev that identifies the work, the Form link, your contact details, a statement that you believe in good faith that the use is not authorized, a statement that the notice is accurate and that you are the owner or authorized to act for the owner, and your signature. We remove or disable access to the material and tell the Owner. The Owner can send a counter-notice to the same address with the same elements and a statement, under penalty of perjury, that the material was removed by mistake. We terminate, in appropriate circumstances, the accounts of users who repeatedly infringe.

---

## 9. Plans, limits and fees

- **Plans.** The Service has Free, Pro and Team plans, listed on the pricing page at https://formhaus.dev/cloud#pricing. At the effective date, the prices and limits are:

  | Plan | Price | Forms | Submissions per month | Editors | Webhooks | Submission retention |
  |---|---|---|---|---|---|---|
  | Unclaimed Form | $0 | 1 per publish | 100 in total | None | No | 7 days |
  | Free | $0 | 3 | 100 | 1 | Yes | 90 days |
  | Pro | $19/month or $190/year | Unlimited | 25,000 | 3 | Yes | Until you delete them |
  | Team | $49/month or $490/year | Unlimited | 100,000 | 10 | Yes | Until you delete them |

- **Seats.** Editor limits count owners and editors. Viewers are unlimited on every plan.
- **Counting.** Submissions are counted per Workspace per calendar month (UTC). Submissions to an Unclaimed Form are counted per Form.
- **Over the limit.** When a Workspace reaches its monthly submission limit, the endpoint rejects new submissions until the next month or until you upgrade. We do not store rejected submissions.
- **Buying a paid plan.** A Workspace owner buys Pro or Team through checkout in Settings → Usage and plan. Checkout asks you to accept these Terms. Our payment processor, Stripe, collects your payment details; we do not store card numbers. The total payable amount, including any tax we must charge, is shown before you pay. The plan starts when the payment succeeds, and so does the billing period.
- **Renewal.** A paid plan is a subscription that renews automatically at the end of each billing period (one month or one year) at the price then in effect, until you cancel. Before a yearly subscription renews, Stripe emails you a reminder with the renewal date and amount at least 15 and at most 45 days before the renewal.
- **Cancellation.** You can cancel at any time in Settings → Usage and plan → **Manage billing**, or by email to hello@formhaus.dev. We confirm the cancellation by email. Cancellation stops the next renewal. You keep paid-plan access until the end of the current paid period, and the Workspace then moves to the Free plan.
- **Downgrade.** If a Workspace moves from a paid plan to Free, including after cancellation or non-payment, Free limits apply from the change. Submissions older than 90 days are kept for 60 days after the change and then deleted. Export them before then if you need them.
- **Changes to prices or limits.** We may change prices or plan limits for future billing periods. We give at least 30 days' notice by email, and for a yearly subscription at least 30 days before its renewal. A change applies from your next renewal, and you can cancel before it does.
- **Refunds.** Fees are not refundable for partial periods, except: (a) under the right of withdrawal below; (b) under Sections 10, 17 and 19; and (c) where the law requires a refund. Mandatory refund, withdrawal and conformity rights are not affected.
- **Consumers in the EU, UK and Switzerland: right of withdrawal.** If you are a Consumer, you can withdraw from a paid subscription within 14 days of buying it, without giving a reason, by a clear statement by email to hello@formhaus.dev. By starting the subscription, you ask us to provide the paid plan at once, during the withdrawal period. If you withdraw, you pay a proportionate amount for the days the paid plan was active, and we refund the rest within 14 days of your statement, to the original payment method.
- **Non-payment.** If a payment fails, we email you and our payment processor retries the payment for at least 14 days. If the payment still fails, the subscription ends and the Workspace moves to the Free plan.

---

## 10. Availability and changes

The Service has no uptime commitment unless a separate written agreement states one. We may label features as beta. Beta features are provided "as is", may change or be withdrawn at any time, and have no service commitment.

We may update the Service, including its limits and abuse controls, to keep it secure and working. A change that materially reduces the core functions of a paid plan normally takes effect at your next renewal, and we give at least 30 days' notice. If we make such a change during a prepaid period, or stop offering the Service, you may cancel the affected subscription and we refund the prepaid fees for the unused part of the period. Where it is lawful and safe, we give you time to export your data first.

---

## 11. Confidentiality

Each party may receive non-public information of the other ("**Confidential Information**"). The receiving party will use it only to perform under these Terms and protect it with reasonable care. This does not apply to information that is public through no fault of the receiver, that the receiver developed independently, or that it received lawfully from a third party. Customer Data is your Confidential Information. A party may disclose Confidential Information when the law requires it, with notice where the law permits.

---

## 12. Intellectual property and feedback

- We and our licensors own the Service, except for the parts licensed to you under the MIT License as the Open-Source Project. These Terms give you a right to use the Service, not ownership of it.
- "Formhaus," "Fabrique-Futur" and their logos are our trademarks. Hosted pages show a "Made with Formhaus" badge. Do not remove or hide it.
- If you give us feedback, we may use it without restriction and without payment to you.

---

## 13. Security

We protect the Service and Customer Data with the measures described in Annex II of the [Data Processing Addendum](./dpa.md). You are responsible for the security of your email account, your API Keys and Agent Keys, your webhook endpoints and the sites where you embed Forms.

---

## 14. Term, termination and deletion

- These Terms apply while you have an account, own a Form, or use the Service.
- You can delete Forms (with all of their submissions), Workspaces and your account at any time in the dashboard. Deleting your account also deletes the Workspaces where you are the only member. Workspaces with other members stay, with their Forms and data. If you are the only owner of a Workspace that has other members, make another member an owner or remove the members first.
- We may suspend or terminate your access for a material breach of these Terms (including Section 7) that you do not fix within 14 days of our notice, for non-payment, or when the law requires it. We may suspend at once where security, Respondents or the law require it. We may close a Free account with 30 days' notice.
- **Deletion.** When you delete a Form or your account, we remove the data from the live database at once. Backups that contain it expire within 30 days. If we restore a backup, we delete again the data that was deleted after the backup was taken. If your account is terminated for another reason, we delete Customer Data within 30 days of termination, and its backup copies expire within a further 30 days, unless the law requires us to keep it.
- **Export.** Before deletion, you can export submissions as CSV from the dashboard, or read them as JSON through the REST API and the MCP server. If we disable your dashboard access, we provide an export on a verified request to legal@formhaus.dev made within 30 days of termination, unless the law forbids it. Deleted data cannot be restored or exported.
- **Survival.** Sections 6, 11, 12, 15, 16, 17, 18 and 20, accrued payment obligations, and the [Data Processing Addendum](./dpa.md) until Customer Data is deleted, survive termination.

---

## 15. Warranties and disclaimers

THE SERVICE IS PROVIDED **"AS IS" AND "AS AVAILABLE."** TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ANY WARRANTY THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE OR SECURE, OR THAT EVERY SUBMISSION, EMAIL NOTIFICATION OR WEBHOOK WILL BE DELIVERED. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.

This Section does not limit our express commitments in these Terms or in the [Data Processing Addendum](./dpa.md), or the statutory rights of Consumers.

---

## 16. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:

- NEITHER PARTY IS LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA OR GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY.
- OUR TOTAL LIABILITY ARISING OUT OF OR RELATED TO THE SERVICE, THESE TERMS OR THE DATA PROCESSING ADDENDUM, FOR ALL CLAIMS TOGETHER, WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) USD 100.

The exclusions and the cap in this Section do not apply to a party's obligations under Section 17, to your breach of Section 7, to your payment obligations, or to either party's gross negligence, fraud or willful misconduct. Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, or any other liability that cannot be excluded or limited under applicable law, including the mandatory rights of Consumers.

**Individual liability.** To the extent permitted by law, no member, manager, officer or employee of Fabrique-Futur LLC is personally liable to you for contractual claims arising from acting for Fabrique-Futur LLC under these Terms. Your contractual remedies are against Fabrique-Futur LLC. This does not limit liability that the law does not allow to be limited.

---

## 17. Indemnification

**By you.** You will defend us against third-party claims, and pay the damages and reasonable costs finally awarded or agreed in a settlement you approve, to the extent the claim arises from: (a) the content of your Forms, or Submission Data collected in breach of these Terms or the law; (b) your unlawful instructions to us; (c) use of the Service by you, your Agents or anyone using your API Keys or Agent Keys in breach of these Terms or the law; or (d) your processing of Submission Data outside the Service. This does not cover loss caused by our breach of these Terms or the Data Processing Addendum, or by our negligence or misconduct. If you are a Consumer, this paragraph applies only to the extent the law where you live permits.

**By us.** If you are on a paid plan, we will defend you against third-party claims that the Service, as we provide it and used in line with these Terms, infringes that third party's intellectual property rights, and pay the damages and reasonable costs finally awarded or agreed in a settlement we approve. If the Service is, or we believe it may become, subject to such a claim, we may: (a) get the right for you to keep using it; (b) change it so it does not infringe while keeping it materially equivalent; or (c) if neither is commercially reasonable, end the affected Service and refund prepaid, unused fees. This obligation does not cover claims arising from Customer Data, the Open-Source Project as licensed under the MIT License, combinations with products we did not provide, use in breach of these Terms, or changes we did not make. This is our entire liability for intellectual-property infringement.

**Process.** The indemnified party will notify the other promptly. A late notice removes the obligation only to the extent the delay harms the defense. The indemnifying party controls the defense, and the indemnified party may take part with its own counsel at its own cost and will cooperate reasonably. No settlement may admit fault by, impose a non-monetary obligation on, or fail to fully release the indemnified party without its prior written consent.

---

## 18. Governing law and disputes

These Terms are governed by the laws of the **State of Wyoming, USA**, without regard to conflict-of-laws rules, and excluding the U.N. Convention on Contracts for the International Sale of Goods.

The state and federal courts located in Wyoming have exclusive jurisdiction over disputes arising out of these Terms, and each party consents to that jurisdiction and venue. Either party may seek injunctive relief in any competent court to protect its intellectual property or Confidential Information.

**Consumers.** If you are a Consumer, you keep the protection of the mandatory consumer law of the country where you live, and you may also bring a claim in the courts of that country. If you are a Consumer in the EU, UK or Switzerland, we can bring a claim against you only in the courts of your country of residence.

This Section does not affect the forum and the rights of Data Subjects under the Standard Contractual Clauses described in the [Data Processing Addendum](./dpa.md).

---

## 19. Changes to these Terms

We may update these Terms. If a change is material, we will give notice by email or in the dashboard at least 30 days before it takes effect. Changes apply only from their effective date, not to past events. The sign-in and claim pages show the current Terms, and we record the version you accept. If you keep using the Service after the effective date, you accept the updated Terms, unless the law requires your express consent, in which case we ask for it.

If you do not agree to a material change, you can cancel and delete your account before it takes effect. If you cancel a paid plan for that reason, we refund the prepaid fees for the unused part of the period.

---

## 20. General

- **Assignment.** You may not assign these Terms without our consent, except to a successor in a merger or sale of substantially all assets. We may assign these Terms to an affiliate or in connection with a reorganization, merger or sale.
- **Entire agreement.** These Terms, the [Privacy Policy](./privacy.md), the [Data Processing Addendum](./dpa.md) and your plan are the entire agreement about the Service and replace earlier agreements on it. A separate written agreement that you sign with us controls where it conflicts with these Terms.
- **Order of precedence.** If documents conflict: a signed written agreement, then the Data Processing Addendum (for data protection), then these Terms, then other documentation.
- **Severability and waiver.** If a provision is unenforceable, the rest stay in effect. Not enforcing a provision is not a waiver.
- **Force majeure.** Neither party is liable for delays or failures caused by events beyond its reasonable control.
- **Independent parties.** These Terms create no partnership, agency or employment relationship.
- **Notices.** We give notice by email to the account address or in the dashboard. Send legal notices to legal@formhaus.dev.
- **Export controls and sanctions.** You may not access or use the Service where US sanctions or export-control laws prohibit it, including for a prohibited person, entity, destination or end use. You represent that you are not located in, organized under the laws of, or ordinarily resident in a country or region subject to comprehensive US sanctions (at the effective date, Cuba, Iran, North Korea, Syria, and the Crimea, so-called Donetsk People's Republic and Luhansk People's Republic regions of Ukraine), and that you are not on, or owned or controlled by anyone on, a US, EU or UK sanctions list. We may restrict access where we need to in order to comply with these laws.

---

## 21. Contact

**Fabrique-Futur LLC**
30 N Gould St, Ste R, Sheridan, WY 82801, United States
Legal, privacy, security, copyright and abuse reports: legal@formhaus.dev
General questions and billing: hello@formhaus.dev
