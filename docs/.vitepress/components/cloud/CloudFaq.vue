<script setup lang="ts">
import FaqSection from '../landing/FaqSection.vue';

const items = [
  {
    "question": "Where is my data stored?",
    "answer": [
      {
        "text": "Forms and responses are stored in Frankfurt, EU, with encrypted backups. IP addresses are not stored with responses."
      }
    ]
  },
  {
    "question": "Can I put my own branding on the form?",
    "answer": [
      {
        "text": "Hosted pages can show your company name and a link to your privacy policy, and on paid plans your logo. There is a small “Made with Formhaus” mark."
      }
    ]
  },
  {
    "question": "Do I need a developer?",
    "answer": [
      {
        "text": "No. Build in the browser or ask your AI agent, then share the link."
      }
    ]
  },
  {
    "question": "How do I connect my AI agent?",
    "answer": [
      {
        "text": "Add the Formhaus connector in Claude or another assistant that supports connectors, then ask for a form. The "
      },
      {
        "text": "setup guide",
        "href": "/cloud/quickstart"
      },
      {
        "text": " has the steps."
      }
    ]
  },
  {
    "question": "How do I cancel?",
    "answer": [
      {
        "text": "Cancel any time from your account. Paid features stay on until the end of the billing period."
      }
    ]
  }
];
</script>

<template>
  <FaqSection :items="items" />
</template>
