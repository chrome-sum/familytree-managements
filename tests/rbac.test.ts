import test from 'node:test'
import assert from 'node:assert/strict'
import { canManageTree, canManageUsers, canViewTree } from '../lib/rbac-policy'
import type { UserRole } from '../lib/types'

const roles: UserRole[] = ['admin', 'editor', 'viewer']

test('all authenticated roles can view tree', () => {
  for (const role of roles) {
    assert.equal(canViewTree(role), true)
  }
  assert.equal(canViewTree(null), false)
})

test('only admin and editor can manage tree', () => {
  assert.equal(canManageTree('admin'), true)
  assert.equal(canManageTree('editor'), true)
  assert.equal(canManageTree('viewer'), false)
  assert.equal(canManageTree(undefined), false)
})

test('only admin can manage users', () => {
  assert.equal(canManageUsers('admin'), true)
  assert.equal(canManageUsers('editor'), false)
  assert.equal(canManageUsers('viewer'), false)
  assert.equal(canManageUsers(undefined), false)
})
