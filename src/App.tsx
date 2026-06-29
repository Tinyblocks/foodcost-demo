import { useState } from "react";
import { Scenario, RESTAURANT, getInvoices } from "./data/seed";
import { cn } from "./components/ui";
import Dashboard from "./views/Dashboard";
import Invoices from "./views/Invoices";
import Mercuriale from "./views/Mercuriale";
import Recipes from "./views/Recipes";
import MenuEngineering from "./views/MenuEngineering";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ChefHat,
  Grid3x3,
  Utensils,
} from "lucide-react";

type ViewId = "dashboard" | "invoices" | "mercuriale" | "recipes" | "menu";

const NAV: { id: ViewId; label: string; icon: typeof FileText }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "invoices", label: "Factures", icon: FileText },
  { id: "mercuriale", label: "Mercuriale", icon: BookOpen },
  { id: "recipes", label: "Fiches techniques", icon: ChefHat },
  { id: "menu", label: "Menu engineering", icon: Grid3x3 },
];

const TITLES: Record<ViewId, string> = {
  dashboard: "Tableau de bord",
  invoices: "Factures",
  mercuriale: "Mercuriale",
  recipes: "Fiches techniques",
  menu: "Menu engineering",
};

const params =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const initView = (params.get("view") as ViewId) || "dashboard";
const initScenario = (params.get("scenario") as Scenario) || "mai";

export default function App() {
  const [view, setView] = useState<ViewId>(initView);
  const [scenario, setScenario] = useState<Scenario>(initScenario);

  const lastInvoice = getInvoices(scenario)[0];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Foodcost</p>
            <p className="text-xs text-zinc-500">Pilotage du coût matière</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  view === item.id
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="text-sm font-medium text-zinc-800">{RESTAURANT.name}</p>
          <p className="text-xs text-zinc-500">{RESTAURANT.city}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-7 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {TITLES[view]}
            </h1>
            <p className="text-xs text-zinc-500">
              Dernière facture : {lastInvoice.date} · {lastInvoice.supplier}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-500">
              {RESTAURANT.ingredientCount} ingrédients · 8 fournisseurs
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-zinc-50 p-7">
          {view === "dashboard" && <Dashboard scenario={scenario} />}
          {view === "invoices" && (
            <Invoices
              scenario={scenario}
              onImport={() => setScenario("juin")}
              onReset={() => setScenario("mai")}
            />
          )}
          {view === "mercuriale" && <Mercuriale scenario={scenario} />}
          {view === "recipes" && <Recipes scenario={scenario} />}
          {view === "menu" && <MenuEngineering scenario={scenario} />}
        </main>
      </div>
    </div>
  );
}
