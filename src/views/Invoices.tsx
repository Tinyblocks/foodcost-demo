import { useState } from "react";
import {
  Scenario,
  getIngredients,
  getInvoices,
  invoiceLineItems,
  priceOf,
  Invoice,
} from "../data/seed";
import { Badge, Button, Card, CardHeader, cn, eur } from "../components/ui";
import {
  FileUp,
  Loader2,
  CheckCircle2,
  Sparkles,
  ScanLine,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  X,
  Mail,
  Plus,
  Pencil,
} from "lucide-react";

type Phase = "idle" | "scanning" | "review" | "done";

interface ReviewLine {
  rawLabel: string;
  ingredientId: string;
  conditioning: string;
  price: number;
  reconnu: boolean;
}

// Raw lines as read off the supplier PDF. Note the block-feta case: a different
// conditionnement that must normalize to the SAME ingredient (Feta), in €/kg.
const reviewSeed: Omit<ReviewLine, "price">[] = [
  { rawLabel: "BLOC FETA 2KG", ingredientId: "feta", conditioning: "bloc 2 kg → ÷ 2 pour le €/kg", reconnu: true },
  { rawLabel: "LAIT COCO BTE 400ML", ingredientId: "lait-coco", conditioning: "boîte 400 ml → €/L", reconnu: true },
  { rawLabel: "PENNE SACHET 3KG", ingredientId: "pates", conditioning: "sachet 3 kg → €/kg", reconnu: true },
  { rawLabel: "QUINOA PAQUET 2,5KG", ingredientId: "quinoa", conditioning: "paquet 2,5 kg → €/kg", reconnu: true },
  { rawLabel: "BEURRE PLAQUETTE 10x250G", ingredientId: "beurre", conditioning: "colis 2,5 kg → €/kg", reconnu: true },
  { rawLabel: "VINAIGRE DE CIDRE 1L", ingredientId: "vinaigre-cidre", conditioning: "—", reconnu: true },
  { rawLabel: "CHEDDAR TRANCHES 1KG", ingredientId: "cheddar", conditioning: "tranche pesée → €/kg", reconnu: true },
  { rawLabel: "CREAM CHEESE 1,5KG", ingredientId: "cream-cheese", conditioning: "seau 1,5 kg → €/kg", reconnu: false },
];

