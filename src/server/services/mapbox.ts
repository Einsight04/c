import mbxTilesets from "@mapbox/mapbox-sdk/services/tilesets";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { env } from "~/env";

const geocodingService = mbxGeocoding({
  accessToken: env.NEXT_PUBLIC_MAPBOX_API_KEY,
});

geocodingService.forwardGeocode({
  query: { lng: -122.42, lat: 37.78 },
});
