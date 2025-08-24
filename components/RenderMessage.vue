<!-- components/RenderMessage.vue -->
<template>
  <div v-html="renderedHtml"></div>
</template>

<script setup>
import { marked } from 'marked';
import katex from 'katex';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const renderedHtml = computed(() => {
  if (!props.content) return '';

  let processedContent = props.content;

  // Najdeme a vykreslíme blokovou matematiku ($$...$$)
  const blockMathRegex = /\$\$\n?([\s\S]*?)\n?\$\$/g;
  processedContent = processedContent.replace(blockMathRegex, (match, expression) => {
    try {
      return katex.renderToString(expression, { throwOnError: false, displayMode: true });
    } catch (e) {
      return match; // V případě chyby vrátíme původní text
    }
  });

  // Najdeme a vykreslíme řádkovou matematiku ($...$)
  const inlineMathRegex = /\$(.+?)\$/g;
  processedContent = processedContent.replace(inlineMathRegex, (match, expression) => {
    try {
      return katex.renderToString(expression, { throwOnError: false, displayMode: false });
    } catch (e) {
      return match;
    }
  });

  // Zbytek textu zpracujeme jako Markdown
  return marked.parse(processedContent, { gfm: true, breaks: true });
});
</script>

<style>
/* Základní styly pro bloky kódu */
pre {
  background-color: #f4f4f4;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  white-space: pre-wrap;
}
code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #e9e9e9;
  padding: 2px 4px;
  border-radius: 4px;
}
pre code {
  background-color: transparent;
  padding: 0;
}
/* Styly pro KaTeX (matematiku) */
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0;
}
</style>
