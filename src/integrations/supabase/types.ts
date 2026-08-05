export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          code: string
          created_at: string
          ends_on: string
          id: string
          name: string
          starts_on: string
          status: Database["public"]["Enums"]["academic_period_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          ends_on: string
          id?: string
          name: string
          starts_on: string
          status?: Database["public"]["Enums"]["academic_period_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          ends_on?: string
          id?: string
          name?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["academic_period_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          points: number
          position: number
          question_id: string
          question_version_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          points?: number
          position?: number
          question_id: string
          question_version_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          points?: number
          position?: number
          question_id?: string
          question_version_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_question_version_id_fkey"
            columns: ["question_version_id"]
            isOneToOne: false
            referencedRelation: "question_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_snapshots: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          question_count: number
          tenant_id: string
          total_points: number
          updated_at: string
          version: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload: Json
          question_count?: number
          tenant_id: string
          total_points?: number
          updated_at?: string
          version: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          question_count?: number
          tenant_id?: string
          total_points?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_snapshots_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          duration_minutes: number
          id: string
          passing_score: number
          published_at: string | null
          published_version: number
          randomize_choices: boolean
          randomize_questions: boolean
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          duration_minutes?: number
          id?: string
          passing_score?: number
          published_at?: string | null
          published_version?: number
          randomize_choices?: boolean
          randomize_questions?: boolean
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          duration_minutes?: number
          id?: string
          passing_score?: number
          published_at?: string | null
          published_version?: number
          randomize_choices?: boolean
          randomize_questions?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          audio_plays: number
          created_at: string
          flagged: boolean
          id: string
          question_id: string
          question_version_id: string
          selected_choice_ids: Json
          tenant_id: string
          text_answer: string | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          audio_plays?: number
          created_at?: string
          flagged?: boolean
          id?: string
          question_id: string
          question_version_id: string
          selected_choice_ids?: Json
          tenant_id: string
          text_answer?: string | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          audio_plays?: number
          created_at?: string
          flagged?: boolean
          id?: string
          question_id?: string
          question_version_id?: string
          selected_choice_ids?: Json
          tenant_id?: string
          text_answer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note: string | null
          target_type: Database["public"]["Enums"]["learning_target"]
          tenant_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note?: string | null
          target_type: Database["public"]["Enums"]["learning_target"]
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note?: string | null
          target_type?: Database["public"]["Enums"]["learning_target"]
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "lesson_units"
            referencedColumns: ["id"]
          },
        ]
      }
      continue_learning: {
        Row: {
          course_id: string
          created_at: string
          id: string
          last_position: number
          lesson_id: string
          module_id: string
          opened_at: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_position?: number
          lesson_id: string
          module_id: string
          opened_at?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          last_position?: number
          lesson_id?: string
          module_id?: string
          opened_at?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "continue_learning_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continue_learning_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continue_learning_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continue_learning_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continue_learning_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "lesson_units"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          audio_url: string | null
          blocks: Json
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          id: string
          published_at: string | null
          situation: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          situation?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          situation?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          level: string | null
          position: number
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          level?: string | null
          position?: number
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          level?: string | null
          position?: number
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_notes: {
        Row: {
          blocks: Json
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          id: string
          published_at: string | null
          region: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          region?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          region?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_on: string | null
          created_at: string
          enrolled_on: string
          id: string
          period_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_profile_id: string
          study_group_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_on?: string | null
          created_at?: string
          enrolled_on?: string
          id?: string
          period_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_profile_id: string
          study_group_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_on?: string | null
          created_at?: string
          enrolled_on?: string
          id?: string
          period_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_profile_id?: string
          study_group_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eps_references: {
        Row: {
          blocks: Json
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          id: string
          published_at: string | null
          reference_code: string | null
          slug: string
          source_year: number | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug: string
          source_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug?: string
          source_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eps_references_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          assessment_id: string
          created_at: string
          duration_minutes: number
          expires_at: string | null
          id: string
          last_saved_at: string | null
          question_order: Json
          snapshot_id: string
          snapshot_version: number
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          last_saved_at?: string | null
          question_order?: Json
          snapshot_id: string
          snapshot_version?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          last_saved_at?: string | null
          question_order?: Json
          snapshot_id?: string
          snapshot_version?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "assessment_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          assessment_id: string
          attempt_id: string
          breakdown: Json
          correct_count: number
          created_at: string
          earned_points: number
          empty_count: number
          grade: string
          id: string
          passed: boolean
          percentage: number
          tenant_id: string
          time_used_seconds: number
          total_points: number
          total_questions: number
          updated_at: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          assessment_id: string
          attempt_id: string
          breakdown?: Json
          correct_count?: number
          created_at?: string
          earned_points?: number
          empty_count?: number
          grade?: string
          id?: string
          passed?: boolean
          percentage?: number
          tenant_id: string
          time_used_seconds?: number
          total_points?: number
          total_questions?: number
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          assessment_id?: string
          attempt_id?: string
          breakdown?: Json
          correct_count?: number
          created_at?: string
          earned_points?: number
          empty_count?: number
          grade?: string
          id?: string
          passed?: boolean
          percentage?: number
          tenant_id?: string
          time_used_seconds?: number
          total_points?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grammars: {
        Row: {
          blocks: Json
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          id: string
          meaning: string | null
          pattern: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          meaning?: string | null
          pattern?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          meaning?: string | null
          pattern?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammars_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["knowledge_kind"]
          note: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["knowledge_kind"]
          note?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["knowledge_kind"]
          note?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          created_at: string
          id: string
          last_position: number
          last_viewed_at: string
          lesson_id: string
          percent: number
          status: Database["public"]["Enums"]["progress_status"]
          target_type: Database["public"]["Enums"]["learning_target"]
          tenant_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_position?: number
          last_viewed_at?: string
          lesson_id: string
          percent?: number
          status?: Database["public"]["Enums"]["progress_status"]
          target_type: Database["public"]["Enums"]["learning_target"]
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_position?: number
          last_viewed_at?: string
          lesson_id?: string
          percent?: number
          status?: Database["public"]["Enums"]["progress_status"]
          target_type?: Database["public"]["Enums"]["learning_target"]
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "lesson_units"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          position: number
          tenant_id: string
          type: Database["public"]["Enums"]["block_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          position?: number
          tenant_id: string
          type: Database["public"]["Enums"]["block_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          position?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["block_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "lesson_units"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_units: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          position: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          position?: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          position?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_units_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          estimated_minutes: number
          id: string
          module_id: string
          position: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          module_id: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          module_id?: string
          position?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_choices: {
        Row: {
          content: string
          created_at: string
          id: string
          is_correct: boolean
          label: string | null
          position: number
          question_version_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string | null
          position?: number
          question_version_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string | null
          position?: number
          question_version_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_choices_question_version_id_fkey"
            columns: ["question_version_id"]
            isOneToOne: false
            referencedRelation: "question_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_choices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_versions: {
        Row: {
          answer_key: string | null
          audio_url: string | null
          category: string | null
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          explanation: string | null
          id: string
          language: string
          passage: string | null
          prompt: string
          question_id: string
          skill: Database["public"]["Enums"]["question_skill"]
          source: string | null
          tags: string[]
          tenant_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
          version: number
        }
        Insert: {
          answer_key?: string | null
          audio_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          explanation?: string | null
          id?: string
          language?: string
          passage?: string | null
          prompt: string
          question_id: string
          skill?: Database["public"]["Enums"]["question_skill"]
          source?: string | null
          tags?: string[]
          tenant_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          version: number
        }
        Update: {
          answer_key?: string | null
          audio_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          explanation?: string | null
          id?: string
          language?: string
          passage?: string | null
          prompt?: string
          question_id?: string
          skill?: Database["public"]["Enums"]["question_skill"]
          source?: string | null
          tags?: string[]
          tenant_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          author_id: string | null
          category: string | null
          created_at: string
          current_version: number
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          id: string
          language: string
          public_id: string
          skill: Database["public"]["Enums"]["question_skill"]
          source: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          created_at?: string
          current_version?: number
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          language?: string
          public_id: string
          skill?: Database["public"]["Enums"]["question_skill"]
          source?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          created_at?: string
          current_version?: number
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          id?: string
          language?: string
          public_id?: string
          skill?: Database["public"]["Enums"]["question_skill"]
          source?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          student_number: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          student_number: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          student_number?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          capacity: number
          code: string
          created_at: string
          id: string
          level: string | null
          name: string
          period_id: string
          room: string | null
          status: Database["public"]["Enums"]["study_group_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          code: string
          created_at?: string
          id?: string
          level?: string | null
          name: string
          period_id: string
          room?: string | null
          status?: Database["public"]["Enums"]["study_group_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          code?: string
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          period_id?: string
          room?: string | null
          status?: Database["public"]["Enums"]["study_group_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          assigned_on: string
          assignment_role: Database["public"]["Enums"]["teacher_assignment_role"]
          created_at: string
          id: string
          study_group_id: string
          teacher_user_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_on?: string
          assignment_role?: Database["public"]["Enums"]["teacher_assignment_role"]
          created_at?: string
          id?: string
          study_group_id: string
          teacher_user_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_on?: string
          assignment_role?: Database["public"]["Enums"]["teacher_assignment_role"]
          created_at?: string
          id?: string
          study_group_id?: string
          teacher_user_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      vocabularies: {
        Row: {
          audio_url: string | null
          blocks: Json
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["knowledge_difficulty"]
          hangeul: string | null
          id: string
          meaning: string | null
          published_at: string | null
          romanization: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          hangeul?: string | null
          id?: string
          meaning?: string | null
          published_at?: string | null
          romanization?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          blocks?: Json
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["knowledge_difficulty"]
          hangeul?: string | null
          id?: string
          meaning?: string | null
          published_at?: string | null
          romanization?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabularies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      shares_tenant_with: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      academic_period_status: "draft" | "active" | "archived"
      app_role: "owner" | "admin" | "instructor" | "staff" | "student"
      assessment_type: "exam" | "quiz" | "practice" | "tryout"
      attempt_status:
        | "draft"
        | "in_progress"
        | "submitted"
        | "expired"
        | "abandoned"
      block_type:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "quote"
        | "divider"
        | "callout"
      content_status: "draft" | "published" | "archived"
      enrollment_status: "active" | "completed" | "suspended" | "dropped"
      knowledge_difficulty: "beginner" | "intermediate" | "advanced"
      knowledge_kind:
        | "grammar"
        | "vocabulary"
        | "conversation"
        | "culture_note"
        | "eps_reference"
      learning_target: "lesson" | "unit"
      membership_status: "invited" | "active" | "suspended" | "revoked"
      progress_status: "not_started" | "in_progress" | "completed"
      question_skill: "reading" | "listening"
      question_type:
        | "multiple_choice"
        | "multiple_response"
        | "true_false"
        | "short_answer"
      study_group_status: "draft" | "active" | "archived"
      teacher_assignment_role: "lead" | "assistant"
      tenant_status: "active" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academic_period_status: ["draft", "active", "archived"],
      app_role: ["owner", "admin", "instructor", "staff", "student"],
      assessment_type: ["exam", "quiz", "practice", "tryout"],
      attempt_status: [
        "draft",
        "in_progress",
        "submitted",
        "expired",
        "abandoned",
      ],
      block_type: [
        "text",
        "image",
        "audio",
        "video",
        "quote",
        "divider",
        "callout",
      ],
      content_status: ["draft", "published", "archived"],
      enrollment_status: ["active", "completed", "suspended", "dropped"],
      knowledge_difficulty: ["beginner", "intermediate", "advanced"],
      knowledge_kind: [
        "grammar",
        "vocabulary",
        "conversation",
        "culture_note",
        "eps_reference",
      ],
      learning_target: ["lesson", "unit"],
      membership_status: ["invited", "active", "suspended", "revoked"],
      progress_status: ["not_started", "in_progress", "completed"],
      question_skill: ["reading", "listening"],
      question_type: [
        "multiple_choice",
        "multiple_response",
        "true_false",
        "short_answer",
      ],
      study_group_status: ["draft", "active", "archived"],
      teacher_assignment_role: ["lead", "assistant"],
      tenant_status: ["active", "suspended"],
    },
  },
} as const
