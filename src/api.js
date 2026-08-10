import { fallbackClimate, fallbackPrice, fallbackWeather, monthLabels, nasaMonthKeys, provinceNames } from './data'

const OAE_FRUIT_RESOURCE = 'd1374b32-895c-48b0-bd29-7917b217c809'
const DGTFARM_RESOURCE = 'a91d0f7a-7208-4a05-8fdf-e41ebce83573'
const responseCache = new Map()
const provinceByThaiName = Object.fromEntries(Object.entries(provinceNames).map(([name, label]) => [label, name]))

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

const fetchJsonCached = (url, ttl = 30 * 60 * 1000) => {
  const now = Date.now()
  const cached = responseCache.get(url)
  if (cached?.value && cached.expires > now) return Promise.resolve(cached.value)
  if (cached?.promise) return cached.promise
  const promise = fetchJson(url)
    .then((value) => {
      responseCache.set(url, { value, expires: Date.now() + ttl })
      return value
    })
    .catch((error) => {
      responseCache.delete(url)
      throw error
    })
  responseCache.set(url, { promise, expires: now + ttl })
  return promise
}

export function clearApiCache() {
  responseCache.clear()
}

const median = (values) => {
  const ordered = [...values].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2
}

const unitLabel = (unit) => unit === 'กิโลกรัม' ? 'บาท/กก.' : `บาท/${unit}`

async function fetchDataGoPrice(product) {
  const url = `/api/data-go/datastore_search?resource_id=${product.resourceId}&limit=200&sort=_id%20asc`
  const json = await fetchJsonCached(url)
  const records = json?.result?.records
  if (!json.success || !records?.length) throw new Error('ไม่พบข้อมูลราคา')
  const series = records
    .map((row) => ({
      period: `${row.year ?? row['ปี']}/${row.month ?? row['เดือน']}`,
      value: Number(row.value ?? row.Value ?? row.values ?? row['ค่า'] ?? row['ค่าข้อมูล']),
      product: row.product_name ?? row.commod ?? row['รายการ'] ?? product.label,
      unit: row.unit ?? row['หน่วย'] ?? 'บาท/กก.',
      year: Number(row.year ?? row['ปี']), month: Number(row.month ?? row['เดือน']) || 0,
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month))
  if (!series.length) throw new Error('ไม่พบค่าราคาในชุดข้อมูล')
  return {
    series: series.slice(-18), current: series.at(-1), total: json.result.total,
    mode: 'monthly', source: 'data.go.th', sourceDetail: 'ราคาเกษตรระดับประเทศ',
  }
}

async function fetchOaeFruitPrice(product) {
  const url = `/api/catalog-oae/datastore_search?resource_id=${OAE_FRUIT_RESOURCE}&limit=500`
  const json = await fetchJsonCached(url, 12 * 60 * 60 * 1000)
  const series = (json?.result?.records ?? [])
    .filter((row) => row.commod === product.commodity && row.attribute === 'ราคาที่เกษตรกรขายได้')
    .map((row) => ({
      period: String(row.year_th), year: Number(row.year_th), value: Number(row.value),
      product: `${product.label} (ราคาที่เกษตรกรขายได้)`, unit: row.unit || 'บาท/กก.',
    }))
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.value))
    .sort((a, b) => a.year - b.year)
  if (!series.length) throw new Error(`ไม่พบราคาของ${product.label}`)
  return {
    series, current: series.at(-1), total: series.length,
    mode: 'annual', source: 'สศก.', sourceDetail: 'ราคาฟาร์มระดับประเทศ รายปี',
  }
}

async function fetchDgtfarmRows() {
  const url = `/api/catalog-acfs/datastore_search?resource_id=${DGTFARM_RESOURCE}&limit=1000`
  const json = await fetchJsonCached(url, 6 * 60 * 60 * 1000)
  if (!json?.success || !json?.result?.records?.length) throw new Error('ไม่พบข้อมูล DGTFarm')
  return json.result.records
}

