// src/pages/CapacityPage.jsx
import { useEffect, useState, useMemo } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import ChipsFilter from "../components/filters/ChipsFilter.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import ResourceQuickSearch from "../components/ResourceQuickSearch.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewResourceForm from "../components/forms/NewResourceForm.jsx";
import useBA from "../services/state.js";

// Colores por CARGA: 100–80 rojo, 80–50 amarillo, <50 verde
const colorForLoad = (v) => {
  const n = parseInt(String(v)) || 0;
  return n >= 80
    ? "bg-red-100 text-red-700 border border-red-200"
    : n >= 50
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-green-100 text-green-700 border border-green-200";
};

export default function CapacityPage() {
  const {
    weeksCapacity, capacityRows,
    meses, clasificaciones,
    filtrosCapacity, setFiltroCapacity,
    refreshMock,
  } = useBA();

  const [openNew, setOpenNew] = useState(false);

  useEffect(() => { refreshMock(); }, []);

  // Para defaults en el formulario
  const defaultWeek = weeksCapacity?.[0] || "";
  const { defaultMes, defaultSemana } = useMemo(() => {
    if (!defaultWeek) return { defaultMes: "", defaultSemana: "" };
    const [mesKey, semTxt] = defaultWeek.split(":");
    return { defaultMes: mesKey, defaultSemana: semTxt };
  }, [defaultWeek]);

  return (
    <section className="space-y-6">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Capacidad de Recursos</span>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={() => setOpenNew(true)}>+ Recurso</button>
          </div>
        </div>
        <div className="card-body grid gap-4 md:grid-cols-3">
          <SelectFilter
            label="Mes"
            value={filtrosCapacity.mes}
            onChange={(v)=>setFiltroCapacity("mes", v)}
            options={["Todos", ...meses]}
          />
          <ChipsFilter
            label="Clasifica"
            value={filtrosCapacity.clasifica}
            onChange={(v)=>setFiltroCapacity("clasifica", v)}
            options={clasificaciones}
          />
        </div>
      </div>

      {/* Buscador con promedio de DISPONIBILIDAD */}
      <div className="card">
        <div className="card-header">Buscar recurso (disponibilidad)</div>
        <div className="card-body">
          <ResourceQuickSearch windowWeeks={5} />
        </div>
      </div>

      {/* Grid semanal de CARGA por recurso */}
      <WeeklyGrid
        weeks={weeksCapacity}
        rows={capacityRows}
        windowSize={5}
        getRowKey={(r) => `${r.clasifica}||${r.recurso}`}
        renderLeft={(r) => r ? [r.clasifica, r.recurso] : ["CLASIF.", "RECURSO"]}
        leftWidths={["w-[10rem]", "w-[16rem]"]}
        leftStickyOffsets={["left-0", "left-[10rem]"]}
        getValue={(r, w) => r.values?.[w] ?? "0%"}
        colorClass={colorForLoad}
        formatAsPercent={true}
      />

      {/* Sheet: Nuevo Recurso */}
      <RightSheet
        title="Nuevo recurso"
        open={openNew}
        onClose={() => setOpenNew(false)}
        footer={null}
      >
        <NewResourceForm onClose={() => setOpenNew(false)} defaultMes={defaultMes} defaultSemana={defaultSemana} />
      </RightSheet>
    </section>
  );
}
