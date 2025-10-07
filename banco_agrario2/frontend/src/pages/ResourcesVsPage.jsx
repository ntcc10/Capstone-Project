// src/pages/ResourcesVsPage.jsx
import { useEffect, useMemo, useState } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewAssignmentFromProject from "../components/forms/NewAssignmentFromProject.jsx";
import useBA from "../services/state.js";

// Colores por CARGA
const colorForLoad = (v) => {
  const n = parseInt(String(v)) || 0;
  return n >= 80
    ? "bg-red-100 text-red-700 border border-red-200"
    : n >= 50
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-green-100 text-green-700 border border-green-200";
};

export default function ResourcesVsPage() {
  const {
    resourcesVsWeeklyWeeks,
    resourcesVsWeeklyTypes,
    resourcesVsWeeklyByResource,
    people,
    filtrosResourcesVs,
    setFiltroResourcesVs,
    availabilityWeeks,
    availabilityResources,
    refreshMock,
  } = useBA();

  const [openNew, setOpenNew] = useState(false);

  useEffect(() => { refreshMock(); }, []);

  // Persona seleccionada (si “Todos”, tomamos la primera)
  const selectedPerson =
    filtrosResourcesVs?.recurso && filtrosResourcesVs.recurso !== "Todos"
      ? filtrosResourcesVs.recurso
      : (people?.[0] || "");

  const bucket = resourcesVsWeeklyByResource?.[selectedPerson] || {
    loadByTypeWeek: {},
    projectNamesByType: {},
    projectCountByTypeWeek: {},
  };

  // Gauge de CARGA promedio (5 semanas)
  const gaugeWeeksWindow = 5;
  const gaugeValue = useMemo(() => {
    if (!selectedPerson) return 0;
    const rec = (availabilityResources || []).find(
      (r) => String(r.recurso || "").trim() === String(selectedPerson).trim()
    );
    if (!rec) return 0;
    const weeksSlice = availabilityWeeks?.slice?.(0, gaugeWeeksWindow) || [];
    const vals = weeksSlice.map((w) => {
      const free = Number(rec.availabilityByWeek?.[w] ?? 0);
      return 100 - free;
    });
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [selectedPerson, availabilityWeeks, availabilityResources]);

  // 1) Carga por tipo (semanal)
  const rowsLoad = useMemo(
    () =>
      (resourcesVsWeeklyTypes || []).map((t) => ({
        tipo: t,
        values: bucket.loadByTypeWeek?.[t] || {},
      })),
    [resourcesVsWeeklyTypes, bucket]
  );

  // 2) # Proyectos por tipo (semanal)
  const rowsProjCount = useMemo(
    () =>
      (resourcesVsWeeklyTypes || []).map((t) => ({
        tipo: t,
        values: bucket.projectCountByTypeWeek?.[t] || {},
      })),
    [resourcesVsWeeklyTypes, bucket]
  );

  const resumenByType = bucket.projectNamesByType || {};
  const getVal = (row, w) => row.values?.[w] ?? 0;

  /* ---------- Mini gauge ---------- */
  const MiniGauge = ({ value = 0, size = 80, label = "" }) => {
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const dash = (clamped / 100) * c;
    const color = clamped >= 80 ? "#ef4444" : clamped >= 50 ? "#f59e0b" : "#10b981";
    return (
      <div className="flex items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r}
            stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={`${dash} ${c-dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#111827">
            {Math.round(clamped)}%
          </text>
        </svg>
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-xs text-gray-400">0% libre · 100% ocupado</div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Recursos vs PM y PRO · Vista semanal por persona</span>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={() => setOpenNew(true)}>+ Asignación</button>
          </div>
        </div>

        <div className="card-body grid gap-4 md:grid-cols-3">
          <SelectFilter
            label="Recurso"
            value={selectedPerson || "Todos"}
            onChange={(v)=>setFiltroResourcesVs("recurso", v)}
            options={people}
          />
        </div>
      </div>

      {/* Gauge */}
      {selectedPerson ? (
        <div className="rounded-2xl border bg-white p-4 flex items-center gap-6">
          <MiniGauge value={gaugeValue} label={`Carga promedio de ${selectedPerson} (próx. ${gaugeWeeksWindow} semanas)`} />
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
          Selecciona un recurso para ver su carga promedio.
        </div>
      )}

      {/* 1) Carga por tipo */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700 px-1">Carga por tipo (semanal)</div>
        <WeeklyGrid
          weeks={resourcesVsWeeklyWeeks}
          rows={rowsLoad}
          windowSize={5}
          getRowKey={(r) => r.tipo}
          renderLeft={(r) => (r ? [r.tipo] : ["TIPO"])}
          leftWidths={["w-[12rem]"]}
          leftStickyOffsets={["left-0"]}
          getValue={(r, w) => getVal(r, w)}
          colorClass={colorForLoad}
          formatAsPercent={true}
        />
      </div>

      {/* 2) # Proyectos por tipo */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700 px-1">Proyectos por tipo (semanal)</div>
        <WeeklyGrid
          weeks={resourcesVsWeeklyWeeks}
          rows={rowsProjCount}
          windowSize={5}
          getRowKey={(r) => r.tipo}
          renderLeft={(r) => (r ? [r.tipo] : ["TIPO"])}
          leftWidths={["w-[12rem]"]}
          leftStickyOffsets={["left-0"]}
          getValue={(r, w) => getVal(r, w)}
          formatAsPercent={false}
          colorClass={(v) => (Number(v) > 0
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-600 border border-gray-200")}
        />
      </div>

      {/* Resumen */}
      <div className="card">
        <div className="card-header">Resumen de proyectos de {selectedPerson || "—"}</div>
        <div className="card-body grid gap-4 md:grid-cols-3">
          {Object.keys(resumenByType).length === 0 && (
            <div className="text-gray-500">Sin proyectos registrados.</div>
          )}
          {Object.entries(resumenByType).map(([tipo, names]) => (
            <div key={tipo} className="rounded-xl border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">{tipo}</div>
              <ul className="space-y-1 list-disc pl-5">
                {names.map((n) => <li key={n} className="text-sm text-gray-700">{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Sheet: Nueva Asignación desde proyecto existente */}
      <RightSheet
        title="Nueva asignación"
        open={openNew}
        onClose={() => setOpenNew(false)}
        footer={null}
      >
        <NewAssignmentFromProject
          onClose={() => setOpenNew(false)}
          selectedPerson={selectedPerson}
          weeksOptions={resourcesVsWeeklyWeeks || []}
        />
      </RightSheet>
    </section>
  );
}
