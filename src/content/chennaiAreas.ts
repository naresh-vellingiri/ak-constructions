/**
 * Chennai localities offered as suggestions in the plot-location field when
 * Google Places is unavailable (no API key yet, quota used up, or the request
 * failed). The field always accepts any typed text, so this only saves typing.
 *
 * This is NOT a statement of where AK builds; that claim is
 * `clientConfig.serviceAreas`. These are just common place names.
 */
export const CHENNAI_AREAS: string[] = [
  "Adyar", "Alandur", "Ambattur", "Anna Nagar", "Arumbakkam", "Ashok Nagar",
  "Avadi", "Besant Nagar", "Chetpet", "Chromepet", "Egmore", "Guduvanchery",
  "Guindy", "Injambakkam", "K.K. Nagar", "Kelambakkam", "Kilpauk", "Kodambakkam",
  "Kolathur", "Kotturpuram", "Kovilambakkam", "Karapakkam", "Madambakkam",
  "Madhavaram", "Madipakkam", "Mambalam", "Manapakkam", "Medavakkam", "Mogappair",
  "Mugalivakkam", "Mylapore", "Navalur", "Neelankarai", "Nungambakkam",
  "Pallavaram", "Pallikaranai", "Perambur", "Perumbakkam", "Perungudi",
  "Poonamallee", "Porur", "Ramapuram", "Royapettah", "Saidapet", "Selaiyur",
  "Sembakkam", "Sholinganallur", "Siruseri", "T. Nagar", "Tambaram",
  "Thiruvanmiyur", "Thoraipakkam", "Urapakkam", "Vadapalani", "Valasaravakkam",
  "Velachery", "Villivakkam", "Virugambakkam", "West Mambalam",
];

/**
 * Towns around Chennai that plot buyers commonly mention. Listed separately
 * because they are suggested as "<town>, Tamil Nadu", not "<town>, Chennai".
 */
export const NEARBY_TOWNS: string[] = [
  "Chengalpattu", "Kanchipuram", "Mahabalipuram", "Maraimalai Nagar",
  "Ponneri", "Sriperumbudur", "Thiruvallur",
];
