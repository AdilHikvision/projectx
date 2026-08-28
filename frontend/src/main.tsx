import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { LoadingProvider } from './context/LoadingContext.tsx'
import { ModuleProvider } from './context/ModuleContext.tsx'

// Иконки — это лигатуры шрифта Material Symbols, который грузится с Google
// Fonts. Пока шрифт не готов, браузер рисует текст самой лигатуры
// («progress_activity», «alternate_email»), и это выглядит как ключи переводов.
// Поэтому иконки показываем только после того, как шрифт действительно
// загрузился; до этого CSS прячет их (см. index.css, .icon-font-ready).
// document.fonts.check() здесь не годится — он отвечает true и на системном
// фоллбеке, поэтому проверяем статус самого @font-face.
const ICON_FAMILY = 'Material Symbols Rounded'

const isIconFontLoaded = () =>
  Array.from(document.fonts).some(
    (face) => face.family.replace(/["']/g, '') === ICON_FAMILY && face.status === 'loaded',
  )

if (typeof document.fonts?.load === 'function') {
  void document.fonts.load(`24px "${ICON_FAMILY}"`).catch(() => undefined)

  const poll = window.setInterval(() => {
    if (!isIconFontLoaded()) return
    window.clearInterval(poll)
    document.documentElement.classList.add('icon-font-ready')
  }, 100)

  // Нет интернета — шрифт не приедет никогда. Перестаём ждать: иконки останутся
  // пустыми плейсхолдерами, но слова-лигатуры пользователю не покажем.
  window.setTimeout(() => window.clearInterval(poll), 10000)
} else {
  // Старый браузер без Font Loading API — показываем как есть.
  document.documentElement.classList.add('icon-font-ready')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <ModuleProvider>
            <App />
          </ModuleProvider>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  </StrictMode>,
)
