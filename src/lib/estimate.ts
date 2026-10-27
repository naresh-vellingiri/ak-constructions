import { clientConfig, type WorkType } from "@/config/client";
import { formatIndianCurrency } from "@/lib/utils";

export type EstimateLine = {
  label: string;
  /** Right-hand figure, already formatted. */
  value: string;
};

export type QuoteEstimate = {
  /** 0 means there is no figure to show yet (e.g. no area entered). */
  total: number;
  lines: EstimateLine[];
};

const { turnkeyPerSqFt, interiorStartsFrom } = clientConfig.pricing;

/**
 * Indicative "starting from" estimate for the quote form.
 *
 * Both inputs are published starting prices, so every total here is a floor, not
 * a quote — the form labels it "From". For the combined option the two floors
 * are added and shown as separate lines, so the customer sees exactly where the
 * number comes from rather than one opaque figure.
 *
 * Interiors are a flat starting budget (not per sq ft), so they do not change
 * with the area entered.
 */
export function estimateQuote(workType: string, sqFt: number): QuoteEstimate {
  const construction = sqFt > 0 ? sqFt * turnkeyPerSqFt : 0;
  const constructionLine: EstimateLine = {
    label: `Turnkey construction · ${sqFt.toLocaleString("en-IN")} sq ft × ${formatIndianCurrency(turnkeyPerSqFt)}`,
    value: formatIndianCurrency(construction),
  };
  const interiorLine: EstimateLine = {
    label: "Custom interiors · starting budget",
    value: formatIndianCurrency(interiorStartsFrom),
  };

  switch (workType as WorkType) {
    case "Construction Only":
      return construction > 0
        ? { total: construction, lines: [constructionLine] }
        : { total: 0, lines: [] };

    case "Interior Design Only":
      return { total: interiorStartsFrom, lines: [interiorLine] };

    case "Interior + Construction":
      return construction > 0
        ? { total: construction + interiorStartsFrom, lines: [constructionLine, interiorLine] }
        : { total: 0, lines: [] };

    default:
      return { total: 0, lines: [] };
  }
}
