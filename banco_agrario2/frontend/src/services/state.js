// src/services/state.js
import { create } from "zustand";
import {
  buildCapacityRows,
  buildAssignmentRows,
  buildResourceMatrix,
  buildResourceAvailability,
  computePerResourceTypeWeekly, // <-- NUEVO helper (añádelo en transformExcel.js)
} from "../utils/transformExcel";

/* =============== Utils filtros =============== */
const isAll = (v) => {
  if (v == null) return true;
  const s = String(v).trim().toLowerCase();
  return s === "todos" || s === "all" || s === "";
};
const norm = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/* =============== MOCK de ejemplo =============== */
const MOCK = [
  { CLASIFICA:"Proyecto", TIPO:"PRO", ESTADO:"En curso", NOMBRE:"NIIF 9", "CON RECURSO":"Si", "CANT.":1, RECURSO:"Luis Eduardo", "ÁREA":"Proy", MES:"Agosto_25",     SEMANA:"Sem 1", "%":15 },
  { CLASIFICA:"Proyecto", TIPO:"PRO", ESTADO:"En curso", NOMBRE:"NIIF 9", "CON RECURSO":"Si", "CANT.":1, RECURSO:"Luis Eduardo", "ÁREA":"Proy", MES:"Agosto_25",     SEMANA:"Sem 2", "%":15 },
  { CLASIFICA:"Proyecto", TIPO:"PRO", ESTADO:"En curso", NOMBRE:"Grande Exposiciones", "CON RECURSO":"Si", "CANT.":1, RECURSO:"Catalina", "ÁREA":"Proc", MES:"Septiembre_25", SEMANA:"Sem 1", "%":30 },
  { CLASIFICA:"Admon",    TIPO:"ADM", ESTADO:"Nuevo",    NOMBRE:"Onboarding", "CON RECURSO":"No", "CANT.":1, RECURSO:"Sin Recurso", "ÁREA":"QS", MES:"Septiembre_25", SEMANA:"Sem 1", "%":0 },
  { CLASIFICA:"Proyecto", TIPO:"PRO", ESTADO:"En curso", NOMBRE:"Proyecto Futuro", "CON RECURSO":"Si", "CANT.":1, RECURSO:"Luis Eduardo", "ÁREA":"Proy", MES:"Febrero_26",  SEMANA:"Sem 2", "%":0 },
];

/* =============== Filtros por PÁGINA =============== */
// Asignación: estado[], conRecurso, clasifica[]
const initialAssignmentFilters = {
  estado: [],            // chips
  conRecurso: "Todos",   // select "Si" | "No" | "Todos"
  clasifica: [],         // chips
};
// Capacidad: mes, clasifica[]
const initialCapacityFilters = {
  mes: "Todos",
  clasifica: [],
};
// Recursos vs PM/PRO (mensual + semanal por persona)
const initialResourcesVsFilters = {
  tipo: "Todos",         // para la matriz mensual
  recurso: "Todos",      // NUEVO: para la vista semanal por persona
};

/* =============== Aplicadores por página (mensuales/semanales) =============== */
function applyFiltersAssignment(records, f) {
  return records.filter((r) => {
    if (Array.isArray(f.estado) && f.estado.length > 0 && !f.estado.includes(r.ESTADO)) return false;
    if (!isAll(f.conRecurso)) {
      const want = norm(f.conRecurso); // "si" | "no"
      if (norm(r["CON RECURSO"]) !== want) return false;
    }
    if (Array.isArray(f.clasifica) && f.clasifica.length > 0 && !f.clasifica.includes(r.CLASIFICA)) return false;
    return true;
  });
}
function applyFiltersCapacity(records, f) {
  return records.filter((r) => {
    if (!isAll(f.mes) && String(r.MES) !== f.mes) return false;
    if (Array.isArray(f.clasifica) && f.clasifica.length > 0 && !f.clasifica.includes(r.CLASIFICA)) return false;
    return true;
  });
}
function applyFiltersResourcesVs(records, f) {
  // Este filtro se usa para la matriz mensual (por TIPO)
  return records.filter((r) => {
    if (!isAll(f.tipo) && norm(r.TIPO) !== norm(f.tipo)) return false;
    return true;
  });
}

