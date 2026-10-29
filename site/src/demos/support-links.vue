<script setup lang="ts">
import SupportLinks from "@kit/SupportLinks.vue";

const links = [
  { id: "github", label: "Sponsor on GitHub", detail: "Monthly or one-time, through GitHub Sponsors.", icon: "pi-heart", href: "https://github.com/sponsors/DumiFlex" },
  { id: "coffee", label: "Buy me a coffee", detail: "A one-off thank you, no account needed.", icon: "pi-gift", href: "https://buymeacoffee.com/dumiflex" },
  { id: "paypal", label: "PayPal", detail: "Send any amount through PayPal.me.", icon: "pi-paypal", href: "https://paypal.me/DumiFlex" },
];
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <SupportLinks :links="links" />
  </div>
</template>
