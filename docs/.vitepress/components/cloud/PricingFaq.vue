<script setup lang="ts">
import FaqSection from '../landing/FaqSection.vue';

const items = [
  {
    "question": "Can I cancel any time?",
    "answer": [
      {
        "text": "Yes. Paid features stay on until the end of the billing period."
      }
    ]
  },
  {
    "question": "How do I upgrade?",
    "answer": [
      {
        "text": "Pay for Pro at checkout, and it is on within a day. For Team, email hello@formhaus.dev."
      }
    ]
  },
  {
    "question": "What happens at my limit?",
    "answer": [
      {
        "text": "New responses stop until next month or until you upgrade. Rejected responses are not stored."
      }
    ]
  },
  {
    "question": "How long are responses kept?",
    "answer": [
      {
        "text": "Free keeps responses for 90 days. Pro and Team keep them until you delete them. If you move to Free, responses older than 90 days are deleted 60 days later."
      }
    ]
  },
  {
    "question": "Can I pay yearly?",
    "answer": [
      {
        "text": "Pro costs $19 monthly or $190 yearly. Team costs $49 monthly or $490 yearly."
      }
    ]
  }
];
</script>

<template>
  <FaqSection :items="items" />
</template>
