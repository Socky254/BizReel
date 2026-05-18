import { ISearchRepository, SearchResult, MarketTrend } from '../../domain/repositories/ISearchRepository';
import { supabase } from '../../core/network/supabase';

export class SearchRepositoryImpl implements ISearchRepository {
  async globalSearch(term: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('global_search', { search_term: term });
      if (error) throw error;
      return (data || []) as SearchResult[];
    } catch (e) {
      console.error("SearchRepo Error (globalSearch):", e);
      return [];
    }
  }

  async getTrends(): Promise<MarketTrend[]> {
    try {
      const { data, error } = await supabase.rpc('get_market_trends');
      if (error) throw error;
      return (data || []) as MarketTrend[];
    } catch (e) {
      console.error("SearchRepo Error (getTrends):", e);
      return [];
    }
  }
}
