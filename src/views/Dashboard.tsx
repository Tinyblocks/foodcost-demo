import {
  Scenario,
  allCosts,
  avgFoodCost,
  getIngredients,
  staleIngredients,
  trendPct,
  foodCostTone,
  FC_RED,
  RESTAURANT,
} from "../data/seed";
import { Badge, Card, CardHeader, Stat, eur, pct } from "../components/ui";
import {
  AlertTriangle,
  Gauge,
  Percent,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function Dashboard({ scenario }: { scenario: Scenario }) {
  const costs = allCosts(scenario);
  const avg = avgFoodCost(scenario);
  const overThirty = costs.filter((c) => c.ratio > FC_RED);
  const ingredients = getIngredients(scenario);
  const stale = staleIngredients(scenario);
  const butterRise = scenario === "juin";

  const movers = [...ingredients]
    .filter((i) => !i.houseMade)
    .map((i) => ({ i, t: trendPct(i.history) }))
    .sort((a, b) => Math.abs(b.t) - Math.abs(a.t))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {butterRise && (
        <div className="fc-fade flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">
              Facture du 03/06 — le beurre est passé de 8,50 € à 10,00 €/kg
              (+17,6 %)
            </p>
            <p className="mt-0.5 text-red-700">
              <span className="font-medium">Cookie maison</span> dépasse 30 % de
              coût matière. Vous l'auriez raté sans vous en rendre compte.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          label="Coût matière moyen"
          value={pct(avg * 100, 0)}
          hint="Moyenne non pondérée · cible < 30 %"
          tone={foodCostTone(avg)}
          icon={<Gauge className="h-4 w-4" />}
        />
        <Stat
          label="Marge brute"
          value={pct((1 - avg) * 100, 0)}
          hint="Standard marché ≈ 70 %"
          tone="emerald"
          icon={<Percent className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Mouvements de prix"
            subtitle="Variations les plus fortes depuis janvier"
          />
          <div className="divide-y divide-zinc-100">
            {movers.map(({ i, t }) => {
              const up = t > 0;
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{i.name}</p>
                    <p className="text-xs text-zinc-400">{i.supplier}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-zinc-600">
                      {eur(i.price)} €/{i.unit}
                    </span>
                    <span
                      className={
                        up
                          ? "inline-flex items-center gap-0.5 text-sm font-medium text-red-600"
                          : "inline-flex items-center gap-0.5 text-sm font-medium text-emerald-600"
                      }
                    >
                      {up ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {up ? "+" : ""}
                      {t.toFixed(0)} %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Fiches à surveiller"
            subtitle="Coût matière le plus élevé"
            right={
              <Badge tone={overThirty.length ? "red" : "emerald"}>
                {overThirty.length} &gt; 30 %
              </Badge>
            }
          />
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-2 text-xs uppercase tracking-wide text-zinc-400">
            <span>Fiche</span>
            <span>Coût matière</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {[...costs]
              .sort((a, b) => b.ratio - a.ratio)
              .slice(0, 6)
              .map((c) => (
                <div
                  key={c.recipe.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span>{c.recipe.emoji}</span>
                    <span className="text-sm text-zinc-700">
                      {c.recipe.name}
                    </span>
                  </div>
                  <Badge tone={foodCostTone(c.ratio)}>{pct(c.ratio * 100, 0)}</Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <p className="text-xs text-zinc-400">
        Code couleur coût matière : <span className="text-emerald-600">● &lt; 25 %</span>{" "}
        · <span className="text-amber-600">● 25–30 %</span> ·{" "}
        <span className="text-red-600">● &gt; 30 %</span>
      </p>
    </div>
  );
}
