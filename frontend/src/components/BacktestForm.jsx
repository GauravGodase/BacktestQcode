import { useState } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
import { ButtonSpinner } from './ui/Spinner'
import 'react-datepicker/dist/react-datepicker.css'

const PRESETS = {
  quality: {
    label: 'Quality Growth',
    filters: { min_market_cap: 5000, max_market_cap: 999999999, min_roce: 15, require_pat_positive: true },
    ranking_rules: [
      { metric: 'roce', direction: 'desc' },
      { metric: 'roe', direction: 'desc' },
    ],
    weighting_method: 'metric',
    metric_for_weighting: 'roce',
  },
  value: {
    label: 'Value Screen',
    filters: { min_market_cap: 1000, max_market_cap: 50000, min_roce: 8, require_pat_positive: true },
    ranking_rules: [{ metric: 'pe_ratio', direction: 'asc' }],
    weighting_method: 'equal',
    metric_for_weighting: 'roce',
  },
  largecap: {
    label: 'Large Cap Momentum',
    filters: { min_market_cap: 20000, max_market_cap: 999999999, min_roce: 10, require_pat_positive: true },
    ranking_rules: [{ metric: 'roe', direction: 'desc' }],
    weighting_method: 'market_cap',
    metric_for_weighting: 'roce',
  },
}

const defaultState = {
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  rebalance_frequency: 'quarterly',
  portfolio_size: 10,
  weighting_method: 'equal',
  metric_for_weighting: 'roce',
  ranking_rules: [{ metric: 'roce', direction: 'desc' }],
  filters: {
    min_market_cap: 1000,
    max_market_cap: 999999999,
    min_roce: 10,
    require_pat_positive: true,
  },
  initial_capital: 10000000,
}

const rankingOptions = [
  { value: 'roce', label: 'ROCE' },
  { value: 'roe', label: 'ROE' },
  { value: 'pe_ratio', label: 'P/E Ratio' },
  { value: 'pb_ratio', label: 'P/B Ratio' },
  { value: 'market_cap', label: 'Market Cap' },
]

const frequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const weightMethods = [
  { value: 'equal', label: 'Equal Weight' },
  { value: 'market_cap', label: 'Market Cap Weight' },
  { value: 'metric', label: 'Metric Weight' },
]

