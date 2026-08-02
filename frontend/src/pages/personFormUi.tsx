import type { ReactNode } from 'react'

/* ═══ Общие примитивы оформления карточек людей по референс-дизайну.
   Используются и на странице добавления, и на карточке сотрудника/посетителя,
   чтобы оба экрана выглядели одинаково. ═══ */

/** Поле ввода: высота 48px, рамка #E6E6F0, скругление 12px, подсветка при фокусе. */
export const PM_INPUT =
  'w-full h-12 px-4 rounded-xl border border-[#E6E6F0] bg-white text-[13.5px] font-semibold text-text-dark outline-none transition-colors focus:border-primary'

/** Карточка-панель: тонкая рамка #EFEFF5, скругление 18px. */
export const PM_CARD = 'rounded-[18px] border border-[#EFEFF5] bg-surface'

/** Заголовок карточки (15px/700) и подпись под ним. */
export const PM_TITLE = 'text-[15px] font-bold tracking-[-0.3px] text-text-dark'
export const PM_SUB = 'block mt-[7px] text-[11.5px] text-[#8B8CA7] leading-[1.5]'

/** Мягкая кнопка во всю ширину (сиреневая, как в макете). */
export const PM_SOFT_BTN =
  'w-full flex items-center justify-center gap-[9px] bg-[#F4F3FD] rounded-[11px] py-3 text-[12.5px] font-semibold text-primary hover:bg-[#EAE7FC] transition-colors disabled:opacity-50'

/** Подпись поля + обязательная звёздочка. */
export function PmField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px] min-w-0">
      <span className="text-[12.5px] font-semibold text-[#4A4B6B]">
        {label}{required && <span className="text-[#D9534A]"> *</span>}
      </span>
      {children}
    </div>
  )
}

/** Статус-пилюля (записано / нет) из карточки «Биометрические данные». */
export function PmPill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold ${ok ? 'bg-[#EAF8F0] text-[#1E9B62]' : 'bg-[#F1F0F7] text-[#8B8CA7]'}`}>
      {children}
    </span>
  )
}
