---
title: Privacy Policy
description: How Fabrique-Futur LLC handles personal data in Formhaus Cloud, for account holders, people who fill in forms and site visitors.
sidebar: false
---

# Formhaus Cloud Privacy Policy

**Effective date: October 12, 2026**

This Privacy Policy explains how **Fabrique-Futur LLC**, a Wyoming limited liability company ("**Fabrique-Futur**," "**we**," "**us**," "**our**"), handles personal data in **Formhaus Cloud** (the "**Service**"): the hosted form backend at api.formhaus.dev, app.formhaus.dev and f.formhaus.dev, and the website at formhaus.dev.

Formhaus Cloud is a form backend. Our customers ("**form owners**") use it to collect data from the people who fill in their forms ("**respondents**"). Terms such as Agent, Agent Key, API Key, Unclaimed Form and Workspace have the meanings given in the [Terms of Service](./terms.md). We have three roles:

- **Processor** for the data respondents submit to a form that a Workspace holds. The form owner decides what to collect and why, and is the controller. We process it for the form owner under our [Data Processing Addendum](./dpa.md).
- **Controller, for a limited purpose,** for submissions to Unclaimed Forms, which no Workspace holds yet. We store them so the form works, return them to the Agent Key that created the form, apply abuse controls, and delete them when the form expires. Section 2 describes this.
- **Controller** for the data we need to run the Service: account data, billing data, security data, and data about visits to our website. This policy describes that processing.

The open-source Formhaus libraries, Figma plugin and local MCP server run on your own machines. Used only locally, they send no data to us. When you use their Cloud features, such as publishing a form or reading submissions, they send the data needed for that request to the Service, and this policy and the [Terms](./terms.md) apply.

---

## 1. Who we are and how to contact us

- Privacy, legal and security contact: **legal@formhaus.dev**
- General questions: hello@formhaus.dev
- Post: Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States

---

## 2. If you filled in a form

For a form that a Workspace holds, the form owner is responsible for your submission. Hosted pages show Formhaus branding, links to our Terms and this policy, and a "Report abuse" link. They do not show who the form owner is unless the owner put it in the form. It is the form owner's job to tell you who they are and how they use your data.

- **What the Service stores:** the values you entered, the time of submission, your browser's user agent, the referring page, and which optional steps you skipped.
- **What it does not store:** your IP address. The Service uses your IP address in memory for rate limiting and then discards it. Section 7 describes what hosted pages keep in your browser.
- **Where it goes:** the form owner can see your submission in the dashboard, export it and send it to their own systems through a webhook or an AI agent. Email notifications to the form owner contain form titles and counts, not your answers. What happens to it there is up to the form owner.
- **Your rights:** contact the form owner to access, correct or delete your submission. If you cannot reach the form owner, write to legal@formhaus.dev with the form link; we will pass your request to the owner and help them respond.

**Unclaimed forms.** An AI agent can publish a form without an account. Until someone claims it, the hosted page shows: "Published by an AI agent and not yet linked to an account. Whoever runs the agent can read what you send. Don't enter passwords or payment details."

- The AI agent that published the form, and the person it works for, can read your submission through the Agent Key the Service gave the agent. The person who instructs the agent is responsible for what they do with it.
- We keep your submission so the form works, return it to that Agent Key, and apply abuse controls. Our legal basis is our legitimate interest in letting AI agents publish working forms without an account first.
- If nobody claims the form, it expires 7 days after it was published, and we delete it and its submissions within the following day. If someone claims it, the account that claims it becomes the form owner and the controller of your submission, and we process it for them as described above. The agent's access then ends, unless the person who claims chooses to let it keep access.
- To have your submission to an unclaimed form deleted earlier, write to legal@formhaus.dev with the form link and enough detail for us to find your submission, such as the time you sent it and a value you entered. We may ask for more to make sure the request is yours.

