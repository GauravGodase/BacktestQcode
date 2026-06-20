import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area,
} from 'recharts'
import { ChevronIcon, DownloadIcon } from './ui/Icons'

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`
}

function formatCurrency(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const chartTooltipStyle = {
  backgroundColor: '#121722',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '13px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

const metricConfig = [
  { key: 'cagr', label: 'CAGR', format: (p) => formatPercent(p.cagr), tone: 'brand' },
  { key: 'total_return', label: 'Total Return', format: (p) => formatPercent(p.total_return), tone: 'blue' },
  { key: 'sharpe_ratio', label: 'Sharpe Ratio', format: (p) => p.sharpe_ratio.toFixed(2), tone: 'violet' },
  { key: 'max_drawdown', label: 'Max Drawdown', format: (p) => formatPercent(p.max_drawdown), tone: 'rose' },
  { key: 'annual_volatility', label: 'Volatility', format: (p) => formatPercent(p.annual_volatility), tone: 'amber' },
]

const toneStyles = {
  brand: 'border-brand-500/20 from-brand-500/15 to-transparent',
  blue: 'border-accent-blue/20 from-accent-blue/15 to-transparent',
  violet: 'border-accent-violet/20 from-accent-violet/15 to-transparent',
  rose: 'border-rose-500/20 from-rose-500/15 to-transparent',
  amber: 'border-accent-amber/20 from-accent-amber/15 to-transparent',
}

export default function ResultsPanel({ result, onExport }) {
  const [activeTab, setActiveTab] = useState('overview')

  const equityData = result.equity_curve.map((p) => ({
    date: p.date,
    value: p.value,
    label: new Date(p.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
  }))

  const drawdownData = result.drawdown_curve.map((p) => ({
    date: p.date,
    value: p.value * 100,
    label: new Date(p.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
  }))

  return (
    <div className="animate-fade-in min-w-0 space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-fluid-xl font-bold tracking-tight text-white">Performance Report</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {result.portfolio_log.length} rebalance periods · simulated portfolio
          </p>
          {result.equity_curve.length > 0 && (
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Backtest period: {new Date(result.equity_curve[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(result.equity_curve[result.equity_curve.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={() => onExport('csv')} className="btn-secondary w-full sm:w-auto">
            <DownloadIcon />
            CSV
          </button>
          <button onClick={() => onExport('excel')} className="btn-primary w-full sm:w-auto">
            <DownloadIcon />
            Excel
          </button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        {metricConfig.map(({ key, label, format, tone }) => (
          <div key={key} className={`glass-panel border bg-gradient-to-br p-3 sm:p-4 ${toneStyles[tone]} ${key === 'sharpe_ratio' ? 'col-span-2 lg:col-span-1' : ''}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="metric-value mt-1 sm:mt-2">{format(result.performance)}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full min-w-0 gap-1 rounded-xl border border-white/[0.06] bg-[#121722]/80 p-1 sm:inline-flex sm:w-auto">
        {['overview', 'portfolio'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-fluid-xs font-medium capitalize transition sm:flex-none sm:px-4 sm:text-fluid-sm ${
              activeTab === tab ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'overview' ? 'Charts & Holdings' : 'Rebalance Log'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Equity Curve" subtitle="Portfolio value over time">
              <div className="chart-adaptive">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={72} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v) => [formatCurrency(v), 'Portfolio']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Drawdown" subtitle="Peak-to-trough decline">
              <div className="chart-adaptive">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <defs>
                    <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} width={48} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Drawdown']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#fb7185" fill="url(#drawdownFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <WinnersCard title="Top Winners" items={result.top_winners} positive />
            <WinnersCard title="Top Losers" items={result.top_losers} positive={false} />
          </div>
        </>
      )}

      {activeTab === 'portfolio' && <PortfolioLog log={result.portfolio_log} />}
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass-panel p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
      <p className="mb-3 text-xs text-slate-500 sm:mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

function WinnersCard({ title, items, positive }) {
  return (
    <div className="glass-panel p-5">
      <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No data available</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.ticker} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#181e2c]/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-xs font-semibold text-slate-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-medium text-white">{item.ticker.replace('.NS', '')}</span>
              </div>
              <span className={`font-mono text-sm font-semibold ${positive ? 'text-brand-400' : 'text-rose-400'}`}>
                {item.return !== undefined ? formatPercent(item.return) : `${((item.weight || 0) * 100).toFixed(1)}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PortfolioLog({ log }) {
  const [expandedDate, setExpandedDate] = useState(log[0]?.date)

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
        <h3 className="text-fluid-base font-semibold text-white">Rebalance History</h3>
        <p className="text-fluid-xs text-slate-500">Portfolio composition at each rebalance date</p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {log.map((entry) => (
          <div key={entry.date}>
            <button
              onClick={() => setExpandedDate(expandedDate === entry.date ? null : entry.date)}
              className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.02] sm:px-6"
            >
              <div className="min-w-0">
                <p className="break-anywhere font-medium text-white">
                  {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="mt-0.5 break-anywhere text-fluid-xs text-slate-500">
                  {entry.portfolio_size} holdings · {formatCurrency(entry.portfolio_value || 0)}
                </p>
              </div>
              <ChevronIcon open={expandedDate === entry.date} className="h-5 w-5 shrink-0 text-slate-500" />
            </button>
            {expandedDate === entry.date && (
              <div className="overflow-x-auto px-4 pb-5 sm:px-6">
                <table className="w-full min-w-[20rem] text-fluid-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      <th className="pb-2 pr-4">Ticker</th>
                      <th className="pb-2 pr-4">Weight</th>
                      <th className="pb-2 pr-4">Allocation</th>
                      <th className="pb-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(entry.holdings).map(([ticker, data]) => (
                      <tr key={ticker} className="border-b border-white/[0.03] text-slate-300">
                        <td className="py-2.5 pr-4 font-medium text-white">{ticker.replace('.NS', '')}</td>
                        <td className="py-2.5 pr-4 font-mono">{(data.weight * 100).toFixed(2)}%</td>
                        <td className="py-2.5 pr-4 font-mono">{formatCurrency(data.allocation)}</td>
                        <td className="py-2.5 font-mono">₹{data.price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