async function marketSnapshot(product) {
  const allRows = await fetchDgtfarmRows()
  const matching = allRows.filter((row) => {
    const type = String(row.product_type ?? '')
    return row.product_category === 'ผลไม้' && product.aliases.some((alias) => type.includes(alias)) && Number(row.price) > 0
  })
  if (!matching.length) throw new Error(`ไม่พบราคาเสนอขายของ${product.label}`)

  const unitCounts = matching.reduce((counts, row) => {
    const unit = String(row.unit ?? '').trim()
    if (unit) counts[unit] = (counts[unit] ?? 0) + 1
    return counts
  }, {})
  const selectedUnit = unitCounts['กิโลกรัม'] ? 'กิโลกรัม' : Object.entries(unitCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const comparableRows = matching.filter((row) => String(row.unit ?? '').trim() === selectedUnit)
  const grouped = comparableRows.reduce((groups, row) => {
    const provinceLabel = String(row.province ?? '').trim()
    const provinceName = provinceByThaiName[provinceLabel]
    if (!provinceName) return groups
    if (!groups[provinceName]) groups[provinceName] = []
    groups[provinceName].push(Number(row.price))
    return groups
  }, {})
  const byProvince = Object.fromEntries(Object.entries(grouped).map(([name, values]) => [name, {
    value: median(values), count: values.length, unit: unitLabel(selectedUnit),
  }]))
  const values = comparableRows.map((row) => Number(row.price)).filter(Number.isFinite)
  return {
    byProvince, unit: unitLabel(selectedUnit), listingCount: values.length,
    coverage: Object.keys(byProvince).length, median: median(values),
  }
}

async function fetchDgtfarmPrice(product) {
  const snapshot = await marketSnapshot(product)
  const series = Object.entries(snapshot.byProvince)
    .map(([name, item]) => ({ period: provinceNames[name], value: item.value }))
    .sort((a, b) => a.value - b.value)
  return {
    series,
    current: {
      product: `${product.label} (มัธยฐานราคาเสนอขาย)`, value: snapshot.median,
      unit: snapshot.unit, period: `${snapshot.coverage} จังหวัด · ${snapshot.listingCount} รายการ`,
    },
    total: snapshot.listingCount, mode: 'snapshot', source: 'DGTFarm',
    sourceDetail: 'ราคาเสนอขายจากผู้จำหน่ายมาตรฐาน',
  }
}

export async function fetchPrice(product) {
  if (product.source === 'oae-fruit') return fetchOaeFruitPrice(product)
  if (product.source === 'dgtfarm') return fetchDgtfarmPrice(product)
  return fetchDataGoPrice(product)
}

export async function fetchProvincePrices(product) {
  if (product.category !== 'fruit') {
    return { byProvince: {}, unit: '', listingCount: 0, coverage: 0, source: null }
  }
  const snapshot = await marketSnapshot(product)
  return { ...snapshot, source: 'DGTFarm', sourceDetail: 'มัธยฐานราคาเสนอขายต่อจังหวัด' }
}

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: 'Asia/Bangkok', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',
    hourly: 'soil_moisture_0_to_1cm,et0_fao_evapotranspiration',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration',
  })
  const json = await fetchJsonCached(`https://api.open-meteo.com/v1/forecast?${params}`, 5 * 60 * 1000)
  const hourIndex = Math.max(0, json.hourly.time.findIndex((time) => time >= json.current.time))
  return {
    temperature: json.current.temperature_2m, apparent: json.current.apparent_temperature,
    humidity: json.current.relative_humidity_2m, wind: json.current.wind_speed_10m,
    rain: json.daily.precipitation_sum[0], soil: json.hourly.soil_moisture_0_to_1cm[hourIndex],
    et0: json.daily.et0_fao_evapotranspiration[0], min: json.daily.temperature_2m_min[0], max: json.daily.temperature_2m_max[0],
    forecast: json.daily.time.map((date, i) => ({ name: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)), rain: json.daily.precipitation_sum[i] })),
  }
}

export async function fetchClimate(lat, lon, start, end) {
  const params = new URLSearchParams({
    parameters: 'T2M,PRECTOTCORR', community: 'AG', longitude: lon, latitude: lat,
    start: String(start), end: String(end), format: 'JSON',
  })
  const json = await fetchJsonCached(`/api/nasa-power/temporal/climatology/point?${params}`, 7 * 24 * 60 * 60 * 1000)
  const parameter = json?.properties?.parameter
  if (!parameter?.T2M || !parameter?.PRECTOTCORR) throw new Error('ไม่พบข้อมูลภูมิอากาศ')
  return nasaMonthKeys.map((key, i) => ({ name: monthLabels[i], temp: parameter.T2M[key], rain: parameter.PRECTOTCORR[key] }))
}

export const unavailablePrice = (product) => ({
  series: [], current: { product: product.label, value: null, unit: '', period: 'ไม่พบข้อมูล' },
  mode: 'unavailable', source: product.source === 'dgtfarm' ? 'DGTFarm' : 'data.go.th', sourceDetail: 'ไม่พบข้อมูลล่าสุด',
})

export const fallbacks = {
  price: {
    series: fallbackPrice,
    current: { ...fallbackPrice.at(-1), product: 'มันสำปะหลังสด คละ', unit: 'บาท/กก.' },
    mode: 'monthly', source: 'data.go.th', sourceDetail: 'ราคาเกษตรระดับประเทศ',
  },
  provincePrices: { byProvince: {}, unit: '', listingCount: 0, coverage: 0, source: null },
  weather: fallbackWeather,
  climate: fallbackClimate,
}
