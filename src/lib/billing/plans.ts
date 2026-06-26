export type BillingPlanId = "monthly" | "quarterly" | "semiannual" | "annual";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  priceLabel: string;
  amountCents: number;
  durationMonths: number;
  description: string;
  featured?: boolean;
  oldPriceLabel?: string;
  savingLabel?: string;
  badge?: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "monthly",
    name: "Plano Mensal",
    priceLabel: "R$47,98",
    amountCents: 4798,
    durationMonths: 1,
    description: "Ideal para testar a ferramenta",
  },
  {
    id: "quarterly",
    name: "Plano Trimestral",
    priceLabel: "R$97,90",
    amountCents: 9790,
    durationMonths: 3,
    description: "Mais tempo para prospectar com economia",
  },
  {
    id: "semiannual",
    name: "Plano Semestral",
    priceLabel: "R$154,00",
    amountCents: 15400,
    durationMonths: 6,
    description: "Para quem quer trabalhar com consistencia",
  },
  {
    id: "annual",
    name: "Plano Anual",
    oldPriceLabel: "R$575,76",
    priceLabel: "R$187,90",
    amountCents: 18790,
    durationMonths: 12,
    description: "Melhor escolha para quem quer vender sites e prospectar o ano inteiro pagando muito menos",
    featured: true,
    badge: "Mais vantajoso",
    savingLabel: "Economia de R$387,86",
  },
];

export function getBillingPlan(planId: string | null | undefined) {
  return BILLING_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function addPlanMonths(date: Date, plan: BillingPlan) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + plan.durationMonths);
  return nextDate;
}
