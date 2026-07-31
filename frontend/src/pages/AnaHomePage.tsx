import { AppLayout } from '../components/templates'
import './ana-home.css'

/* ═══════════════════════════════════════════════════════════════
   Ana səhifə — workforce modulunun açılış görünüşü.
   arkoz.html (192.168.88.189:5090) "Ana səhifə" ekranının BİREBİR portu:
   hero + 2 üzən kart · 4 KPI · donut / son giriş / yeni əməkdaş ·
   məzuniyyət müraciətləri / bugünkü növbələr / sürətli əməliyyatlar / həftəlik statistika.
   DESIGN-SYSTEM.md-yə uyğun (Plus Jakarta Sans, #6C5CE7, radius 18px KÖLGƏSİZ,
   KPI 54px ikon, grid cədvəl, status çipləri, SVG stroke 1.8). Stil SCOPED: ana-home.css.
   Demo data; backend inteqrasiyası sonrakı mərhələdir.
   ═══════════════════════════════════════════════════════════════ */

// Avatar rəng dövrü (DESIGN-SYSTEM §2)
const AV = [['#EFECFD', '#6C5CE7'], ['#EAF8F0', '#1E9B62'], ['#FEF4E6', '#D98324'], ['#E9F1FE', '#3A72CE'], ['#FDECEA', '#D9534A'], ['#F1EDFB', '#7B5BC9']]

interface Recent { initials: string; name: string; position: string; time: string; status: 'İşdə' | 'Gecikdi' | 'İşdə deyil'; chip: string }
const RECENT: Recent[] = [
  { initials: 'RM', name: 'Rəşad Məmmədov', position: 'Marketinq üzrə mütəxəssis', time: '08:55', status: 'İşdə', chip: 'green' },
  { initials: 'Aİ', name: 'Aysel İbrahimova', position: 'UX/UI Dizayner', time: '09:03', status: 'İşdə', chip: 'green' },
  { initials: 'EQ', name: 'Elvin Quliyev', position: 'Proqramçı', time: '09:15', status: 'Gecikdi', chip: 'orange' },
  { initials: 'GƏ', name: 'Günel Əliyeva', position: 'Maliyyə mütəxəssisi', time: '09:18', status: 'İşdə', chip: 'green' },
  { initials: 'MH', name: 'Murat Həsənov', position: 'Satış meneceri', time: '09:25', status: 'İşdə', chip: 'green' },
  { initials: 'NR', name: 'Nigar Rzayeva', position: 'HR mütəxəssisi', time: '09:31', status: 'İşdə', chip: 'green' },
]

// Məzuniyyət müraciətləri
const LEAVES = [
  { initials: 'TH', name: 'Tural Həsənov', type: 'İllik məzuniyyət', date: '24 May - 28 May', status: 'Gözləmədə', chip: 'orange' },
  { initials: 'Zİ', name: 'Zəhra İsmayılova', type: 'Xəstəlik icazəsi', date: '20 May', status: 'Təsdiqləndi', chip: 'green' },
]

// Bugünkü növbələr
const SHIFTS = [
  { icon: 'sun', tint: '#FEF4E6', color: '#D98324', name: 'Səhər növbəsi', time: '09:00 - 18:00', count: '63 nəfər' },
  { icon: 'noon', tint: '#E9F1FE', color: '#3A72CE', name: 'Günorta növbəsi', time: '13:00 - 22:00', count: '34 nəfər' },
  { icon: 'moon', tint: '#EFECFD', color: '#6C5CE7', name: 'Gecə növbəsi', time: '22:00 - 07:00', count: '18 nəfər' },
]

// Sürətli əməliyyatlar
const ACTIONS = [
  { icon: 'scan', tint: '#EFECFD', color: '#6C5CE7', title: 'Üz tanıma cihazları', desc: 'Cihazları idarə edin və statusu izləyin' },
  { icon: 'cal', tint: '#EAF8F0', color: '#1E9B62', title: 'İcazə (izin) yarat', desc: 'Məzuniyyət və digər icazələri qeyd edin' },
  { icon: 'chart', tint: '#FEF4E6', color: '#D98324', title: 'Hesabat yarat', desc: 'Davamiyyət hesabatını ixrac edin' },
]

// Həftəlik statistika (bar chart) — max 150
const WEEK = [
  { d: 'B.e', v: 124 }, { d: 'Ç.a', v: 100 }, { d: 'Ç', v: 118 }, { d: 'C.a', v: 128 },
  { d: 'C', v: 96 }, { d: 'Ş', v: 40, dim: true }, { d: 'B', v: 20, dim: true },
]

