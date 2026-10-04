import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canManageAccess, manageableRoles } from '../src/field/access-model.mjs';

test('access hierarchy prevents self changes and privilege escalation', () => {
  const admin = { id: 'a', papel: 'admin' };
  assert.equal(canManageAccess(admin, admin), false);
  assert.equal(canManageAccess(admin, { id: 'b', papel: 'super_admin' }), false);
  assert.equal(canManageAccess(admin, { id: 'b', papel: 'admin' }), false);
  assert.equal(canManageAccess(admin, { id: 'b', papel: 'tecnico' }), true);
  assert.deepEqual(manageableRoles({ papel: 'tecnico' }), []);
  assert.deepEqual(manageableRoles({ papel: 'coordenador' }), []);
  assert.equal(canManageAccess({ id: 'c', papel: 'coordenador' }, { id: 't', papel: 'tecnico' }), false);
});
