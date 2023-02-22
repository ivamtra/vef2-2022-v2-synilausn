import express from 'express';
import passport from 'passport';
import { createUser } from '../lib/users.js';

export const userRouter = express.Router();

function renderRegister(req, res) {
  return res.render('register', { title: 'title', message: 'message' });
}

function renderLogin(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }
  return res.render('user-login', {
    title: 'Innskráning notenda',
    message,
  });
}

async function registerUser(req, res, next) {
  console.log('Register');
  const { username, password } = req.body;
  await createUser(username, password);
  console.log('User created');
  next();
}

function ensureNotLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
}

userRouter.get('/login', ensureNotLoggedIn, renderLogin);
userRouter.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/user/login',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

userRouter.get('/register', ensureNotLoggedIn, renderRegister);

userRouter.post(
  '/register',
  registerUser,
  passport.authenticate('local'),
  (req, res) => res.redirect('/')
);

// TODO Logout route
userRouter.get('/logout', (req, res) => {
  req.logOut((err) => {
    if (err) console.error(err);
    else res.redirect('/');
  });
});
