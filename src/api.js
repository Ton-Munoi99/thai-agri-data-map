import { fallbackClimate, fallbackPrice, fallbackWeather, monthLabels, nasaMonthKeys } from './data'

const fetchJson = async (url, signal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function fetchPrice(resourceId, signal) {
  const url = `/api/data-go/datastore_search?resource_id=${resourceId}&limit=200&sort=_id%20asc`
  const json = await fetchJson(url, signal)
  const records = json?.result?.records
  if (!json.success || !records?.length) throw new Error('ไม่พบข้อมูลราคา')
  const series = records
    .map((row) => ({
      period: `${row.year ?? row['ปี']}/${row.month ?? row['เดือน']}`,
      value: Number(row.value ?? row.Value ?? row.values ?? row['ค่า'] ?? row['ค่าข้อมูล']),
      product: row.product_name ?? row.commod ?? row['รายการ'] ?? 'สินค้าเกษตร',
      unit: row.unit ?? row['หน่วย'] ?? 'บาท/กก.',
      year: Number(row.year ?? row['ปี']), month: Number(row.month ?? row['เดือน']) || 0,
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month))
  if (!series.length) throw new Error('ไม่พบค่าราคาในชุดข้อมูล')
  return { series: series.slice(-18), current: series.at(-1), total: json.result.total }
}

export async function fetchWeather(lat, lon, signal) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: 'Asia/Bangkok', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',
    hourly: 'soil_moisture_0_to_1cm,et0_fao_evapotranspiration',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration',
  })
  const json = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`, signal)
  const hourIndex = Math.max(0, json.hourly.time.findIndex((time) => time >= json.current.time))
  return {
    temperature: json.current.temperature_2m, apparent: json.current.apparent_temperature,
    humidity: json.current.relative_humidity_2m, wind: json.current.wind_speed_10m,
    rain: json.daily.precipitation_sum[0], soil: json.hourly.soil_moisture_0_to_1cm[hourIndex],
    et0: json.daily.et0_fao_evapotranspiration[0], min: json.daily.temperature_2m_min[0], max: json.daily.temperature_2m_max[0],
    forecast: json.daily.time.map((date, i) => ({ name: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)), rain: json.daily.precipitation_sum[i] })),
  }
}

export async function fetchClimate(lat, lon, start, end, signal) {
  const params = new URLSearchParams({
    parameters: 'T2M,PRECTOTCORR', community: 'AG', longitude: lon, latitude: lat,
    start: String(start), end: String(end), format: 'JSON',
  })
  const json = await fetchJson(`/api/nasa-power/temporal/climatology/point?${params}`, signal)
  const parameter = json?.properties?.parameter
  if (!parameter?.T2M || !parameter?.PRECTOTCORR) throw new Error('ไม่พบข้อมูลภูมิอากาศ')
  return nasaMonthKeys.map((key, i) => ({ name: monthLabels[i], temp: parameter.T2M[key], rain: parameter.PRECTOTCORR[key] }))
}

export const fallbacks = { price: { series: fallbackPrice, current: { ...fallbackPrice.at(-1), product: 'มันสำปะหลังสด คละ', unit: 'บาท/กก.' } }, weather: fallbackWeather, climate: fallbackClimate }
