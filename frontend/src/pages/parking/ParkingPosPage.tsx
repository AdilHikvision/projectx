import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button } from '../../components/atoms'
import { ConfirmDialog } from '../../components/molecules'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

/* ═══ POS платной парковки: один инпут номера по центру → полная сводка по машине,
   открытая сессия с суммой к оплате и кнопка оплаты/открытия шлагбаума. ═══ */

interface PosResult {
  plate: string
  found: boolean
  vehicle: {
    id: string; plate: string; brand: string | null; color: string | null
    country: string | null; company: string | null; vehicleType: string | null
    photoUrl: string | null; ownerName: string | null; ownerPhone: string | null
    isActive: boolean; permitActive: boolean
  } | null
  listStatus: 'Allow' | 'Block' | null
  listCategory: string | null
  subscription: { name: string; endDate: string; unlimited: boolean; entriesLimit: number | null; entriesUsed: number } | null
  openSession: {
    sessionId: string; enteredUtc: string; minutes: number; amount: number
    requiresPayment: boolean; tariffName: string | null; cameraName: string | null; photoUrl: string | null
    /** Когда оплатили и до какого момента нужно выехать. */
    paidUtc?: string | null; paidUntilUtc?: string | null; graceExpired?: boolean
  } | null
  recentSessions: { enteredUtc: string; exitedUtc: string | null; cost: number | null; paymentMethod: string | null; isDebt?: boolean }[]
  /** Сумма прошлых выездов без оплаты. */
  debt?: number
  /** Разрешённое время стоянки для этого номера, минут; null — без ограничения. */
  timeLimitMinutes?: number | null
}

/** Ответ сервера про шлагбаум — общий для ручного въезда и ручного выпуска. */
interface Barrier {
  barrierTriggered: boolean
  barrierSkipped: boolean
  barrierError?: string | null
}

