import express from 'express';
import { validationResult } from 'express-validator';
import { catchErrors } from '../lib/catch-errors.js';
import {
  createEvent,
  deleteEvent,
  getEventsByPage,
  listEvent,
  listEventByName,
  listEvents,
  updateEvent,
} from '../lib/db.js';
import passport, { ensureAdminLoggedIn, isAdmin } from '../lib/login.js';
import { slugify } from '../lib/slugify.js';
import { findByUsername } from '../lib/users.js';
import {
  registrationValidationMiddleware,
  sanitizationMiddleware,
  xssSanitizationMiddleware,
} from '../lib/validation.js';

export const adminRouter = express.Router();

// Tengja við paging
async function adminPageRoute(req, res) {
  // Checka ef notandi er admin
  // Ef hann er admin út frá auth:
  // Sýna admin síðuna
  // Annars
  // Redirect á venjulega síðu

  const { number } = req.params;
  const events = await getEventsByPage(number);
  const { user: { username } = {} } = req || {};

  const prev = parseInt(number, 10) - 1;
  const next = parseInt(number, 10) + 1;

  return res.render('admin', {
    username,
    events,
    prev,
    next,
    errors: [],
    data: {},
    title: 'Viðburðir — umsjón',
    admin: true,
  });
}

async function index(req, res) {
  res.redirect('/admin/page/1');
}

export function login(req, res) {
  if (req.isAuthenticated()) {
    if (isAdmin(req)) return res.redirect('/admin');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message, title: 'Innskráning' });
}

async function validationCheck(req, res, next) {
  const { name, description } = req.body;

  const events = await listEvents();
  const { user: { username } = {} } = req;

  const data = {
    name,
    description,
  };

  const validation = validationResult(req);

  const customValidations = [];

  const eventNameExists = await listEventByName(name);

  if (eventNameExists !== null) {
    customValidations.push({
      param: 'name',
      msg: 'Viðburður með þessu nafni er til',
    });
  }

  if (!validation.isEmpty() || customValidations.length > 0) {
    return res.render('admin', {
      events,
      username,
      title: 'Viðburðir — umsjón',
      data,
      errors: validation.errors.concat(customValidations),
      admin: true,
    });
  }

  return next();
}

async function validationCheckUpdate(req, res, next) {
  const { name, description } = req.body;
  const { slug } = req.params;
  const { user: { username } = {} } = req;

  const event = await listEvent(slug);

  const data = {
    name,
    description,
  };

  const validation = validationResult(req);

  const customValidations = [];

  const eventNameExists = await listEventByName(name);

  if (eventNameExists !== null && eventNameExists.id !== event.id) {
    customValidations.push({
      param: 'name',
      msg: 'Viðburður með þessu nafni er til',
    });
  }

  if (!validation.isEmpty() || customValidations.length > 0) {
    return res.render('admin-event', {
      username,
      event,
      title: 'Viðburðir — umsjón',
      data,
      errors: validation.errors.concat(customValidations),
      admin: true,
    });
  }

  return next();
}

// TODO: Bæta við URL og Location
async function registerRoute(req, res) {
  const { name, description, location, url } = req.body;
  const slug = slugify(name);

  const created = await createEvent({ name, slug, description, location, url });

  if (created) {
    return res.redirect('/admin');
  }

  return res.render('error');
}

async function updateRoute(req, res) {
  const { name, description, url, location } = req.body;
  const { slug } = req.params;

  const event = await listEvent(slug);

  const newSlug = slugify(name);

  const updated = await updateEvent(event.id, {
    name,
    slug: newSlug,
    description,
    url,
    location,
  });

  if (updated) {
    return res.redirect('/admin');
  }

  return res.render('error');
}

export function redirectIfNotAdmin(req, res, next) {
  if (!req.user?.isadmin || !req.user) {
    res.redirect('/');
  } else next();
}

async function deleteEventRoute(req, res, next) {
  const { slug } = req.params;
  await deleteEvent(slug);
  next();
}

async function eventRoute(req, res, next) {
  const { slug } = req.params;
  const { user: { username } = {} } = req;

  const event = await listEvent(slug);

  if (!event) {
    return next();
  }

  return res.render('admin-event', {
    username,
    title: `${event.name} — Viðburðir — umsjón`,
    event,
    errors: [],
    data: {
      name: event.name,
      description: event.description,
      location: event.location,
      url: event.url,
    },
  });
}

export async function checkIfAdminLogIn(req, res, next) {
  const userTryingToLogIn = await findByUsername(req.body.username);

  if (!userTryingToLogIn || !userTryingToLogIn.isadmin) {
    res.render('login', {
      message: 'Notandanafn eða lykilorð vitlaust',
      title: 'Innskráning',
    });
  } else {
    next();
  }
}

adminRouter.get('/', ensureAdminLoggedIn, catchErrors(index));
adminRouter.post(
  '/',
  ensureAdminLoggedIn,
  registrationValidationMiddleware('description'),
  xssSanitizationMiddleware('description'),
  catchErrors(validationCheck),
  sanitizationMiddleware('description'),
  catchErrors(registerRoute)
);

adminRouter.get('/page/:number', ensureAdminLoggedIn, adminPageRoute);

adminRouter.get('/login', login);
adminRouter.post(
  '/login',
  checkIfAdminLogIn,

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  }
);

adminRouter.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout((err) => {
    if (err) {
      console.error(err);
    } else {
      res.redirect('/');
    }
  });
});

// Ætti að vera delete endpoint en það er enginn framendi
// sem kallar á þetta.
// Því er þetta get request til að hægt sé að deleta í UI.
adminRouter.get(
  '/delete/:slug',
  ensureAdminLoggedIn,
  deleteEventRoute,
  (req, res) => res.redirect('/admin')
);

// Verður að vera seinast svo það taki ekki yfir önnur route
adminRouter.get('/:slug', ensureAdminLoggedIn, catchErrors(eventRoute));
adminRouter.post(
  '/:slug',
  ensureAdminLoggedIn,
  registrationValidationMiddleware('description'),
  xssSanitizationMiddleware('description'),
  catchErrors(validationCheckUpdate),
  sanitizationMiddleware('description'),
  catchErrors(updateRoute)
);
