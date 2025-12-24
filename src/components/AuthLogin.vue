<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const email = ref('')
const loading = ref(false)

const login = async () => {
  loading.value = true
  await supabase.auth.signInWithOtp({ email: email.value })
  loading.value = false
}
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div class="w-80 space-y-4">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full rounded border p-2"
      />
      <button
        @click="login"
        class="w-full rounded bg-black px-4 py-2 text-white"
      >
        Sign In
      </button>
    </div>
  </div>
</template>
