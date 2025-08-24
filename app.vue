<template>
  <div>
    <Head>
      <!-- Přidáme CSS pro matematické vzorce (KaTeX) -->
      <Link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
    </Head>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
  </div>
</template>