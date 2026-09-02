export const RECHARGE_PARTNERS = [
  {
    id: "STARTSELECT",
    name: "Startselect",
    url: "https://startselect.com/ie-en/paysafecard-classic-100-eur/72506",
    iconUrl:
      "https://cdn.startselect.com/images/apple-icon-2024-144x144.png?v=2",
  },
  {
    id: "DUNDLE",
    name: "Dundle",
    url: "https://dundle.com/ie/paysafecard/",
    iconUrl: "https://dundle.com/icon3.png?icon3.4253ndbjg8rgv.png",
  },
  {
    id: "RECHARGE_COM",
    name: "Recharge.com",
    url: "https://www.recharge.com/en/ie/paysafeca",
    iconUrl: "https://company.recharge.com/favicon.ico",
  },
  {
    id: "VIDAPLAYER",
    name: "VidaPlayer",
    url: "https://www.vidaplayer.com/en/product/prepaid-card-paysafecard-ireland/50-eur-paysafecard?currency=EUR&gad_source=1&gad_campaignid=22490828365&gbraid=0AAAAAq6eBdIM_YA18POxtb4xomzX0l6Vn&gclid=EAIaIQobChMIjJbEpJKXlgMVTJ1QBh2M2wHQEAQYAyABEgLx-PD_BwE",
    iconUrl: "https://www.vidaplayer.com/favicon.ico",
  },
] as const;

export type RechargePartnerId = (typeof RECHARGE_PARTNERS)[number]["id"];

export function isRechargePartnerId(value: string): value is RechargePartnerId {
  return RECHARGE_PARTNERS.some((partner) => partner.id === value);
}
