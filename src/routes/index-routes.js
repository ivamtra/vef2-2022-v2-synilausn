import express from 'express';
import { validationResult } from 'express-validator';
import { catchErrors } from '../lib/catch-errors.js';
import { listEvent, listEvents, listRegistered, register } from '../lib/db.js';
import {
  registrationValidationMiddleware,
  sanitizationMiddleware,
  xssSanitizationMiddleware,
} from '../lib/validation.js';
import { pageRouter } from './page-routes.js';

export const indexRouter = express.Router();

// Tengja við paging
indexRouter.use('/page', pageRouter);

async function indexRoute(req, res) {
  res.redirect('/page/1');
}

async function eventRoute(req, res, next) {
  const { slug } = req.params;
  const event = await listEvent(slug);
  console.log(event);

  if (!event) {
    return next();
  }

  const registered = await listRegistered(event.id);

  return res.render('event', {
    title: `${event.name} — Viðburðasíðan`,
    event,
    registered,
    errors: [],
    data: {},
  });
}

async function eventRegisteredRoute(req, res) {
  const events = await listEvents();

  res.render('registered', {
    title: 'Viðburðasíðan',
    events,
  });
}

async function validationCheck(req, res, next) {
  const { name, comment } = req.body;

  // TODO tvítekning frá því að ofan
  const { slug } = req.params;
  const event = await listEvent(slug);
  const registered = await listRegistered(event.id);

  const data = {
    name,
    comment,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.render('event', {
      title: `${event.name} — Viðburðasíðan`,
      data,
      event,
      registered,
      errors: validation.errors,
    });
  }

  return next();
}

async function registerRoute(req, res) {
  const { name, comment } = req.body;
  const { slug } = req.params;
  const event = await listEvent(slug);

  const registered = await register({
    name,
    comment,
    event: event.id,
  });

  if (registered) {
    return res.redirect(`/${event.slug}`);
  }

  return res.render('error');
}

function redirectIfAdmin(req, res, next) {
  console.log(req.user);
  if (req.user?.isadmin) {
    res.redirect('/admin');
  } else next();
}

function ensureUserLoggedIn(req, res, next) {
  console.log(req.user);
  if (!req.user) {
    res.redirect('/user/login');
  } else next();
}

indexRouter.get('/', redirectIfAdmin, catchErrors(indexRoute));

indexRouter.get('/:slug', catchErrors(eventRoute));
indexRouter.post(
  '/:slug',
  ensureUserLoggedIn,
  registrationValidationMiddleware('comment'),
  xssSanitizationMiddleware('comment'),
  catchErrors(validationCheck),
  sanitizationMiddleware('comment'),
  catchErrors(registerRoute)
);
indexRouter.get('/:slug/thanks', catchErrors(eventRegisteredRoute));
