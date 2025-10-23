import { describe, it, expect } from 'vitest';
import { matchNurse } from './matching';

describe('matchNurse', () => {
  it('matches by auth metadata nurse_no', () => {
    const nurse = { nurse_no: 'N001', name: 'Maria' };
    const authUsers = [{ id: 'uid-1', user_metadata: { nurse_no: 'N001' }, email: 'maria@example.com' }];
    const userRoles: any[] = [];
    const res = matchNurse(nurse, authUsers, userRoles);
    expect(res).not.toBeNull();
    expect(res?.source).toBe('auth');
    expect(res?.userId).toBe('uid-1');
  });

  it('matches by numeric suffix from user_roles', () => {
    const nurse = { nurse_no: 'N002', name: 'Juan' };
    const authUsers: any[] = [];
    const userRoles = [{ user_id: 'uid-2', role: 'staff', account_number: 'STAFF002' }];
    const res = matchNurse(nurse, authUsers, userRoles as any);
    expect(res).not.toBeNull();
    expect(res?.source).toBe('user_roles_suffix');
    expect(res?.userId).toBe('uid-2');
  });

  it('returns null when no match', () => {
    const nurse = { nurse_no: 'N999', name: 'No One' };
    const res = matchNurse(nurse, [], []);
    expect(res).toBeNull();
  });
});
