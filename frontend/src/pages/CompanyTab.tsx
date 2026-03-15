import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button, Input } from '../components/atoms'
import { Modal } from '../components/organisms'
import { ConfirmDialog } from '../components/molecules'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface Company {
  id: string
  name: string
  description?: string | null
}

interface DepartmentTreeItem {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  parentId?: string | null
  companyId?: string | null
  employeesCount: number
  visitorsCount: number
}

interface DepartmentForm {
  name: string
  description: string
  parentId: string | null
  companyId: string | null
}

interface CompanyForm {
  name: string
  description: string
}

const emptyDeptForm: DepartmentForm = { name: '', description: '', parentId: null, companyId: null }
const emptyCompanyForm: CompanyForm = { name: '', description: '' }

type AppMode = 'Single' | 'Multiple' | 'None'

function buildTree(items: DepartmentTreeItem[], parentId: string | null): DepartmentTreeItem[] {
  return items
    .filter((d) => (d.parentId ?? null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

const NODE_WIDTH = 260
const NODE_HEIGHT = 120
const HORIZONTAL_GAP = 40
const VERTICAL_GAP = 80

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
  if (childCenters.length === 0) return null
  const midY = parentBottom + (childTop - parentBottom) / 2
  
  return (
    <g className="tree-connectors" style={{ pointerEvents: 'none' }}>
      {childCenters.map((cx, i) => {
        const d = `M ${parentX} ${parentBottom} C ${parentX} ${midY}, ${cx} ${midY}, ${cx} ${childTop}`
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{ 
              filter: 'drop-shadow(0px 2px 2px rgba(14, 165, 233, 0.3))',
              opacity: 0.8
            }}
          />
        )
      })}
    </g>
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
    <g className="animate-in fade-in zoom-in-95 duration-500">
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

      <g
        transform={`translate(${x}, ${y})`}
        className="group/node select-none"
      >
        {/* Glow effect on hover */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={16}
          fill="rgb(56 189 248 / 0)"
          className="transition-all duration-300 group-hover/node:fill-sky-400/10 -m-2 opacity-0 group-hover/node:opacity-100"
        />

        {/* Main Card */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={16}
          fill="white"
          filter="url(#nodeShadow)"
          className="transition-all duration-300 group-hover/node:-translate-y-1 group-hover/node:fill-slate-50/50"
        />
        
        {/* Left accent bar */}
        <rect
          width={4}
          height={NODE_HEIGHT - 48}
          x={0}
          y={24}
          rx={2}
          fill="rgb(56 189 248)"
          className="group-hover/node:height-full group-hover/node:y-0 transition-all duration-300"
        />

        <foreignObject x={0} y={0} width={NODE_WIDTH} height={NODE_HEIGHT} className="transition-transform duration-300 group-hover/node:-translate-y-1 pointer-events-none">
          <div className="p-3.5 h-full flex flex-col justify-between pointer-events-auto overflow-hidden">
            <div className="flex items-start justify-between gap-2 overflow-hidden">
              <div className="min-w-0 flex-1">
                <h5 className="text-[10px] font-black text-text-dark tracking-wider leading-tight truncate uppercase group-hover/node:text-sky-600 transition-colors">
                  {item.name}
                </h5>
                <p className="text-[9px] text-text-light font-bold truncate opacity-70 mt-0.5 leading-none">
                  {item.description || 'Нет описания'}
                </p>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover/node:opacity-100 transition-all duration-300 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddChild(item); }}
                  className="w-5 h-5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="w-5 h-5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  className="w-5 h-5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[12px]">delete</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50/80 border border-divider-light/20 shadow-sm">
                  <span className="material-symbols-outlined text-[12px] text-sky-500">groups</span>
                  <span className="text-[10px] font-black text-text-dark">{item.employeesCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50/80 border border-divider-light/20 shadow-sm">
                  <span className="material-symbols-outlined text-[12px] text-emerald-500">person_pin_circle</span>
                  <span className="text-[10px] font-black text-text-dark">{item.visitorsCount}</span>
                </div>
              </div>
              
              {hasChildren && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    isExpanded ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-500'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[14px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              )}
            </div>
          </div>
        </foreignObject>
      </g>

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
  const [mode, setMode] = useState<AppMode>('None')
  const [companies, setCompanies] = useState<Company[]>([])
  const [items, setItems] = useState<DepartmentTreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'initial' | 'add-dept' | 'edit-dept' | 'add-company' | 'edit-company' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deptForm, setDeptForm] = useState<DepartmentForm>(emptyDeptForm)
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'dept' | 'company', item: any } | null>(null)
  const [zoom, setZoom] = useState<Record<string, number>>({})
  const [pan, setPan] = useState<Record<string, { x: number, y: number }>>({})
  const [isPanning, setIsPanning] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent, companyId: string) => {
    if (e.button !== 0) return // Only left click
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return
    
    setIsPanning(true)
    setStartPos({ 
      x: e.clientX - (pan[companyId]?.x || 0), 
      y: e.clientY - (pan[companyId]?.y || 0) 
    })
  }

  const handleMouseMove = (e: React.MouseEvent, companyId: string) => {
    if (!isPanning) return
    setPan(prev => ({
      ...prev,
      [companyId]: {
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      }
    }))
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [settings, companyList, deptList] = await Promise.all([
        apiRequest<any[]>('/api/system-settings', { token }),
        apiRequest<Company[]>('/api/companies', { token }),
        apiRequest<DepartmentTreeItem[]>('/api/departments/tree', { token })
      ])

      const modeSetting = settings.find(s => s.key === 'CompanyMode')
      const currentMode = (modeSetting?.value as AppMode) || 'None'
      
      setMode(currentMode)
      setCompanies(companyList)
      setItems(deptList)
      setExpandedIds(new Set(deptList.map((d) => d.id)))

      if (currentMode === 'None') {
        setModal('initial')
      }
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

  const handleSetMode = async (newMode: AppMode, companyName?: string) => {
    if (!token) return
    setIsSubmitting(true)
    try {
      if (newMode === 'Single' && companyName) {
        await apiRequest('/api/companies', {
          method: 'POST',
          token,
          body: JSON.stringify({ name: companyName })
        })
      }
      await apiRequest('/api/system-settings', {
        method: 'POST',
        token,
        body: JSON.stringify({ key: 'CompanyMode', value: newMode })
      })
      setModal(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка настройки')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDept = (parent?: DepartmentTreeItem, companyId?: string) => {
    setDeptForm({ 
      ...emptyDeptForm, 
      parentId: parent?.id ?? null,
      companyId: companyId ?? parent?.companyId ?? companies[0]?.id ?? null
    })
    setEditingId(null)
    setModal('add-dept')
  }

  const handleEditDept = (item: DepartmentTreeItem) => {
    setDeptForm({ 
      name: item.name, 
      description: item.description ?? '', 
      parentId: item.parentId ?? null,
      companyId: item.companyId ?? null
    })
    setEditingId(item.id)
    setModal('edit-dept')
  }

  const handleSubmitDept = async () => {
    if (!token || !deptForm.name.trim()) return
    setIsSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/departments/${editingId}` : '/api/departments'
      await apiRequest(url, {
        method,
        token,
        body: JSON.stringify({
          name: deptForm.name.trim(),
          description: deptForm.description.trim() || null,
          parentId: deptForm.parentId || null,
          companyId: deptForm.companyId || null,
        }),
      })
      setModal(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddCompany = () => {
    setCompanyForm(emptyCompanyForm)
    setEditingId(null)
    setModal('add-company')
  }

  const handleSubmitCompany = async () => {
    if (!token || !companyForm.name.trim()) return
    setIsSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies'
      await apiRequest(url, {
        method,
        token,
        body: JSON.stringify({
          name: companyForm.name.trim(),
          description: companyForm.description.trim() || null
        }),
      })
      setModal(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (type: 'dept' | 'company', item: any) => {
    setDeleteConfirm({ type, item })
  }

  const handleConfirmDelete = async () => {
    if (!token || !deleteConfirm) return
    setIsSubmitting(true)
    try {
      const url = deleteConfirm.type === 'dept' 
        ? `/api/departments/${deleteConfirm.item.id}` 
        : `/api/companies/${deleteConfirm.item.id}`
      await apiRequest(url, { method: 'DELETE', token })
      setDeleteConfirm(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-text-light text-sm">Загрузка...</div>

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>
      )}

      {mode === 'None' && items.length === 0 ? (
        <div className="py-16 text-center space-y-8">
           <div className="max-w-2xl mx-auto bg-surface rounded-3xl p-12 shadow-md border-none">
             <span className="material-symbols-outlined text-6xl text-sky-500 mb-6 block">domain_add</span>
             <h2 className="text-2xl font-black text-text-dark mb-4">Начальная настройка</h2>
             <p className="text-text-light mb-8">Выберите режим работы системы. Это определит, как будет строиться структура вашей организации.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div 
                 className="p-6 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all group bg-white border-none"
                 onClick={() => setModal('initial')}
               >
                 <span className="material-symbols-outlined text-4xl text-text-light group-hover:text-sky-500 mb-4 block">business</span>
                 <h3 className="font-bold text-lg mb-2">Одна компания</h3>
                 <p className="text-xs text-text-light text-center">Используйте этот режим, если вы настраиваете систему для одного офиса или предприятия.</p>
               </div>
               
               <div 
                 className="p-6 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all group bg-white border-none"
                 onClick={() => handleSetMode('Multiple')}
               >
                 <span className="material-symbols-outlined text-4xl text-text-light group-hover:text-sky-500 mb-4 block">hub</span>
                 <h3 className="font-bold text-lg mb-2">Группа компаний</h3>
                 <p className="text-xs text-text-light text-center">Позволяет создавать множество независимых компаний и прикреплять к ним отделы.</p>
               </div>
             </div>
           </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="py-16 text-center">
          <div className="max-w-xl mx-auto bg-surface rounded-2xl p-10 shadow-md border-none">
            <span className="material-symbols-outlined text-5xl text-sky-500 mb-4 block">domain_add</span>
            <h2 className="text-lg font-black text-text-dark mb-2">Нет компаний</h2>
            <p className="text-sm text-text-light mb-6">
              {mode === 'Single'
                ? 'Создайте компанию для начала работы.'
                : 'Добавьте первую компанию для управления структурой.'}
            </p>
            <Button icon="add" onClick={handleAddCompany}>
              {mode === 'Single' ? 'Создать компанию' : 'Добавить компанию'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">
              {mode === 'Multiple' ? 'Компании и отделы' : 'Структура компании'}
            </h3>
            <div className="flex gap-2">
              {mode === 'Multiple' && (
                <Button variant="outline" icon="add" onClick={handleAddCompany}>
                  Добавить компанию
                </Button>
              )}
              <Button icon="add" onClick={() => handleAddDept()}>
                Добавить отдел
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            {companies.map(company => {
              const companyDepts = items.filter(d => d.companyId === company.id)
              const rootDepts = buildTree(companyDepts, null)
              
              return (
                <div key={company.id} className="bg-surface rounded-3xl p-8 shadow-md border-none overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-black text-text-dark">{company.name}</h4>
                      {company.description && <p className="text-xs text-text-light">{company.description}</p>}
                    </div>
                    {mode === 'Multiple' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setCompanyForm({ name: company.name, description: company.description ?? '' })
                            setEditingId(company.id)
                            setModal('edit-company')
                          }}
                        >
                          ✎
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete('company', company)}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>

                  {rootDepts.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl shadow-sm border-none">
                      <p className="text-xs text-text-light mb-4">В этой компании пока нет отделов</p>
                      <Button size="sm" variant="outline" onClick={() => handleAddDept(undefined, company.id)}>
                        Создать первый отдел
                      </Button>
                    </div>
                  ) : (
                      <div 
                        className="relative h-[600px] overflow-hidden rounded-2xl shadow-md bg-[#e5e7eb] select-none border-none"
                        onMouseDown={(e) => handleMouseDown(e, company.id)}
                        onMouseMove={(e) => handleMouseMove(e, company.id)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        {/* Zoom Controls */}
                        <div className="absolute top-4 right-4 z-30 flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-divider-light/10">
                          <button 
                            onClick={() => setZoom(prev => ({ ...prev, [company.id]: Math.min((prev[company.id] || 1) + 0.1, 1.5) }))}
                            className="w-8 h-8 rounded-lg hover:bg-sky-50 text-text-dark transition-all flex items-center justify-center pointer-events-auto"
                          >
                            <span className="material-symbols-outlined text-lg">add</span>
                          </button>
                          <div className="h-[1px] bg-divider-light/10 mx-1" />
                          <button 
                            onClick={() => {
                              setZoom(prev => ({ ...prev, [company.id]: 1 }))
                              setPan(prev => ({ ...prev, [company.id]: { x: 0, y: 0 } }))
                            }}
                            className="text-[9px] font-black text-center py-1 text-text-light hover:text-sky-500 transition-colors pointer-events-auto"
                            title="Reset Zoom & Pan"
                          >
                            {Math.round((zoom[company.id] || 1) * 100)}%
                          </button>
                          <div className="h-[1px] bg-divider-light/10 mx-1" />
                          <button 
                            onClick={() => setZoom(prev => ({ ...prev, [company.id]: Math.max((prev[company.id] || 1) - 0.1, 0.4) }))}
                            className="w-8 h-8 rounded-lg hover:bg-sky-50 text-text-dark transition-all flex items-center justify-center pointer-events-auto"
                          >
                            <span className="material-symbols-outlined text-lg">remove</span>
                          </button>
                        </div>

                        {/* Interactive Canvas */}
                        <div 
                          className={`w-full h-full relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                          style={{ 
                            transform: `translate(${pan[company.id]?.x || 0}px, ${pan[company.id]?.y || 0}px) scale(${zoom[company.id] || 1})`,
                            transformOrigin: '0 0',
                            transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                          }}
                        >
                          {/* Grid dots */}
                          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
                          
                          <svg
                            width={Math.max(2000, rootDepts.reduce((w, r) => w + getTreeSize(companyDepts, r.id, expandedIds, expandedIds.has(r.id)).width + HORIZONTAL_GAP, 2000))}
                            height={Math.max(1000, Math.max(...rootDepts.map(r => getTreeSize(companyDepts, r.id, expandedIds, expandedIds.has(r.id)).height)) + 500)}
                            className="relative z-10 overflow-visible"
                          >
                        <defs>
                          <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="150%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                            <feOffset dx="0" dy="4" result="offsetblur" />
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.08" />
                            </feComponentTransfer>
                            <feMerge>
                              <feMergeNode />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(56 189 248)" />
                            <stop offset="100%" stopColor="rgb(14 165 233)" />
                          </linearGradient>
                        </defs>

                         {rootDepts.map((item, idx) => {
                            const size = getTreeSize(companyDepts, item.id, expandedIds, expandedIds.has(item.id))
                            const prevWidth = rootDepts.slice(0, idx).reduce((w, r) => w + getTreeSize(companyDepts, r.id, expandedIds, expandedIds.has(r.id)).width + HORIZONTAL_GAP, 0)
                            const x = prevWidth + Math.max(0, (size.width - NODE_WIDTH) / 2)
                            return (
                              <DepartmentNode
                                key={item.id}
                                item={item}
                                allItems={companyDepts}
                                x={x}
                                y={NODE_HEIGHT / 4} // Padding top inside SVG
                                expandedIds={expandedIds}
                                onToggle={(id) => setExpandedIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(id)) next.delete(id)
                                  else next.add(id)
                                  return next
                                })}
                                onEdit={handleEditDept}
                                onDelete={(d) => handleDelete('dept', d)}
                                onAddChild={handleAddDept}
                              />
                            )
                          })}
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODALS */}
      
      {modal === 'initial' && (
        <Modal isOpen title="Название компании" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-text-light">Введите название вашей компании для завершения настройки.</p>
            <Input 
              placeholder="Название компании" 
              value={companyForm.name} 
              onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
              autoFocus
            />
            <Button 
              fullWidth 
              onClick={() => handleSetMode('Single', companyForm.name)} 
              isLoading={isSubmitting}
              disabled={!companyForm.name.trim()}
            >
              Завершить
            </Button>
          </div>
        </Modal>
      )}

      {(modal === 'add-dept' || modal === 'edit-dept') && (
        <Modal 
          isOpen 
          title={modal === 'add-dept' ? 'Добавить отдел' : 'Редактировать отдел'} 
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Название</label>
              <Input 
                value={deptForm.name} 
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="Напр. Отдел продаж"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Описание</label>
              <Input 
                value={deptForm.description} 
                onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Опционально"
              />
            </div>
            {mode === 'Multiple' && !deptForm.parentId && (
              <div>
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Компания</label>
                <select 
                  className="w-full bg-surface border-2 border-divider-light rounded-xl h-12 px-4 text-sm focus:border-sky-400 outline-none transition-all"
                  value={deptForm.companyId ?? ''}
                  onChange={e => setDeptForm({ ...deptForm, companyId: e.target.value })}
                >
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <Button fullWidth onClick={handleSubmitDept} isLoading={isSubmitting} disabled={!deptForm.name.trim()}>
              {modal === 'add-dept' ? 'Добавить' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {(modal === 'add-company' || modal === 'edit-company') && (
        <Modal 
          isOpen 
          title={modal === 'add-company' ? 'Добавить компанию' : 'Редактировать компанию'} 
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input 
              value={companyForm.name} 
              onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="Название компании"
            />
            <Input 
              value={companyForm.description} 
              onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })}
              placeholder="Описание (опционально)"
            />
            <Button fullWidth onClick={handleSubmitCompany} isLoading={isSubmitting} disabled={!companyForm.name.trim()}>
              {modal === 'add-company' ? 'Добавить' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen
          title={deleteConfirm.type === 'dept' ? 'Удалить отдел?' : 'Удалить компанию?'}
          message={`Это действие нельзя будет отменить.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteConfirm(null)}
          isLoading={isSubmitting}
          variant="danger"
        />
      )}
    </div>
  )
}
