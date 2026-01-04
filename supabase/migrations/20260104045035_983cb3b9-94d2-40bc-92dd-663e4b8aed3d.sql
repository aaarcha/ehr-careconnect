-- Phase 1: Add 'nurse' to user_role enum only
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nurse';