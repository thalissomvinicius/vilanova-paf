import { PafRepository } from './repository.ts';

function repository(profile: Record<string, unknown> | null, organization = 'org-a', validToken = true) {
  const db = {
    auth: { getUser: async (token: string) => ({ data: { user: validToken && token === 'verified' ? { id: 'auth-user' } : null }, error: null }) },
    from: (table: string) => ({ select: () => ({ eq: (field: string, value: unknown) => ({ single: async () => {
      if (table === 'paf_perfis' && (field !== 'id' || value !== 'auth-user')) throw new Error('Profile must match verified identity');
      return { data: table === 'paf_perfis' ? profile : { organizacao_id: organization } };
    } }) }) })
  };
  return new PafRepository(db as any);
}
const admin = { id: 'auth-user', nome: 'Admin', papel: 'admin', ativo: true, organizacao_id: 'org-a', deve_trocar_senha: false };

Deno.test('shared admin identity requires verified token, active profile and bound organization', async () => {
  const auth = await repository(admin).getUnifiedSession('verified');
  if (auth?.account.field_profile_id !== 'auth-user' || auth.role !== 'admin') throw new Error('Expected shared admin session');
  for (const profile of [null, { ...admin, ativo: false }, { ...admin, deve_trocar_senha: true }, { ...admin, papel: 'tecnico' }, { ...admin, papel: 'coordenador' }, { ...admin, organizacao_id: 'other' }]) {
    if (await repository(profile).getUnifiedSession('verified')) throw new Error('Unauthorized profile accepted');
  }
  if (await repository(admin).getUnifiedSession('forged')) throw new Error('Forged token accepted');
});
