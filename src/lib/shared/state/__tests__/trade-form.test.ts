import { describe, it, expect } from 'vitest';
import { TradeFormState } from '$lib/shared/state/trade-form.svelte.ts';

describe('TradeFormState', () => {
  it('initializes with empty selections and defaults', () => {
    const form = new TradeFormState();

    expect(form.selectedHave).toEqual([]);
    expect(form.selectedWant).toEqual([]);
    expect(form.expandedHave).toBeNull();
    expect(form.expandedWant).toBeNull();
    expect(form.stock).toBe(1);
    expect(form.offerQuantity).toBe(1);
    expect(form.wantQuantity).toBe(1);
  });

  describe('toggleHave', () => {
    it('adds item in single-select mode (maxSelections=1)', () => {
      const form = new TradeFormState();
      form.maxSelections = 1;

      form.toggleHave(10);
      expect(form.selectedHave).toEqual([10]);
    });

    it('replaces selection in single-select mode', () => {
      const form = new TradeFormState();
      form.maxSelections = 1;
      form.toggleHave(10);

      form.toggleHave(20);
      expect(form.selectedHave).toEqual([20]);
    });

    it('toggles off same item in single-select mode', () => {
      const form = new TradeFormState();
      form.maxSelections = 1;
      form.toggleHave(10);

      form.toggleHave(10);
      expect(form.selectedHave).toEqual([]);
    });

    it('adds multiple items in multi-select mode', () => {
      const form = new TradeFormState();

      form.toggleHave(10);
      form.toggleHave(20);
      expect(form.selectedHave).toEqual([10, 20]);
    });

    it('removes existing item in multi-select mode', () => {
      const form = new TradeFormState();
      form.toggleHave(10);
      form.toggleHave(20);

      form.toggleHave(10);
      expect(form.selectedHave).toEqual([20]);
    });
  });

  describe('toggleWant', () => {
    it('adds item in single-select mode', () => {
      const form = new TradeFormState();
      form.maxSelections = 1;

      form.toggleWant(5);
      expect(form.selectedWant).toEqual([5]);
    });

    it('adds multiple items in multi-select mode', () => {
      const form = new TradeFormState();

      form.toggleWant(1);
      form.toggleWant(2);
      expect(form.selectedWant).toEqual([1, 2]);
    });

    it('toggles off same item in single-select mode', () => {
      const form = new TradeFormState();
      form.maxSelections = 1;
      form.toggleWant(5);

      form.toggleWant(5);
      expect(form.selectedWant).toEqual([]);
    });
  });

  describe('toggleCategory', () => {
    it('toggles have category', () => {
      const form = new TradeFormState();

      form.toggleCategory('have', 'bait');
      expect(form.expandedHave).toBe('bait');

      form.toggleCategory('have', 'bait');
      expect(form.expandedHave).toBeNull();
    });

    it('toggles want category', () => {
      const form = new TradeFormState();

      form.toggleCategory('want', 'rod');
      expect(form.expandedWant).toBe('rod');

      form.toggleCategory('want', 'rod');
      expect(form.expandedWant).toBeNull();
    });

    it('switches category instead of closing when different', () => {
      const form = new TradeFormState();
      form.toggleCategory('have', 'bait');

      form.toggleCategory('have', 'lure');
      expect(form.expandedHave).toBe('lure');
    });
  });

  describe('reset', () => {
    it('clears all state to defaults', () => {
      const form = new TradeFormState();
      form.toggleHave(10);
      form.toggleWant(5);
      form.toggleCategory('have', 'bait');
      form.toggleCategory('want', 'rod');
      form.stock = 5;
      form.offerQuantity = 3;
      form.wantQuantity = 2;

      form.reset();

      expect(form.selectedHave).toEqual([]);
      expect(form.selectedWant).toEqual([]);
      expect(form.expandedHave).toBeNull();
      expect(form.expandedWant).toBeNull();
      expect(form.stock).toBe(1);
      expect(form.offerQuantity).toBe(1);
      expect(form.wantQuantity).toBe(1);
      expect(form.wantStep).toBe(1);
      expect(form.premiumOptions).toBeNull();
    });
  });

  describe('updateWantInputType', () => {
    it('sets step=0.5 for gold', () => {
      const form = new TradeFormState();
      form.updateWantInputType('gold');
      expect(form.wantStep).toBe(0.5);
      expect(form.premiumOptions).toBeNull();
    });

    it('sets premium options for premium item', () => {
      const form = new TradeFormState();
      form.updateWantInputType('premium');
      expect(form.wantStep).toBe(1);
      expect(form.premiumOptions).toEqual([3, 7, 30, 90, 180, 360]);
    });

    it('snapToPremium snaps to nearest option', () => {
      const form = new TradeFormState();
      form.wantQuantity = 15;
      form.premiumOptions = [3, 7, 30, 90, 180, 360];
      form.snapToPremium();
      expect(form.wantQuantity).toBe(7);
    });

    it('snapToPremium does nothing when no options', () => {
      const form = new TradeFormState();
      form.wantQuantity = 15;
      form.snapToPremium();
      expect(form.wantQuantity).toBe(15);
    });

    it('resets to default for normal items', () => {
      const form = new TradeFormState();
      form.updateWantInputType('gold'); // first set gold
      form.updateWantInputType('worm');
      expect(form.wantStep).toBe(1);
      expect(form.premiumOptions).toBeNull();
    });

    it('handles null input as normal item', () => {
      const form = new TradeFormState();
      form.updateWantInputType('gold');
      form.updateWantInputType(null);
      expect(form.wantStep).toBe(1);
      expect(form.premiumOptions).toBeNull();
    });
  });

  describe('wantStep and premiumOptions defaults', () => {
    it('initializes with wantStep=1 and no premium options', () => {
      const form = new TradeFormState();
      expect(form.wantStep).toBe(1);
      expect(form.premiumOptions).toBeNull();
    });
  });
});
