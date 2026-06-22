interface IconifyResponse {
  prefix: string
  total: number
  title: string
  uncategorized?: string[]
  categories?: Record<string, string[]>
  aliases?: Record<string, string>
}

const ICONS_MAP: Record<string, string[]> = {}
const PENDING_REQUESTS: Record<string, Promise<string[]>> = {}

export async function fetchIconsData(prefix: string): Promise<string[]> {
  if (Reflect.has(ICONS_MAP, prefix) && ICONS_MAP[prefix]) {
    return ICONS_MAP[prefix]
  }
  if (Reflect.has(PENDING_REQUESTS, prefix) && (await PENDING_REQUESTS[prefix])) {
    return PENDING_REQUESTS[prefix]
  }
  
  PENDING_REQUESTS[prefix] = (async () => {
    try {
      let icons: string[] = []
      
      if (process.client) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1000 * 10)
          const response: IconifyResponse = await fetch(
            `/icons/${prefix}.json`,
            { signal: controller.signal }
          ).then((res) => res.json())
          clearTimeout(timeoutId)
          icons = response
          console.log(`Loaded ${icons.length} ${prefix} icons from local cache`)
        } catch (localError) {
          console.warn(`Failed to load ${prefix} icons from local cache, trying online API...`, localError)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1000 * 10)
          const response: IconifyResponse = await fetch(
            `https://api.iconify.design/collection?prefix=${prefix}`,
            { signal: controller.signal }
          ).then((res) => res.json())
          clearTimeout(timeoutId)
          const list = response.uncategorized || []
          if (response.categories) {
            for (const category in response.categories) {
              list.push(...(response.categories[category] || []))
            }
          }
          icons = list.map((v) => `${prefix}:${v}`)
          console.log(`Loaded ${icons.length} ${prefix} icons from online API`)
        }
      } else {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000 * 10)
        const response: IconifyResponse = await fetch(
          `https://api.iconify.design/collection?prefix=${prefix}`,
          { signal: controller.signal }
        ).then((res) => res.json())
        clearTimeout(timeoutId)
        const list = response.uncategorized || []
        if (response.categories) {
          for (const category in response.categories) {
            list.push(...(response.categories[category] || []))
          }
        }
        icons = list.map((v) => `${prefix}:${v}`)
        console.log(`Loaded ${icons.length} ${prefix} icons from online API (server side)`)
      }
      
      ICONS_MAP[prefix] = icons
    } catch (error) {
      console.error(`Failed to fetch icons for prefix ${prefix}:`, error)
      return [] as string[]
    }
    return ICONS_MAP[prefix]
  })()
  
  return PENDING_REQUESTS[prefix]
}
