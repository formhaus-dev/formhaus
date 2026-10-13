---
layout: home
title: "Pricing · Formhaus Cloud"
titleTemplate: false
description: "Compare Free, Pro and Team plans for Formhaus Cloud. Find prices, response limits and clear answers about billing and keeping your responses."
markdownStyles: false
footer: false
pageClass: lp-page
sidebar: false
---

<script setup>
import CloudPricing from './.vitepress/components/cloud/CloudPricing.vue';
import PricingFaq from './.vitepress/components/cloud/PricingFaq.vue';
import CloudClosing from './.vitepress/components/cloud/CloudClosing.vue';
import './.vitepress/components/landing/landing.css';
import './.vitepress/components/cloud/cloud.css';
</script>

<div class="lp cloud">
  <CloudPricing heading="h1" />
  <PricingFaq />
  <CloudClosing />
</div>
