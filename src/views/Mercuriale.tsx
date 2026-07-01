import { useState } from "react";
import {
  Scenario,
  getIngredients,
  Ingredient,
  trendPct,
  avgInflation,
} from "../data/seed";
import { Badge, Card, CardHeader, cn, eur } from "../components/ui";
import { Home, TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TrendTag({ history }: { history?: Ingredient["history"] }) {
  const t = trendPct(history);
  if (Math.abs(t) < 0.5)
    return <span className="text-xs text-zinc-400">stable</span>;
  const up = t > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-red-600" : "text-emerald-600"
      )}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {t.toFixed(0)} %
    </span>
  );
}

export default function Mercuriale({ scenario }: { scenario: Scenario }) {
  const ingredients = getIngredients(scenario);
  const [selected, setSelected] = useState<string>("beurre");
  const ing = ingredients.find((i) => i.id === selected) as Ingredient;
  const prices = (ing.history ?? []).map((h) => h.price);
  const lo = Math.floor(Math.min(...prices) * 0.9 * 10) / 10;
  const hi = Math.ceil(Math.max(...prices) * 1.1 * 10) / 10;
  const rising = trendPct(ing.history) > 0.5;
  const inflation = avgInflation(scenario);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            inflation > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          )}
        >
          {inflation > 0 ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Inflation moyenne de vos achats · depuis janvier
          </p>
          <p
            className={cn(
              "text-2xl font-semibold",
              inflation > 0 ? "text-red-600" : "text-emerald-600"
            )}
          >
            {inflation > 0 ? "+" : ""}
            {inflation.toFixed(1)} %
          </p>
        </div>
        <p className="ml-auto max-w-xs text-xs text-zinc-500">
          Variation moyenne des prix de tous vos ingrédients suivis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader
          title="Mercuriale"
          subtitle="Construite et tenue à jour automatiquement depuis vos factures"
          right={
            <Badge tone="zinc">{ingredients.length} affichés · 400 suivis</Badge>
          }
        />
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Ingrédient</th>
                <th className="px-5 py-2.5 font-medium">Depuis janv.</th>
                <th className="px-5 py-2.5 text-right font-medium">Prix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {ingredients.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-zinc-50",
                    selected === i.id && "bg-emerald-50/60"
                  )}
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800">{i.name}</span>
                      {i.houseMade && (
                        <Badge tone="blue">
                          <Home className="h-3 w-3" />
                          Maison
                        </Badge>
                      )}
                      {i.stale && (
                        <Badge tone="amber">
                          <Clock className="h-3 w-3" />
                          {i.lastInvoiceDays} j
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{i.supplier}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <TrendTag history={i.history} />
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-zinc-800">
                    {eur(i.price)} €/{i.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="lg:col-span-2 self-start">
        <CardHeader
          title={ing.name}
          subtitle={
            ing.houseMade
              ? "Coût calculé depuis sa fiche maison"
              : `${ing.supplier} · dernière facture il y a ${ing.lastInvoiceDays} j`
          }
          right={
            <Badge tone={rising ? "red" : "emerald"}>
              {eur(ing.price)} €/{ing.unit}
            </Badge>
          }
        />
        <div className="p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ing.history}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[lo, hi]}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  formatter={(v: number) => [`${eur(v)} €/${ing.unit}`, "Prix"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e4e4e7",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={rising ? "#dc2626" : "#059669"}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Tendance depuis janvier</span>
            <TrendTag history={ing.history} />
          </div>

          {ing.houseMade ? (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Ingrédient maison : son coût suit automatiquement le prix du piment
              et du vinaigre. Plus de fiche qui casse quand un prix bouge.
            </p>
          ) : ing.stale ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Aucune facture depuis {ing.lastInvoiceDays} jours — prix
              potentiellement périmé. Foodcost le signale au lieu de calculer une
              marge sur une donnée fausse.
            </p>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              {rising
                ? "En hausse — surveillez les fiches qui en dépendent."
                : "Stable ou en baisse — bon moment pour vos marges."}
            </p>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