/* =============== Store =============== */
const useBA = create((set, get) => ({
  // Datos base
  raw: [],

  // --- Recursos vs PM/PRO: vista semanal por persona ---
  resourcesVsWeeklyWeeks: [],
  resourcesVsWeeklyTypes: [],
  resourcesVsWeeklyByResource: {},  // mapa por recurso (salida de computePerResourceTypeWeekly)
  people: [],                       // catálogo de personas (RECURSO)

  // Catálogos globales (desde raw completo)
  meses: [],
  clasificaciones: [],
  estados: ["En curso", "Nuevo", "Finalizado"],
  conRecursoOpts: ["Si", "No"],
  tipos: ["PRO", "ADM", "INN", "MANT", "REQ", "OPE", "SOST", "GIRA", "PROC", "TI"],

  // === Filtros por página (independientes) ===
  filtrosAssignment: { ...initialAssignmentFilters },
  filtrosCapacity:   { ...initialCapacityFilters },
  filtrosResourcesVs:{ ...initialResourcesVsFilters },

  // === Derivados por página ===
  // Asignación (semanal)
  weeksAssignment: [],
  assignmentRows: [],
  // Capacidad (semanal)
  weeksCapacity: [],
  capacityRows: [],
  // Recursos vs PM/PRO (mensual)
  months: [],
  totalsByMonth: {},
  byType: {},
  // Disponibilidad global (si luego quieres filtros propios, se agregan)
  availabilityWeeks: [],
  availabilityResources: [],

  /* ===== Helpers internos ===== */
  _rebuildCatalogsFromRaw: () => {
    const raw = get().raw;
    const meses = [...new Set(raw.map((r) => r.MES))].filter(Boolean).sort();
    const clasificaciones = [...new Set(raw.map((r) => r.CLASIFICA))].filter(Boolean).sort();
    // catálogo de personas
    const people = [...new Set(raw.map(r => (r.RECURSO || "").toString().trim()))]
      .filter(Boolean)
      .sort();
    set({ meses, clasificaciones, people });
  },

  _recomputeAssignment: () => {
    const { raw, filtrosAssignment } = get();
    const filtered = applyFiltersAssignment(raw, filtrosAssignment);
    const asg = buildAssignmentRows(filtered); // { weeks, rows }
    set({
      weeksAssignment: asg.weeks,
      assignmentRows: asg.rows,
    });
  },

  _recomputeCapacity: () => {
    const { raw, filtrosCapacity } = get();
    const filtered = applyFiltersCapacity(raw, filtrosCapacity);
    const cap = buildCapacityRows(filtered); // { weeks, rows }
    set({
      weeksCapacity: cap.weeks,
      capacityRows: cap.rows,
    });
  },

  _recomputeResourcesVsMonthly: () => {
    const { raw, filtrosResourcesVs } = get();
    const filtered = applyFiltersResourcesVs(raw, filtrosResourcesVs);
    const mat = buildResourceMatrix(filtered); // { months, byType, totals }
    set({
      months: mat.months,
      totalsByMonth: mat.totals,
      byType: mat.byType,
    });
  },

  _recomputeResourcesVsWeekly: () => {
    // La vista semanal por persona trabaja sobre el RAW (sin filtro por tipo)
    const { raw } = get();
    const resWeekly = computePerResourceTypeWeekly(raw);
    set({
      resourcesVsWeeklyWeeks: resWeekly.weeks,
      resourcesVsWeeklyTypes: resWeekly.types,
      resourcesVsWeeklyByResource: resWeekly.perResource,
    });
  },

  _recomputeAvailability: () => {
    const { raw } = get();
    const avail = buildResourceAvailability(raw);
    set({
      availabilityWeeks: avail.weeks,
      availabilityResources: avail.resources,
    });
  },

  /* ===== Mutadores públicos ===== */

  // Cargar datos (Excel/API)
  loadFromArray: (records) => {
    set({ raw: Array.isArray(records) ? records : [] });

    // Catálogos globales (meses, clasificaciones, personas)
    get()._rebuildCatalogsFromRaw();

    // Recalculos por página con sus filtros vigentes
    get()._recomputeAssignment();
    get()._recomputeCapacity();
    get()._recomputeResourcesVsMonthly();
    get()._recomputeResourcesVsWeekly();
    get()._recomputeAvailability();
  },

  // Mock dev rápido
  refreshMock: () => {
    const current = get().raw?.length ? get().raw : MOCK;
    get().loadFromArray(current);
  },

  // ---- Setters de filtros (por página) ----
  setFiltroAssignment: (key, value) => {
    set({ filtrosAssignment: { ...get().filtrosAssignment, [key]: value } });
    get()._recomputeAssignment();
  },
  resetFiltrosAssignment: () => {
    set({ filtrosAssignment: { ...initialAssignmentFilters } });
    get()._recomputeAssignment();
  },

  setFiltroCapacity: (key, value) => {
    set({ filtrosCapacity: { ...get().filtrosCapacity, [key]: value } });
    get()._recomputeCapacity();
  },
  resetFiltrosCapacity: () => {
    set({ filtrosCapacity: { ...initialCapacityFilters } });
    get()._recomputeCapacity();
  },

  setFiltroResourcesVs: (key, value) => {
    set({ filtrosResourcesVs: { ...get().filtrosResourcesVs, [key]: value } });
    // Para mensual:
    get()._recomputeResourcesVsMonthly();
    // La vista semanal por persona no necesita recompute aquí (trabaja sobre RAW),
    // pero si quisieras filtrar por persona a nivel de estado, bastaría con leer el filtro en la página.
  },
  resetFiltrosResourcesVs: () => {
    set({ filtrosResourcesVs: { ...initialResourcesVsFilters } });
    get()._recomputeResourcesVsMonthly();
  },

  /* ===== Creadores ===== */
  createResource: (payload) => {
    const { raw } = get();
    const newRow = {
      CLASIFICA: "Recurso",
      TIPO: payload.tipo || "ADM",
      ESTADO: "Nuevo",
      NOMBRE: payload.nombre,
      "CON RECURSO": "Si",
      "CANT.": 1,
      RECURSO: payload.nombre,
      "ÁREA": payload.area || "Proy",
      MES: payload.mes || "Agosto_25",
      SEMANA: payload.semana || "Sem 1",
      "%": payload.capacidad || 0,
    };
    const updated = [...raw, newRow];
    get().loadFromArray(updated);
  },

  createAssignment: (payload) => {
    const { raw } = get();
    const newRow = {
      CLASIFICA: payload.clasifica || "Proyecto",
      TIPO: payload.tipo || "PRO",
      ESTADO: payload.estado || "En curso",
      NOMBRE: payload.nombre,
      "CON RECURSO": payload.recurso ? "Si" : "No",
      "CANT.": 1,
      RECURSO: payload.recurso || "Sin Recurso",
      "ÁREA": payload.area || "Proy",
      MES: payload.mes,
      SEMANA: payload.semana,
      "%": payload.porcentaje || 0,
    };
    const updated = [...raw, newRow];
    get().loadFromArray(updated);
  },

  createProject: (payload) => {
    const { raw } = get();
    const newRow = {
      CLASIFICA: "Proyecto",
      TIPO: payload.tipo || "PRO",
      ESTADO: "Nuevo",
      NOMBRE: payload.nombre,
      "CON RECURSO": "No",
      "CANT.": 0,
      RECURSO: "Sin Recurso",
      "ÁREA": payload.area || "Proy",
      MES: payload.mes || "Agosto_25",
      SEMANA: payload.semana || "Sem 1",
      "%": 0,
    };
    const updated = [...raw, newRow];
    get().loadFromArray(updated);
  },
}));

export default useBA;