export default function Invoices({
  scenario,
  onImport,
  onReset,
}: {
  scenario: Scenario;
  onImport: () => void;
  onReset: () => void;
}) {
  const reviewShot =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("shot") === "review";
  const [phase, setPhase] = useState<Phase>(
    reviewShot ? "review" : scenario === "juin" ? "done" : "idle"
  );
  const [lines, setLines] = useState<ReviewLine[]>(
    reviewShot
      ? reviewSeed.map((l) => ({ ...l, price: priceOf(l.ingredientId, "juin") }))
      : []
  );
  const [open, setOpen] = useState<Invoice | null>(null);
  const ingredients = getIngredients(scenario);
  const invoices = getInvoices(scenario);

  function start() {
    setPhase("scanning");
    setTimeout(() => {
      // Detected prices = the incoming invoice's values (butter already at 10).
      setLines(reviewSeed.map((l) => ({ ...l, price: priceOf(l.ingredientId, "juin") })));
      setPhase("review");
    }, 1900);
  }

  function setMapping(i: number, ingredientId: string) {
    setLines((ls) =>
      ls.map((l, idx) =>
        idx === i ? { ...l, ingredientId, price: priceOf(ingredientId, "juin"), reconnu: true } : l
      )
    );
  }

  function setPrice(i: number, price: number) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, price } : l)));
  }

  function validate() {
    onImport();
    setPhase("done");
  }

  function reset() {
    onReset();
    setPhase("idle");
    setLines([]);
  }

  const reconnus = lines.filter((l) => l.reconnu).length;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Importer une facture"
          subtitle="PDF, photo ou transfert email automatique — l'IA lit, vous validez"
        />
        <div className="p-5">
          {phase === "idle" && (
            <button
              onClick={start}
              className="group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 py-12 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm group-hover:bg-emerald-100">
                <FileUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-800">
                  Déposez votre dernière facture
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  metro_03-06-2026.pdf · 3 pages · reçue par email
                </p>
              </div>
              <span className="mt-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white">
                Importer la facture
              </span>
            </button>
          )}

          {phase === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-4 py-14">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <ScanLine className="h-7 w-7 text-emerald-600 fc-pulse" />
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lecture de la facture, extraction des lignes…
              </div>
            </div>
          )}

          {phase === "review" && (
            <div className="fc-fade space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800">
                  Vérifiez avant de valider
                </span>
                <span className="text-amber-700">
                  {reconnus}/{lines.length} reconnus · corrigez un prix ou un
                  ingrédient si besoin
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Ligne facture</th>
                      <th className="px-4 py-2.5 font-medium">Ingrédient (modifiable)</th>
                      <th className="px-4 py-2.5 font-medium">Conditionnement</th>
                      <th className="px-4 py-2.5 text-right font-medium">Prix €/u (modifiable)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {lines.map((l, i) => {
                      const ing = ingredients.find((x) => x.id === l.ingredientId);
                      return (
                        <tr key={i}>
                          <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                            {l.rawLabel}
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={l.ingredientId}
                              onChange={(e) => setMapping(i, e.target.value)}
                              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                            >
                              {ingredients
                                .filter((x) => !x.houseMade)
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-xs text-zinc-500">
                            {l.conditioning}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={l.price}
                                onChange={(e) => setPrice(i, parseFloat(e.target.value) || 0)}
                                className="w-20 rounded border border-zinc-300 px-2 py-1 text-right text-sm tabular-nums focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-xs text-zinc-400">
                                €/{ing?.unit ?? "u"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" className="text-zinc-500" onClick={reset}>
                  Annuler
                </Button>
                <Button onClick={validate}>
                  <CheckCircle2 className="h-4 w-4" />
                  Valider et mettre à jour les prix
                </Button>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="fc-fade space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">
                  Facture du 03/06 validée.
                </span>
                <span className="text-emerald-700">
                  Mercuriale et fiches techniques mises à jour.
                </span>
                <Button variant="ghost" className="ml-auto text-zinc-500" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réinitialiser
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Beurre <span className="font-medium">+17,6 %</span> (8,50 →
                  10,00 €/kg). 1 fiche dépasse 30 % de coût matière :{" "}
                  <span className="font-medium">Cookie maison</span>.
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Factures reçues"
          subtitle="Classées et rapprochées automatiquement depuis vos emails"
          right={
            <div className="flex items-center gap-2">
              <Badge tone="zinc">{invoices.length} ce trimestre</Badge>
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("idle");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          }
        />
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Fournisseur</th>
                <th className="px-5 py-2.5 text-right font-medium">Lignes</th>
                <th className="px-5 py-2.5 text-right font-medium">Total HT</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setOpen(inv)}
                  className="group cursor-pointer align-top transition-colors hover:bg-zinc-50"
                >
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums text-zinc-600">
                    {inv.date}
                  </td>
                  <td className="px-5 py-3 text-zinc-800">{inv.supplier}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-600">
                    {inv.lines}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-800">
                    {eur(inv.totalHT)} €
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        {inv.status === "Confirmée" ? (
                          <Badge tone="emerald">Confirmée</Badge>
                        ) : (
                          <Badge tone="amber">
                            <AlertTriangle className="h-3 w-3" />
                            À vérifier
                          </Badge>
                        )}
                        {inv.note && (
                          <p className="mt-1 max-w-xs text-xs text-zinc-500">
                            {inv.note}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <InvoiceModal
          invoice={open}
          scenario={scenario}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function InvoiceModal({
  invoice,
  scenario,
  onClose,
}: {
  invoice: Invoice;
  scenario: Scenario;
  onClose: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [items, setItems] = useState(() => invoiceLineItems(invoice, scenario));
  const totalHT = items.reduce((s, l) => s + l.totalHT, 0);
  const tva = items.reduce((s, l) => s + (l.totalHT * l.tva) / 100, 0);
  const mixedTva = new Set(items.map((l) => l.tva)).size > 1;

  function setPrice(i: number, price: number) {
    setItems((rows) =>
      rows.map((l, idx) =>
        idx === i ? { ...l, unitPriceHT: price, totalHT: price * l.qty } : l
      )
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-zinc-900/40 p-6"
      onClick={onClose}
    >
      <div
        className="fc-fade my-6 w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900">
                {invoice.supplier}
              </h3>
              {invoice.status === "Confirmée" ? (
                <Badge tone="emerald">Confirmée</Badge>
              ) : (
                <Badge tone="amber">
                  <AlertTriangle className="h-3 w-3" />
                  À vérifier
                </Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              <Mail className="h-3.5 w-3.5" />
              Facture du {invoice.date}/2026 · reçue par email · rapprochée
              automatiquement
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!edit && (
              <Button variant="outline" onClick={() => setEdit(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Éditer
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {invoice.note && (
          <div
            className={cn(
              "mx-6 mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm",
              invoice.status === "À vérifier"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{invoice.note}</span>
          </div>
        )}

        <div className="px-6 py-4">
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Désignation</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qté</th>
                  <th className="px-4 py-2.5 text-right font-medium">PU HT</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total HT</th>
                  <th className="px-4 py-2.5 text-right font-medium">TVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((l, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">
                      {l.label}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">
                      {l.qty}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600">
                      {edit ? (
                        <input
                          type="number"
                          step="0.01"
                          value={l.unitPriceHT}
                          onChange={(e) => setPrice(i, parseFloat(e.target.value) || 0)}
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-right text-sm tabular-nums focus:border-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <>{eur(l.unitPriceHT)} €</>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-800">
                      {eur(l.totalHT)} €
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          "tabular-nums",
                          l.tva === 20 ? "font-medium text-amber-600" : "text-zinc-400"
                        )}
                      >
                        {l.tva.toLocaleString("fr-FR")} %
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Total HT</span>
              <span className="tabular-nums">{eur(totalHT)} €</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span className="flex items-center gap-1">
                TVA
                {mixedTva && <span className="text-xs text-amber-600">(mixte)</span>}
              </span>
              <span className="tabular-nums">{eur(tva)} €</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-semibold text-zinc-900">
              <span>Total TTC</span>
              <span className="tabular-nums">{eur(totalHT + tva)} €</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          {edit ? (
            <Button onClick={() => setEdit(false)}>
              <CheckCircle2 className="h-4 w-4" />
              Enregistrer
            </Button>
          ) : (
            <>
              {invoice.status === "À vérifier" && (
                <Button variant="outline" onClick={onClose}>
                  Marquer comme vérifiée
                </Button>
              )}
              <Button onClick={onClose}>Fermer</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