**Reporting a form.** If a form looks like phishing or abuse, use the "Report abuse" link on the page or write to legal@formhaus.dev. When you use the link, we store your report and a keyed hash of your network prefix (the first 24 bits of an IPv4 address or the first 48 bits of an IPv6 address, not your full IP address). The hash key changes every day, so we can count distinct reporters without storing your IP address.

---

## 3. The data we collect as controller

**You give us, or someone gives us about you:**

- **Account data:** your email address and plan. Sign-in uses one-time links sent by email; there are no passwords.
- **Acceptance records:** the version of the Terms you accepted, when, and whether at sign-in or at a claim, with the ids of the forms you claimed.
- **Claim data:** the email address an AI agent gives when it publishes a form, used to send the claim link to that address. The agent, not you, gave it to us.
- **Invitation data:** the email address and role a Workspace owner enters to invite you. The owner, not you, gave it to us.
- **Agent Key and API Key metadata:** key name, prefix, creation time, last use time and revocation time. We store only a keyed hash of the key itself.
- **Billing data:** plan and payment status. Stripe collects your payment details on its own page; we do not receive or store card numbers.
- **Communications:** messages you send us, including abuse reports and support requests.

**We collect automatically:**

- **Session data:** a session cookie on app.formhaus.dev and a keyed hash of the session token on our server.
- **Security and operations data:** application logs with error messages, background job results and timings, used for security and debugging. They do not contain IP addresses or submission values. IP addresses are used in memory for rate limiting and are not stored with your data. The server's firewall and SSH logs record the IP addresses of blocked connections and SSH login attempts.
- **Website visit data:** formhaus.dev is hosted by Vercel, which processes your IP address and request data in its logs to serve the site. We do not run analytics or tracking on formhaus.dev. The Playground page loads the Sandpack code bundler from codesandbox.io, which receives your IP address and the code in the editor.

The Service is not for special categories of personal data, and we do not intentionally collect them about account holders. The [Terms](./terms.md) forbid collecting them with forms.

---

## 4. How we use data

We use the data in Section 3 to:

- run the Service: sign you in, keep your forms and submissions, deliver webhooks, and send sign-in, claim and invite links, milestone emails, weekly summaries, webhook and abuse alerts. These emails contain form titles and counts, not submission values. You can turn milestone emails and weekly summaries off in the dashboard;
- send one welcome email from the founder about 10 minutes after your first sign-in, with setup steps;
- keep evidence that you accepted the Terms;
- enforce plan limits, rate limits and abuse controls;
- take payments and keep billing records;
- answer support requests and abuse reports;
- send service messages, such as notices about changes to these documents, security incidents or your plan;
- secure, debug and improve the Service, using account and operations data, not Submission Data;
- comply with the law and enforce our [Terms](./terms.md).

**We do not sell personal data. We do not use submissions or other customer data to train AI or machine-learning models. We do not show ads or share data for advertising.** The Service does not send submissions to any AI provider. We disclose submissions to an AI agent only when the form owner has given it a key, or, for an unclaimed form, to the agent that published it through the Agent Key the Service returned to it.

**No marketing emails.** We do not send newsletters or product update emails. If we start, we will ask for your consent where the law requires it, or rely on the existing-customer exception where it applies, and every such email will have an unsubscribe link. Service emails, such as sign-in links and notices about your account, are sent regardless.

---

## 5. Legal bases (EU and UK GDPR)

- **Contract:** to provide the Service you signed up for, including sign-in, form hosting, service emails and billing.
- **Legitimate interests:** to secure the Service, prevent abuse, handle reports, keep acceptance records, debug and plan the Service, serve the website, send the welcome email, send claim and invite emails to the address an agent or a Workspace owner gave us, and run Unclaimed Forms as described in Section 2. We balance these interests against your rights, and you can object at any time (Section 11).
- **Legal obligation:** to keep billing records and respond to lawful requests.
- **Consent:** for marketing emails, if we ever send them and the law requires consent.

