/**
 * Unit tests for TradeCard slider proportional math.
 * Tests: slider range, step, proportional scaling, stock cap.
 */
import { describe, it, expect } from 'vitest';

interface SliderParams {
  baseWantQty: number;
  stock: number;
  offerQty: number;
  wantCode: string | undefined;
}

interface SliderResult {
  min: number;
  max: number;
  step: number;
}

function computeSliderParams(params: SliderParams): SliderResult {
  const { baseWantQty, stock, offerQty, wantCode } = params;
  const ratio = baseWantQty / offerQty;
  const min = baseWantQty;
  const max = stock * ratio;
  const step = wantCode === 'gold' ? 0.5 : 1;
  return { min, max, step };
}

describe('Slider Proportional Math', () => {
  describe('Basic range', () => {
    it('min equals base wantQuantity', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 50,
        offerQty: 10,
        wantCode: undefined,
      });
      expect(result.min).toBe(1);
    });

    it('max equals stock * ratio', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 100,
        offerQty: 10,
        wantCode: undefined,
      });
      // ratio = 1/10 = 0.1
      // max = 100 * 0.1 = 10
      expect(result.max).toBe(10);
    });

    it('handles 10 Worms ↔ 1 Gold, stock 100', () => {
      // Trade: 10 Worms for 1 Gold, seller has 100 Worms
      // ratio = 1/10 = 0.1
      // max slider = 100 * 0.1 = 10 Gold
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 100,
        offerQty: 10,
        wantCode: 'gold',
      });
      expect(result.min).toBe(1);
      expect(result.max).toBe(10);
      expect(result.step).toBe(0.5);
    });
  });

  describe('Step value', () => {
    it('step=0.5 when wantItem is gold', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 10,
        offerQty: 1,
        wantCode: 'gold',
      });
      expect(result.step).toBe(0.5);
    });

    it('step=1 for normal items', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 10,
        offerQty: 1,
        wantCode: 'worm',
      });
      expect(result.step).toBe(1);
    });

    it('step=1 for premium', () => {
      const result = computeSliderParams({
        baseWantQty: 30,
        stock: 10,
        offerQty: 1,
        wantCode: 'premium',
      });
      expect(result.step).toBe(1);
    });
  });

  describe('Proportional offer scaling', () => {
    it('implied offer = sliderValue / ratio', () => {
      const baseWantQty = 1;
      const offerQty = 10;
      const stock = 100;
      const ratio = baseWantQty / offerQty; // 0.1
      const max = stock * ratio; // 10

      // At slider max (10 Gold): implied offer = 10 / 0.1 = 100 Worms
      const impliedOfferAtMax = max / ratio;
      expect(impliedOfferAtMax).toBe(100);

      // At slider midpoint (5.5 Gold): implied offer = 5.5 / 0.1 = 55 Worms
      const midSlider = (baseWantQty + max) / 2;
      const impliedOfferAtMid = midSlider / ratio;
      expect(impliedOfferAtMid).toBe(55);
    });

    it('at min slider, implied offer = base offer quantity', () => {
      const baseWantQty = 1;
      const offerQty = 10;
      const ratio = baseWantQty / offerQty;

      const impliedOffer = baseWantQty / ratio;
      expect(impliedOffer).toBe(10);
    });
  });

  describe('Edge cases', () => {
    it('handles equal offer and want quantities', () => {
      const result = computeSliderParams({
        baseWantQty: 5,
        stock: 20,
        offerQty: 5,
        wantCode: undefined,
      });
      // ratio = 1, max = 20
      expect(result.min).toBe(5);
      expect(result.max).toBe(20);
    });

    it('handles large offer quantities', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 50,
        offerQty: 100,
        wantCode: undefined,
      });
      // ratio = 0.01, max = 0.5
      expect(result.max).toBe(0.5);
    });

    it('handles zero offer quantity gracefully (Infinity max)', () => {
      const result = computeSliderParams({
        baseWantQty: 1,
        stock: 50,
        offerQty: 0,
        wantCode: undefined,
      });
      expect(result.max).toBe(Infinity);
    });
  });
});
