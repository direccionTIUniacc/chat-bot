<template>
  <div 
    :class="[
      'flex items-center justify-center',
      containerClass
    ]"
  >
    <div class="flex items-center space-x-2">
      <!-- Spinner -->
      <div 
        :class="[
          'animate-spin rounded-full border-2 border-transparent',
          spinnerClass
        ]"
        :style="{ 
          width: size + 'px', 
          height: size + 'px',
          borderTopColor: color,
          borderRightColor: color
        }"
      />
      
      <!-- Texto de carga -->
      <span 
        v-if="text" 
        :class="[
          'text-sm font-medium',
          textClass
        ]"
      >
        {{ text }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number
  color?: string
  text?: string
  containerClass?: string
  spinnerClass?: string
  textClass?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: '#1e40af', // uniacc-primary
  containerClass: '',
  spinnerClass: '',
  textClass: 'text-gray-600',
  overlay: false
})
</script>

<style scoped>
/* Estilos adicionales si se necesita overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}
</style>
