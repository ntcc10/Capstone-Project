export default function SelectFilter({ label, value, onChange, options }) {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <select className="select" value={value} onChange={(e)=>onChange(e.target.value)}>
          <option value="all">Todos</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  