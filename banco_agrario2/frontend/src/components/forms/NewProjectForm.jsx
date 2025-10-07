// src/components/forms/NewProjectForm.jsx
import { useMemo, useState } from "react";
import useBA from "../../services/state.js";

/**
 * Crea un proyecto sin seleccionar mes/semana.
 * Campos: Nombre, Tipo, Clasificación.
 */
export default function NewProjectForm({ onClose }) {
  const { tipos, clasificaciones, createProject } = useBA();

  const [form, setForm] = useState({
    nombre: "",
    tipo: tipos?.[0] || "PRO",
    clasifica: (clasificaciones?.length ? clasificaciones : ["Proyecto"])[0],
  });

  const canSubmit = useMemo(() => form.nombre.trim().length > 0, [form.nombre]);
  const handle = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Nota: tu state.js actual fija CLASIFICA="Proyecto" en createProject.
    // Si quieres guardar la clasificación elegida, asegúrate de que createProject use payload.clasifica.
    createProject({
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      clasifica: form.clasifica, // requiere que state.js respete este campo
    });

    onClose?.();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Nombre del proyecto</label>
        <input
          className="input"
          value={form.nombre}
          onChange={handle("nombre")}
          placeholder="Ej. NIIF 9"
          autoFocus
          required
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-gray-700">Tipo</label>
          <select className="input" value={form.tipo} onChange={handle("tipo")}>
            {(tipos || ["PRO", "ADM"]).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-gray-700">Clasificación</label>
          <select className="input" value={form.clasifica} onChange={handle("clasifica")}>
            {(clasificaciones?.length ? clasificaciones : ["Proyecto", "Admon"]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Guardar
        </button>
      </div>
    </form>
  );
}
