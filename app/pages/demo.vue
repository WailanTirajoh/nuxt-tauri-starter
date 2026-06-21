<script setup lang="ts">
import {
  useDocumentStorage,
  removeDocument,
  getDocumentKeys,
  getRegistryKeys,
} from "@/composables/useDocumentStorage";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";
import AppIcon from "@/components/AppIcon.vue";

const user = useDocumentStorage(
  "demo:user",
  { name: "Guest", email: "guest@example.com", count: 0 },
  { collection: "demo" },
);

const counter = useDocumentStorage(
  "demo:counter",
  { value: 0 },
  { collection: "demo", debounce: 1000 },
);

const todos = useDocumentStorage(
  "demo:todos",
  [
    { id: 1, text: "Try useDocumentStorage", done: true },
    { id: 2, text: "Build something awesome", done: false },
  ],
  { collection: "demo" },
);

const registryKeys = ref<string[]>([]);
const documentKeys = ref<string[]>([]);

const addTodo = () => {
  todos.value.push({
    id: Date.now(),
    text: `Todo #${todos.value.length + 1}`,
    done: false,
  });
};
const toggleTodo = (id: number) => {
  const t = todos.value.find((t) => t.id === id);
  if (t) t.done = !t.done;
};
const deleteTodo = (id: number) => {
  const i = todos.value.findIndex((t) => t.id === id);
  if (i !== -1) todos.value.splice(i, 1);
};

const refreshKeys = async () => {
  registryKeys.value = getRegistryKeys();
  documentKeys.value = await getDocumentKeys();
};
const deleteUser = async () => {
  await removeDocument("demo:user");
  user.value = { name: "Guest", email: "guest@example.com", count: 0 };
  await refreshKeys();
};

onMounted(refreshKeys);

const inputClass =
  "w-56 rounded-lg bg-black/5 dark:bg-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
</script>

<template>
  <div>
    <PageHeader
      title="Storage"
      subtitle="Reactive SQLite-backed storage, synced across windows."
      icon="database"
      color="blue"
    />

    <SettingsGroup
      title="Profile"
      footer="Changes auto-save to SQLite after a 300ms debounce, and broadcast to every open window."
    >
      <SettingsRow title="Name">
        <input v-model="user.name" type="text" :class="inputClass" />
      </SettingsRow>
      <SettingsRow title="Email">
        <input v-model="user.email" type="email" :class="inputClass" />
      </SettingsRow>
      <SettingsRow title="Count" :description="`Current: ${user.count}`">
        <AppButton size="sm" @click="user.count++">Increment</AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Counter" footer="Custom 1s debounce before each write.">
      <SettingsRow title="Value">
        <span class="font-mono text-lg font-semibold">{{ counter.value }}</span>
        <AppButton variant="primary" size="sm" @click="counter.value++">
          + 1
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Todos" footer="Array mutations are deeply reactive and auto-persisted.">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <input
          :checked="todo.done"
          type="checkbox"
          class="w-4 h-4 rounded accent-blue-500"
          @change="toggleTodo(todo.id)"
        />
        <span
          class="flex-1 text-sm"
          :class="{ 'line-through text-gray-400 dark:text-neutral-500': todo.done }"
        >
          {{ todo.text }}
        </span>
        <button
          class="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete todo"
          @click="deleteTodo(todo.id)"
        >
          <AppIcon name="trash" :size="16" />
        </button>
      </div>
      <SettingsRow>
        <template #title>
          <span class="text-sm text-gray-500 dark:text-neutral-400">
            {{ todos.length }} item{{ todos.length === 1 ? "" : "s" }}
          </span>
        </template>
        <AppButton size="sm" @click="addTodo">
          <AppIcon name="plus" :size="14" /> Add todo
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup
      title="Inspector"
      footer="Registry keys are active reactive refs this session; document keys are persisted in SQLite."
    >
      <SettingsRow
        title="Registry (in memory)"
        :description="registryKeys.join(', ') || 'none'"
      />
      <SettingsRow
        title="Documents (in SQLite)"
        :description="documentKeys.join(', ') || 'none'"
      />
      <SettingsRow title="Actions">
        <AppButton size="sm" @click="refreshKeys">Refresh</AppButton>
        <AppButton variant="danger" size="sm" @click="deleteUser">
          Delete user
        </AppButton>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
