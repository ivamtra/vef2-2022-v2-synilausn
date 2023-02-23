// Testa db fallið fyrir paging
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import dotenv from 'dotenv';
import {
  createEvent,
  createSchema,
  deleteEvent,
  dropSchema,
  end,
  updateEvent,
} from '../lib/db';

dotenv.config({ path: './.env.test' });

describe('Events', () => {
  beforeAll(async () => {
    await dropSchema();
    await createSchema();
  });

  afterAll(async () => {
    await end();
  });

  // Event hefur nú fleiri dálka

  it('Creates a new event with more data', async () => {
    const result = await createEvent({
      name: 'name',
      slug: 'slug',
      description: 'desc',
      location: 'RVK',
      url: 'youtube.com',
    });
    expect(result).toBeTruthy();
  });
  // Update-a viðburð með auka gögnum

  it('Updates the location of event', async () => {
    const result = await updateEvent(1, {
      name: 'name',
      slug: 'slug',
      description: 'desc',
      location: 'AK',
      url: 'youtube.com',
    });
    expect(result.location).toBe('AK');
  });

  it('Deletes the event', async () => {
    const result = await deleteEvent('slug');

    expect(result).toBeTruthy();
  });
});
