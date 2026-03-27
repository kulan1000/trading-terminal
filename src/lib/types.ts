export type Asset = "Gold" | "Silver" | "Oil";
export type Direction = "bullish" | "bearish" | "neutral";
export type Strength = "strong" | "medium" | "weak";

// Shared across signal-feed, message-list, discord components
export interface DiscordMessage {
  id: number;
  author: string;
  content: string;
  channel: string;
  timestamp: string;
  processed: boolean;
}

export type Position = "long" | "short";
export type SignalType = "entry" | "position" | "exited" | "opinion";

// Signal tag attached to a message
export interface SignalTag {
  asset: Asset;
  direction: Direction;
  strength?: Strength;
  signal_type?: SignalType;
  position?: Position | null;
  interpretation?: string;
}

// Signal Feed message with matched commodity tags
export interface FeedMessage extends DiscordMessage {
  assets: SignalTag[];
}

export interface Database {
  public: {
    Tables: {
      discord_messages: {
        Row: {
          id: number;
          discord_message_id: string;
          channel: string;
          author: string;
          content: string;
          timestamp: string;
          processed: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["discord_messages"]["Row"],
          "id" | "created_at" | "processed"
        >;
      };
      signals: {
        Row: {
          id: number;
          message_id: number;
          asset: Asset;
          direction: Direction;
          confidence: number;
          strength: Strength;
          interpretation: string | null;
          model_used: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["signals"]["Row"],
          "id" | "created_at" | "model_used"
        >;
      };
      signal_outcomes: {
        Row: {
          id: number;
          signal_id: number;
          entry_price: number | null;
          outcome_price: number | null;
          pnl: number | null;
          resolved_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["signal_outcomes"]["Row"],
          "id"
        >;
      };
      user_credibility: {
        Row: {
          id: number;
          discord_user: string;
          total_signals: number;
          correct_signals: number;
          score: number;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_credibility"]["Row"],
          "id" | "updated_at" | "total_signals" | "correct_signals" | "score"
        >;
      };
    };
  };
}