// İnline SVG ikonlar (viewBox 0 0 24 24, stroke 1.8 — DESIGN-SYSTEM §8)
const svg = (d: string, color: string, size = 26) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((p, i) => <path key={i} d={p} />)}
  </svg>
)
const IC_GROUP = 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75'
const IC_CHECK = 'M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4 12 14.01l-3-3'
const IC_CLOCK = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M12 6v6l4 2'
const IC_X = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M15 9l-6 6|M9 9l6 6'
const ICONS: Record<string, string> = {
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10|M12 1v2|M12 21v2|M4.2 4.2l1.4 1.4|M18.4 18.4l1.4 1.4|M1 12h2|M21 12h2|M4.2 19.8l1.4-1.4|M18.4 5.6l1.4-1.4',
  noon: 'M17 18a5 5 0 0 0-10 0|M12 2v7|M4.2 10.2l1.4 1.4|M1 18h2|M21 18h2|M18.4 11.6l1.4-1.4|M23 22H1',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2|M17 3h2a2 2 0 0 1 2 2v2|M21 17v2a2 2 0 0 1-2 2h-2|M7 21H5a2 2 0 0 1-2-2v-2|M8 11h.01|M16 11h.01|M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5',
  cal: 'M8 2v4|M16 2v4|M3 10h18|M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
  chart: 'M3 3v18h18|M18 17V9|M13 17V5|M8 17v-3',
}

