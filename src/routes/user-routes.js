import express from 'express';
import passport from '../lib/login.js';
import { createUser } from '../lib/users.js';

export const userRouter = express.Router();

function renderRegister(req, res) {
  return res.render('register', { title: 'title', message: 'message' });
}

async function registerUser(req, res, next) {
  const { username, password } = req.body;
  await createUser(username, password);
  console.log('User created');
  next();
}

userRouter.get('/register', renderRegister);
userRouter.post(
  '/register',
  registerUser,
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),
  (req, res) => {
    res.redirect('/admin');
  }
);
