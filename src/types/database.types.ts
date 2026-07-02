/**
 * Types de la base de données.
 * Version écrite à la main pour démarrer. Pour la régénérer automatiquement
 * depuis ton vrai schéma Supabase :
 *   npx supabase login
 *   npx supabase link --project-ref <ton-ref>
 *   npm run db:types
 *
 * NB : chaque table/vue DOIT exposer `Relationships` (et le schéma `CompositeTypes`)
 * pour satisfaire la contrainte de type de @supabase/supabase-js ≥ 2.45 — sinon
 * les requêtes retombent sur un schéma par défaut et renvoient le type `never`.
 */

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; avatar_url: string | null; created_at: string };
        Insert: { id: string; display_name?: string; avatar_url?: string | null };
        Update: { display_name?: string; avatar_url?: string | null };
        Relationships: [];
      };
      pools: {
        Row: {
          id: string;
          name: string;
          season: string;
          buy_in_cents: number;
          points_exact: number;
          points_outcome: number;
          join_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: { name: string; owner_id: string; season?: string; buy_in_cents?: number };
        Update: { name?: string; buy_in_cents?: number; points_exact?: number; points_outcome?: number };
        Relationships: [
          {
            foreignKeyName: "pools_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pool_members: {
        Row: {
          pool_id: string;
          user_id: string;
          is_admin: boolean;
          has_paid: boolean;
          bonus_validated: boolean;
          joined_at: string;
        };
        Insert: { pool_id: string; user_id: string; is_admin?: boolean; has_paid?: boolean };
        Update: { is_admin?: boolean; has_paid?: boolean; bonus_validated?: boolean };
        Relationships: [
          {
            foreignKeyName: "pool_members_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pool_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          pool_id: string;
          match_no: number;
          stage: string;
          group_label: string | null;
          kickoff: string;
          venue: string | null;
          team_a: string;
          team_a_code: string | null;
          team_b: string;
          team_b_code: string | null;
          score_a: number | null;
          score_b: number | null;
          status: string;
          manual: boolean;
          qualified: string | null;
          final_a: number | null;
          final_b: number | null;
          pens_a: number | null;
          pens_b: number | null;
          created_at: string;
        };
        Insert: {
          pool_id: string;
          match_no: number;
          kickoff: string;
          team_a: string;
          team_b: string;
          stage?: string;
          group_label?: string | null;
          venue?: string | null;
          team_a_code?: string | null;
          team_b_code?: string | null;
          manual?: boolean;
          qualified?: string | null;
          final_a?: number | null;
          final_b?: number | null;
          pens_a?: number | null;
          pens_b?: number | null;
        };
        Update: {
          score_a?: number | null;
          score_b?: number | null;
          status?: string;
          kickoff?: string;
          manual?: boolean;
          qualified?: string | null;
          final_a?: number | null;
          final_b?: number | null;
          pens_a?: number | null;
          pens_b?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      bonus_answers: {
        Row: { pool_id: string; user_id: string; question_key: string; answer: string; created_at: string };
        Insert: { pool_id: string; user_id: string; question_key: string; answer: string };
        Update: { answer?: string };
        Relationships: [];
      };
      bonus_results: {
        Row: { pool_id: string; question_key: string; answer: string };
        Insert: { pool_id: string; question_key: string; answer: string };
        Update: { answer?: string };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          pred_a: number;
          pred_b: number;
          joker: boolean;
          pred_qualifier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { match_id: string; user_id: string; pred_a: number; pred_b: number; joker?: boolean; pred_qualifier?: string | null };
        Update: { pred_a?: number; pred_b?: number; joker?: boolean; pred_qualifier?: string | null };
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_leaderboard: {
        Row: {
          pool_id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          total_points: number;
          qualif_points: number;
          exact_count: number;
          correct_count: number;
          qualif_count: number;
          played_count: number;
        };
        Relationships: [];
      };
      v_prediction_scores: {
        Row: {
          prediction_id: string;
          pool_id: string;
          user_id: string;
          match_id: string;
          match_no: number;
          pred_a: number;
          pred_b: number;
          score_a: number | null;
          score_b: number | null;
          status: string;
          points: number;
          qualif_points: number;
          is_correct: boolean;
          is_exact: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      join_pool: { Args: { p_code: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
