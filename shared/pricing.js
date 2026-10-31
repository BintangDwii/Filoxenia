export const DEFAULT_PRICING = Object.freeze({
  laborPercent: 20,
  overheadPercent: 10,
  roundingStep: 1000,
});

export const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const roundUpTo = (value, step = DEFAULT_PRICING.roundingStep) => {
  const safeValue = Math.max(0, toFiniteNumber(value));
  const safeStep = toFiniteNumber(step) > 0 ? toFiniteNumber(step) : 1;
  return Math.ceil(safeValue / safeStep) * safeStep;
};

export const calculatePricing = ({
  materialCost = 0,
  yieldQty = 1,
  packagingCost = 0,
  laborPercent = DEFAULT_PRICING.laborPercent,
  overheadPercent = DEFAULT_PRICING.overheadPercent,
  marginPercent = 0,
  roundingStep = DEFAULT_PRICING.roundingStep,
} = {}) => {
  const material = Math.max(0, toFiniteNumber(materialCost));
  const safeYield = Math.max(1, toFiniteNumber(yieldQty, 1));
  const packaging = Math.max(0, toFiniteNumber(packagingCost));
  const safeLaborPercent = Math.max(0, toFiniteNumber(laborPercent));
  const safeOverheadPercent = Math.max(0, toFiniteNumber(overheadPercent));
  const safeMarginPercent = Math.max(0, toFiniteNumber(marginPercent));

  const laborCost = material * (safeLaborPercent / 100);
  const overheadCost = material * (safeOverheadPercent / 100);
  const hppTotal = material + laborCost + overheadCost;
  const hppPerUnit = hppTotal / safeYield;
  const packagingPerUnit = packaging;
  const modalPerUnit = hppPerUnit + packagingPerUnit;
  const marginAmount = modalPerUnit * (safeMarginPercent / 100);
  const sellingPriceRaw = modalPerUnit + marginAmount;
  const sellingPriceFinal = roundUpTo(sellingPriceRaw, roundingStep);
  const materialCostPerUnit = material / safeYield;
  const bepRatio =
    sellingPriceFinal > 0 ? materialCostPerUnit / sellingPriceFinal : 0;

  return {
    materialCost: normalizeNumber(material),
    yieldQty: normalizeNumber(safeYield),
    laborPercent: normalizeNumber(safeLaborPercent),
    laborCost: normalizeNumber(laborCost),
    overheadPercent: normalizeNumber(safeOverheadPercent),
    overheadCost: normalizeNumber(overheadCost),
    hppTotal: normalizeNumber(hppTotal),
    hppPerUnit: normalizeNumber(hppPerUnit),
    packagingCost: normalizeNumber(packagingPerUnit),
    modalPerUnit: normalizeNumber(modalPerUnit),
    marginPercent: normalizeNumber(safeMarginPercent),
    marginAmount: normalizeNumber(marginAmount),
    sellingPriceRaw: normalizeNumber(sellingPriceRaw),
    sellingPriceFinal,
    roundingStep: toFiniteNumber(roundingStep, DEFAULT_PRICING.roundingStep),
    materialCostPerUnit: normalizeNumber(materialCostPerUnit),
    bepRatio: normalizeNumber(bepRatio),
    bepPercent: normalizeNumber(bepRatio * 100),
  };
};

const normalizeNumber = (value) => Math.round(Number(value) * 1e6) / 1e6;

export const sumShoppingList = (items = []) =>
  items.reduce((total, item) => {
    const quantity = Math.max(0, toFiniteNumber(item.qty));
    const unitCost = Math.max(0, toFiniteNumber(item.hargaSatuan ?? item.unitCost));
    return total + quantity * unitCost;
  }, 0);
