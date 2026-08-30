import { StoreDiscoveryHeader } from "@/components/shared/store-discovery-header";

export function StoreHeader() {
  return (
    <StoreDiscoveryHeader
      search=""
      categorySlug=""
      sort="newest"
      displayTone="MIST"
      navigation={null}
    />
  );
}
