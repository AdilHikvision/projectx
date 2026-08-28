import { apiRequest } from '../lib/api'

export interface HousingBlockItem {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  parentId?: string | null
  residentCount: number
}

/**
 * Разворачивает дерево ЖКХ в плоский список для <select>: каждый узел с отступом
 * по глубине. Узлы, оставшиеся без родителя (родителя удалили), показываем в корне,
 * иначе они пропали бы из выбора вместе со своим поддеревом.
 */
export function flattenHousingBlocks(items: HousingBlockItem[]): { id: string; label: string }[] {
  const byParent = new Map<string | null, HousingBlockItem[]>()
  const ids = new Set(items.map((i) => i.id))
  for (const item of items) {
    const parent = item.parentId && ids.has(item.parentId) ? item.parentId : null
    const bucket = byParent.get(parent)
    if (bucket) bucket.push(item)
    else byParent.set(parent, [item])
  }
  const out: { id: string; label: string }[] = []
  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? []
    children.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    for (const child of children) {
      out.push({ id: child.id, label: '\u00A0'.repeat(depth * 4) + child.name })
      walk(child.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

/** Структуру читают три экрана (создание, карточка, настройки) — запрос один и тот же. */
export async function loadHousingBlocks(token: string | null): Promise<HousingBlockItem[]> {
  if (!token) return []
  return apiRequest<HousingBlockItem[]>('/api/housing-blocks', { token })
}
