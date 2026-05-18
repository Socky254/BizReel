import { Profile } from '../../domain/models';

export class ProfileMapper {
  static toDomain(raw: any): Profile {
    return {
      id: raw.id,
      username: raw.username,
      business_name: raw.business_name,
      category: raw.category,
      bio: raw.bio,
      website: raw.website,
      location: raw.location,
      phone: raw.phone,
      working_hours: raw.working_hours,
      avatar_url: raw.avatar_url,
      push_token: raw.push_token,
      mfa_enabled: raw.mfa_enabled,
      is_verified: raw.is_verified,
      is_live: raw.is_live,
      is_private: raw.is_private,
      allow_downloads: raw.allow_downloads,
      show_active_status: raw.show_active_status,
      dm_setting: raw.dm_setting,
      updated_at: raw.updated_at,
      created_at: raw.created_at,
    };
  }
}
