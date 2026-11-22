import { CountryUserActivity, DotMapLocation, MetricStat } from "./types";

export const activeUserLocations: DotMapLocation[] = [
  { country: "EG", id: "cai", lat: 30.04, lon: 31.24, name: "Cairo", value: 4320 },
  { country: "SA", id: "ruh", lat: 24.71, lon: 46.68, name: "Riyadh", value: 3150 },
  { country: "AE", id: "dxb", lat: 25.20, lon: 55.27, name: "Dubai", value: 2480 },
  { country: "US", id: "nyc", lat: 40.71, lon: -74.01, name: "New York", value: 3460 },
  { country: "US", id: "sfo", lat: 37.77, lon: -122.42, name: "San Francisco", value: 2840 },
  { country: "GB", id: "lon", lat: 51.51, lon: -0.13, name: "London", value: 2970 },
  { country: "DE", id: "ber", lat: 52.52, lon: 13.4, name: "Berlin", value: 2190 },
  { country: "IN", id: "blr", lat: 12.97, lon: 77.59, name: "Bengaluru", value: 3740 },
  { country: "SG", id: "sin", lat: 1.35, lon: 103.82, name: "Singapore", value: 1420 },
  { country: "JP", id: "tyo", lat: 35.68, lon: 139.69, name: "Tokyo", value: 1980 },
  { country: "AU", id: "syd", lat: -33.87, lon: 151.21, name: "Sydney", value: 1120 },
  { country: "BR", id: "gru", lat: -23.55, lon: -46.63, name: "São Paulo", value: 1150 },
];

export const initialActiveCountries: CountryUserActivity[] = [
  { id: "eg", country: "Egypt", countryCode: "EG", city: "Cairo", lat: 30.0444, lng: 31.2357, users: 4320, color: "#10B981" },
  { id: "sa", country: "Saudi Arabia", countryCode: "SA", city: "Riyadh", lat: 24.7136, lng: 46.6753, users: 3150, color: "#10B981" },
  { id: "ae", country: "United Arab Emirates", countryCode: "AE", city: "Dubai", lat: 25.2048, lng: 55.2708, users: 2480, color: "#06B6D4" },
  { id: "us", country: "United States", countryCode: "US", city: "New York / SF", lat: 39.8283, lng: -98.5795, users: 5820, color: "#3B82F6" },
  { id: "de", country: "Germany", countryCode: "DE", city: "Berlin", lat: 52.52, lng: 13.405, users: 2190, color: "#3B82F6" },
  { id: "gb", country: "United Kingdom", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278, users: 2640, color: "#3B82F6" },
  { id: "in", country: "India", countryCode: "IN", city: "Bengaluru", lat: 12.9716, lng: 77.5946, users: 3740, color: "#F59E0B" },
  { id: "sg", country: "Singapore", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198, users: 1420, color: "#06B6D4" },
  { id: "jp", country: "Japan", countryCode: "JP", city: "Tokyo", lat: 35.6762, lng: 139.6503, users: 1980, color: "#EC4899" },
  { id: "br", country: "Brazil", countryCode: "BR", city: "São Paulo", lat: -23.5505, lng: -46.6333, users: 1150, color: "#8B5CF6" },
];

export const overviewMetrics: MetricStat[] = [
  { title: "Total Users", value: "148,290", change: "+14.2%", trend: "up", description: "vs. previous month" },
  { title: "Active Now", value: "28,890", change: "+8.7%", trend: "up", description: "across 10 global regions" },
  { title: "Avg. Session Time", value: "4m 32s", change: "+12.1%", trend: "up", description: "steady engagement" },
  { title: "Bounce Rate", value: "24.6%", change: "-3.4%", trend: "down", description: "lower is better" },
];