export function AnaHomePage() {
  return (
    <AppLayout onAction={() => {}}>
      <div className="ana-root">

        {/* HERO */}
        <div className="ana-hero">
          <img className="ana-hero-img" src="/ana-hero.png" alt="Ofisdə üz tanıma ilə keçid nəzarəti" />
          <div className="ana-hero-text">
            <h1>Xoş gəldiniz! Gününüz xoş olsun 👋</h1>
            <p>Bugünkü davamiyyət vəziyyətinə ümumi baxış</p>
          </div>
          <div className="ana-hero-cards">
            <div className="ana-float">
              <span className="ic" style={{ background: '#EAF8F0' }}>{svg(IC_CHECK, '#1E9B62', 20)}</span>
              <div>
                <div className="l1">08:55</div>
                <div className="l2">Rəşad Məmmədov · Giriş vaxtı</div>
              </div>
            </div>
            <div className="ana-float">
              <span className="ic" style={{ background: '#EFECFD' }}>{svg(IC_GROUP, '#6C5CE7', 20)}</span>
              <div>
                <div className="l1">Növbədə 2 nəfər</div>
                <div className="l2">Növbədə olanlar</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="ana-kpis">
          <div className="ana-kpi">
            <div className="ana-kpi-top">
              <span className="ana-kpi-ic" style={{ background: '#EFECFD' }}>{svg(IC_GROUP, '#6C5CE7')}</span>
            </div>
            <div>
              <div className="ana-kpi-lbl">Ümumi əməkdaşlar</div>
              <div className="ana-kpi-num" style={{ color: '#252641' }}>128</div>
              <div className="ana-kpi-sub">Nəfər</div>
            </div>
          </div>
          <div className="ana-kpi green">
            <div className="ana-kpi-top">
              <span className="ana-kpi-ic" style={{ background: '#EAF8F0' }}>{svg(IC_CHECK, '#1E9B62')}</span>
            </div>
            <div>
              <div className="ana-kpi-lbl">İşdə olanlar</div>
              <div className="ana-kpi-num" style={{ color: '#1E9B62' }}>96</div>
              <div className="ana-kpi-sub">Nəfər (75%)</div>
            </div>
          </div>
          <div className="ana-kpi orange">
            <div className="ana-kpi-top">
              <span className="ana-kpi-ic" style={{ background: '#FEF4E6' }}>{svg(IC_CLOCK, '#D98324')}</span>
            </div>
            <div>
              <div className="ana-kpi-lbl">Gecikənlər</div>
              <div className="ana-kpi-num" style={{ color: '#D98324' }}>7</div>
              <div className="ana-kpi-sub">Nəfər (5%)</div>
            </div>
          </div>
          <div className="ana-kpi red">
            <div className="ana-kpi-top">
              <span className="ana-kpi-ic" style={{ background: '#FDECEA' }}>{svg(IC_X, '#D9534A')}</span>
            </div>
            <div>
              <div className="ana-kpi-lbl">İşdə olmayanlar</div>
              <div className="ana-kpi-num" style={{ color: '#D9534A' }}>25</div>
              <div className="ana-kpi-sub">Nəfər (20%)</div>
            </div>
          </div>
        </div>

        {/* 3-sütun */}
        <div className="ana-grid3">
          {/* Donut */}
          <div className="ana-card">
            <div className="ana-card-h"><span className="t">Bugünkü davamiyyət</span></div>
            <div className="ana-donut-wrap">
              <div className="ana-donut" style={{ background: 'conic-gradient(#22B573 0 75%, #E8A33D 75% 80%, #E9736A 80% 100%)' }}>
                <div className="hole">
                  <div className="n">75%</div>
                  <div className="c">İşdə olanlar</div>
                </div>
              </div>
              <div className="ana-legend">
                <div className="ana-lg"><span className="dot" style={{ background: '#22B573' }}></span><span className="nm">İşdə olanlar</span><span className="vl">96 (75%)</span></div>
                <div className="ana-lg"><span className="dot" style={{ background: '#E8A33D' }}></span><span className="nm">Gecikənlər</span><span className="vl">7 (5%)</span></div>
                <div className="ana-lg"><span className="dot" style={{ background: '#E9736A' }}></span><span className="nm">İşdə olmayanlar</span><span className="vl">25 (20%)</span></div>
              </div>
              <button className="ana-btn ghost">Ətraflı hesabat →</button>
            </div>
          </div>

          {/* Son giriş edənlər */}
          <div className="ana-card">
            <div className="ana-card-h">
              <span className="t">Son giriş edənlər</span>
              <button className="ana-link">Hamısına bax →</button>
            </div>
            <div className="ana-thead">
              <span>Əməkdaş</span><span>Giriş</span><span className="r">Status</span>
            </div>
            {RECENT.map((p, i) => (
              <div className="ana-trow" key={p.name}>
                <div className="ana-person">
                  <span className="ana-av" style={{ background: AV[i % AV.length][0], color: AV[i % AV.length][1] }}>{p.initials}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="nm">{p.name}</div>
                    <div className="ps">{p.position}</div>
                  </div>
                </div>
                <div className="ana-time">{p.time}</div>
                <span className={'ana-chip ' + p.chip}>{p.status}</span>
              </div>
            ))}
          </div>

          {/* Yeni əməkdaş */}
          <div className="ana-card ana-add">
            <div className="ana-card-h"><span className="t">Yeni əməkdaş əlavə et</span></div>
            <p className="desc">Əməkdaş məlumatlarını daxil edin və sistemə əlavə edin.</p>
            <div className="illus">İllüstrasiya</div>
            <button className="ana-btn">Əməkdaş əlavə et +</button>
          </div>
        </div>

        {/* ALT SIRA — 4 sütun */}
        <div className="ana-grid4">
          {/* Məzuniyyət müraciətləri */}
          <div className="ana-card ana-col">
            <div className="ana-card-h"><span className="t">Məzuniyyət müraciətləri</span></div>
            <div className="ana-list">
              {LEAVES.map((l, i) => (
                <div className="ana-leave" key={l.name}>
                  <span className="ana-av sm" style={{ background: AV[(i + 2) % AV.length][0], color: AV[(i + 2) % AV.length][1] }}>{l.initials}</span>
                  <div className="ana-leave-mid">
                    <div className="nm">{l.name}</div>
                    <div className="ps">{l.type} · {l.date}</div>
                  </div>
                  <span className={'ana-chip ' + l.chip}>{l.status}</span>
                </div>
              ))}
            </div>
            <button className="ana-link foot">Hamısına bax →</button>
          </div>

          {/* Bugünkü növbələr */}
          <div className="ana-card ana-col">
            <div className="ana-card-h"><span className="t">Bugünkü növbələr</span></div>
            <div className="ana-list">
              {SHIFTS.map((s) => (
                <div className="ana-shift" key={s.name}>
                  <span className="ana-sq" style={{ background: s.tint }}>{svg(ICONS[s.icon], s.color, 20)}</span>
                  <div className="ana-shift-mid">
                    <div className="nm">{s.name}</div>
                    <div className="ps">{s.time}</div>
                  </div>
                  <span className="ana-shift-cnt">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sürətli əməliyyatlar */}
          <div className="ana-card ana-col">
            <div className="ana-card-h"><span className="t">Sürətli əməliyyatlar</span></div>
            <div className="ana-list">
              {ACTIONS.map((a) => (
                <button className="ana-action" key={a.title}>
                  <span className="ana-sq" style={{ background: a.tint }}>{svg(ICONS[a.icon], a.color, 20)}</span>
                  <div className="ana-action-mid">
                    <div className="nm">{a.title}</div>
                    <div className="ps">{a.desc}</div>
                  </div>
                  <span className="ana-chev">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bu həftəlik statistika */}
          <div className="ana-card ana-col">
            <div className="ana-card-h"><span className="t">Bu həftəlik statistika</span></div>
            <div className="ana-chart">
              <div className="ana-yaxis"><span>150</span><span>100</span><span>50</span><span>0</span></div>
              <div className="ana-bars">
                {WEEK.map((w) => (
                  <div className="ana-bar-col" key={w.d}>
                    <div className="ana-bar-track">
                      <div className="ana-bar" style={{ height: (w.v / 150 * 100) + '%', background: w.dim ? '#E9E7F9' : '#6C5CE7' }}></div>
                    </div>
                    <span className="ana-bar-lbl">{w.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
