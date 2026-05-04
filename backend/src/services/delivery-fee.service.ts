export interface DeliveryFeeMatch {
  area: string;
  fee: number;
  matchedKeyword?: string;
}

export const DELIVERY_FEE_RULES: DeliveryFeeMatch[] = [
  { area: 'Val De Vie Winelands Lifestyle Estate', fee: 40, matchedKeyword: 'val de vie' },
  { area: 'Pearl Valley Estate', fee: 55, matchedKeyword: 'pearl valley estate' },
  { area: 'Pearl Valley', fee: 55, matchedKeyword: 'pearl valley' },
  { area: 'Simondium', fee: 55, matchedKeyword: 'simondium' },
  { area: 'Boschendal Wine Estate', fee: 55, matchedKeyword: 'boschendal' },
  { area: 'Boshendal Wine Estate', fee: 55, matchedKeyword: 'boshendal' },
  { area: 'Franschhoek', fee: 55, matchedKeyword: 'franschhoek' },
  { area: 'Windmeul', fee: 55, matchedKeyword: 'windmeul' },
  { area: 'Rhebokskloof', fee: 55, matchedKeyword: 'rhebokskloof' },
  { area: 'Wellington', fee: 55, matchedKeyword: 'wellington' },
  { area: 'Klapmuts', fee: 55, matchedKeyword: 'klapmuts' },
  { area: 'Paarl', fee: 50, matchedKeyword: 'paarl' },
];

export class DeliveryFeeService {
  calculate(address?: string | null, deliveryMethod: 'delivery' | 'collection' = 'delivery'): DeliveryFeeMatch {
    if (deliveryMethod === 'collection') {
      return { area: 'Collection', fee: 0 };
    }

    const normalizedAddress = (address || '').toLowerCase();
    const matchedRule = DELIVERY_FEE_RULES.find((rule) =>
      normalizedAddress.includes((rule.matchedKeyword || rule.area).toLowerCase()),
    );

    return matchedRule || { area: 'Delivery Area To Confirm', fee: 0 };
  }
}

export const deliveryFeeService = new DeliveryFeeService();