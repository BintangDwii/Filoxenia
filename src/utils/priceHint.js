import { BUKET_VARIANTS } from '../data/constants.js';
import { formatRupiah } from './format.js';

export const getBouquetVariant = (value) =>
  BUKET_VARIANTS.find((variant) => variant.value === value) ?? BUKET_VARIANTS[0];

export const getBouquetVariantLabel = (value) => getBouquetVariant(value).label;

export const getSuggestedPrice = (kategori, tambahan) => {
  if (kategori === 'Buket') {
    return getBouquetVariant(tambahan).defaultPrice;
  }

  return null;
};

export const getPriceHint = (kategori, tambahan) => {
  if (kategori === 'Buket') {
    return `Default ${formatRupiah(getBouquetVariant(tambahan).defaultPrice)}`;
  }

  if (kategori === 'Gelang') {
    return 'Rp 10.000';
  }

  if (kategori === 'Headband') {
    return 'Rp 15.000 - 20.000';
  }

  return '';
};
