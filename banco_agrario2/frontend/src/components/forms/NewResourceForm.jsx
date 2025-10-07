// src/components/forms/NewResourceForm.jsx
import { useState, useMemo } from "react";
import useBA from "../../services/state.js";

export default function NewResourceForm({ onClose }) {
  const { meses, createResource } = useBA();
  const [nombre, setNombre] = useState("");

  // Usamos el primer mes disponible como default técnico (el % inicial será 0)
  const defaultMes = useMemo(() => meses?.[0] || "", [meses]);

  const submit = (e) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return;
    createResource({
      nombre: n,
      mes: defaultMes,
      semana: "Sem 1",
      capacidad: 0, // carga inicial 0%
    });
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Nombre de nuevo recurso</label>
        <input
          className="input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. María Gómez"
          autoFocus
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!nombre.trim()}>
          Guardar
        </button>
      </div>
    </form>
  );
}
