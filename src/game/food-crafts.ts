/**
 * Food crafts (Nahrungsgebäude): exactly these four bought buildings count wherever the *number of food
 * buildings* matters for money — wedding rhythm and dowries (weddings.ts), taxable population (economy.ts).
 * Mirrored by DB village_tax_pop and village_wedding_list. Market hall and guild hall are NOT food crafts;
 * the broader care-gate supply list (CARE_FOOD in world.ts) is a separate category and stays as it is.
 */
export const FOOD_CRAFTS = ["fisher", "hunter", "granary", "dairy"] as const;
export const countFoodCrafts = (own: Set<string>) => FOOD_CRAFTS.filter((i) => own.has(i)).length;
