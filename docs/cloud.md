---
layout: home
title: "The simple way to collect responses · Formhaus Cloud"
titleTemplate: false
description: "Build a form visually or with your AI assistant, share it anywhere, and send every response to the tools you already use. Free for 3 forms."
markdownStyles: false
footer: false
pageClass: lp-page
sidebar: false
---

<script setup>
import CloudHero from './.vitepress/components/cloud/CloudHero.vue';
import CloudBuilder from './.vitepress/components/cloud/CloudBuilder.vue';
import CloudAssistant from './.vitepress/components/cloud/CloudAssistant.vue';
import CloudResponses from './.vitepress/components/cloud/CloudResponses.vue';
import CloudTemplates from './.vitepress/components/cloud/CloudTemplates.vue';
import CloudFaq from './.vitepress/components/cloud/CloudFaq.vue';
import CloudClosing from './.vitepress/components/cloud/CloudClosing.vue';
import './.vitepress/components/landing/landing.css';
import './.vitepress/components/cloud/cloud.css';
</script>

<div class="lp cloud">
  <CloudHero />
  <CloudBuilder />
  <CloudAssistant variant="summary" />
  <CloudResponses />
  <CloudTemplates />
  <CloudFaq />
  <CloudClosing show-pricing />
</div>
