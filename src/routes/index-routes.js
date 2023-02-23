import express from 'express';
import { validationResult } from 'express-validator';
import { catchErrors } from '../lib/catch-errors.js';
import {
  deleteRegistration,
  getEventsByPage,
  listEvent,
  listEvents,
  listRegistered,
  register,
} from '../lib/db.js';
import {
  registrationValidationMiddleware,
  sanitizationMiddleware,
  xssSanitizationMiddleware,
} from '../lib/validation.js';

export const indexRouter = express.Router();

// Tengja við paging
async function pageRoute(req, res) {
  const number = Number(req.params.number);
  const events = await getEventsByPage(number);

  const { user: { username } = {} } = req || {};

  // Ef sýna á til baka ör
  const showBackArrow = number > 1;

  const eventsNext = await getEventsByPage(number + 1);
  // Ef sýna á áfram ör
  const showNextArrow = eventsNext.length !== 0;

  console.log(showBackArrow);
  console.log(showNextArrow);

  const prev = number - 1;
  const next = number + 1;
  const body = {
    user: username,
    title: 'Viðburðasíðan',
    admin: false,
    events,
    prev,
    next,
    showBackArrow,
    showNextArrow,
    loginInfo: `Skráður inn sem ${username}`,
  };
  if (!username) body.loginInfo = 'Ekki skráður inn';

  res.render('index', body);
}

async function indexRoute(req, res) {
  res.redirect('/page/1');
}

async function eventRoute(req, res, next) {
  const { slug } = req.params;
  const event = await listEvent(slug);

  if (!event) {
    return next();
  }

  const registered = await listRegistered(event.id);
  console.log(req.user?.id);

  return res.render('event', {
    title: `${event.name} — Viðburðasíðan`,
    event,
    userId: req?.user?.id,
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
  const { comment, name } = req.body;
  console.log(comment);

  const userId = req.user.id;
  console.log(userId);
  console.log(name);
  const { slug } = req.params;
  const event = await listEvent(slug);

  const registered = await register({
    name,
    userId,
    comment,
    event: event.id,
  });

  if (registered) {
    return res.redirect(`/${event.slug}`);
  }

  return res.render('error');
}

function redirectIfAdmin(req, res, next) {
  if (req.user?.isadmin) {
    res.redirect('/admin');
  } else next();
}

function ensureUserLoggedIn(req, res, next) {
  if (!req.user) {
    res.redirect('/user/login');
  } else next();
}

// Skráir út viðkomandi sem er loggaður inn
async function unregister(req, res) {
  const { userId, slug } = req.params;

  const intId = Number(userId);

  await deleteRegistration({ userId: intId, slug });

  return res.redirect(`/${slug}`);
}

indexRouter.get('/', redirectIfAdmin, catchErrors(indexRoute));
indexRouter.get('/page/:number', pageRoute);
indexRouter.get('/unregister/:slug/:userId', ensureUserLoggedIn, unregister);
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
