declare module 'geohash' {
  export const GeoHash: {
    encodeGeoHash(latitude: number, longitude: number): string;
    decodeGeoHash(hash: string): { latitude: number[]; longitude: number[] };
    calculateAdjacent(srcHash: string, dir: string): string;
  };
}
