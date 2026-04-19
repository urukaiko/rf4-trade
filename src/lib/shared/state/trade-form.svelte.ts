export class TradeFormState {
  selectedHave = $state<number[]>([]);
  selectedWant = $state<number[]>([]);
  expandedHave = $state<string | null>(null);
  expandedWant = $state<string | null>(null);
  stock = $state(1);
  offerQuantity = $state(1);
  wantQuantity = $state(1);
  maxSelections = $state<number>(Infinity);

  /** Step for want quantity input. 0.5 for gold, 1 for normal items. */
  wantStep = $state(1);
  /** Premium duration options when want item is premium. Null = normal numeric input. */
  premiumOptions = $state<number[] | null>(null);

  toggleHave(id: number) {
    if (this.maxSelections === 1) {
      this.selectedHave = this.selectedHave[0] === id ? [] : [id];
    } else {
      const idx = this.selectedHave.indexOf(id);
      if (idx === -1) this.selectedHave = [...this.selectedHave, id];
      else this.selectedHave = this.selectedHave.filter((i) => i !== id);
    }
  }

  toggleWant(id: number) {
    if (this.maxSelections === 1) {
      this.selectedWant = this.selectedWant[0] === id ? [] : [id];
    } else {
      const idx = this.selectedWant.indexOf(id);
      if (idx === -1) this.selectedWant = [...this.selectedWant, id];
      else this.selectedWant = this.selectedWant.filter((i) => i !== id);
    }
  }

  toggleCategory(side: 'have' | 'want', category: string) {
    if (side === 'have') {
      this.expandedHave = this.expandedHave === category ? null : category;
    } else {
      this.expandedWant = this.expandedWant === category ? null : category;
    }
  }

  /** Update want quantity input type based on selected want item. */
  updateWantInputType(itemCode: string | null) {
    if (itemCode === 'gold') {
      this.wantStep = 0.5;
      this.premiumOptions = null;
    } else if (itemCode === 'premium') {
      this.wantStep = 1;
      this.premiumOptions = [3, 7, 30, 90, 180, 360];
    } else {
      this.wantStep = 1;
      this.premiumOptions = null;
    }
  }

  /** Snap want quantity to nearest premium option. Call separately (not inside $effect). */
  snapToPremium() {
    if (!this.premiumOptions) return;
    const current = this.wantQuantity;
    const nearest = this.premiumOptions.reduce((a, b) => Math.abs(b - current) < Math.abs(a - current) ? b : a);
    this.wantQuantity = nearest;
  }

  reset() {
    this.selectedHave = [];
    this.selectedWant = [];
    this.expandedHave = null;
    this.expandedWant = null;
    this.stock = 1;
    this.offerQuantity = 1;
    this.wantQuantity = 1;
    this.wantStep = 1;
    this.premiumOptions = null;
  }
}
