import { useLayoutEffect, useState } from 'react'
import thailand from '@svg-maps/thailand'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { provinceNames } from '../data'

function shadeFor(id) {
  return 1 + [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5
}

export default function ThailandMap({ selected, onSelect, priceLabel }) {
  const [marker, setMarker] = useState({ x: 205, y: 505 })
  const [zoom, setZoom] = useState(1)

  useLayoutEffect(() => {
    const location = thailand.locations.find((item) => item.name === selected.name)
    const path = location ? document.getElementById(`province-${location.id}`) : null
    if (!path) return
    const box = path.getBBox()
    setMarker({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
  }, [selected.name])

  return (
    <section className="map-panel" aria-label="แผนที่ประเทศไทย">
      <div className="map-heading">
        <div>
          <h2>แผนที่ประเทศไทย</h2>
          <p>เลือกจังหวัดเพื่อดูอากาศ ดิน และภูมิอากาศตามพิกัด</p>
        </div>
        <div className="map-value"><span>ราคาอ้างอิงประเทศ</span><strong>{priceLabel}</strong></div>
      </div>

      <div className="map-stage">
        <div className="map-tools" aria-label="เครื่องมือแผนที่">
          <button type="button" aria-label="ขยายแผนที่" title="ขยายแผนที่" disabled={zoom >= 1.8} onClick={() => setZoom((value) => Math.min(1.8, value + .2))}><Plus size={18} /></button>
          <button type="button" aria-label="ย่อแผนที่" title="ย่อแผนที่" disabled={zoom <= .8} onClick={() => setZoom((value) => Math.max(.8, value - .2))}><Minus size={18} /></button>
          <button type="button" aria-label="รีเซ็ตขนาดแผนที่" title="รีเซ็ตขนาดแผนที่" onClick={() => setZoom(1)}><LocateFixed size={18} /></button>
        </div>
        <svg className="thailand-map" viewBox={thailand.viewBox} role="img" aria-label="จังหวัดของประเทศไทย">
          <title>เลือกจังหวัดบนแผนที่ประเทศไทย</title>
          <g className="map-content" transform={`translate(280 512.5) scale(${zoom}) translate(-280 -512.5)`}>
          {thailand.locations.map((location) => provinceNames[location.name] ? (
            <path
              key={location.id}
              id={`province-${location.id}`}
              d={location.path}
              className={`province shade-${shadeFor(location.id)} ${selected.name === location.name ? 'selected' : ''}`}
              aria-label={provinceNames[location.name] ?? location.name}
              tabIndex="0"
              onClick={(event) => onSelect(location, event.currentTarget)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(location, event.currentTarget) }}
            />
          ) : <path key={location.id} d={location.path} className="map-water" aria-hidden="true" />)}
          <g className="svg-marker" transform={`translate(${marker.x} ${marker.y})`} aria-hidden="true">
            <circle r="10" />
            <circle r="4" className="marker-core" />
            <rect x="-34" y="15" width="68" height="25" rx="7" />
            <text x="0" y="32" textAnchor="middle">{selected.label}</text>
          </g>
          </g>
        </svg>
        <div className="map-legend">
          <strong>ระดับสีแผนที่</strong>
          <span><i className="legend-color l5" />เข้มมาก</span>
          <span><i className="legend-color l3" />ปานกลาง</span>
          <span><i className="legend-color l1" />อ่อน</span>
          <small>สีใช้แยกพื้นที่เพื่อการอ่านแผนที่ ไม่ใช่ค่าราคารายจังหวัด</small>
        </div>
      </div>
    </section>
  )
}
