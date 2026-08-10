import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'

const tooltipStyle = { borderRadius: 10, border: '1px solid #dce5df', boxShadow: '0 8px 24px rgba(22, 55, 35, .08)', fontSize: 12 }

export function PriceChart({ data }) {
  return <ResponsiveContainer width="100%" height={108}>
    <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
      <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#198754" stopOpacity={0.18}/><stop offset="100%" stopColor="#198754" stopOpacity={0}/></linearGradient></defs>
      <XAxis dataKey="period" tick={false} axisLine={false} />
      <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)} บาท/กก.`, 'ราคา']} />
      <Area type="monotone" dataKey="value" stroke="#177a45" strokeWidth={2.2} fill="url(#priceFill)" dot={false} activeDot={{ r: 4 }} />
    </AreaChart>
  </ResponsiveContainer>
}

export function ClimateChart({ data }) {
  return <ResponsiveContainer width="100%" height={182}>
    <ComposedChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -24 }}>
      <CartesianGrid vertical={false} stroke="#e8eeea" />
      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#738078' }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="rain" tick={{ fontSize: 10, fill: '#738078' }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="temp" orientation="right" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: '#d87916' }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [name === 'rain' ? `${value} มม./วัน` : `${value} °C`, name === 'rain' ? 'ฝนเฉลี่ย' : 'อุณหภูมิ']} />
      <Line yAxisId="rain" type="monotone" dataKey="rain" stroke="#1689f5" strokeWidth={2.2} dot={{ r: 2.5, fill: '#fff' }} />
      <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#ed8618" strokeWidth={2.2} dot={{ r: 2.5, fill: '#fff' }} />
    </ComposedChart>
  </ResponsiveContainer>
}
