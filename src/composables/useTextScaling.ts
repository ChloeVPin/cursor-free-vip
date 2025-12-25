import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export function useTextScaling() {
  const resizeObserver = ref<ResizeObserver | null>(null)

  const scaleTextToFit = (element: HTMLElement, maxWidth: number, baseFontSize: number = 14) => {
    const text = element.textContent?.trim()
    if (!text) return

    element.style.fontSize = `${baseFontSize}px`

    if (element.scrollWidth <= maxWidth) {
      return
    }

    let minSize = 10
    let maxSize = baseFontSize
    let bestSize = baseFontSize

    while (minSize <= maxSize) {
      const midSize = Math.round((minSize + maxSize) / 2)
      element.style.fontSize = `${midSize}px`

      if (element.scrollWidth <= maxWidth) {
        bestSize = midSize
        minSize = midSize + 1
      } else {
        maxSize = midSize - 1
      }
    }

    element.style.fontSize = `${bestSize}px`
  }

  const observeElement = (element: HTMLElement, maxWidth: number, baseFontSize: number = 14) => {
    if (!element) return

    scaleTextToFit(element, maxWidth, baseFontSize)

    if (!resizeObserver.value) {
      resizeObserver.value = new ResizeObserver(() => {
        scaleTextToFit(element, maxWidth, baseFontSize)
      })
    }

    resizeObserver.value.observe(element)

    const observer = new MutationObserver(() => {
      scaleTextToFit(element, maxWidth, baseFontSize)
    })

    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => {
      observer.disconnect()
      resizeObserver.value?.unobserve(element)
    }
  }

  const autoScaleText = (selector: string, maxWidth: number, baseFontSize: number = 14) => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((element) => {
      scaleTextToFit(element as HTMLElement, maxWidth, baseFontSize)
      observeElement(element as HTMLElement, maxWidth, baseFontSize)
    })
  }

  onUnmounted(() => {
    if (resizeObserver.value) {
      resizeObserver.value.disconnect()
    }
  })

  const batchScaleText = (selectors: Array<{ selector: string, maxWidth: number, baseFontSize?: number }>) => {
    selectors.forEach(({ selector, maxWidth, baseFontSize = 14 }) => {
      autoScaleText(selector, maxWidth, baseFontSize)
    })
  }

  return {
    scaleTextToFit,
    observeElement,
    autoScaleText,
    batchScaleText
  }
}
