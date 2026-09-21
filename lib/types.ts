export type Theme = {
  id: string;
  month_label: string;
  title: string;
  subtitle: string | null;
  active: boolean;
};

export type Meeting = {
  id: string;
  meeting_date: string;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  published: boolean;
  created_at: string;
};

export type MeetingBlock = {
  id: string;
  meeting_id: string;
  type: string;
  title: string;
  content: string | null;
  sort_order: number;
  enabled: boolean;
  metadata: Record<string, unknown>;
};

export type Plan = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  price_cents: number;
  signup_url: string | null;
  image_url: string | null;
  published: boolean;
};

export type Challenge = {
  id: string;
  meeting_id: string | null;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  published: boolean;
};

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  published: boolean;
};

export type Poll = {
  id: string;
  meeting_id: string;
  title: string;
  question: string;
  active: boolean;
};

export type PollOption = {
  id: string;
  poll_id: string;
  emoji: string;
  label: string;
  sort_order: number;
};

export type Question = {
  id: string;
  meeting_id: string | null;
  anonymous_id: string;
  body: string;
  status: "pending" | "visible" | "featured" | "answered" | "hidden";
  created_at: string;
};

export type Petition = {
  id: string;
  meeting_id: string | null;
  anonymous_id: string;
  body: string;
  status: "visible" | "hidden";
  created_at: string;
};

export type DinnerTask = {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  sort_order: number;
};

export type DinnerAssignment = {
  id: string;
  meeting_id: string;
  participant_name: string;
  task_id: string;
  assigned_at: string;
};

export type ThinkGlaoSession = {
  id: string;
  meeting_id: string;
  speaker_name: string;
  duration_seconds: number;
  starts_at: string | null;
  ends_at: string | null;
  status: "scheduled" | "live" | "paused" | "finished";
  question_count: number;
};

export interface Devotional {
  id: string;
  meeting_id?: string;
  day_number: number; // 1 a 5
  title: string;
  passage_reference?: string;
  content: string;
  published: boolean;
  created_at?: string;
}

export interface ResourceItem {
  id: string;
  meeting_id?: string;
  type: "slides" | "song" | "book" | "podcast";
  title: string;
  url: string;
  description?: string;
  created_at?: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  body: string;
  prayer_count: number;
  created_at: string;
}