import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePricing,
  roundUpTo,
  sumShoppingList,
} from '../shared/pricing.js';

test('menghitung buket memakai aturan tanpa pembulatan antara', () => {
  const result = calculatePricing({
    materialCost: 9121,
    yieldQty: 1,
    packagingCost: 0,
    marginPercent: 48,
  });

  assert.equal(result.laborCost, 1824.2);
  assert.equal(result.overheadCost, 912.1);
  assert.equal(result.hppTotal, 11857.3);
  assert.equal(result.hppPerUnit, 11857.3);
  assert.equal(result.sellingPriceRaw, 17548.804);
  assert.equal(result.sellingPriceFinal, 18000);
  assert.equal(result.bepRatio, 0.506722);
});

test('menghitung gelang per unit dari produksi batch', () => {
  const result = calculatePricing({
    materialCost: 114000,
    yieldQty: 50,
    packagingCost: 500,
    marginPercent: 185,
  });

  assert.equal(result.hppTotal, 148200);
  assert.equal(result.hppPerUnit, 2964);
  assert.equal(result.modalPerUnit, 3464);
  assert.equal(result.sellingPriceRaw, 9872.4);
  assert.equal(result.sellingPriceFinal, 10000);
  assert.equal(result.bepRatio, 0.228);
});

test('membulatkan harga jual ke atas sesuai kelipatan', () => {
  assert.equal(roundUpTo(17548.804), 18000);
  assert.equal(roundUpTo(17000, 1000), 17000);
  assert.equal(roundUpTo(1001, 500), 1500);
});

test('menjumlahkan daftar belanja', () => {
  assert.equal(
    sumShoppingList([
      { qty: 2, hargaSatuan: 5000 },
      { qty: 1.5, hargaSatuan: 10000 },
    ]),
    25000
  );
});
