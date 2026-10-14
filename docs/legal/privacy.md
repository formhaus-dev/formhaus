---
title: Privacy Policy
description: How Fabrique-Futur LLC handles personal data in Formhaus Cloud, for account holders, people who fill in forms and site visitors.
sidebar: false
pageClass: lp-page
---

# Formhaus Cloud Privacy Policy

**Effective date: October 15, 2026**

This Privacy Policy explains how **Fabrique-Futur LLC**, a Wyoming limited liability company ("**Fabrique-Futur**," "**we**," "**us**," "**our**"), handles personal data in **Formhaus Cloud** (the "**Service**"): the hosted form backend at api.formhaus.dev, app.formhaus.dev and f.formhaus.dev, and the website at formhaus.dev.

Formhaus Cloud is a form backend. Our customers ("**form owners**") use it to collect data from the people who fill in their forms ("**respondents**"). This means we have two roles:

- **Processor** for the data respondents submit to a form. The form owner decides what to collect and why, and is the controller. We process it for the form owner under our [Data Processing Addendum](./dpa.md).
- **Controller** for the data we need to run the Service: account data, billing data, security data, and data about visits to our website. This policy describes that processing.

The open-source Formhaus libraries, Figma plugin and local MCP server run on your own machines and do not send data to us.

---

## 1. Who we are and how to contact us

- Privacy, legal and security contact: **legal@formhaus.dev**
- General questions: hello@formhaus.dev
- Post: Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States
- **EU and UK representative (Article 27):** where Article 27 of the EU or UK GDPR requires one, the details are available on request at legal@formhaus.dev.

---

## 2. If you filled in a form

The form owner is responsible for your submission. Hosted pages show Formhaus branding and a "Report abuse" link. The form owner may also show their name and a link to their privacy policy there. It is the form owner's job to tell you who they are and how they use your data.

- **What the Service stores:** the values you entered, the time of submission, your browser's user agent, the referring page, and which optional steps you skipped.
- **What it does not store:** your IP address. The Service uses your IP address in memory for rate limiting and then discards it. Hosted pages and the embed set no cookies.
- **Where it goes:** the form owner can see your submission in the dashboard, export it and send it to their own systems through a webhook or an AI agent. Email notifications to the form owner contain form titles and counts, not your answers. What happens to it there is up to the form owner.
- **Your rights:** contact the form owner to access, correct or delete your submission. If you cannot reach the form owner, write to legal@formhaus.dev with the form link; we will pass your request to the owner and help them respond.
- **Unclaimed forms:** a form that an AI agent published without an account shows an "Unverified form" banner. It has no owner yet. Its submissions are deleted 7 days after the form was published unless someone claims it. If you want your submission to an unclaimed form deleted earlier, write to legal@formhaus.dev with the form link and we will delete it.
- **Reporting a form:** if a form looks like phishing or abuse, use the "Report abuse" link on the page or write to legal@formhaus.dev. When you use the link, we store your report and a keyed hash of your IP address that changes every day, so we can count distinct reporters without storing your IP address.

---

## 3. The data we collect as controller

**You give us:**

- **Account data:** your email address and plan. Sign-in uses one-time links sent by email; there are no passwords.
- **Claim data:** the email address an AI agent gives when it publishes a form for you, used to send you the claim link.
- **API key metadata:** key name, prefix, creation time, last use time and revocation time. We store only a keyed hash of the key itself.
- **Billing data:** plan and payment status. Stripe collects your payment details on its own page; we do not receive or store card numbers.
- **Communications:** messages you send us, including abuse reports.

**We collect automatically:**