const fmtDT = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'
const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`)

export function ParkingPosPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState<PosResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payMethod, setPayMethod] = useState('cash')
  const [error, setError] = useState<string | null>(null)
  const [paidOk, setPaidOk] = useState(false)
  const [paidUntil, setPaidUntil] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const [entryDenied, setEntryDenied] = useState<string | null>(null)
  // Ручной выпуск и то, что ответил шлагбаум: кассир должен видеть, открылся он или нет.
  const [releasing, setReleasing] = useState(false)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [barrierMsg, setBarrierMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const lookup = async () => {
    const p = plate.trim()
    if (!token || !p) return
    setLoading(true); setError(null); setPaidOk(false); setPaidUntil(null)
    try {
      const r = await apiRequest<PosResult>(`/api/parking/pos-lookup?plate=${encodeURIComponent(p)}`, { token })
      setResult(r)
      setPayMethod('cash')
    } catch (e) { setError(e instanceof Error ? e.message : 'error'); setResult(null) }
    finally { setLoading(false) }
  }

  const pay = async () => {
    if (!token || !result?.openSession) return
    setPaying(true); setError(null)
    try {
      const res = await apiRequest<{ paidUntilUtc: string | null; graceMinutes: number }>('/api/parking/pay', {
        method: 'POST', token,
        body: JSON.stringify({ sessionId: result.openSession.sessionId, method: payMethod, operator: 'POS' }),
      })
      // Кассиру важно назвать водителю время, до которого нужно выехать.
      setPaidUntil(res.paidUntilUtc)
      setPaidOk(true)
      const r = await apiRequest<PosResult>(`/api/parking/pos-lookup?plate=${encodeURIComponent(result.plate)}`, { token })
      setResult(r)
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
    finally { setPaying(false) }
  }

  /** Что ответил шлагбаум: открыт, им управляет камера, или импульс не прошёл. */
  const barrierState = (r: Barrier) =>
    r.barrierTriggered ? { ok: true, text: t('parking.pos.barrierOpened') }
      : r.barrierSkipped ? { ok: true, text: t('parking.pos.barrierByCamera') }
        : { ok: false, text: t('parking.pos.barrierFailed', { error: r.barrierError ?? '' }) }

  /** Ручной въезд идёт через то же решение, что и камера: чёрный список, абонемент,
   *  пропуск и свободные места проверяются одинаково. */
  const manualEntry = async () => {
    if (!token || !result) return
    setEntering(true); setError(null); setEntryDenied(null); setBarrierMsg(null)
    try {
      const d = await apiRequest<{ allowed: boolean; reason: string } & Barrier>('/api/parking/access-decision', {
        method: 'POST', token,
        body: JSON.stringify({ plate: result.plate, openSession: true, operator: 'POS' }),
      })
      if (!d.allowed) { setEntryDenied(d.reason); return }
      setBarrierMsg(barrierState(d))
      setResult(await apiRequest<PosResult>(`/api/parking/pos-lookup?plate=${encodeURIComponent(result.plate)}`, { token }))
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
    finally { setEntering(false) }
  }

  /** Ручной выпуск: сессия закрывается даже без оплаты, недобор уходит в долг,
   *  и выездной шлагбаум открывается отдельной командой — проезда-то не было. */
  const release = async () => {
    if (!token || !result?.openSession) return
    setReleasing(true); setError(null); setBarrierMsg(null)
    try {
      const r = await apiRequest<{ closed: number; debt: number } & Barrier>('/api/parking/exit', {
        method: 'POST', token, body: JSON.stringify({ plate: result.plate }),
      })
      setConfirmRelease(false)
      setBarrierMsg(barrierState(r))
      setResult(await apiRequest<PosResult>(`/api/parking/pos-lookup?plate=${encodeURIComponent(result.plate)}`, { token }))
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
    finally { setReleasing(false) }
  }

  const v = result?.vehicle
  const os = result?.openSession

  return (
    <AppLayout>
      <div className="p-6 min-h-full flex flex-col items-center">
        {/* Центральный инпут номера */}
        <div className={`w-full max-w-xl transition-all ${result ? 'mt-4' : 'mt-[18vh]'}`}>
          <h1 className="text-center text-xl font-black text-text-dark mb-1">{t('parking.pos.title')}</h1>
          <p className="text-center text-xs text-text-light mb-5">{t('parking.pos.subtitle')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') void lookup() }}
              placeholder="10-AA-100"
              autoFocus
              className="flex-1 h-16 px-6 rounded-2xl border-2 border-divider-light bg-white text-2xl font-black font-mono text-center tracking-widest text-text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none shadow-sm"
            />
            <Button icon="search" isLoading={loading} disabled={!plate.trim()} onClick={() => void lookup()} className="h-16 px-6">
              {t('parking.pos.find')}
            </Button>
          </div>
          {error && <p className="mt-3 text-center text-sm font-bold text-error-text">{error}</p>}
          {paidOk && (
            <p className="mt-3 text-center text-sm font-black text-green-700 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {paidUntil
                ? t('parking.pos.paidExitBy', { time: fmtDT(paidUntil) })
                : t('parking.pos.paidOpened')}
            </p>
          )}
        </div>

        {/* Результат */}
        {result && (
          <div className="w-full max-w-xl mt-6 space-y-4">
            {/* Статусные плашки */}
            <div className="flex flex-wrap gap-2 justify-center">
              {result.listStatus === 'Block' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-700">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {t('parking.pos.blacklisted')}{result.listCategory ? ` — ${t(`parking.pos.blockReason.${result.listCategory}`, { defaultValue: result.listCategory })}` : ''}
                </span>
              )}
              {result.listStatus === 'Allow' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> {t('parking.pos.whitelisted')}
                </span>
              )}
              {result.subscription && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
                  <span className="material-symbols-outlined text-sm">card_membership</span>
                  {result.subscription.name} → {result.subscription.endDate}
                  {!result.subscription.unlimited && result.subscription.entriesLimit != null && ` (${result.subscription.entriesUsed}/${result.subscription.entriesLimit})`}
                </span>
              )}
              {v?.permitActive && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">verified_user</span> {t('parking.pos.permitActive')}
                </span>
              )}
              {/* Долг за прошлые выезды без оплаты — кассир видит его сразу. */}
              {!!result.debt && result.debt > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-700">
                  <span className="material-symbols-outlined text-sm">money_off</span>
                  {t('parking.pos.debt')}: {result.debt.toFixed(2)} AZN
                </span>
              )}
              {/* Перепростой: показываем, когда машина уже превысила лимит. */}
              {result.timeLimitMinutes != null && os != null && os.minutes > result.timeLimitMinutes && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  <span className="material-symbols-outlined text-sm">timer_off</span>
                  {t('parking.pos.overstay', { limit: result.timeLimitMinutes })}
                </span>
              )}
            </div>

            {/* Машина */}
            {v ? (
              <div className="bg-surface rounded-2xl shadow-sm p-5 flex gap-4">
                {v.photoUrl ? (
                  <img src={v.photoUrl} alt="" className="w-28 h-28 rounded-xl object-cover shrink-0 bg-background-light" />
                ) : (
                  <span className="w-28 h-28 rounded-xl bg-background-light flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-4xl text-text-light">directions_car</span>
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono text-lg font-black text-text-dark">
                    {v.country && <span className="mr-2 text-[10px] font-black text-text-light border border-border rounded px-1 py-0.5 align-middle">{v.country}</span>}
                    {v.plate}
                  </p>
                  <p className="text-sm text-text-dark font-bold">{v.brand ?? '—'}{v.color ? ` · ${v.color}` : ''}{v.vehicleType ? ` · ${t(`parking.veh.type.${v.vehicleType}`, { defaultValue: v.vehicleType })}` : ''}</p>
                  <p className="text-xs text-text-light">{t('parking.ap.owner')}: <span className="font-bold text-text-dark">{v.ownerName ?? '—'}</span>{v.ownerPhone ? ` · ${v.ownerPhone}` : ''}</p>
                  {v.company && <p className="text-xs text-text-light">{t('parking.veh.company')}: <span className="font-bold text-text-dark">{v.company}</span></p>}
                </div>
              </div>
            ) : result.found ? (
              /* Номер известен (стоит внутри, есть визиты, абонемент или запрет), но карточки
                 в белом списке нет. Писать «не найден» здесь нельзя — кассир только что его нашёл. */
              <div className="bg-surface rounded-2xl shadow-sm p-5 flex gap-4">
                <span className="w-28 h-28 rounded-xl bg-background-light flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-4xl text-text-light">directions_car</span>
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono text-lg font-black text-text-dark">{result.plate}</p>
                  <p className="text-xs text-text-light">{t('parking.pos.notInWhitelist')}</p>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl shadow-sm p-5 text-center text-sm text-text-light">
                {t('parking.pos.unknownVehicle')}
              </div>
            )}

            {/* Открытая сессия + оплата */}
            {os ? (
              <div className="bg-surface rounded-2xl shadow-sm p-5 space-y-3">
                <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('parking.pos.insideNow')}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p className="text-text-light">{t('parking.ap.entered')}: <span className="font-mono font-bold text-text-dark">{fmtDT(os.enteredUtc)}</span></p>
                  <p className="text-text-light">{t('parking.ap.duration')}: <span className="font-mono font-bold text-text-dark">{fmtDur(os.minutes)}</span></p>
                  {os.cameraName && <p className="text-text-light">{t('parking.hist.camera')}: <span className="font-bold text-text-dark">{os.cameraName}</span></p>}
                  {os.tariffName && <p className="text-text-light">{t('parking.hist.tariff')}: <span className="font-bold text-text-dark">{os.tariffName}</span></p>}
                </div>
                {/* Уже оплачено: показываем, до какого времени нужно выехать, и просрочку. */}
                {os.paidUtc && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-bold ${os.graceExpired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <span className="material-symbols-outlined text-base align-middle mr-1">
                      {os.graceExpired ? 'timer_off' : 'schedule'}
                    </span>
                    {os.graceExpired
                      ? t('parking.pos.graceExpired')
                      : t('parking.pos.exitBy', { time: os.paidUntilUtc ? fmtDT(os.paidUntilUtc) : '—' })}
                  </div>
                )}
                <p className="text-2xl font-black text-text-dark">
                  {t(os.paidUtc && os.amount > 0 ? 'parking.pos.surcharge' : 'parking.hist.toPay')}: {os.amount.toFixed(2)} AZN
                </p>
                <div className="flex gap-2">
                  {os.requiresPayment && (
                    <select className="h-11 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark outline-none" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      {['cash', 'card', 'online'].map((m) => <option key={m} value={m}>{t(`parking.hist.pay.${m}`)}</option>)}
                    </select>
                  )}
                  {/* Касса принимает деньги; шлагбаум на выезде открывает камера, поэтому
                      кнопка говорит про оплату, а не про шлагбаум. */}
                  <Button fullWidth icon="payments" isLoading={paying} onClick={() => void pay()}>
                    {t('parking.pos.acceptPayment')}
                  </Button>
                  {/* Выпуск руками: когда камера не сработала или водитель встал перед шлагбаумом. */}
                  <Button variant="outline" icon="logout" isLoading={releasing} onClick={() => setConfirmRelease(true)}>
                    {t('parking.pos.release')}
                  </Button>
                </div>
                <p className="text-[11px] text-text-light">{t('parking.pos.payHint')}</p>
                {barrierMsg && (
                  <p className={`text-xs font-bold ${barrierMsg.ok ? 'text-green-700' : 'text-error-text'}`}>{barrierMsg.text}</p>
                )}
              </div>
            ) : (
              /* Машины внутри нет — оператор может оформить въезд руками,
                 если камера не сработала или номер не читается. */
              <div className="bg-surface rounded-2xl shadow-sm p-5 space-y-3 text-center">
                <p className="text-sm text-text-light">{t('parking.pos.notInside')}</p>
                <Button icon="login" isLoading={entering} onClick={() => void manualEntry()} className="mx-auto">
                  {t('parking.pos.manualEntry')}
                </Button>
                {entryDenied && (
                  <p className="text-xs font-bold text-error-text">
                    {t('parking.pos.entryDenied')}: {t(`parking.pos.reason.${entryDenied}`, { defaultValue: entryDenied })}
                  </p>
                )}
                {barrierMsg && (
                  <p className={`text-xs font-bold ${barrierMsg.ok ? 'text-green-700' : 'text-error-text'}`}>{barrierMsg.text}</p>
                )}
              </div>
            )}

            {/* Последние визиты */}
            {result.recentSessions.length > 0 && (
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('parking.pos.recentVisits')}</p>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {result.recentSessions.map((s, i) => (
                      <tr key={i} className="border-b border-border last:border-none">
                        <td className="px-5 py-2.5 font-mono text-xs text-text-light">{fmtDT(s.enteredUtc)}</td>
                        <td className="px-5 py-2.5 font-mono text-xs text-text-light">{fmtDT(s.exitedUtc)}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs font-bold text-text-dark">{s.cost != null ? `${s.cost.toFixed(2)} AZN` : '—'}</td>
                        <td className="px-5 py-2.5 text-right text-xs text-text-light">{s.paymentMethod ? t(`parking.hist.pay.${s.paymentMethod}`, { defaultValue: s.paymentMethod }) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Выпуск без оплаты фиксируется долгом, поэтому спрашиваем подтверждение. */}
      {confirmRelease && (
        <ConfirmDialog
          isOpen
          title={t('parking.pos.releaseConfirmTitle', { plate: result?.plate ?? '' })}
          message={os && os.amount > 0
            ? t('parking.pos.releaseConfirmDebt', { amount: os.amount.toFixed(2) })
            : t('parking.pos.releaseConfirm')}
          onConfirm={() => void release()}
          onClose={() => setConfirmRelease(false)}
          isLoading={releasing}
          variant="danger"
        />
      )}
    </AppLayout>
  )
}
