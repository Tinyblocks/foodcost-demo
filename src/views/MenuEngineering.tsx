import {
  Scenario,
  menuEngineering,
  MenuCategory,
  MenuItem,
  totalMonthlySales,
} from "../data/seed";
import { Badge, Card, cn, eur, pct } from "../components/ui";
import { Star, Milk, HelpCircle, TrendingDown } from "lucide-react";

const CAT_STYLE: Record<
  MenuCategory,
  {
    color: string;
    bg: string;
    tone: "emerald" | "blue" | "amber" | "zinc";
    icon: typeof Star;
    tip: string;
  }
> = {
  Étoile: {
    color: "#059669",
    bg: "bg-emerald-50",
    tone: "emerald",
    icon: Star,
    tip: "Populaire + rentable. À mettre en avant sur la carte.",
  },
  "Vache à lait": {
    color: "#2563eb",
    bg: "bg-blue-50",
    tone: "blue",
    icon: Milk,
    tip: "Très vendu, marge plus faible. À garder, optimiser le coût.",
  },
  Énigme: {
    color: "#d97706",
    bg: "bg-amber-50",
    tone: "amber",
    icon: HelpCircle,
    tip: "Bonne marge, peu vendu. À pousser (placement, photo).",
  },
  "Poids mort": {
    color: "#71717a",
    bg: "bg-zinc-100",
    tone: "zinc",
    icon: TrendingDown,
    tip: "Peu vendu, peu rentable. À questionner ou retirer.",
  },
};

const ORDER: MenuCategory[] = ["Étoile", "Vache à lait", "Énigme", "Poids mort"];

function contribution(it: MenuItem) {
  return (it.recipe.sellingPriceHT - it.costPerPortion) * it.recipe.monthlySales;
}

export default function MenuEngineering({ scenario }: { scenario: Scenario }) {
  const { items } = menuEngineering(scenario);
  const totalContribution = items.reduce((s, it) => s + contribution(it), 0);
  const totalSales = totalMonthlySales();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-500">
          Vos plats classés par popularité et rentabilité, à partir de vos
          ventes du mois.
        </p>
        <div className="ml-auto flex gap-2">
          <Badge tone="emerald">Marge pondérée ≈ 71 %</Badge>
          <Badge tone="zinc">
            Marge brute totale {eur(totalContribution, 0)} €/mois
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ORDER.map((cat) => {
          const s = CAT_STYLE[cat];
          const Icon = s.icon;
          const list = items
            .filter((i) => i.category === cat)
            .sort((a, b) => contribution(b) - contribution(a));
          const catContribution = list.reduce((sum, it) => sum + contribution(it), 0);

          return (
            <Card key={cat} className="overflow-hidden">
              <div
                className={cn("flex items-start gap-3 px-5 py-4", s.bg)}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: s.color }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900">{cat}</h3>
                    <Badge tone={s.tone}>{list.length}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">{s.tip}</p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-xs text-zinc-500">Marge brute</p>
                  <p className="text-sm font-semibold text-zinc-800">
                    {eur(catContribution, 0)} €
                  </p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-5 py-2 font-medium">Plat</th>
                    <th className="px-5 py-2 text-right font-medium">Marge</th>
                    <th className="px-5 py-2 text-right font-medium">% ventes</th>
                    <th className="px-5 py-2 text-right font-medium">€/mois</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {list.map((it) => (
                    <tr key={it.recipe.id}>
                      <td className="px-5 py-2.5 text-zinc-800">
                        {it.recipe.emoji} {it.recipe.name}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        <span
                          className={
                            it.belowMargin ? "text-red-600" : "text-emerald-600"
                          }
                        >
                          {pct(it.margePct, 0)}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-zinc-500">
                        {((it.recipe.monthlySales / totalSales) * 100).toFixed(0)} %
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-medium text-zinc-800">
                        {eur(contribution(it), 0)} €
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td colSpan={4} className="px-5 py-4 text-center text-xs italic text-zinc-400">
                        Aucun plat dans cette catégorie
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-zinc-400">
        « Marge € / mois » = marge brute unitaire × ventes du mois. C'est la
        contribution réelle de chaque plat, pas juste son pourcentage. Les
        boissons fraîches ressortent en énigmes / poids morts : marge faible mais
        zéro préparation, ce sont des ventes additionnelles.
      </p>
    </div>
  );
}
