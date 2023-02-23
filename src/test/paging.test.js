// Testa db fallið fyrir paging
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import dotenv from 'dotenv';
import { createSchema, dropSchema, end, getEventsByPage } from '../lib/db';

dotenv.config({ path: './.env.test' });

describe('paging', () => {
  beforeAll(async () => {
    await dropSchema();
    await createSchema();
  });

  afterAll(async () => {
    await end();
  });

  it('Returns empty array if no pages ', async () => {
    const result = await getEventsByPage(1);

    expect(result.length).toBe(0);
  });
});