- **Session data:** a session cookie on app.formhaus.dev and a keyed hash of the session token on our server.
- **Security and operations data:** application logs with error messages, background job results and timings, used for security and debugging. They do not contain IP addresses or submission values. IP addresses are used in memory for rate limiting and are not stored with your data. The server's firewall and SSH logs record the IP addresses of blocked connections and SSH login attempts.
- **Website visit data:** formhaus.dev is served from our server in Frankfurt through Cloudflare's network. Cloudflare processes your IP address and request data to deliver the site and protect it from attacks.
- **Website analytics:** we measure visits to formhaus.dev with Umami, a cookieless analytics tool that we run ourselves on DigitalOcean in New York, United States. It records the page address, the referring site, campaign parameters in the link, page title, browser, operating system, device type, screen size, language, approximate location (country, region and city) and the buttons you click on the site. Umami uses your IP address to find the location and to make a visitor ID that changes every month, and does not store the IP address. It sets no cookies and stores nothing in your browser. It sends nothing when your browser sends a Do Not Track or Global Privacy Control signal. We look only at aggregate reports. We run no analytics on app.formhaus.dev, f.formhaus.dev or api.formhaus.dev.

We do not intentionally collect special categories of personal data about account holders.

---

## 4. How we use data

We use the data in Section 3 to:

- run the Service: sign you in, keep your forms and submissions, deliver webhooks, and send sign-in, claim and invite links, milestone emails, weekly summaries and alerts. These emails contain form titles and counts, not submission values;
- enforce plan limits, rate limits and abuse controls;
- take payments and keep billing records;
- answer support requests and abuse reports;
- send service messages, such as notices about changes to these documents, security incidents or your plan;
- secure, debug and improve the Service, using account and operations data, not Submission Data;
- measure visits to formhaus.dev in aggregate, to see which pages and links people use;
- comply with the law and enforce our [Terms](./terms.md).

**We do not sell personal data. We do not use submissions or other customer data to train AI or machine-learning models. We do not show ads or share data for advertising.** The Service does not send submissions to any AI provider. If a form owner lets their own AI agent read submissions, that agent and its provider process them under the owner's agreements.

We send product update emails to account holders. Every product update email has an unsubscribe link, and you can opt out at any time. Service emails, such as sign-in links and notices about your account, are sent regardless.

---

## 5. Legal bases (EU and UK GDPR)

- **Contract:** to provide the Service you signed up for, including sign-in, form hosting and billing.
- **Legitimate interests:** to secure the Service, prevent abuse, handle reports, debug and plan the Service, serve the website and measure its use, and send product update emails to existing customers, which you can opt out of at any time. We balance these against your rights.
- **Legal obligation:** to keep billing records and respond to lawful requests.

For submissions, the form owner is responsible for the legal basis.

---

## 6. How we share data

- **Sub-processors and service providers** that help us run the Service, under contracts that limit their use of the data. They are listed on the [Sub-processors](./sub-processors.md) page.
- **Form owners**, who receive the submissions to their own forms.
- **Professional advisers**, such as lawyers and accountants, under confidentiality.
- **Authorities**, when the law requires it or to protect the rights and safety of people or the Service.
- **A successor** in a merger, acquisition or sale of assets, under this policy.

---

## 7. Cookies and local storage

- **app.formhaus.dev** sets one strictly necessary cookie, `__Host-fh_session`, to keep you signed in. It lasts up to 30 days, is HttpOnly and Secure, and needs no consent.
- **f.formhaus.dev** (hosted pages and the embed) and **api.formhaus.dev** set no cookies.
- **formhaus.dev** sets no cookies, and our analytics stores nothing in your browser. The site stores your light or dark theme choice in your browser's local storage. This value is not sent to us.

We use no analytics, advertising or cross-site tracking cookies.

---

## 8. Where data is stored and international transfers

The Service and its database run on DigitalOcean in Frankfurt, Germany (region fra1). Encrypted database backups are stored in DigitalOcean Spaces in the same region, and DigitalOcean keeps daily backup images of the server in the same datacenter. Email is sent from Resend's EU region in Ireland. Website analytics run on DigitalOcean in New York, United States. Some providers, such as our payment provider and Cloudflare, process data in the United States; see the [Sub-processors](./sub-processors.md) page.

Fabrique-Futur is a US company, and we access the Service from outside the EU to operate it. Where personal data is transferred from the EEA, UK or Switzerland to a country without an adequacy decision, we rely on the **2021 EU Standard Contractual Clauses** (with the **UK Addendum** for UK transfers), and on the **EU-US Data Privacy Framework** for certified providers as an additional basis. Ask at legal@formhaus.dev for details of these safeguards.

