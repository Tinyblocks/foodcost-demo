// Seed data modeled on the "Very French Beans" teardown (Marine's process video).
// Everything HT, standardized to kg / L / pièce. Cible: 70% de marge (= 30% coût matière).
// The app ships with 5 months of invoice history already loaded; importing the
// latest invoice (the real product action) is what updates prices and fires alerts.

export type Scenario = "mai" | "juin";
export type Unit = "kg" | "L" | "pièce";

export interface PricePoint {
  month: string;
  price: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  price: number;
  category: string;
  supplier: string;
  rawLabel?: string;
  conditioning?: string;
  trend?: number; // fractional change Jan -> Mai (for generated history)
  lastInvoiceDays?: number;
  // computed:
  history?: PricePoint[];
  stale?: boolean;
}

export interface RecipeLine {
  ingredientId: string;
  qty: number;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  sellingPriceHT: number;
  portions: number;
  monthlySales: number;
  lines: RecipeLine[];
}

export interface Invoice {
  id: string;
  date: string;
  supplier: string;
  lines: number;
  totalHT: number;
  status: "Confirmée" | "À vérifier";
  note?: string;
}

export const SEASONING_RATE = 0.03;
export const TARGET_RATIO = 0.3; // coût matière cible
export const MARGIN_TARGET = 70; // marge cible en % (gardée pour le menu engineering)
export const STALE_DAYS = 60;

