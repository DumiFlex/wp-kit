<script setup lang="ts">
import WorkingLine from "@kit/WorkingLine.vue";
import { useWorkingDemo } from "../working-demo";

const { word, time } = useWorkingDemo();
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <p class="wp-kit__muted">The four marks, at the three tempos.</p>
    <WorkingLine :word="word" :time="time" variant="typing" tempo="slow" label="Reading the prompt" />
    <WorkingLine :word="word" :time="time" variant="shuffle" tempo="mid" />
    <WorkingLine :word="word" :time="time" variant="orbit" tempo="fast" />
    <WorkingLine :word="word" :time="time" variant="burst" tempo="mid" />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Inline, community colours</p>
      <WorkingLine :word="word" :time="time" inline brand="community" variant="orbit" tempo="mid" :size="16" />
    </div>
  </div>
</template>
