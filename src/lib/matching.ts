export interface UserRole {
  user_id: string | null;
  role: string;
  account_number?: string | null;
  patient_number?: string | null;
  [k: string]: any;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
}

export type MatchResult = {
  source: 'auth' | 'user_roles_suffix' | 'user_roles_name';
  userId: string;
  roleMatch?: UserRole | null;
};

/**
 * Try to match a nurse record to an auth user or user_roles fallback.
 * Nurse should have at least `nurse_no` and `name` fields.
 */
export function matchNurse(
  nurse: { nurse_no?: string; name?: string },
  authUsers: AuthUser[] = [],
  userRoles: UserRole[] = []
): MatchResult | null {
  const nurseNo = nurse.nurse_no || '';

  // 1) Prefer exact auth user metadata/email matches
  if (authUsers && authUsers.length > 0) {
    const byAuth = authUsers.find(u =>
      u.user_metadata?.nurse_no === nurseNo ||
      (u.email && u.email.split('@')[0].toUpperCase() === nurseNo)
    );
    if (byAuth) return { source: 'auth', userId: byAuth.id, roleMatch: null };
  }

  // 2) Numeric-suffix matching against user_roles.account_number
  const nurseDigits = nurseNo.replace(/\D/g, '');
  if (nurseDigits) {
    const suffixMatch = userRoles.find(ur => {
      if (!ur.account_number) return false;
      const accDigits = String(ur.account_number).replace(/\D/g, '');
      return accDigits && accDigits === nurseDigits;
    });
    if (suffixMatch?.user_id) return { source: 'user_roles_suffix', userId: suffixMatch.user_id, roleMatch: suffixMatch };
  }

  // 3) Name-based fallback
  const nameMatch = userRoles.find(ur => ur.account_number === nurse.name || ur.patient_number === nurse.name);
  if (nameMatch?.user_id) return { source: 'user_roles_name', userId: nameMatch.user_id, roleMatch: nameMatch };

  return null;
}
