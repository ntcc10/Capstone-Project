// src/components/forms/NewAssignmentFromProject.jsx
import { useMemo, useState } from "react";
import useBA from "../../services/state.js";

/**
 * Props:
 * - onClose
 * - selectedPerson: string (recurso preseleccionado opcional)
 * - weeksOptions: string[] (labels "Mes_yy:Sem n")
 *
 * Crea asignaciones a partir de:
 * - Proyecto existente (lista desplegable)
 * - Recurso (lista de personas creadas)
 * - Semana inicio y fin (rango inclusivo)
 */
export default function NewAssignmentFromProject({ onClose, selectedPerson = "", weeksOptions = [] }) {
  const { raw, people, createAssignment } = useBA();

  // Lista de proyectos existentes (por nombre único)
  const projectOptions = useMemo(() => {
    const set = new Set(
      (raw || [])
        .filter(r => String(r.CLASIFICA || "").trim().toLowerCase() === "proyecto")
        .map(r => String(r.NOMBRE || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  const defaultResource = selectedPerson || (people?.[0] || "");
  const [form, setForm] = useState({
    project: projectOptions[0] || "",
    resource: defaultResource,
    start: weeksOptions[0] || "",
    end: weeksOptions[0] || "",
  });

  const handle = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  // Deriva rango de semanas (inclusive)
  const weekRange = useMemo(() => {
    const idxStart = weeksOptions.indexOf(form.start);
    const idxEnd = weeksOptions.indexOf(form.end);
    if (idxStart < 0 || idxEnd < 0) return [];
    const [a, b] = idxStart <= idxEnd ? [idxStart, idxEnd] : [idxEnd, idxStart];
    return weeksOptions.slice(a, b + 1);
  }, [form.start, form.end, weeksOptions]);

  const canSubmit = form.resource && form.project && weekRange.length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Crea una fila por cada semana del rango
    for (const w of weekRange) {
      const [mes, semana] = String(w).split(":");
      createAssignment({
        clasifica: "Proyecto",
        tipo: "PRO",
        estado: "En curso",
        nombre: form.project,
        recurso: form.resource,   // ← recurso seleccionado
        area: "Proy",
        mes,
        semana,
        porcentaje: 0,            // puedes exponer este campo si te interesa
      });
    }
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Proyecto */}
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Proyecto</label>
        <select className="input" value={form.project} onChange={handle("project")}>
          {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Recurso */}
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Recurso</label>
        <select className="input" value={form.resource} onChange={handle("resource")}>
          {(people || []).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Semanas */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-gray-700">Semana inicio</label>
          <select className="input" value={form.start} onChange={handle("start")}>
            {weeksOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-gray-700">Semana fin</label>
          <select className="input" value={form.end} onChange={handle("end")}>
            {weeksOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Se crearán asignaciones para <b>{weekRange.length}</b> semana(s).
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Guardar asignación
        </button>
      </div>
    </form>
  );
}
