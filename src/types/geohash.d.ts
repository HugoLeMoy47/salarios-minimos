declare module 'geohash' {
  function encode(lat: number, lon: number, precision?: number): string;
  function decode(hash: string): { latitude: number[]; longitude: number[] };
  function neighbor(hash: string, direction: string): string;
  function decode_bbox(hash: string): number[];
}