For submissions to a form that a Workspace holds, the form owner is responsible for the legal basis.

---

## 6. How we share data

- **Sub-processors and service providers** that help us run the Service, under contracts that limit their use of the data. They are listed on the [Sub-processors](./sub-processors.md) page.
- **Form owners**, who receive the submissions to their own forms.
- **The AI agent that published an unclaimed form**, which can read that form's submissions through its Agent Key, as described in Section 2.
- **Professional advisers**, such as lawyers and accountants, under confidentiality.
- **Authorities**, when the law requires it or to protect the rights and safety of people or the Service.
- **A successor** in a merger, acquisition or sale of assets, under this policy.

---

## 7. Cookies and browser storage

**app.formhaus.dev** (the dashboard):

- `__Host-fh_session`: keeps you signed in. Strictly necessary, HttpOnly and Secure, up to 30 days.
- `__Host-fh_next`: remembers which claim, invite or import page to return to after you sign in. Strictly necessary, HttpOnly and Secure, 30 minutes.
- `fh_theme`: your light or dark theme choice, set when you switch it. Up to 1 year.

**f.formhaus.dev** (hosted pages and the embed) sets no cookies. A hosted page keeps your answers in your browser's session storage (`fh:draft:` and the form id) while you fill in the form, so a reload does not lose them. That copy is deleted when you submit or close the tab and is not sent to us until you submit. A hosted page also stores your light or dark theme choice in local storage (`fh_theme`) when you switch it.

**api.formhaus.dev** sets no cookies.

**formhaus.dev** sets no cookies. It stores your light or dark theme choice in your browser's local storage. This value is not sent to us.

These are all strictly necessary or store a choice you made, so they need no consent. We use no analytics, advertising or cross-site tracking cookies. A site that embeds a form may set its own cookies; the site owner is responsible for those.

---

## 8. Where data is stored and international transfers

The Service and its database run on DigitalOcean in Frankfurt, Germany (region fra1). Encrypted database backups are stored in DigitalOcean Spaces in the same region, and DigitalOcean keeps daily backup images of the server in the same region. Our email provider, Resend, sends email through its Ireland region and stores email content and delivery records in the United States. Our payment provider and website host also process data in the United States; see the [Sub-processors](./sub-processors.md) page.

Fabrique-Futur is a US company, and our personnel access the Service from outside the EU to operate it. Where personal data is transferred from the EEA, UK or Switzerland to a country without an adequacy decision, we rely on the **2021 EU Standard Contractual Clauses** (with the **UK Addendum** for UK transfers and the changes Swiss law requires for Swiss transfers). For providers certified under the **EU-US Data Privacy Framework**, the framework is an additional basis. Ask at legal@formhaus.dev for a copy of these safeguards.

---

## 9. Retention

| Data | Kept for |
|---|---|
| Submissions on an unclaimed form | Deleted with the form within a day after it expires, 7 days after it was published, unless it is claimed |
| Submissions on the Free plan | 90 days after submission |
| Submissions on the Pro and Team plans | Until the form owner deletes the form or the account |
| Submissions after a move from a paid plan to Free | Submissions older than 90 days are kept for 60 days after the change, then deleted |
| Forms and their versions | Until the owner deletes them or the account |
| Account data and API Key metadata | For the life of the account |
| Acceptance records | For the life of the account |
| Agent Keys | Deleted when the last unclaimed form they created expires, or turned off at a claim. A key kept at a claim is kept as an API Key |
| Invitations | For the life of the Workspace; an unused invite stops working after 7 days |
| One-time sign-in links | 15 minutes, single use |
| Sessions | Up to 30 days, or until you sign out |
| Idempotency records (a hash of a submission, used to answer retries) | 24 hours |
| Webhook delivery log (status code, error type and timing, no submission values) | The last 100 delivery attempts per form |
| Abuse reports | For the life of the form |
| Support and abuse emails | Up to 2 years after the matter is closed |
| Application logs | Up to 90 days |
| Firewall and SSH logs | About 5 weeks |
| Billing records | Up to 7 years, for tax and accounting |
| Encrypted database backups | A copy on the server for 7 days and an off-site copy for 30 days |
| DigitalOcean server backup images | 7 days |
| Emails at Resend | 30 days |

