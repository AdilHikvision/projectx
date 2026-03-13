import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Input } from '../components/atoms'
import { Modal } from '../components/organisms'
import { ConfirmDialog } from '../components/molecules'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface DepartmentTreeItem {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  parentId?: string | null
  employeesCount: number
  visitorsCount: number
}

interface DepartmentForm {
  name: string
  description: string
  parentId: string | null
}

const emptyForm: DepartmentForm = { name: '', description: '', parentId: null }

function buildTree(items: DepartmentTreeItem[], parentId: string | null): DepartmentTreeItem[] {
  return items
    .filter((d) => (d.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 72
const HORIZONTAL_GAP = 40
const VERTICAL_GAP = 48

function TreeConnector({
  parentX,
  parentBottom,
  childCenters,
  childTop,
}: {
  parentX: number
  parentBottom: number
  childCenters: number[]
  childTop: number
}) {
  const midY = parentBottom + (childTop - parentBottom) / 2
  if (childCenters.length === 0) return null
  if (childCenters.length === 1) {
    return (
      <path
        d={`M ${parentX} ${parentBottom} L ${childCenters[0]} ${childTop}`}
        fill="none"
        stroke="rgb(56 189 248)"
        strokeWidth="2"
      />
    )
  }
  const [first, ...rest] = childCenters
  const last = rest[rest.length - 1] ?? first
  const segments = [
    `M ${parentX} ${parentBottom} L ${parentX} ${midY}`,
    `M ${Math.min(first, last)} ${midY} L ${Math.max(first, last)} ${midY}`,
    ...childCenters.map((cx) => `M ${cx} ${midY} L ${cx} ${childTop}`),
  ]
  return (
    <path
      d={segments.join(' ')}
      fill="none"
      stroke="rgb(56 189 248)"
      strokeWidth="2"
    />
  )
}

function DepartmentNode({
  item,
  allItems,
  x,
  y,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: DepartmentTreeItem
  allItems: DepartmentTreeItem[]
  x: number
  y: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onEdit: (d: DepartmentTreeItem) => void
  onDelete: (d: DepartmentTreeItem) => void
  onAddChild: (parent: DepartmentTreeItem) => void
}) {
  const children = buildTree(allItems, item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(item.id)

  const totalChildWidth = hasChildren && isExpanded
    ? children.length * NODE_WIDTH + (children.length - 1) * HORIZONTAL_GAP
    : 0
  const childStartX = x + NODE_WIDTH / 2 - totalChildWidth / 2
  const childY = y + NODE_HEIGHT + VERTICAL_GAP

  return (
    <g>
      {/* Connector from parent to children */}
      {hasChildren && isExpanded && (
        <TreeConnector
          parentX={x + NODE_WIDTH / 2}
          parentBottom={y + NODE_HEIGHT}
          childCenters={children.map(
            (_, idx) => childStartX + idx * (NODE_WIDTH + HORIZONTAL_GAP) + NODE_WIDTH / 2
          )}
          childTop={childY}
        />
      )}

      {/* Node box */}
      <g
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer"
        onClick={() => hasChildren && onToggle(item.id)}
      >
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={4}
          fill="white"
          stroke="rgb(56 189 248)"
          strokeWidth="2"
          className="transition-colors hover:fill-sky-50"
        />
        <foreignObject x={8} y={8} width={NODE_WIDTH - 16} height={NODE_HEIGHT - 16}>
          <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col justify-center h-full overflow-hidden group/node">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-dark truncate">{item.name}</p>
                {item.description && (
                  <p className="text-[10px] text-text-light truncate">{item.description}</p>
                )}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddChild(item)
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded bg-sky-100 text-sky-600 hover:bg-sky-200 text-[10px] font-bold"
                  title="Добавить подотдел"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(item)
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded bg-sky-100 text-sky-600 hover:bg-sky-200 text-[10px]"
                  title="Редактировать"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item)
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 text-[10px]"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-text-light">{item.employeesCount} сотрудн.</span>
              <span className="text-[10px] text-text-light">{item.visitorsCount} посет.</span>
            </div>
          </div>
        </foreignObject>
        {hasChildren && (
          <circle
            cx={NODE_WIDTH - 16}
            cy={NODE_HEIGHT / 2}
            r={10}
            fill="rgb(56 189 248 / 0.2)"
            className="hover:fill-sky-300/40"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(item.id)
            }}
          />
        )}
        {hasChildren && (
          <text
            x={NODE_WIDTH - 16}
            y={NODE_HEIGHT / 2 + 1}
            textAnchor="middle"
            fontSize="14"
            fill="rgb(56 189 248)"
            className="pointer-events-none"
          >
            {isExpanded ? '−' : '+'}
          </text>
        )}
      </g>

      {/* Children */}
      {hasChildren && isExpanded &&
        children.map((child, idx) => (
          <DepartmentNode
            key={child.id}
            item={child}
            allItems={allItems}
            x={childStartX + idx * (NODE_WIDTH + HORIZONTAL_GAP)}
            y={childY}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </g>
  )
}

function getTreeSize(
  items: DepartmentTreeItem[],
  parentId: string | null,
  expandedIds: Set<string>,
  isExpanded = true
): { width: number; height: number } {
  const children = buildTree(items, parentId)
  if (children.length === 0 || !isExpanded) return { width: NODE_WIDTH, height: NODE_HEIGHT }
  const childSizes = children.map((c) =>
    getTreeSize(items, c.id, expandedIds, expandedIds.has(c.id))
  )
  const totalWidth = Math.max(
    childSizes.reduce((sum, s) => sum + s.width, 0) + (children.length - 1) * HORIZONTAL_GAP,
    NODE_WIDTH
  )
  const maxChildHeight = Math.max(...childSizes.map((s) => s.height))
  const totalHeight = NODE_HEIGHT + VERTICAL_GAP + maxChildHeight
  return { width: totalWidth, height: totalHeight }
}

export function CompanyTab() {
  const { token } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const [items, setItems] = useState<DepartmentTreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentForAdd, setParentForAdd] = useState<DepartmentTreeItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DepartmentTreeItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const list = await apiRequest<DepartmentTreeItem[]>('/api/departments/tree', { token })
      setItems(list)
      setExpandedIds(new Set(list.map((d) => d.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
      stopLoading()
    }
  }, [token, stopLoading])

  useEffect(() => {
    startLoading()
    load()
  }, [load, startLoading])

  const handleAdd = (parent?: DepartmentTreeItem) => {
    setParentForAdd(parent ?? null)
    setForm({ ...emptyForm, parentId: parent?.id ?? null })
    setEditingId(null)
    setModal('add')
  }

  const handleEdit = (item: DepartmentTreeItem) => {
    setParentForAdd(null)
    setForm({ name: item.name, description: item.description ?? '', parentId: item.parentId ?? null })
    setEditingId(item.id)
    setModal('edit')
  }

  const handleDelete = (item: DepartmentTreeItem) => {
    setDeleteConfirm(item)
  }

  const handleSubmitAdd = async () => {
    if (!token || !form.name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/departments', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          parentId: form.parentId || null,
        }),
      })
      setModal(null)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!token || !editingId || !form.name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/departments/${editingId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          parentId: form.parentId || null,
        }),
      })
      setModal(null)
      setEditingId(null)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!token || !deleteConfirm) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/departments/${deleteConfirm.id}`, {
        method: 'DELETE',
        token,
      })
      setDeleteConfirm(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setIsSubmitting(false)
    }
  }

  const rootItems = buildTree(items, null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">
          Структура отделов
        </h3>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedIds(new Set(items.map((d) => d.id)))}
              >
                Развернуть всё
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedIds(new Set())}
              >
                Свернуть всё
              </Button>
            </>
          )}
          <Button icon="add" onClick={() => handleAdd()}>
            Добавить отдел
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-text-light text-sm">Загрузка...</div>
      ) : rootItems.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-text-light/50 mb-4 block">
            business
          </span>
          <p className="text-sm text-text-light mb-4">Нет отделов. Добавьте первый отдел.</p>
          <Button onClick={() => handleAdd()}>Добавить отдел</Button>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 shadow-md border border-divider-light/50 overflow-auto">
          <svg
            width={Math.max(
              400,
              rootItems.reduce(
                (w, r) =>
                  w +
                  getTreeSize(items, r.id, expandedIds, expandedIds.has(r.id)).width +
                  (rootItems.length > 1 ? HORIZONTAL_GAP : 0),
                rootItems.length > 1 ? -HORIZONTAL_GAP : 0
              )
            )}
            height={
              rootItems.length > 0
                ? Math.max(
                    200,
                    rootItems.reduce(
                      (h, r) =>
                        Math.max(
                          h,
                          getTreeSize(items, r.id, expandedIds, expandedIds.has(r.id)).height
                        ),
                      0
                    )
                  )
                : 200
            }
            className="min-w-full"
          >
            {rootItems.map((item, idx) => {
              const prevWidth = rootItems
                .slice(0, idx)
                .reduce(
                  (w, r) =>
                    w +
                    getTreeSize(items, r.id, expandedIds, expandedIds.has(r.id)).width +
                    HORIZONTAL_GAP,
                  0
                )
              const thisWidth = getTreeSize(
                items,
                item.id,
                expandedIds,
                expandedIds.has(item.id)
              ).width
              const x = prevWidth + Math.max(0, (thisWidth - NODE_WIDTH) / 2)
              return (
                <DepartmentNode
                  key={item.id}
                  item={item}
                  allItems={items}
                  x={x}
                  y={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAdd}
                />
              )
            })}
          </svg>
        </div>
      )}

      {modal && (
        <Modal
          isOpen
          title={modal === 'add' ? 'Добавить отдел' : 'Редактировать отдел'}
          onClose={() => {
            setModal(null)
            setForm(emptyForm)
            setEditingId(null)
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">
                Название
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Отдел продаж"
                icon="business"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">
                Описание
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Опционально"
                icon="description"
              />
            </div>
            {modal === 'add' && parentForAdd && (
              <p className="text-xs text-text-light">
                Родительский отдел: <strong>{parentForAdd.name}</strong>
              </p>
            )}
            {modal === 'edit' && items.length > 1 && (
              <div>
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">
                  Родительский отдел
                </label>
                <select
                  value={form.parentId ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, parentId: e.target.value || null }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-divider-light bg-surface text-sm font-bold"
                >
                  <option value="">— Без родителя (корневой) —</option>
                  {items
                    .filter((d) => d.id !== editingId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                fullWidth
                onClick={modal === 'add' ? handleSubmitAdd : handleSubmitEdit}
                isLoading={isSubmitting}
                disabled={!form.name.trim()}
              >
                {modal === 'add' ? 'Добавить' : 'Сохранить'}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setModal(null)}>
                Отмена
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title="Удалить отдел?"
          message={`Отдел «${deleteConfirm.name}» будет удалён. Сотрудники и посетители этого отдела не будут удалены, но у них сбросится привязка к отделу.`}
          confirmText="Удалить"
          variant="danger"
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}