---

## 9. Retention

| Data | Kept for |
|---|---|
| Submissions on an unclaimed form | Deleted with the form 7 days after it was published, unless it is claimed |
| Submissions on the Free plan | 90 days after submission |
| Submissions on the Pro and Team plans | Until the form owner deletes them or the account |
| Submissions after a move from a paid plan to Free | Submissions older than 90 days are deleted 60 days after the change |
| Forms and their versions | Until the owner deletes them or the account |
| Account data and API key metadata | For the life of the account |
| One-time sign-in links | 15 minutes, single use |
| Sessions | Up to 30 days, or until you sign out |
| Idempotency records (a hash of a submission, used to answer retries) | 24 hours |
| Webhook delivery log (status code, error type and timing, no submission values) | The last 100 delivery attempts per form |
| Abuse reports | For the life of the form |
| Website analytics (no IP addresses) | Up to 25 months |
| Server logs | Up to 90 days |
| Billing records | Up to 7 years, for tax and accounting |
| Encrypted database backups | A server copy for 7 days and an off-site copy for 30 days |
| DigitalOcean server backups | 7 days |

When you delete a form, submissions or your account, we remove the data from the live database at once. Backups that contain it expire within 30 days. Our email provider keeps sent emails for 30 days; see the [Sub-processors](./sub-processors.md) page.

---

## 10. Security

The Service uses TLS for all connections, stores data in the EU on storage that is encrypted at rest, encrypts off-site database backups before they leave the server, stores only keyed hashes of sign-in tokens, session tokens, API keys and claim tokens, signs webhooks, blocks webhook requests to private networks, and rate-limits public endpoints. Annex II of the [Data Processing Addendum](./dpa.md) describes the measures in full.

If a breach affects your personal data, we will notify you and the relevant authorities as the law requires.

---

## 11. Your rights

Depending on where you live, you may have the right to access, correct, delete, restrict or object to the processing of your personal data, to receive it in a portable format, to withdraw consent, and not to be discriminated against for using these rights.

To use them for data we control, write to **legal@formhaus.dev**. We will verify your request and answer within the time the law requires. For submissions to a form, contact the form owner first (see Section 2).

### United States

We do not sell or share personal information, including for cross-context behavioral advertising, and we do not use sensitive personal information beyond providing the Service. Wherever you live in the US, you can ask us to access, correct or delete your personal information, and you can use an authorized agent. If we deny your request, you can appeal by replying to our decision or by writing to legal@formhaus.dev with "Privacy appeal" in the subject.

- **California (CCPA/CPRA).** In the last 12 months we collected these categories for the purposes in Section 4, and kept them as described in Section 9: **identifiers** (email address, account and key identifiers); **commercial information** (plan and payment status); **internet or network activity** (session and operations data). We process submissions as a service provider for form owners. We do not sell or share personal information, so there is nothing to opt out of.
- **Other US states.** Where another state's privacy law applies, you may have rights to access, correct or delete your data and to opt out of sale, targeted advertising or profiling. We do none of these.

### EU and EEA

You can complain to the data-protection supervisory authority where you live or work.

### UK

You can complain to us first: write to **legal@formhaus.dev** with "Data protection complaint" in the subject. We will acknowledge your complaint within 30 days, investigate it and tell you the outcome without undue delay. If you are not satisfied, you can complain to the Information Commissioner's Office at ico.org.uk.

---

## 12. Children

Accounts are for people aged 18 and over. If we learn that we hold account data of a child, we will delete it. Form owners are responsible for any data about children that their forms collect; see the [Terms](./terms.md).

---

## 13. Changes

We may update this policy. If a change is material, we will give notice by email or in the dashboard before it takes effect. The effective date at the top shows the current version.

---

## 14. Contact

Questions and requests: **legal@formhaus.dev**
Fabrique-Futur LLC, 30 N Gould St, Ste R, Sheridan, WY 82801, United States
