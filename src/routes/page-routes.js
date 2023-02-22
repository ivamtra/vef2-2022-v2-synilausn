import express from 'express';
import { catchErrors } from '../lib/catch-errors.js';
import { getEventsByPage } from '../lib/db.js';

// TODO
// get '/' ->
// redirect /page/1

// TODO get events by page
export const pageRouter = express.Router();

async function pageRoute(req, res) {
  console.log(req.originalUrl);
  const { number } = req.params;
  const events = await getEventsByPage(number);

  const { user: { username } = {} } = req || {};
  const body = {
    user: username,
    title: 'Viðburðasíðan',
    admin: false,
    events,
    loginInfo: `Skráður inn sem ${username}`,
  };
  if (!username) body.loginInfo = 'Ekki skráður inn';

  res.render('index', body);
}

async function adminPageRoute(req, res) {
  // Checka ef notandi er admin
  // Ef hann er admin út frá auth:
  // Sýna admin síðuna
  // Annars
  // Redirect á venjulega síðu
}

pageRouter.get('/:number', catchErrors(pageRoute));
