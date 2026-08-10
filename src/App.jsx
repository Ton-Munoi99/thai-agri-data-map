import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Leaf, MapPin, RefreshCw } from 'lucide-react'
import ThailandMap from './components/ThailandMap'
import InsightRail from './components/InsightRail'
import { fetchClimate, fetchPrice, fetchWeather, fallbacks } from './api'
import { anchorCoordinates, climatePeriods, crops, provinceNames } from './data'

const initialLocation = { name: 'Kanchanaburi', label: 'กาญจนบุรี', ...anchorCoordinates.Kanchanaburi }

function approximateCoordinate(target) {
  const box = target?.getBBox()
  if (!box) return { lat: 14.02, lon: 99.53 }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  return { lon: 97.25 + (x / 560) * 8.6, lat: 20.55 - (y / 1025) * 14.7 }
}

function App() {
  const [selected, setSelected] = useState(initialLocation)
  const [cropId, setCropId] = useState('cassava')
  const [climatePeriodId, setClimatePeriodId] = useState(climatePeriods[0].id)
  const [price, setPrice] = useState(fallbacks.price)
  const [weather, setWeather] = useState(fallbacks.weather)
  const [climate, setClimate] = useState(fallbacks.climate)
  const [loading, setLoading] = useState(true)
  const [staleSources, setStaleSources] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentCrop = useMemo(() => crops.find((crop) => crop.id === cropId) ?? crops[0], [cropId])
  const currentPeriod = useMemo(() => climatePeriods.find((period) => period.id === climatePeriodId) ?? climatePeriods[0], [climatePeriodId])

  const loadData = useCallback(async (signal) => {
    setLoading(true)
    const stale = []
    const results = await Promise.allSettled([
      fetchPrice(currentCrop.resourceId, signal),
      fetchWeather(selected.lat, selected.lon, signal),
      fetchClimate(selected.lat, selected.lon, currentPeriod.start, currentPeriod.end, signal),
    ])
    if (results[0].status === 'fulfilled') setPrice(results[0].value); else stale.push('data.go.th')
    if (results[1].status === 'fulfilled') setWeather(results[1].value); else stale.push('Open‑Meteo')
    if (results[2].status === 'fulfilled') setClimate(results[2].value); else stale.push('NASA POWER')
    if (!signal.aborted) {
      setStaleSources(stale)
      setUpdatedAt(new Date())
      setLoading(false)
    }
  }, [currentCrop.resourceId, currentPeriod.end, currentPeriod.start, selected.lat, selected.lon])

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData, refreshKey])

  const selectProvince = (location, target) => {
    const coords = anchorCoordinates[location.name] ?? approximateCoordinate(target)
    setSelected({ name: location.name, label: provinceNames[location.name] ?? location.name, ...coords })
  }

  const selectFromDropdown = (name) => {
    const location = { name, id: document.querySelector(`[aria-label="${provinceNames[name] ?? name}"]`)?.id?.replace('province-', '') }
    const target = location.id ? document.getElementById(`province-${location.id}`) : null
    selectProvince(location, target)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="เกษตรไทย Data Map"><span className="brand-mark"><Leaf /></span><span>เกษตรไทย <b>Data Map</b></span></a>
        <div className="update-area"><span>อัปเดตล่าสุด<br/><b>{updatedAt ? updatedAt.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'กำลังเชื่อมต่อ'}</b></span><button className="refresh-button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}><RefreshCw size={17} className={loading ? 'spinning' : ''}/>อัปเดตข้อมูล</button></div>
      </header>

      <div className="controls" id="top">
        <label><span><Leaf size={15}/>สินค้าเกษตร</span><select value={cropId} onChange={(event) => setCropId(event.target.value)}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.label}</option>)}</select><ChevronDown /></label>
        <label><span><MapPin size={15}/>จังหวัด</span><select value={selected.name} onChange={(event) => selectFromDropdown(event.target.value)}>{Object.entries(provinceNames).sort((a, b) => a[1].localeCompare(b[1], 'th')).map(([name, label]) => <option key={name} value={name}>{label}</option>)}</select><ChevronDown /></label>
        <label className="period-control"><span><CalendarDays size={15}/>ช่วงข้อมูลภูมิอากาศ</span><select value={climatePeriodId} onChange={(event) => setClimatePeriodId(event.target.value)}>{climatePeriods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select><ChevronDown /></label>
      </div>

      <main className="dashboard">
        <ThailandMap selected={selected} onSelect={selectProvince} priceLabel={`${Number(price.current?.value ?? 0).toFixed(2)} ${price.current?.unit ?? 'บาท/กก.'}`} />
        <InsightRail selected={selected} price={price} weather={weather} climate={climate} climatePeriod={currentPeriod} loading={loading} staleSources={staleSources}/>
      </main>

      <footer className="source-footer">
        <strong>แหล่งข้อมูล</strong>
        <a href="https://data.go.th" target="_blank" rel="noreferrer"><i className={staleSources.includes('data.go.th') ? 'warn' : ''}/>data.go.th <span>ราคาเกษตรระดับประเทศ</span></a>
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer"><i className={staleSources.includes('Open‑Meteo') ? 'warn' : ''}/>Open‑Meteo <span>อากาศและความชื้นดิน</span></a>
        <a href="https://power.larc.nasa.gov" target="_blank" rel="noreferrer"><i className={staleSources.includes('NASA POWER') ? 'warn' : ''}/>NASA POWER <span>ภูมิอากาศย้อนหลัง</span></a>
      </footer>
    </div>
  )
}

export default App