When you delete a form, we remove it and its submissions from the live database at once. When you delete your account, we remove your account data at once, except the billing records, acceptance records, support emails and logs listed above, which we keep for the periods shown. Backups that contain deleted data expire within 30 days.

---

## 10. Security

The Service uses TLS for all connections, stores its database in the EU, encrypts database backups before they leave the server, stores only keyed hashes of sign-in tokens, session tokens, API Keys, Agent Keys and claim tokens, signs webhooks, blocks webhook requests to private networks, and rate-limits public endpoints. Annex II of the [Data Processing Addendum](./dpa.md) describes the measures in full.

If a breach affects your personal data, we will notify you and the relevant authorities as the law requires.

---

## 11. Your rights

Depending on where you live, you may have the right to access, correct, delete, restrict or object to the processing of your personal data, to receive it in a portable format, to withdraw consent, and not to be discriminated against for using these rights. You can object at any time to processing based on our legitimate interests, and to direct marketing without giving a reason.

To use them for data we control, write to **legal@formhaus.dev**. We will verify your request and answer within the time the law requires. For submissions to a form that a Workspace holds, contact the form owner first (see Section 2).

### United States

We do not sell or share personal information, including for cross-context behavioral advertising, and we do not use sensitive personal information beyond providing the Service. Wherever you live in the US, you can ask us to access, correct or delete your personal information, and you can use an authorized agent. If we deny your request, you can appeal by replying to our decision or by writing to legal@formhaus.dev with "Privacy appeal" in the subject.

- **California (CCPA/CPRA).** In the last 12 months we collected these categories of personal information, for the purposes in Section 4, and kept them as described in Section 9:

  | Category | Examples | Source | Disclosed for a business purpose to |
  |---|---|---|---|
  | Identifiers | Email address, account, key and Workspace identifiers | You; an AI agent or a Workspace owner who entered your address | Resend (email), Stripe (billing), DigitalOcean (hosting) |
  | Commercial information | Plan, payment status, acceptance records | You; Stripe | Stripe, DigitalOcean |
  | Internet or network activity | Session data, operations data, firewall and SSH logs, website request logs | Your browser and devices | DigitalOcean, Vercel |
  | Communications | Support messages and abuse reports | You | None |

  We process submissions to forms that a Workspace holds as a service provider for the form owners. We do not sell or share personal information, so there is nothing to opt out of.
- **Other US states.** Where another state's privacy law applies, you may have rights to access, correct or delete your data and to opt out of sale, targeted advertising or profiling. We do none of these.

### EU and EEA

You can complain to the data-protection supervisory authority where you live or work.

### UK

You can complain to us first: write to **legal@formhaus.dev** with "Data protection complaint" in the subject. We will acknowledge your complaint within 30 days, investigate it and tell you the outcome without undue delay. If you are not satisfied, you can complain to the Information Commissioner's Office at ico.org.uk.

---

## 12. Children

Accounts are for people aged 18 and over. If we learn that we hold account data of a child, we will delete it. The [Terms](./terms.md) forbid forms directed at children under 13, or under the age of digital consent where they live, and collecting personal data from them. If you believe a form collects data from a child, write to legal@formhaus.dev with the form link.

---

## 13. Changes

We may update this policy. If a change is material, we will give notice by email or in the dashboard before it takes effect. The effective date at the top shows the current version, and the [Legal](./index.md) page lists what changed.

---

## 14. Contact

Questions and requests: **legal@formhaus.dev**
Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States
