// Testa db fallið fyrir paging
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import dotenv from 'dotenv';
import {
  createEvent,
  createSchema,
  dropSchema,
  end,
  getEventsByPage,
} from '../lib/db';
import { dummyEvents } from './mock/mockEvents';

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

  it('Returns 10 entries for input greater than 10', async () => {
    for (const event of dummyEvents) {
      // eslint-disable-next-line no-await-in-loop
      await createEvent(event);
    }

    const result = await getEventsByPage(1);

    expect(result.length).toBe(10);
  });
});
