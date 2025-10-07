// src/pages/AssignmentPage.jsx
import { useEffect, useMemo, useState } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import ChipsFilter from "../components/filters/ChipsFilter.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewProjectForm from "../components/forms/NewProjectForm.jsx";
import useBA from "../services/state.js";

const colorForLoad = (v) => {
  const n = parseInt(String(v)) || 0;
  return n >= 80
    ? "bg-red-100 text-red-700 border border-red-200"
    : n >= 50
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-green-100 text-green-700 border border-green-200";
};

export default function AssignmentPage() {
  const {
    weeksAssignment, assignmentRows,
    estados, conRecursoOpts, clasificaciones,
    filtrosAssignment, setFiltroAssignment,
    refreshMock,
  } = useBA();

  const [openNewProject, setOpenNewProject] = useState(false);

  useEffect(() => { refreshMock(); }, []);

  const defaultWeek = weeksAssignment?.[0] || "";
  const { defaultMes, defaultSemana } = useMemo(() => {
    if (!defaultWeek) return { defaultMes: "", defaultSemana: "" };
    const [mesKey, semTxt] = defaultWeek.split(":");
    return { defaultMes: mesKey, defaultSemana: semTxt };
  }, [defaultWeek]);

  return (
    <section className="space-y-4">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Asignación PM y PRO</span>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={() => setOpenNewProject(true)}>+ Proyecto</button>
          </div>
        </div>

        <div className="card-body grid gap-4 md:grid-cols-3">
          <ChipsFilter
            label="Estado"
            value={filtrosAssignment.estado}
            onChange={(v)=>setFiltroAssignment("estado", v)}
            options={estados}
          />
          <SelectFilter
            label="Con recurso"
            value={filtrosAssignment.conRecurso}
            onChange={(v)=>setFiltroAssignment("conRecurso", v)}
            options={["Todos", ...conRecursoOpts]}
          />
          <ChipsFilter
            label="Clasifica"
            value={filtrosAssignment.clasifica}
            onChange={(v)=>setFiltroAssignment("clasifica", v)}
            options={clasificaciones}
          />
        </div>
      </div>

      <WeeklyGrid
        weeks={weeksAssignment}
        rows={assignmentRows}
        windowSize={5}
        getRowKey={(r) => r.nombre}
        renderLeft={(r) => r ? [r.nombre, r.area] : ["NOMBRE", "ÁREA"]}
        leftWidths={["w-[18rem]", "w-[6rem]"]}
        leftStickyOffsets={["left-0", "left-[18rem]"]}
        getValue={(r, w) => r.values?.[w] ?? "0%"}
        colorClass={colorForLoad}
        formatAsPercent={true}
      />

      <RightSheet
        title="Nuevo proyecto"
        open={openNewProject}
        onClose={() => setOpenNewProject(false)}
        footer={null}
      >
        <NewProjectForm onClose={() => setOpenNewProject(false)} defaultMes={defaultMes} defaultSemana={defaultSemana} />
      </RightSheet>
    </section>
  );
}
