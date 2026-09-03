export const RECHARGE_PARTNERS = [
  {
    id: "STARTSELECT",
    name: "Startselect",
    url: "https://startselect.com/ie-en/paysafecard-classic-100-eur/72506",
    iconUrl: "/images/partners/startselect.png",
  },
  {
    id: "DUNDLE",
    name: "Dundle",
    url: "https://dundle.com/ie/paysafecard/",
    iconUrl: "/images/partners/dundle.png",
  },
  {
    id: "RECHARGE_COM",
    name: "Recharge.com",
    url: "https://www.recharge.com/en/ie/paysafeca",
    iconUrl: "/images/partners/recharge-com.ico",
  },
  {
    id: "VIDAPLAYER",
    name: "VidaPlayer",
    url: "https://www.vidaplayer.com/en/product/prepaid-card-paysafecard-ireland/50-eur-paysafecard?currency=EUR&gad_source=1&gad_campaignid=22490828365&gbraid=0AAAAAq6eBdIM_YA18POxtb4xomzX0l6Vn&gclid=EAIaIQobChMIjJbEpJKXlgMVTJ1QBh2M2wHQEAQYAyABEgLx-PD_BwE",
    iconUrl: "/images/partners/vidaplayer.ico",
  },
] as const;

export type RechargePartnerId = (typeof RECHARGE_PARTNERS)[number]["id"];

export function isRechargePartnerId(value: string): value is RechargePartnerId {
  return RECHARGE_PARTNERS.some((partner) => partner.id === value);
}
