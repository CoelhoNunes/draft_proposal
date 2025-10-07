import test from 'node:test';
import assert from 'node:assert/strict';

import { z, ZodError } from '../dist/z/index.js';

test('string schema enforces min/max and trimming', () => {
  const schema = z.string().min(3).max(5).trim();
  assert.equal(schema.parse('  abc  '), 'abc');

  assert.throws(() => schema.parse('ab'), (error) => {
    assert.ok(error instanceof ZodError);
    return true;
  });
});

test('object schema parses nested structures and defaults', () => {
  const schema = z.object({
    id: z.string().uuid(),
    tags: z.array(z.string()).default([]),
    meta: z.record(z.string()).optional(),
  });

  const data = schema.parse({
    id: '123e4567-e89b-12d3-a456-426614174000',
  });

  assert.deepEqual(data, {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tags: [],
    meta: undefined,
  });
});

test('enum schema constrains allowed values', () => {
  const schema = z.enum(['one', 'two', 'three']);
  assert.equal(schema.parse('two'), 'two');
  assert.throws(() => schema.parse('four'), (error) => {
    assert.ok(error instanceof ZodError);
    return true;
  });
});

test('safeParse returns structured errors', () => {
  const schema = z.object({
    email: z.string().email(),
  });

  const result = schema.safeParse({ email: 'invalid' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].path.join('.'), 'email');
  }
});
