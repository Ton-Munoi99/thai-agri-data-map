import { fallbackClimate, fallbackWeather, monthLabels, nasaMonthKeys, provinceNames } from './data'

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

const unitLabel = (unit) => {
  if (unit === 'กิโลกรัม') return 'บาท/กก.'
  if (unit === 'ร้อยผล' || unit === 'ร้อยฟอง') return `บาท/100 ${unit.slice(3)}`
  return `บาท/${unit}`
}

const thaiDate = (date) => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))

async function fetchFarmPlusYear() {
  const json = await fetchJsonCached('/api/oae-farmplus/years', 6 * 60 * 60 * 1000)
  const years = (json?.data ?? []).map(Number).filter(Number.isFinite)
  if (!json?.success || !years.length) throw new Error('ไม่พบปีข้อมูล OAE Farm Plus')
  return Math.max(...years)
}

function farmPlusParams(product, year) {
  return new URLSearchParams({ product: product.oaeProduct, year: String(year) })
}

export async function fetchPrice(product) {
  const year = await fetchFarmPlusYear()
  const json = await fetchJsonCached(`/api/oae-farmplus/price-trends?${farmPlusParams(product, year)}`, 5 * 60 * 1000)
  const series = (json?.data ?? [])
    .map((row) => ({
      date: row.date,
      period: thaiDate(row.date),
      value: Number(row.avg_price),
      minimum: Number(row.min_price),
      maximum: Number(row.max_price),
      count: Number(row.report_count) || 0,
    }))
    .filter((row) => row.date && Number.isFinite(row.value))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  if (!json?.success || !series.length) throw new Error(`ไม่พบราคาของ${product.label}`)
  const latest = series.at(-1)
  return {
    series: series.slice(-18),
    current: { ...latest, product: product.oaeProduct, unit: unitLabel(product.unit) },
    total: series.reduce((sum, row) => sum + row.count, 0),
    mode: 'weekly', source: 'OAE Farm Plus', sourceDetail: 'สศก. · ราคาที่เกษตรกรขายได้ ณ ไร่นา',
  }
}

export async function fetchProvincePrices(product) {
  const year = await fetchFarmPlusYear()
  const json = await fetchJsonCached(`/api/oae-farmplus/price-by-province?${farmPlusParams(product, year)}`, 5 * 60 * 1000)
  if (!json?.success) throw new Error('ไม่พบข้อมูลราคารายจังหวัด')
  const priceUnit = unitLabel(product.unit)
  const byProvince = Object.fromEntries((json.data ?? []).flatMap((row) => {
    const name = provinceByThaiName[String(row.province_name ?? '').trim()]
    const value = Number(row.avg_price)
    if (!name || !Number.isFinite(value)) return []
    return [[name, {
      value,
      count: Number(row.report_count) || 0,
      unit: priceUnit,
      date: row.create_at,
    }]]
  }))
  const listingCount = Object.values(byProvince).reduce((sum, item) => sum + item.count, 0)
  return {
    byProvince, unit: priceUnit, listingCount, coverage: Object.keys(byProvince).length,
    source: 'OAE Farm Plus', sourceDetail: 'ราคาเฉลี่ยที่เกษตรกรขายได้รายจังหวัด',
  }
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
  mode: 'unavailable', source: 'OAE Farm Plus', sourceDetail: 'ไม่พบข้อมูลล่าสุด',
})

export const fallbacks = {
  price: {
    series: [], current: { product: 'กำลังโหลดราคา OAE', value: null, unit: '', period: '' },
    mode: 'unavailable', source: 'OAE Farm Plus', sourceDetail: 'กำลังเชื่อมต่อ',
  },
  provincePrices: { byProvince: {}, unit: '', listingCount: 0, coverage: 0, source: null },
  weather: fallbackWeather,
  climate: fallbackClimate,
}
