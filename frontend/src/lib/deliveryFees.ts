export interface DeliveryFeeRule {
  area: string;
  fee: number;
  keywords: string[];
}

export const DELIVERY_FEE_RULES: DeliveryFeeRule[] = [
  { area: 'Val De Vie Winelands Lifestyle Estate', fee: 40, keywords: ['val de vie'] },
  { area: 'Pearl Valley Estate', fee: 55, keywords: ['pearl valley estate', 'pearl valley'] },
  { area: 'Pearl Valley / Simondium / Boschendal Wine Estate and Franschhoek', fee: 55, keywords: ['simondium', 'boschendal', 'boshendal', 'franschhoek'] },
  { area: 'Windmeul / Rhebokskloof', fee: 55, keywords: ['windmeul', 'rhebokskloof'] },
  { area: 'Wellington', fee: 55, keywords: ['wellington'] },
  { area: 'Klapmuts', fee: 55, keywords: ['klapmuts'] },
  { area: 'Paarl', fee: 50, keywords: ['paarl'] },
];

export function calculateDeliveryFee(address?: string | null, method: 'delivery' | 'collection' = 'delivery') {
  if (method === 'collection') return { area: 'Collection', fee: 0 };

  const normalizedAddress = (address || '').toLowerCase();
  const match = DELIVERY_FEE_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedAddress.includes(keyword)),
  );

  return match ? { area: match.area, fee: match.fee } : { area: 'Delivery Area To Confirm', fee: 0 };
}

export function formatDeliveryFeeOptions() {
  return DELIVERY_FEE_RULES.map((rule) => `${rule.area} — R${rule.fee}`).join('\n');
}