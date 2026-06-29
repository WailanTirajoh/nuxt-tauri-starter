<script setup lang="ts">
import { usePrint } from "@/composables/usePrint";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";

const { print, printElement, isSupported, printing } = usePrint();

const receipt = ref<HTMLElement | null>(null);

const items = [
  { name: "Reactive Storage license", qty: 1, price: 49 },
  { name: "Priority support (1 yr)", qty: 1, price: 120 },
  { name: "Extra seat", qty: 3, price: 19 },
];
const total = computed(() =>
  items.reduce((sum, i) => sum + i.qty * i.price, 0),
);
// Serialized via useState + a fixed locale/timezone so the SSR and client
// renders match (avoids a hydration mismatch).
const today = useState("print-demo-today", () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date()),
);

const printReceipt = () =>
  printElement(receipt, {
    documentTitle: "Receipt — nuxt-tauri-starter",
    styles: "@page { margin: 16mm; }",
  });
</script>

<template>
  <div>
    <PageHeader
      title="Print"
      subtitle="Print the page or a single element — Save as PDF from the dialog."
      icon="printer"
      color="gray"
    />

    <SettingsGroup
      title="Actions"
      footer="Opens the system print dialog; choose a printer or “Save as PDF”."
    >
      <SettingsRow
        title="Print the receipt"
        description="Prints only the card below, on its own page"
      >
        <AppButton
          variant="primary"
          :disabled="!isSupported || printing"
          @click="printReceipt"
        >
          {{ printing ? "Preparing…" : "Print receipt" }}
        </AppButton>
      </SettingsRow>
      <SettingsRow title="Print the whole page" description="window.print()">
        <AppButton :disabled="!isSupported" @click="print">Print page</AppButton>
      </SettingsRow>
    </SettingsGroup>

    <!-- The element that gets printed on its own -->
    <div
      ref="receipt"
      class="rounded-xl bg-white text-gray-900 ring-1 ring-black/5 p-8"
    >
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-xl font-semibold">Invoice</h2>
          <p class="text-sm text-gray-500">nuxt-tauri-starter</p>
        </div>
        <div class="text-right text-sm text-gray-500">
          <p>#INV-001</p>
          <p>{{ today }}</p>
        </div>
      </div>

      <table class="w-full mt-6 text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-500">
            <th class="py-2 font-medium">Item</th>
            <th class="py-2 font-medium text-center">Qty</th>
            <th class="py-2 font-medium text-right">Price</th>
            <th class="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.name"
            class="border-b border-gray-100"
          >
            <td class="py-2">{{ item.name }}</td>
            <td class="py-2 text-center">{{ item.qty }}</td>
            <td class="py-2 text-right">${{ item.price }}</td>
            <td class="py-2 text-right">${{ item.qty * item.price }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="py-3 text-right font-medium">Total</td>
            <td class="py-3 text-right font-semibold">${{ total }}</td>
          </tr>
        </tfoot>
      </table>

      <p class="mt-6 text-xs text-gray-400">Thank you for your purchase.</p>
    </div>

    <p
      v-if="!isSupported"
      class="mt-4 text-xs text-gray-400 dark:text-neutral-500 text-center"
    >
      Printing is available in the desktop app and browser. Mobile webviews may
      not support <span class="font-mono">window.print()</span>.
    </p>
  </div>
</template>