// Code couleur coût matière : vert < 25 %, orange 25–30 %, rouge > 30 %.
export const FC_GREEN = 0.25;
export const FC_RED = 0.3;
export function foodCostTone(ratio: number): "emerald" | "amber" | "red" {
  if (ratio < FC_GREEN) return "emerald";
  if (ratio <= FC_RED) return "amber";
  return "red";
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai"];

// --- Ingredients ---------------------------------------------------------

const baseIngredients: Ingredient[] = [
  { id: "beurre", name: "Beurre doux", unit: "kg", price: 8.5, category: "Crèmerie", supplier: "Metro", rawLabel: "BEURRE PLAQUETTE 10x250G", conditioning: "colis 2,5 kg → €/kg", lastInvoiceDays: 4 },
  { id: "farine", name: "Farine T55", unit: "kg", price: 1.1, category: "Épicerie", supplier: "Metro", rawLabel: "FARINE T55 SAC 25KG", conditioning: "sac 25 kg → €/kg", trend: 0.1, lastInvoiceDays: 12 },
  { id: "sucre", name: "Sucre semoule", unit: "kg", price: 1.4, category: "Épicerie", supplier: "Metro", trend: 0.05, lastInvoiceDays: 12 },
  { id: "sel", name: "Sel fin", unit: "kg", price: 0.8, category: "Épicerie", supplier: "Metro", trend: 0.0, lastInvoiceDays: 33 },
  { id: "chocolat", name: "Chocolat noir 60%", unit: "kg", price: 9.0, category: "Épicerie", supplier: "Metro", rawLabel: "CHOCOLAT PISTOLES 5KG", conditioning: "seau 5 kg → €/kg", trend: 0.14, lastInvoiceDays: 12 },
  { id: "oeuf", name: "Œuf plein air", unit: "pièce", price: 0.3, category: "Crèmerie", supplier: "Ferme Boulay", rawLabel: "OEUFS PA x180", conditioning: "plateau 180 → €/pièce", trend: 0.06, lastInvoiceDays: 6 },
  { id: "feta", name: "Feta AOP", unit: "kg", price: 9.0, category: "Crèmerie", supplier: "Grossiste Méditerranée", rawLabel: "FETA POT 500G", conditioning: "pot 500 g facturé à la pièce → ×2 pour le €/kg", trend: 0.07, lastInvoiceDays: 9 },
  { id: "lait-coco", name: "Lait de coco", unit: "L", price: 3.2, category: "Épicerie", supplier: "Asia Import", rawLabel: "LAIT COCO BTE 400ML", conditioning: "boîte 400 ml → €/L", trend: 0.03, lastInvoiceDays: 18 },
  { id: "pates", name: "Pâtes sèches", unit: "kg", price: 2.1, category: "Épicerie", supplier: "Metro", rawLabel: "PENNE SACHET 3KG", conditioning: "sachet 3 kg → €/kg", trend: -0.09, lastInvoiceDays: 12 },
  { id: "vinaigre-cidre", name: "Vinaigre de cidre", unit: "L", price: 2.5, category: "Épicerie", supplier: "Metro", trend: 0.02, lastInvoiceDays: 96 },
  { id: "quinoa", name: "Quinoa bio", unit: "kg", price: 4.8, category: "Épicerie", supplier: "Bio Distrib", rawLabel: "QUINOA PAQUET 2,5KG", conditioning: "paquet 2,5 kg (nb colis × qté) → €/kg", trend: -0.08, lastInvoiceDays: 22 },
  { id: "cheddar", name: "Cheddar tranches", unit: "kg", price: 11.0, category: "Crèmerie", supplier: "Grossiste Méditerranée", rawLabel: "CHEDDAR TRANCHES 1KG", conditioning: "tranche pesée → coût à la tranche", trend: 0.08, lastInvoiceDays: 9 },
  { id: "pain", name: "Pain burger", unit: "pièce", price: 0.45, category: "Boulangerie", supplier: "Fournil Voisin", trend: 0.07, lastInvoiceDays: 2 },
  { id: "cream-cheese", name: "Cream cheese", unit: "kg", price: 7.5, category: "Crèmerie", supplier: "Grossiste Méditerranée", trend: 0.04, lastInvoiceDays: 9 },
  { id: "piment-jalapeno", name: "Piment jalapeño", unit: "kg", price: 6.0, category: "Primeur", supplier: "Primeur Bastille", trend: 0.05, lastInvoiceDays: 15 },
  { id: "huile-olive", name: "Huile d'olive", unit: "L", price: 8.0, category: "Épicerie", supplier: "Grossiste Méditerranée", trend: -0.06, lastInvoiceDays: 9 },
  { id: "cafe-grains", name: "Café en grains", unit: "kg", price: 18.0, category: "Boissons", supplier: "Brûlerie Belleville", trend: 0.1, lastInvoiceDays: 20 },
  { id: "lait", name: "Lait entier", unit: "L", price: 1.1, category: "Crèmerie", supplier: "Metro", trend: 0.04, lastInvoiceDays: 4 },
  { id: "legumes-mix", name: "Légumes de saison", unit: "kg", price: 3.5, category: "Primeur", supplier: "Primeur Bastille", trend: 0.12, lastInvoiceDays: 74 },
  { id: "riz", name: "Riz basmati", unit: "kg", price: 2.0, category: "Épicerie", supplier: "Asia Import", trend: 0.03, lastInvoiceDays: 18 },
  { id: "canette-soda", name: "Soda canette 33cl", unit: "pièce", price: 0.55, category: "Boissons", supplier: "C10", trend: 0.06, lastInvoiceDays: 11 },
  { id: "jus-bio", name: "Jus bio 25cl", unit: "pièce", price: 1.2, category: "Boissons", supplier: "Bio Distrib", trend: 0.05, lastInvoiceDays: 22 },
];

const BUTTER_HISTORY: PricePoint[] = [
  { month: "Jan", price: 7.2 },
  { month: "Fév", price: 7.5 },
  { month: "Mar", price: 8.0 },
  { month: "Avr", price: 8.8 },
  { month: "Mai", price: 8.5 },
];

// House-made ingredient: jalapeño pickles. Its own fiche becomes an ingredient.
const picklesFiche: RecipeLine[] = [
  { ingredientId: "piment-jalapeno", qty: 1.5 },
  { ingredientId: "vinaigre-cidre", qty: 0.5 },
  { ingredientId: "sucre", qty: 0.2 },
  { ingredientId: "sel", qty: 0.05 },
];
const PICKLES_YIELD_KG = 2;

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function genHistory(current: number, trend: number): PricePoint[] {
  const start = current / (1 + trend);
  return MONTHS.map((m, i) => {
    const t = i / (MONTHS.length - 1);
    let p = start + (current - start) * smoothstep(t);
    if (i === MONTHS.length - 1) p = current;
    return { month: m, price: Math.round(p * 100) / 100 };
  });
}

export function priceOf(id: string, scenario: Scenario): number {
  if (id === "beurre" && scenario === "juin") return 10.0;
  const ing = baseIngredients.find((i) => i.id === id);
  if (ing) return ing.price;
  if (id === "pickles-jalapeno") {
    const cost = picklesFiche.reduce(
      (s, l) => s + l.qty * priceOf(l.ingredientId, scenario),
      0
    );
    return cost / PICKLES_YIELD_KG;
  }
  return 0;
}

export function getIngredients(scenario: Scenario): Ingredient[] {
  const out = baseIngredients.map((i) => {
    let history: PricePoint[];
    if (i.id === "beurre") {
      history =
        scenario === "juin"
          ? [...BUTTER_HISTORY, { month: "Juin", price: 10.0 }]
          : BUTTER_HISTORY;
    } else {
      history = genHistory(i.price, i.trend ?? 0);
    }
    return {
      ...i,
      price: priceOf(i.id, scenario),
      history,
      stale: (i.lastInvoiceDays ?? 0) > STALE_DAYS,
    };
  });

  // Pickles history derived from its components' monthly prices.
  const map = Object.fromEntries(out.map((i) => [i.id, i]));
  const picklesHistory = MONTHS.map((m, idx) => {
    const cost = picklesFiche.reduce(
      (s, l) => s + l.qty * (map[l.ingredientId].history![idx].price),
      0
    );
    return { month: m, price: Math.round((cost / PICKLES_YIELD_KG) * 100) / 100 };
  });
  out.push({
    id: "pickles-jalapeno",
    name: "Pickles de jalapeños",
    unit: "kg",
    price: priceOf("pickles-jalapeno", scenario),
    category: "Maison",
    supplier: "Production interne",
    houseMade: true,
    history: picklesHistory,
    lastInvoiceDays: 8,
    stale: false,
  } as Ingredient & { houseMade: boolean });

  return out;
}

export function trendPct(history?: PricePoint[]): number {
  if (!history || history.length < 2) return 0;
  const first = history[0].price;
  const last = history[history.length - 1].price;
  return first ? ((last - first) / first) * 100 : 0;
}

// --- Invoices ------------------------------------------------------------

const pastInvoices: Invoice[] = [
  { id: "i-0502", date: "02/05", supplier: "Metro", lines: 14, totalHT: 486.2, status: "Confirmée" },
  { id: "i-2804", date: "28/04", supplier: "Laiterie du Maine", lines: 6, totalHT: 212.4, status: "Confirmée" },
  { id: "i-2204", date: "22/04", supplier: "Grossiste Méditerranée", lines: 9, totalHT: 318.75, status: "À vérifier", note: "Écart TVA 5,5 % / 20 % à confirmer (12,30 €)" },
  { id: "i-1504", date: "15/04", supplier: "Primeur Bastille", lines: 11, totalHT: 174.9, status: "Confirmée" },
  { id: "i-0304", date: "03/04", supplier: "Metro", lines: 13, totalHT: 502.1, status: "Confirmée" },
  { id: "i-2703", date: "27/03", supplier: "Asia Import", lines: 5, totalHT: 143.6, status: "Confirmée" },
  { id: "i-2003", date: "20/03", supplier: "Brûlerie Belleville", lines: 3, totalHT: 96.0, status: "Confirmée" },
  { id: "i-0503", date: "05/03", supplier: "Bio Distrib", lines: 8, totalHT: 221.45, status: "À vérifier", note: "1 ligne non reconnue — à mapper" },
];

export function getInvoices(scenario: Scenario): Invoice[] {
  if (scenario === "juin") {
    return [
      { id: "i-0306", date: "03/06", supplier: "Metro", lines: 8, totalHT: 451.3, status: "Confirmée", note: "3 prix modifiés · 1 alerte coût matière" },
      ...pastInvoices,
    ];
  }
  return pastInvoices;
}

// --- Invoice detail (line items) ----------------------------------------

export interface InvoiceLineItem {
  label: string;
  qty: number;
  unit: string;
  unitPriceHT: number;
  totalHT: number;
  tva: number;
}

const JUNE_LINE_IDS = ["feta", "lait-coco", "pates", "quinoa", "beurre", "vinaigre-cidre", "cheddar", "cream-cheese"];

const MONTH_BY_MM: Record<string, string> = {
  "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Juin",
};

function seededRand(seedStr: string) {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function priceAtMonth(ing: Ingredient, monthLabel: string): number {
  return ing.history?.find((h) => h.month === monthLabel)?.price ?? ing.price;
}

export function invoiceLineItems(invoice: Invoice, scenario: Scenario): InvoiceLineItem[] {
  const ings = getIngredients(scenario).filter((i) => !i.houseMade);
  const byId = Object.fromEntries(ings.map((i) => [i.id, i]));
  const monthLabel = MONTH_BY_MM[invoice.date.slice(3, 5)] ?? "Mai";

  let items: InvoiceLineItem[];

  if (invoice.id === "i-0306") {
    items = JUNE_LINE_IDS.map((id) => {
      const ing = byId[id];
      const rand = seededRand(invoice.id + id);
      const qty = Math.max(1, Math.round(rand() * 14 + 2));
      const price = priceOf(id, scenario);
      return { label: ing.rawLabel ?? ing.name.toUpperCase(), qty, unit: "colis", unitPriceHT: price, totalHT: qty * price, tva: 5.5 };
    });
  } else {
    let pool = ings.filter((i) => i.supplier === invoice.supplier);
    for (const i of ings) {
      if (pool.length >= invoice.lines) break;
      if (!pool.includes(i)) pool.push(i);
    }
    pool = pool.slice(0, invoice.lines);
    items = pool.map((ing) => {
      const rand = seededRand(invoice.id + ing.id);
      const qty = Math.max(1, Math.round(rand() * 16 + 1));
      const price = priceAtMonth(ing, monthLabel);
      return { label: ing.rawLabel ?? ing.name.toUpperCase(), qty, unit: "colis", unitPriceHT: price, totalHT: qty * price, tva: 5.5 };
    });
    if (invoice.note?.includes("TVA")) {
      items.push({ label: "FILM ALIMENTAIRE 300M", qty: 2, unit: "pièce", unitPriceHT: 8.9, tva: 20, totalHT: 17.8 });
    }
  }

  // Scale line totals so they sum to the invoice's headline total (clean numbers).
  const raw = items.reduce((s, l) => s + l.totalHT, 0);
  const factor = raw ? invoice.totalHT / raw : 1;
  return items.map((l, idx) => {
    const scaled = Math.round(l.totalHT * factor * 100) / 100;
    return {
      ...l,
      totalHT: scaled,
      unitPriceHT: Math.round((scaled / l.qty) * 100) / 100,
      // nudge last line to absorb rounding drift
      ...(idx === items.length - 1
        ? { totalHT: Math.round((invoice.totalHT - items.slice(0, -1).reduce((s, x) => s + Math.round(x.totalHT * factor * 100) / 100, 0)) * 100) / 100 }
        : {}),
    };
  });
}

// Ingredients that haven't seen a recent invoice (Marine's "missing facture" reality).
export function staleIngredients(scenario: Scenario): Ingredient[] {
  return getIngredients(scenario).filter((i) => i.stale);
}

// --- Recipes -------------------------------------------------------------

export const recipes: Recipe[] = [
  { id: "allonge", name: "Allongé", emoji: "☕", sellingPriceHT: 2.2, portions: 1, monthlySales: 354, lines: [{ ingredientId: "cafe-grains", qty: 0.008 }] },
  { id: "cappuccino", name: "Cappuccino", emoji: "☕", sellingPriceHT: 3.0, portions: 1, monthlySales: 210, lines: [{ ingredientId: "cafe-grains", qty: 0.008 }, { ingredientId: "lait", qty: 0.15 }] },
  { id: "sandwich-cheddar", name: "Sandwich Cheddar", emoji: "🥪", sellingPriceHT: 7.0, portions: 1, monthlySales: 180, lines: [{ ingredientId: "pain", qty: 2 }, { ingredientId: "cheddar", qty: 0.06 }, { ingredientId: "beurre", qty: 0.02 }, { ingredientId: "cream-cheese", qty: 0.04 }, { ingredientId: "pickles-jalapeno", qty: 0.03 }] },
  { id: "salade-quinoa", name: "Salade Quinoa Feta", emoji: "🥗", sellingPriceHT: 9.5, portions: 1, monthlySales: 95, lines: [{ ingredientId: "quinoa", qty: 0.08 }, { ingredientId: "feta", qty: 0.07 }, { ingredientId: "huile-olive", qty: 0.02 }, { ingredientId: "legumes-mix", qty: 0.1 }] },
  { id: "bowl-coco", name: "Bowl Coco", emoji: "🍲", sellingPriceHT: 11.0, portions: 1, monthlySales: 60, lines: [{ ingredientId: "lait-coco", qty: 0.15 }, { ingredientId: "riz", qty: 0.1 }, { ingredientId: "legumes-mix", qty: 0.15 }] },
  { id: "cookie", name: "Cookie maison", emoji: "🍪", sellingPriceHT: 2.8, portions: 10, monthlySales: 140, lines: [{ ingredientId: "beurre", qty: 0.5 }, { ingredientId: "chocolat", qty: 0.3 }, { ingredientId: "sucre", qty: 0.2 }, { ingredientId: "farine", qty: 0.3 }] },
  { id: "menu-dej", name: "Menu déjeuner", emoji: "🍱", sellingPriceHT: 12.0, portions: 1, monthlySales: 120, lines: [{ ingredientId: "pain", qty: 2 }, { ingredientId: "cheddar", qty: 0.06 }, { ingredientId: "beurre", qty: 0.02 }, { ingredientId: "cream-cheese", qty: 0.04 }, { ingredientId: "pickles-jalapeno", qty: 0.03 }, { ingredientId: "canette-soda", qty: 1 }] },
  { id: "canette", name: "Soda canette", emoji: "🥤", sellingPriceHT: 2.5, portions: 1, monthlySales: 70, lines: [{ ingredientId: "canette-soda", qty: 1 }] },
  { id: "jus-bio", name: "Jus bio", emoji: "🧃", sellingPriceHT: 3.0, portions: 1, monthlySales: 40, lines: [{ ingredientId: "jus-bio", qty: 1 }] },
];

// --- Costing -------------------------------------------------------------

export interface RecipeCost {
  recipe: Recipe;
  rawCost: number;
  totalCost: number;
  costPerPortion: number;
  ratio: number;
  margePct: number;
  belowMargin: boolean; // marge < cible 70%
  lines: { ingredientId: string; qty: number; unitPrice: number; cost: number }[];
}

export function costRecipe(recipe: Recipe, scenario: Scenario): RecipeCost {
  const lines = recipe.lines.map((l) => {
    const unitPrice = priceOf(l.ingredientId, scenario);
    return { ...l, unitPrice, cost: l.qty * unitPrice };
  });
  const rawCost = lines.reduce((s, l) => s + l.cost, 0);
  const totalCost = rawCost * (1 + SEASONING_RATE);
  const costPerPortion = totalCost / recipe.portions;
  const ratio = costPerPortion / recipe.sellingPriceHT;
  const margePct = (1 - ratio) * 100;
  return {
    recipe,
    rawCost,
    totalCost,
    costPerPortion,
    ratio,
    margePct,
    belowMargin: margePct < MARGIN_TARGET,
    lines,
  };
}

export function allCosts(scenario: Scenario): RecipeCost[] {
  return recipes.map((r) => costRecipe(r, scenario));
}

// Coût matière moyen NON pondéré (décision revue 27/06 : pousse à optimiser
// toutes les recettes, pas seulement les plus vendues).
export function avgFoodCost(scenario: Scenario): number {
  const c = allCosts(scenario);
  return c.length ? c.reduce((s, x) => s + x.ratio, 0) / c.length : 0;
}

export function totalMonthlySales(): number {
  return recipes.reduce((s, r) => s + r.monthlySales, 0);
}

export function weightedMargin(scenario: Scenario): number {
  const costs = allCosts(scenario);
  let revenue = 0;
  let matiere = 0;
  for (const c of costs) {
    revenue += c.recipe.sellingPriceHT * c.recipe.monthlySales;
    matiere += c.costPerPortion * c.recipe.monthlySales;
  }
  return revenue ? (1 - matiere / revenue) * 100 : 0;
}

export type MenuCategory = "Étoile" | "Vache à lait" | "Énigme" | "Poids mort";

export interface MenuItem extends RecipeCost {
  popularity: number;
  category: MenuCategory;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function menuEngineering(scenario: Scenario): {
  items: MenuItem[];
  popMedian: number;
} {
  const costs = allCosts(scenario);
  const popMedian = median(costs.map((c) => c.recipe.monthlySales));
  const items = costs.map((c) => {
    const pop = c.recipe.monthlySales;
    const highPop = pop >= popMedian;
    const highMarge = c.margePct >= MARGIN_TARGET;
    let category: MenuCategory;
    if (highPop && highMarge) category = "Étoile";
    else if (highPop && !highMarge) category = "Vache à lait";
    else if (!highPop && highMarge) category = "Énigme";
    else category = "Poids mort";
    return { ...c, popularity: pop, category };
  });
  return { items, popMedian };
}

export const RESTAURANT = {
  name: "Very French Beans",
  city: "Paris 11e",
  ingredientCount: 400,
};
