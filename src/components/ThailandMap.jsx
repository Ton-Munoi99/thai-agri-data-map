import { useLayoutEffect, useMemo, useState } from 'react'
import thailand from '@svg-maps/thailand'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { provinceNames } from '../data'

const priceColors = ['#e6f3e9', '#c9e4d0', '#9fd0ad', '#68b47f', '#23824c']

const formatPrice = (value) => Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function buildScale(byProvince) {
  const values = Object.values(byProvince).map((item) => Number(item.value)).filter(Number.isFinite).sort((a, b) => a - b)
  if (!values.length) return { values, boundaries: [], colors: [], colorFor: () => null }
  const minimum = values[0]
  const maximum = values.at(-1)
  if (minimum === maximum) return { values, boundaries: [minimum, maximum], colors: [priceColors[2]], colorFor: () => priceColors[2] }
  const boundaries = Array.from({ length: 6 }, (_, index) => minimum + ((maximum - minimum) * index / 5))
  return {
    values,
    boundaries,
    colors: priceColors,
    colorFor: (value) => priceColors[Math.min(4, boundaries.slice(1, 5).filter((limit) => value > limit).length)],
  }
}

export default function ThailandMap({ selected, onSelect, product, provincePrices, priceLabel, loading }) {
  const [marker, setMarker] = useState({ x: 205, y: 505 })
  const [zoom, setZoom] = useState(1)
  const [hovered, setHovered] = useState(null)
  const scale = useMemo(() => buildScale(provincePrices.byProvince), [provincePrices.byProvince])

  useLayoutEffect(() => {
    const location = thailand.locations.find((item) => item.name === selected.name)
    const path = location ? document.getElementById(`province-${location.id}`) : null
    if (!path) return
    const box = path.getBBox()
    setMarker({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
  }, [selected.name])

  const showTooltip = (event, location) => {
    const stage = event.currentTarget.closest('.map-stage')
    const stageBox = stage?.getBoundingClientRect()
    const pathBox = event.currentTarget.getBoundingClientRect()
    if (!stageBox) return
    const pointerX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : pathBox.left + pathBox.width / 2
    const pointerY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : pathBox.top + pathBox.height / 2
    setHovered({
      name: location.name,
      x: Math.max(100, Math.min(stageBox.width - 100, pointerX - stageBox.left)),
      y: Math.max(78, Math.min(stageBox.height - 70, pointerY - stageBox.top)),
    })
  }

  const mapTitle = `แผนที่ราคา${product.label} รายจังหวัด`
  const hoveredPrice = hovered ? provincePrices.byProvince[hovered.name] : null

  return (
    <section className="map-panel" aria-label="แผนที่ประเทศไทย">
      <div className="map-heading">
        <div>
          <h2>{mapTitle}</h2>
          <p>เลื่อนเมาส์เหนือจังหวัดเพื่อดูราคาเฉลี่ยที่เกษตรกรขายได้ ณ ไร่นา</p>
        </div>
        <div className="map-value"><span>สศก. (OAE) · ราคาเฉลี่ยประเทศล่าสุด</span><strong>{priceLabel}</strong></div>
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
          {thailand.locations.map((location) => {
            if (!provinceNames[location.name]) return <path key={location.id} d={location.path} className="map-water" aria-hidden="true" />
            const item = provincePrices.byProvince[location.name]
            const detail = item ? `${formatPrice(item.value)} ${item.unit}` : 'ไม่มีข้อมูลราคารายจังหวัด'
            return (
              <path
                key={location.id}
                id={`province-${location.id}`}
                d={location.path}
                className={`province ${item ? 'has-price' : 'no-price'} ${selected.name === location.name ? 'selected' : ''}`}
                style={{ fill: item ? scale.colorFor(item.value) : '#e4ebe7' }}
                aria-label={`${provinceNames[location.name]}: ${detail}`}
                tabIndex="0"
                onPointerEnter={(event) => showTooltip(event, location)}
                onPointerMove={(event) => showTooltip(event, location)}
                onPointerLeave={() => setHovered(null)}
                onFocus={(event) => showTooltip(event, location)}
                onBlur={() => setHovered(null)}
                onClick={(event) => { showTooltip(event, location); onSelect(location, event.currentTarget) }}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(location, event.currentTarget) }}
              />
            )
          })}
          <g className="svg-marker" transform={`translate(${marker.x} ${marker.y})`} aria-hidden="true">
            <circle r="10" />
            <circle r="4" className="marker-core" />
            <rect x="-34" y="15" width="68" height="25" rx="7" />
            <text x="0" y="32" textAnchor="middle">{selected.label}</text>
          </g>
          </g>
        </svg>

        {hovered && <div className="map-tooltip" style={{ left: hovered.x, top: hovered.y }} role="status">
          <strong>{provinceNames[hovered.name]}</strong>
          <span>{product.label}</span>
          {hoveredPrice ? <><b>{formatPrice(hoveredPrice.value)} <small>{hoveredPrice.unit}</small></b><em>เฉลี่ยจาก {hoveredPrice.count.toLocaleString('th-TH')} รายงาน · OAE</em></> : <><b className="no-data">ไม่มีข้อมูลรายจังหวัด</b><em>OAE ยังไม่มีรายงานของจังหวัดนี้</em></>}
        </div>}

        <div className="map-legend">
          <strong>{loading ? 'กำลังโหลดระดับราคา…' : 'ระดับราคาเฉลี่ย ณ ไร่นา'}</strong>
          {scale.boundaries.length ? scale.colors.map((color, index) => <span key={color}><i className="legend-color" style={{ background: color }} />{formatPrice(scale.boundaries[index])}–{formatPrice(scale.boundaries[index + 1])}</span>) : <span><i className="legend-color no-data-color" />ไม่มีข้อมูลรายจังหวัด</span>}
          {scale.boundaries.length > 0 && <span><i className="legend-color no-data-color" />ไม่มีข้อมูล</span>}
          <small>{provincePrices.coverage ? `สศก. · OAE Farm Plus · ${provincePrices.unit} · ${provincePrices.coverage} จังหวัด · ${provincePrices.listingCount.toLocaleString('th-TH')} รายงาน` : 'OAE ยังไม่มีข้อมูลรายจังหวัดสำหรับสินค้านี้'}</small>
        </div>
      </div>
    </section>
  )
}
