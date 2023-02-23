// Testa db fallið fyrir paging
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import dotenv from 'dotenv';
import {
  createEvent,
  createSchema,
  deleteRegistration,
  dropSchema,
  end,
  register,
} from '../lib/db';
import { createUser } from '../lib/users';

dotenv.config({ path: './.env.test' });

describe('Users', () => {
  beforeAll(async () => {
    await dropSchema();
    await createSchema();
  });

  afterAll(async () => {
    await end();
  });

  // Nýskráning sem notandi

  // Testa db fall
  it('Registers a new user as not admin', async () => {
    const result = await createUser('Ivan', '123');

    expect(result.isadmin).toBe(false);
  });

  // ----------------------------

  // Innskráning á viðburði sem notandi er breytt í db.test.js
  // Það þarf núna userId

  // ----------------------------

  // Notandi skráir sig af viðburð
  it('Deletes registration if user exists', async () => {
    // create user
    const user = await createUser('Ivan2', '123');

    // create event
    const event = await createEvent({ name: 'name', slug: 'slug' });

    // Register user to event

    await register({
      name: 'Ivan',
      comment: 'comment',
      userId: user.id,
      event: event.id,
    });

    const result = await deleteRegistration({
      userId: user.id,
      slug: event.slug,
    });
    expect(result.id).toBe(1);
    expect(result.event).toBe(1);
    expect(result.name).toBe('Ivan');
  });
});
