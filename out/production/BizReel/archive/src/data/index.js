export const COLORS = {
  bg: '#0A0A0F',
  surface: '#13131A',
  card: '#1C1C26',
  border: '#2A2A38',
  accent: '#00E5C3',
  accent2: '#7C5CFF',
  gold: '#F5B731',
  red: '#FF4D6A',
  text: '#F0EFF8',
  muted: '#8A8A9E',
  green: '#3ECF8E',
};

export const REELS = [
  {
    id: 0, biz: 'TechNova KE', emoji: '💻', color: '#7C5CFF', bg: '#2A1F4A',
    badge: 'Tech', title: 'How we built a SaaS tool that hit 10K users in 60 days from Nairobi',
    desc: 'Starting from a small apartment in Westlands, we bootstrapped our way to 10,000 paying customers. Here\'s the exact playbook — no VC, no BS.',
    duration: '4:22', views: '128K', likes: '8.7K', category: 'Tech & Software',
    tags: ['#SaaS', '#NairobiTech', '#Bootstrapped'], liked: false,
  },
  {
    id: 1, biz: 'Maua Florals', emoji: '🌸', color: '#FF4D6A', bg: '#3D1A22',
    badge: 'Retail', title: 'Watch us prep 200 wedding bouquets overnight — the chaos is real',
    desc: 'Every Friday night before a big Saturday wedding we turn into a full production studio. 5 staff, 200 arrangements, zero sleep.',
    duration: '2:47', views: '89K', likes: '5.2K', category: 'Retail & Gifts',
    tags: ['#FlowerShop', '#WeddingBusiness', '#Nairobi'], liked: false,
  },
  {
    id: 2, biz: 'Kodi Finance', emoji: '📊', color: '#378ADD', bg: '#0F1E30',
    badge: 'Finance', title: 'We helped 500 SMEs get loans under 48 hours — here\'s how',
    desc: 'Traditional banks reject 70% of SME applications. We built a fintech that reverses that. Approval rate: 82%.',
    duration: '3:15', views: '210K', likes: '14.1K', category: 'Finance & Banking',
    tags: ['#Fintech', '#SMELoans', '#AfricanFintech'], liked: false,
  },
  {
    id: 3, biz: 'Jikoni Plates', emoji: '🍽️', color: '#F5B731', bg: '#2D2008',
    badge: 'Food', title: 'Street food to Westlands restaurant: our 3-year journey in 90 seconds',
    desc: 'From a mkokoteni cart on Tom Mboya Street to a full sit-down restaurant. We almost quit twice.',
    duration: '1:32', views: '445K', likes: '31K', category: 'Food & Beverage',
    tags: ['#FoodBusiness', '#RestaurantLife', '#Nairobi'], liked: false,
  },
  {
    id: 4, biz: 'Wear Harambee', emoji: '👗', color: '#FF4D6A', bg: '#3D1A22',
    badge: 'Fashion', title: 'Selling 300 Ankara pieces in one Instagram Live — strategy breakdown',
    desc: 'Our record drop: 300 units in under 4 hours on a single live stream. Full setup and hype-building breakdown.',
    duration: '5:03', views: '73K', likes: '4.9K', category: 'Fashion & Apparel',
    tags: ['#AfricanFashion', '#DropStrategy', '#Ankara'], liked: false,
  },
  {
    id: 5, biz: 'GreenGrove Farms', emoji: '🌿', color: '#3ECF8E', bg: '#0F2710',
    badge: 'AgriTech', title: 'How vertical farming in 200 sq ft earns us Ksh 180K monthly',
    desc: 'No land? No problem. Our hydroponic farm in Ruiru supplies 14 Nairobi restaurants weekly.',
    duration: '6:14', views: '318K', likes: '22K', category: 'Agriculture & Health',
    tags: ['#VerticalFarming', '#AgriTech', '#KenyaFarming'], liked: false,
  },
];

export const STORIES = [
  { id: 1, biz: 'TechNova KE', emoji: '💻', bg: '#2A1F4A', seen: false, caption: 'We just crossed 10,000 users! 🎉 Thank you Nairobi.', cta: 'See our growth story', time: 'Just now' },
  { id: 2, biz: 'Maua Florals', emoji: '🌸', bg: '#3D1A22', seen: false, caption: 'Valentine\'s special: 30% off all bouquets this weekend!', cta: 'Order Now', time: '2h ago' },
  { id: 3, biz: 'Kodi Finance', emoji: '📊', bg: '#0F1E30', seen: true, caption: 'New product: Instant business credit up to Ksh 500K.', cta: 'Apply Today', time: '5h ago' },
  { id: 4, biz: 'Jikoni Plates', emoji: '🍽️', bg: '#2D2008', seen: true, caption: 'Sunday special menu is LIVE. Nyama choma + sides = Ksh 850.', cta: 'Reserve a Table', time: '8h ago' },
  { id: 5, biz: 'Wear Harambee', emoji: '👗', bg: '#3D1A22', seen: false, caption: 'New collection drops Friday at 8PM! Set your reminder.', cta: 'Get Notified', time: '12h ago' },
];

export const TRENDING = [
  { name: '#NairobiTech2026', count: '42.3K reels', trend: '+18%' },
  { name: '#SMEGrowth', count: '31.1K reels', trend: '+12%' },
  { name: '#MadeInKenya', count: '28.8K reels', trend: '+9%' },
  { name: '#AfricanFintech', count: '19.4K reels', trend: '+24%' },
  { name: '#FoodBusiness', count: '15.7K reels', trend: '+6%' },
];

export const SUGGESTIONS = [
  { name: 'Savannah Coders', category: 'EdTech', emoji: '🖥️', bg: '#2A1F4A' },
  { name: 'Duka Digital', category: 'E-Commerce', emoji: '🛒', bg: '#2D2008' },
  { name: 'PesakaWallet', category: 'Fintech', emoji: '💳', bg: '#0F1E30' },
];

export const MESSAGES = [
  { avatar: '🏦', name: 'Equity Bank KE', text: 'Interested in financing options for your business…', time: '2m', unread: true },
  { avatar: '🛍️', name: 'Zara KE', text: 'We loved your reel! Can we discuss a collaboration?', time: '14m', unread: true },
  { avatar: '🎓', name: 'Strathmore Biz', text: 'You\'re invited to speak at our Founders Summit…', time: '1h', unread: false },
  { avatar: '💡', name: 'Google for Startups', text: 'Your application has been reviewed…', time: '3h', unread: false },
  { avatar: '📰', name: 'TechCabal', text: 'We\'d like to feature TechNova KE in our next issue…', time: '1d', unread: false },
];
