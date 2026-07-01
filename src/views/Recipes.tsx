import { useState } from "react";
import {
  Scenario,
  getIngredients,
  costRecipe,
  recipes,
  Recipe,
  RecipeLine,
  foodCostTone,
  FC_GREEN,
  FC_RED,
  SEASONING_RATE,
  TVA_VENTE,
} from "../data/seed";
import { Badge, Button, Card, CardHeader, cn, eur, pct } from "../components/ui";
import { AlertTriangle, CheckCircle2, Clock, Pencil, Trash2, Plus } from "lucide-react";

interface Draft {
  priceTTC: number;
  portions: number;
  lines: RecipeLine[];
}

export default function Recipes({ scenario }: { scenario: Scenario }) {
  const [selected, setSelected] = useState<string>("cookie");
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saved, setSaved] = useState(false);
  const ingredients = getIngredients(scenario);

  function effective(r: Recipe): Recipe {
    const d = drafts[r.id];
    return d ? { ...r, priceTTC: d.priceTTC, portions: d.portions, lines: d.lines } : r;
  }

  const costs = recipes.map((r) => costRecipe(effective(r), scenario));
  const base = recipes.find((r) => r.id === selected)!;
  const recipe = effective(base);
  const cost = costRecipe(recipe, scenario);

  function startEdit() {
    setDrafts((d) => ({
      ...d,
      [selected]: d[selected] ?? {
        priceTTC: recipe.priceTTC,
        portions: recipe.portions,
        lines: recipe.lines.map((l) => ({ ...l })),
      },
    }));
    setEditing(true);
    setSaved(false);
  }

  function patch(p: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [selected]: { ...d[selected], ...p } }));
  }
  function setLineQty(i: number, qty: number) {
    patch({ lines: drafts[selected].lines.map((l, idx) => (idx === i ? { ...l, qty } : l)) });
  }
  function removeLine(i: number) {
    patch({ lines: drafts[selected].lines.filter((_, idx) => idx !== i) });
  }
  function addLine(id: string) {
    if (!id) return;
    patch({ lines: [...drafts[selected].lines, { ingredientId: id, qty: 0.1 }] });
  }
  function save() {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }
  function select(id: string) {
    setSelected(id);
    setEditing(false);
  }

  const available = ingredients.filter(
    (i) => !recipe.lines.some((l) => l.ingredientId === i.id)
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2 self-start">
        <CardHeader
          title="Fiches techniques"
          subtitle="Coût matière recalculé en temps réel · cible < 30 %"
        />
        <div className="divide-y divide-zinc-100">
          {costs.map((c) => (
            <button
              key={c.recipe.id}
              onClick={() => select(c.recipe.id)}
              className={cn(
                "flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-zinc-50",
                selected === c.recipe.id && "bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{c.recipe.emoji}</span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                    {c.recipe.name}
                    {drafts[c.recipe.id] && <Badge tone="blue">modifiée</Badge>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {eur(c.recipe.priceTTC)} € TTC · coût {eur(c.costPerPortion)} €
                  </p>
                </div>
              </div>
              <Badge tone={foodCostTone(c.ratio)}>{pct(c.ratio * 100, 0)}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-3 self-start">
        <CardHeader
          title={`${recipe.emoji} ${base.name}`}
          subtitle={editing ? "Mode édition — quantités, prix, ingrédients" : undefined}
          right={
            <div className="flex items-center gap-2">
              {!editing && (
                <Badge tone={foodCostTone(cost.ratio)}>
                  {cost.ratio > FC_RED ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Coût matière {pct(cost.ratio * 100, 0)}
                </Badge>
              )}
              {editing ? (
                <Button onClick={save}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
              ) : (
                <Button variant="outline" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Éditer
                </Button>
              )}
            </div>
          }
        />
        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 px-4 py-2.5">
              <p className="text-xs text-zinc-500">Prix de vente TTC</p>
              {editing ? (
                <input
                  type="number"
                  step="0.1"
                  value={drafts[selected].priceTTC}
                  onChange={(e) => patch({ priceTTC: parseFloat(e.target.value) || 0 })}
                  className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm tabular-nums focus:border-emerald-500 focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                  {eur(recipe.priceTTC)} €
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                dont HT : {eur(cost.priceHT)} € · TVA {TVA_VENTE * 100} %
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 px-4 py-2.5">
              <p className="text-xs text-zinc-500">Portions</p>
              {editing ? (
                <input
                  type="number"
                  step="1"
                  value={drafts[selected].portions}
                  onChange={(e) => patch({ portions: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm tabular-nums focus:border-emerald-500 focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 text-lg font-semibold text-zinc-900">{recipe.portions}</p>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Ingrédient</th>
                <th className="pb-2 text-right font-medium">Qté</th>
                <th className="pb-2 text-right font-medium">€/unité</th>
                <th className="pb-2 text-right font-medium">Coût</th>
                <th className="pb-2 text-right font-medium">% recette</th>
                {editing && <th className="pb-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cost.lines.map((l, i) => {
                const ing = ingredients.find((x) => x.id === l.ingredientId)!;
                const moved = scenario === "juin" && l.ingredientId === "beurre";
                const share = cost.rawCost ? (l.cost / cost.rawCost) * 100 : 0;
                return (
                  <tr key={l.ingredientId} className={cn(moved && "bg-red-50")}>
                    <td className="py-2 text-zinc-800">
                      <span className="flex items-center gap-1.5">
                        {ing.name}
                        {ing.houseMade && <Badge tone="blue">Maison</Badge>}
                        {ing.stale && (
                          <Badge tone="amber">
                            <Clock className="h-3 w-3" />
                            prix ancien
                          </Badge>
                        )}
                        {moved && <Badge tone="red">+17,6 %</Badge>}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-600">
                      {editing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={drafts[selected].lines[i].qty}
                          onChange={(e) => setLineQty(i, parseFloat(e.target.value) || 0)}
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-right text-sm tabular-nums focus:border-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <>
                          {l.qty} {ing.unit}
                        </>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-600">
                      {eur(l.unitPrice)} €
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-800">
                      {eur(l.cost)} €
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-500">
                      {share.toFixed(0)} %
                    </td>
                    {editing && (
                      <td className="py-2 pl-2 text-right">
                        <button
                          onClick={() => removeLine(i)}
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="text-zinc-500">
                <td className="py-2" colSpan={3}>
                  Assaisonnement (+{SEASONING_RATE * 100} %)
                </td>
                <td className="py-2 text-right tabular-nums">
                  {eur(cost.rawCost * SEASONING_RATE)} €
                </td>
                <td></td>
                {editing && <td></td>}
              </tr>
            </tbody>
          </table>

          {editing && (
            <div className="mt-3 flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  addLine(e.target.value);
                  e.target.value = "";
                }}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="" disabled>
                  Ajouter un ingrédient…
                </option>
                {available.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({eur(i.price)} €/{i.unit})
                  </option>
                ))}
              </select>
              <span className="text-zinc-400">
                <Plus className="h-4 w-4" />
              </span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Mini label="Coût / portion" value={`${eur(cost.costPerPortion)} €`} />
            <Mini
              label="Coût matière"
              value={pct(cost.ratio * 100, 0)}
              tone={foodCostTone(cost.ratio)}
            />
            <Mini label="Coût total recette" value={`${eur(cost.totalCost)} €`} />
          </div>

          {saved ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Fiche enregistrée. Le coût matière est à jour partout.
            </div>
          ) : cost.ratio > FC_RED ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Au-dessus de 30 % de coût matière. Prix de vente à{" "}
                <span className="font-medium">
                  {eur((cost.costPerPortion / FC_RED) * (1 + TVA_VENTE))} € TTC
                </span>{" "}
                pour repasser sous le seuil.
              </span>
            </div>
          ) : cost.ratio > FC_GREEN ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Coût matière entre 25 % et 30 % — correct, à surveiller.
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Bon coût matière (sous 25 %).
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Mini({
  label,
  value,
  tone = "zinc",
}: {
  label: string;
  value: string;
  tone?: "zinc" | "emerald" | "amber" | "red";
}) {
  const tones = {
    zinc: "text-zinc-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold", tones[tone])}>{value}</p>
    </div>
  );
}
