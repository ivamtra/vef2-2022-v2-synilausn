CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  slug VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  location VARCHAR(64),
  URL VARCHAR(64),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE public.users (
  id serial primary key,
  username character varying(64) NOT NULL UNIQUE,
  password character varying(256) NOT NULL,
  isAdmin boolean NOT NULL DEFAULT FALSE
);


CREATE TABLE public.registrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  userId INTEGER NOT NULL,
  comment TEXT,
  event INTEGER NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT event FOREIGN KEY (event) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT userId FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE

);