const directionOptions = [
  { value: 'desc', label: 'High → Low' },
  { value: 'asc', label: 'Low → High' },
]

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    background: '#181e2c',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1rem',
    minHeight: '3rem',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(16,185,129,0.15)' : 'none',
    '&:hover': { borderColor: 'rgba(16,185,129,0.5)' },
  }),
  menu: (provided) => ({
    ...provided,
    background: '#121722',
    borderRadius: '1rem',
    overflow: 'hidden',
  }),
  option: (provided, state) => ({
    ...provided,
    background: state.isSelected ? '#0f766e' : state.isFocused ? '#111827' : '#121722',
    color: '#f8fafc',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#f8fafc',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#94a3b8',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
}

function SelectInput({ value, options, onChange, placeholder }) {
  return (
    <Select
      options={options}
      value={options.find((option) => option.value === value) || null}
      onChange={(selected) => onChange(selected?.value ?? '')}
      styles={selectStyles}
      isSearchable={false}
      placeholder={placeholder}
      menuPlacement="auto"
    />
  )
}

function DateInput({ value, onChange }) {
  return (
    <DatePicker
      selected={value ? new Date(value) : null}
      onChange={(date) => onChange(date ? date.toISOString().slice(0, 10) : '')}
      dateFormat="yyyy-MM-dd"
      className="form-input"
      placeholderText="YYYY-MM-DD"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  )
}

export default function BacktestForm({ onRun, loading, disabled }) {
  const [form, setForm] = useState(defaultState)

  function updateField(path, value) {
    setForm((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let target = next
      while (keys.length > 1) {
        const key = keys.shift()
        if (/^\d+$/.test(keys[0])) {
          target = target[key][Number(keys.shift())]
        } else {
          target = target[key]
        }
      }
      target[keys[0]] = value
      return next
    })
  }

  function applyPreset(key) {
    const preset = PRESETS[key]
    setForm((prev) => ({
      ...prev,
      ...preset,
      filters: { ...prev.filters, ...preset.filters },
    }))
  }

  function addRankingRule() {
    setForm((prev) => ({
      ...prev,
      ranking_rules: [...prev.ranking_rules, { metric: 'roe', direction: 'desc' }],
    }))
  }

  function removeRankingRule(index) {
    setForm((prev) => ({
      ...prev,
      ranking_rules: prev.ranking_rules.filter((_, i) => i !== index),
    }))
  }

  const onSubmit = (event) => {
    event.preventDefault()
    onRun(form)
  }

  return (
    <form onSubmit={onSubmit} className="animate-fade-in flex min-h-[calc(100vh-14rem)] flex-col">
      <div className="space-y-5 overflow-y-auto pr-1 pb-28">
        <div>
          <p className="form-label">Strategy Presets</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded-lg border border-white/[0.08] bg-[#181e2c]/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-brand-300"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-5">
            <FormSection title="Backtest Period">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Start Date" hint="First day included in the simulation">
                  <DateInput value={form.start_date} onChange={(value) => updateField('start_date', value)} />
                </Field>
                <Field label="End Date" hint="Last day included in the simulation">
                  <DateInput value={form.end_date} onChange={(value) => updateField('end_date', value)} />
                </Field>
              </div>
              <Field label="Initial Capital (₹)" hint="Starting portfolio value before rebalancing">
                <input
                  type="number"
                  min="100000"
                  step="100000"
                  value={form.initial_capital}
                  onChange={(e) => updateField('initial_capital', Number(e.target.value))}
                  className="form-input font-mono"
                />
              </Field>
            </FormSection>

            <FormSection title="Portfolio Rules">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Rebalance">
                  <SelectInput
                    value={form.rebalance_frequency}
                    options={frequencies}
                    onChange={(value) => updateField('rebalance_frequency', value)}
                  />
                </Field>
                <Field label="Portfolio Size">
                  <input type="number" min="1" max="50" value={form.portfolio_size} onChange={(e) => updateField('portfolio_size', Number(e.target.value))} className="form-input font-mono" />
                </Field>
              </div>
              <Field label="Position Sizing">
                <SelectInput value={form.weighting_method} options={weightMethods} onChange={(value) => updateField('weighting_method', value)} />
              </Field>
              {form.weighting_method === 'metric' && (
                <Field label="Weighting Metric">
                  <SelectInput value={form.metric_for_weighting} options={rankingOptions} onChange={(value) => updateField('metric_for_weighting', value)} />
                </Field>
              )}
            </FormSection>
          </div>

          <div className="space-y-5">
            <FormSection title="Universe Filters">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Min MCap (₹ Cr)">
                  <input type="number" value={form.filters.min_market_cap} onChange={(e) => updateField('filters.min_market_cap', Number(e.target.value))} className="form-input font-mono" />
                </Field>
                <Field label="Max MCap (₹ Cr)">
                  <input type="number" value={form.filters.max_market_cap} onChange={(e) => updateField('filters.max_market_cap', Number(e.target.value))} className="form-input font-mono" />
                </Field>
                <Field label="Min ROCE (%)">
                  <input type="number" value={form.filters.min_roce} onChange={(e) => updateField('filters.min_roce', Number(e.target.value))} className="form-input font-mono" />
                </Field>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#181e2c]/40 px-3 py-2.5 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.filters.require_pat_positive}
                      onChange={(e) => updateField('filters.require_pat_positive', e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500/30"
                    />
                    Require PAT &gt; 0
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Ranking Rules"
              action={
                <button type="button" onClick={addRankingRule} className="btn-ghost text-brand-400 hover:text-brand-300">
                  + Add
                </button>
              }
            >
              <div className="space-y-2">
                {form.ranking_rules.map((rule, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <SelectInput
                      value={rule.metric}
                      options={rankingOptions}
                      onChange={(value) => updateField(`ranking_rules.${index}.metric`, value)}
                    />
                    <div className="flex gap-2">
                      <div className="min-w-0 flex-1 sm:w-32">
                        <SelectInput
                          value={rule.direction}
                          options={directionOptions}
                          onChange={(value) => updateField(`ranking_rules.${index}.direction`, value)}
                        />
                      </div>
                      {form.ranking_rules.length > 1 && (
                        <button type="button" onClick={() => removeRankingRule(index)} className="shrink-0 rounded-lg px-3 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400">
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-600">Composite ranking averages individual metric ranks.</p>
            </FormSection>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-white/[0.08] backdrop-blur-xl px-0 py-4">
        {/* <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 text-center">
          <h3 className="text-fluid-lg font-semibold text-white">Ready to run</h3>
          <p className="mt-2 text-sm text-slate-400">Choose a preset or customize filters, then click Run Backtest.</p>
        </div> */}

        <button type="submit" disabled={loading || disabled} className="btn-primary mt-4 w-full py-3.5">
          {loading ? (
            <>
              <ButtonSpinner />
              Running Backtest…
            </>
          ) : disabled ? (
            'Load Market Data First'
          ) : (
            'Run Backtest'
          )}
        </button>
      </div>
    </form>
  )
}

function FormSection({ title, action, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#181e2c]/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  )
}
