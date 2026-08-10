import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Leaf, MapPin, RefreshCw } from 'lucide-react'
import ThailandMap from './components/ThailandMap'
import InsightRail from './components/InsightRail'
import { clearApiCache, fetchClimate, fetchPrice, fetchProvincePrices, fetchWeather, fallbacks, unavailablePrice } from './api'
import { anchorCoordinates, climatePeriods, cropGroups, crops, provinceNames } from './data'

const initialLocation = { name: 'Trat', label: 'ตราด', ...anchorCoordinates.Trat }

function approximateCoordinate(target) {
  const box = target?.getBBox()
  if (!box) return { lat: 14.02, lon: 99.53 }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  return { lon: 97.25 + (x / 560) * 8.6, lat: 20.55 - (y / 1025) * 14.7 }
}

function App() {
  const [selected, setSelected] = useState(initialLocation)
  const [cropId, setCropId] = useState('fruit-durian')
  const [climatePeriodId, setClimatePeriodId] = useState(climatePeriods[0].id)
  const [price, setPrice] = useState(fallbacks.price)
  const [provincePrices, setProvincePrices] = useState(fallbacks.provincePrices)
  const [weather, setWeather] = useState(fallbacks.weather)
  const [climate, setClimate] = useState(fallbacks.climate)
  const [loading, setLoading] = useState({ price: true, map: false, weather: true, climate: true })
  const [sourceFailures, setSourceFailures] = useState({})
  const [updatedAt, setUpdatedAt] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentCrop = useMemo(() => crops.find((crop) => crop.id === cropId) ?? crops[0], [cropId])
  const currentPeriod = useMemo(() => climatePeriods.find((period) => period.id === climatePeriodId) ?? climatePeriods[0], [climatePeriodId])

  const markLoading = useCallback((key, value) => setLoading((state) => ({ ...state, [key]: value })), [])
  const markSource = useCallback((key, failed) => setSourceFailures((state) => ({ ...state, [key]: failed })), [])

  useEffect(() => {
    let active = true
    const source = 'OAE Farm Plus · แนวโน้ม'
    markLoading('price', true)
    setPrice(unavailablePrice(currentCrop))
    fetchPrice(currentCrop)
      .then((value) => { if (active) { setPrice(value); markSource(source, false) } })
      .catch(() => { if (active) markSource(source, true) })
      .finally(() => { if (active) { markLoading('price', false); setUpdatedAt(new Date()) } })
    return () => { active = false }
  }, [currentCrop, markLoading, markSource, refreshKey])

  useEffect(() => {
    let active = true
    setProvincePrices(fallbacks.provincePrices)
    markLoading('map', true)
    fetchProvincePrices(currentCrop)
      .then((value) => { if (active) { setProvincePrices(value); markSource('OAE Farm Plus · รายจังหวัด', false) } })
      .catch(() => { if (active) markSource('OAE Farm Plus · รายจังหวัด', true) })
      .finally(() => { if (active) markLoading('map', false) })
    return () => { active = false }
  }, [currentCrop, markLoading, markSource, refreshKey])

  useEffect(() => {
    let active = true
    markLoading('weather', true)
    fetchWeather(selected.lat, selected.lon)
      .then((value) => { if (active) { setWeather(value); markSource('Open‑Meteo', false) } })
      .catch(() => { if (active) markSource('Open‑Meteo', true) })
      .finally(() => { if (active) { markLoading('weather', false); setUpdatedAt(new Date()) } })
    return () => { active = false }
  }, [markLoading, markSource, refreshKey, selected.lat, selected.lon])

  useEffect(() => {
    let active = true
    markLoading('climate', true)
    fetchClimate(selected.lat, selected.lon, currentPeriod.start, currentPeriod.end)
      .then((value) => { if (active) { setClimate(value); markSource('NASA POWER', false) } })
      .catch(() => { if (active) markSource('NASA POWER', true) })
      .finally(() => { if (active) markLoading('climate', false) })
    return () => { active = false }
  }, [currentPeriod.end, currentPeriod.start, markLoading, markSource, refreshKey, selected.lat, selected.lon])

  const selectProvince = (location, target) => {
    const coords = anchorCoordinates[location.name] ?? approximateCoordinate(target)
    setSelected({ name: location.name, label: provinceNames[location.name] ?? location.name, ...coords })
  }

  const selectFromDropdown = (name) => {
    const location = { name, id: document.querySelector(`[aria-label="${provinceNames[name] ?? name}"]`)?.id?.replace('province-', '') }
    const target = location.id ? document.getElementById(`province-${location.id}`) : null
    selectProvince(location, target)
  }

  const refresh = () => {
    clearApiCache()
    setRefreshKey((value) => value + 1)
  }

  const activeSources = new Set(['Open‑Meteo', 'NASA POWER', 'OAE Farm Plus · แนวโน้ม', 'OAE Farm Plus · รายจังหวัด'])
  const staleSources = Object.entries(sourceFailures).filter(([source, failed]) => failed && activeSources.has(source)).map(([source]) => source)
  const isLoading = Object.values(loading).some(Boolean)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="เกษตรไทย Data Map"><span className="brand-mark"><Leaf /></span><span>เกษตรไทย <b>Data Map</b></span></a>
        <div className="update-area"><span>อัปเดตล่าสุด<br/><b>{updatedAt ? updatedAt.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'กำลังเชื่อมต่อ'}</b></span><button className="refresh-button" onClick={refresh} disabled={isLoading}><RefreshCw size={17} className={isLoading ? 'spinning' : ''}/>อัปเดตข้อมูล</button></div>
      </header>

      <div className="controls" id="top">
        <label><span><Leaf size={15}/>สินค้าเกษตร · ผลไม้ OAE {cropGroups[0].items.length} ชนิด</span><select value={cropId} onChange={(event) => setCropId(event.target.value)}>{cropGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.items.map((crop) => <option key={crop.id} value={crop.id}>{crop.label}</option>)}</optgroup>)}</select><ChevronDown /></label>
        <label><span><MapPin size={15}/>จังหวัด</span><select value={selected.name} onChange={(event) => selectFromDropdown(event.target.value)}>{Object.entries(provinceNames).sort((a, b) => a[1].localeCompare(b[1], 'th')).map(([name, label]) => <option key={name} value={name}>{label}</option>)}</select><ChevronDown /></label>
        <label className="period-control"><span><CalendarDays size={15}/>ช่วงข้อมูลภูมิอากาศ</span><select value={climatePeriodId} onChange={(event) => setClimatePeriodId(event.target.value)}>{climatePeriods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select><ChevronDown /></label>
      </div>

      <main className="dashboard">
        <ThailandMap selected={selected} onSelect={selectProvince} product={currentCrop} provincePrices={provincePrices} priceLabel={`${Number.isFinite(Number(price.current?.value)) ? Number(price.current.value).toFixed(2) : '—'} ${price.current?.unit ?? ''}`} loading={loading.map} />
        <InsightRail selected={selected} price={price} weather={weather} climate={climate} climatePeriod={currentPeriod} loading={loading} staleSources={staleSources}/>
      </main>

      <footer className="source-footer">
        <strong>แหล่งข้อมูล</strong>
        <a href="https://farmgateprice.nabc.go.th/" target="_blank" rel="noreferrer"><i className={staleSources.some((source) => source.startsWith('OAE Farm Plus')) ? 'warn' : ''}/>สศก. · OAE Farm Plus <span>ราคาที่เกษตรกรขายได้ ณ ไร่นา · รายจังหวัด</span></a>
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer"><i className={staleSources.includes('Open‑Meteo') ? 'warn' : ''}/>Open‑Meteo <span>อากาศและความชื้นดิน</span></a>
        <a href="https://power.larc.nasa.gov" target="_blank" rel="noreferrer"><i className={staleSources.includes('NASA POWER') ? 'warn' : ''}/>NASA POWER <span>ภูมิอากาศย้อนหลัง</span></a>
      </footer>
    </div>
  )
}

export default App
