export interface SearchResult {
  id: string;
  entity_type: 'business' | 'reel' | 'product' | 'sector';
  title: string;
  subtitle: string;
  image_url: string;
  metadata?: any;
}

export interface MarketTrend {
  label: string;
  trend_type: string;
  count_val: number;
  metadata: any;
}

export interface ISearchRepository {
  globalSearch(term: string): Promise<SearchResult[]>;
  getTrends(): Promise<MarketTrend[]>;
}
