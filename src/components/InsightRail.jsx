import { useState } from 'react'
import { AlertTriangle, CloudRain, Droplets, Gauge, ThermometerSun, Wind } from 'lucide-react'
import { ClimateChart, PriceChart } from './Charts'

const format = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—'

const tabs = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'price', label: 'ราคาเกษตร' },
  { id: 'weather', label: 'อากาศและดิน' },
  { id: 'climate', label: 'ภูมิอากาศย้อนหลัง' },
]

export default function InsightRail({ selected, price, weather, climate, climatePeriod, loading, staleSources }) {
  const [activeTab, setActiveTab] = useState('overview')
  const previous = price.series.at(-2)?.value
  const change = previous ? price.current.value - previous : 0
  const show = (module) => activeTab === 'overview' || activeTab === module
  return (
    <aside className="insight-rail" aria-live="polite" aria-busy={loading}>
      <div className="rail-tabs" aria-label="ส่วนข้อมูล">
        {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </div>

      <header className="location-header">
        <div><h1>{selected.label}</h1><p>พิกัด {selected.lat.toFixed(3)}, {selected.lon.toFixed(3)}</p></div>
        {staleSources.length > 0 && <div className="stale-note"><AlertTriangle size={17} /><span>ใช้ข้อมูลสำรองบางส่วน<br/><b>{staleSources.join(', ')}</b></span></div>}
      </header>

      {show('weather') && <section className="module weather-module">
        <div className="module-title"><h3>สภาพอากาศปัจจุบัน</h3><span>Open‑Meteo</span></div>
        <div className="weather-main">
          <div className="temperature"><ThermometerSun size={34} /><strong>{format(weather.temperature)}°</strong><span>รู้สึกเหมือน {format(weather.apparent)}°C<br/>สูงสุด {format(weather.max)}° · ต่ำสุด {format(weather.min)}°</span></div>
          <div className="weather-facts">
            <div><Droplets /><span>ความชื้น<strong>{format(weather.humidity, 0)}%</strong></span></div>
            <div><Wind /><span>ความเร็วลม<strong>{format(weather.wind)} กม./ชม.</strong></span></div>
          </div>
        </div>
      </section>}

      {show('price') && <section className="module price-module">
        <div className="module-title"><h3>ราคาเกษตร</h3><span>data.go.th · ระดับประเทศ</span></div>
        <div className="price-layout">
          <div className="price-copy"><span>{price.current.product}</span><strong>{format(price.current.value, 2)} <small>{price.current.unit}</small></strong><p className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)} จากเดือนก่อน</p><small>งวด {price.current.period}</small></div>
          <PriceChart data={price.series} />
        </div>
      </section>}

      {show('weather') && <section className="module soil-module">
        <div className="module-title"><h3>สภาพดินและน้ำ</h3><span>พยากรณ์ 24 ชม.</span></div>
        <div className="soil-grid">
          <div><CloudRain /><span>ฝน<strong>{format(weather.rain)} มม.</strong></span></div>
          <div><Droplets /><span>ความชื้นดิน<strong>{format(weather.soil * 100, 0)}%</strong></span></div>
          <div><Gauge /><span>ET₀<strong>{format(weather.et0)} มม./วัน</strong></span></div>
        </div>
      </section>}

      {show('climate') && <section className="module climate-module">
        <div className="module-title"><h3>ภูมิอากาศย้อนหลัง</h3><span>NASA POWER · เฉลี่ย {climatePeriod.start}–{climatePeriod.end}</span></div>
        <div className="chart-legend"><span className="rain-line">ฝนเฉลี่ย</span><span className="temp-line">อุณหภูมิ</span></div>
        <ClimateChart data={climate} />
      </section>}
      {loading && <div className="loading-wash"><span className="spinner" />กำลังอัปเดตข้อมูลจริง…</div>}
    </aside>
  )
}
