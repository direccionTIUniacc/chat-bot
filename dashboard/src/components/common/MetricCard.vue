<template>
  <div class="card p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          iconBackgroundClass
        ]">
          <component 
            :is="icon" 
            :class="['w-6 h-6', iconClass]"
          />
        </div>
      </div>
      
      <div class="ml-4 flex-1">
        <h3 class="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {{ title }}
        </h3>
        <div class="flex items-baseline">
          <p class="text-2xl font-bold text-gray-900">
            {{ formattedValue }}
          </p>
          <span v-if="unit" class="ml-1 text-sm text-gray-500">
            {{ unit }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Indicador de cambio -->
    <div v-if="change !== undefined" class="mt-4 flex items-center">
      <div :class="[
        'flex items-center text-sm font-medium',
        changeColorClass
      ]">
        <component 
          :is="changeIcon" 
          class="w-4 h-4 mr-1"
        />
        {{ Math.abs(change) }}{{ changeUnit }}
      </div>
      <span class="ml-2 text-sm text-gray-500">
        {{ changeLabel || 'desde el período anterior' }}
      </span>
    </div>
    
    <!-- Descripción adicional -->
    <p v-if="description" class="mt-2 text-sm text-gray-600">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { formatNumber, formatPercentage, formatCurrency } from '@/utils/formatters'

interface Props {
  title: string
  value: number | string
  icon: any
  iconClass?: string
  iconBackgroundClass?: string
  change?: number
  changeUnit?: string
  changeLabel?: string
  unit?: string
  description?: string
  format?: 'number' | 'currency' | 'percentage'
  decimals?: number
}

const props = withDefaults(defineProps<Props>(), {
  iconClass: 'text-white',
  iconBackgroundClass: 'bg-uniacc-primary',
  changeUnit: '%',
  format: 'number',
  decimals: 0
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value)
    case 'percentage':
      return formatPercentage(props.value, props.decimals)
    default:
      return formatNumber(props.value, props.decimals)
  }
})

const changeIcon = computed(() => {
  if (props.change === undefined) return Minus
  if (props.change > 0) return TrendingUp
  if (props.change < 0) return TrendingDown
  return Minus
})

const changeColorClass = computed(() => {
  if (props.change === undefined) return 'text-gray-500'
  if (props.change > 0) return 'text-green-600'
  if (props.change < 0) return 'text-red-600'
  return 'text-gray-500'
})
</script>
