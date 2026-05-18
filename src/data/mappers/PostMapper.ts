import { Post } from '../../domain/models';

export class PostMapper {
  static toDomain(raw: any): Post {
    return {
      id: raw.id,
      user_id: raw.user_id,
      video_url: raw.video_url,
      caption: raw.caption,
      category: raw.category,
      views: raw.views || 0,
      shares: raw.shares || 0,
      is_sponsored: raw.is_sponsored || false,
      created_at: raw.created_at,
      profiles: raw.profiles ? {
        id: raw.profiles.id,
        username: raw.profiles.username,
        business_name: raw.profiles.business_name,
        avatar_url: raw.profiles.avatar_url,
      } : undefined,
      likes: raw.likes || [],
      comments: raw.comments || [],
    };
  }

  static toDomainList(rawList: any[]): Post[] {
    return rawList.map(item => this.toDomain(item));
  }
}
