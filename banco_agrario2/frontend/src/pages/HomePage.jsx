import { Link } from "react-router-dom";

const Tile = ({ to, title, subtitle }) => (
  <Link to={to} className="card p-6 hover:shadow-lg transition">
    <div className="text-xl font-semibold mb-1">{title}</div>
    <div className="text-slate-500">{subtitle}</div>
  </Link>
);

export default function HomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Tile to="/capacidad" title="Capacidad de Recursos" subtitle="% por semana y por recurso, filtrable por Mes/Clasifica." />
      <Tile to="/recursos-vs" title="Recursos vs PM y PRO" subtitle="Matriz por mes y tipo con total general." />
      <Tile to="/asignacion" title="Asignación PM y PRO" subtitle="Proyectos/Área vs Semanas, con filtros de estado y recurso." />
    </div>
  );
}
