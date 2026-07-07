export type UserProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  favoriteSector: string | null;
  investorGoal: string | null;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  favoriteSector: string;
  investorGoal: string;
};

export type ProfileUpdateInput = {
  username?: string | null;
  displayName?: string | null;
  bio?: string | null;
  favoriteSector?: string | null;
  investorGoal?: string | null;
  avatarPath?: string | null;
};

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  favorite_sector: string | null;
  investor_goal: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};
