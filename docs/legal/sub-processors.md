---
title: Sub-processors
description: "Sub-processors of Formhaus Cloud: the third parties Fabrique-Futur LLC uses to run the service, what personal data each one processes and where."
sidebar: false
pageClass: lp-page
---

# Formhaus Cloud Sub-processors

**Effective date: October 15, 2026**

This page lists the third parties that **Fabrique-Futur LLC** uses to run **Formhaus Cloud**. It is part of our [Data Processing Addendum](./dpa.md) and supports our [Privacy Policy](./privacy.md). We give at least 15 days' notice by email before a new Sub-processor starts processing Customer Data, as described in the DPA.

**Transfer mechanism** is the safeguard we rely on for transfers from the EEA, UK or Switzerland: the 2021 EU **SCCs** (with the **UK Addendum**) as the primary mechanism, and the **EU-US Data Privacy Framework (DPF)** as an additional basis for certified providers.

---

## A. Sub-processors that process Customer Data

These process forms and submissions, and the personal data in them.

| Sub-processor (entity) | Purpose | Data processed | Location | Transfer mechanism |
|---|---|---|---|---|
| **DigitalOcean, LLC** | Server hosting for the application and the PostgreSQL database; Spaces object storage for off-site backups | All forms, submissions and account data. Off-site database backups are encrypted before upload, and DigitalOcean does not hold the key. DigitalOcean also keeps daily backup images of the server for 7 days | Frankfurt, Germany (region fra1), for the server, its backup images and the Spaces bucket | Data stored in the EU; DPF and SCCs for access by the US entity |
| **Plus Five Five, Inc.** (Resend) | Email: sign-in, claim and invite links, milestone emails, weekly summaries, webhook and abuse alerts, and product updates | Recipient email address and email content. Emails contain form titles and counts, not submission values. Open and click tracking are off | Sending region Ireland (eu-west-1); Resend is a US company and may process data in the United States | DPF and SCCs |

---

## B. Service providers for account and website data

These process data that we control as described in the [Privacy Policy](./privacy.md). They do not receive submissions.

| Provider (entity) | Purpose | Data processed | Location | Transfer mechanism |
|---|---|---|---|---|
| **Stripe, LLC** | Subscription payments for paid plans | Your email address, payment details and payment status, collected on Stripe's own checkout page. We receive payment status, not card numbers | United States and international | DPF and SCCs |
| **Cloudflare, Inc.** | DNS for formhaus.dev, and network and attack protection in front of the website at formhaus.dev | Visitor IP addresses and request data. No forms, submissions or account data | Global network; Cloudflare is a US company | DPF and SCCs |
| **DigitalOcean, LLC** | Hosting our self-hosted Umami analytics for formhaus.dev | Website visit records: pages, referrers, browser, device, approximate location and clicks. IP addresses pass through to find the location and are not stored. No cookies, forms, submissions or account data | New York, United States (region nyc1) | DPF and SCCs |
| **GitHub, Inc.** | Source code hosting and the build and deploy pipeline (GitHub Actions), which copies new releases to our server | Source code and build artifacts. Deploy jobs do not read forms, submissions or account data | United States | DPF and SCCs |

---

## Notes

- **No AI providers.** Formhaus Cloud does not send forms or submissions to any AI or model provider. When a customer connects their own AI agent to the MCP server or the REST API, the agent and its provider are chosen by the customer and process data under the customer's agreements. They are not our Sub-processors.
- **Customer-configured destinations.** Webhook endpoints belong to the customer. Data delivered there is outside our processing.
- **Email retention at Resend.** Resend keeps sent emails, including their content, for 30 days.
- **DNS and domain registration.** Cloudflare answers DNS queries for formhaus.dev and its subdomains. It proxies only the website at formhaus.dev; api, app and f.formhaus.dev connect straight to our server. GoDaddy is the domain registrar only.
- **Open-source project.** The Formhaus libraries, Figma plugin and local `@formhaus/mcp` run on your machines. The npm registry and the Figma Community distribute them; they are not Sub-processors of Formhaus Cloud.

For questions about this list, write to **legal@formhaus.dev**.
