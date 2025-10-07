export default function ChipsFilter({ label, value, onChange, options }) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(o => {
            const active = value.includes(o);
            return (
              <button
                key={o}
                className={`px-3 py-1 rounded-2xl border ${active ? "bg-[var(--color-ba-blue)] text-white" : "bg-white border-gray-200"}`}
                onClick={()=>{
                  onChange(active ? value.filter(v=>v!==o) : [...value, o]);
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  