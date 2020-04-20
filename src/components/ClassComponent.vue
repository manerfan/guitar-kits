<template>
  <div>
    <button @click="play">play</button>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Todo, Meta } from './models';
import guiarAudio from '../services/GuitarStringsAudio';

@Component
export default class ClassComponent extends Vue {
  @Prop({ type: String, required: true }) readonly title!: string;
  @Prop({ type: Array, default: () => [] }) readonly todos!: Todo[];
  @Prop({ type: Object, required: true }) readonly meta!: Meta;
  @Prop(Boolean) readonly active!: boolean;

  play() {
    // guiarAudio.play(1, 5);
    guiarAudio.decompose(
      { strings: 4, pins: 3 },
      { strings: 3, pins: 2 },
      { strings: 2, pins: 1 },
      { strings: 1, pins: 0 }
    );

    window.setTimeout(
      () =>
        guiarAudio.sweep(
          { strings: 4, pins: 3 },
          { strings: 3, pins: 2 },
          { strings: 2, pins: 1 },
          { strings: 1, pins: 0 }
        ),
      3000
    );
  }
}
</script>
