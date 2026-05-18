export type UserPattern = {
  favoriteCategory: string;
  activeLevel: 'low' | 'medium' | 'high';
  greeting: string;
  suggestion: string;
  insights: string[];
  trendingInCategory: boolean;
  userNeeds: string[];
  sentiment: 'positive' | 'neutral' | 'struggling';
  strategicRole: 'Startup' | 'Corporate' | 'ScaleUp';
  mentorAdvice: string;
  securityStatus: 'secure' | 'vulnerable';
  setupProgress: number;
  isNewUser: boolean;
};
