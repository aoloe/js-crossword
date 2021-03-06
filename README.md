# crosswords

Vue.js based crosswords editor and solver.

## Install

- `git clone https://github.com/aoloe/js-crossword.git crossword`
- `cd js`
  - `wget https://cdn.jsdelivr.net/npm/vue/dist/vue.js`
  - `wget https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js`
  - `wget https://unpkg.com/vue-i18n/dist/vue-i18n.js`
- cd `api`
  - `mkdir db`
  - `wget https://raw.githubusercontent.com/aoloe/php-tiny-rest/master/src/TinyRest.php`
  - create the `api/config.php` file (based on `api/config-demo.php`)

## Notes

Seaching for `vue.js crossword generator` has a few suggestions:

- <https://github.com/Piterden/vue-crossword>

Here a player:

- <https://github.com/dwmkerr/crosswords-js>

Ideas for a multiplyer mode:

- <https://github.com/AgrimPrasad/Multiplayer-GameOfLife>

Related to Vue.js

- catch edit event in input fields: <https://jsfiddle.net/posva/oqe9e8pb/>
- defining the id: <https://stackoverflow.com/questions/47119588/vue-how-to-concat-dynamic-id-with-field-from-v-for-loop-string> (just use js not v-bind:id)

Websockets on the server side:

- <https://www.heroku.com/free> (<https://www.heroku.com/pricing>)

Doing it with php won't probably work:

- <https://www.twilio.com/blog/create-php-websocket-server-build-real-time-even-driven-application>
- <http://socketo.me/>

A format for storing the crossword

- <https://github.com/century-arcade/xd>
  - a standard
  - allows orphaned definitions

## JS notes

- `id.split('-').map(Number);`

## Todo

- allow italics in definitions
- references to _external_ pictures (_una gita a...?_)
- add a picture in a given area (all blacks)
- facilitate (mark cells that have hints)
- allow for schemas with _bars_ as limits.
- ensure a period at the end of the clue.
- set a different color for the clue number without a clue.
- make sure that the pagination works correctly.


- allow for center simmetry + horizonal + vertical
- histogram with word lengths
- mark 1 and 2 cell words, islands (separated cells), cells  that are defined by a single definition
