export type Asset = "Gold" | "Silver" | "Oil";
export type Direction = "bullish" | "bearish" | "neutral";

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
