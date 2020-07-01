basedir = Crossword.get_basedir(window.location.pathname);

// https://vuejs.org/v2/guide/state-management.html#Simple-State-Management-from-Scratch
var Data_store = {
  mode: null,
  cursor: null,
  player_id: null,
  languages: {'de': 'Deutsch', 'it': 'Italiano', 'en': 'English', 'fr': 'Français'},
  categories: {
    hard: {symbol: '💪', legend: 'Hard'},
    personal: {symbol: '👪', legend: 'Personal'},
    kids: {symbol: '🐣', legend: 'For Kids'},
  }
};

var event_hub = new Vue();

const modes = [
  'list',
  'play',
  'edit'
];


const app = new Vue({
  el: '#app',
	i18n, // from js/i18n.js
  data: {
    data_store: Data_store,
    crossword_id: null,
    list: []
  },
  mounted() {
    if (localStorage.crossword_player_id) { 
      this.data_store.player_id = localStorage.crossword_player_id;
    } else {
      this.data_store.player_id = Crossword.uuidv4();
      localStorage.setItem('crossword_player_id', this.data_store.player_id);
    }
    if (localStorage.crossword_id) {
      this.crossword_id = localStorage.crossword_id;
    }

    if (localStorage.crossword_language) { 
      this.set_locale(localStorage.crossword_language);
    } else {
      this.set_locale('en');
    }
    document.title = $t('content.Crosswords');
    event_hub.$on('set_locale', this.set_locale);

    if (localStorage.crossword_id) {
      this.crossword_id = localStorage.crossword_id;
    }

    if (localStorage.crossword_mode) {
      this.data_store.mode = localStorage.crossword_mode;
    } else {
      this.data_store.mode = 'list';
    }

    if (this.crossword_id === null) {
      this.data_store.mode = 'list';
    }
  },
  methods: {
    go: function(href, params = {}) {
      if (modes.includes(href)) {
        for (let [key, param] of Object.entries(params)) {
          if (typeof(this[key]) !== 'undefined') {
            this[key] = param;
          } else {
            console.error('go: ' + key + ' is not defined');
          }
        }
        this.data_store.mode = href;
        localStorage.setItem('crossword_mode', this.data_store.mode);
      }
    },
    set_locale: function(language) {
      localStorage.crossword_language = language;
      i18n.locale = language;
    }
  }
});
