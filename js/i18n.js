const messages = {
  en: {
    content: {
      Crosswords: 'Crosswords',
      Accross: 'Accross',
      Down: 'Down',
      ManageThisUser: 'Manage this user',
      WorkInProgress: 'Work in progress',
      CreateAGrid: 'Create a grid',
      CreateYourOwnGrid: 'Create your own grid',
    },
    button: {
      'BackToTheList': 'Back to the list',
      all: 'All',
      mine: 'Mine',
      next: 'Next',
      previous: 'Previous',
      create: 'Create',
      save: 'Save',
      'delete': 'Delete',
    },
    help: {
      space: 'Press the Space bar to switch between Accross and Down',
      enter: 'Pressing the Enter key sets a separator if the cell is empty or lets you write the clue otherwise.',
    }
  },
  it: {
    content: {
      Crosswords: 'Cruciverba',
      Accross: 'Orizontali',
      Down: 'Verticali',
      ManageThisUser: 'Gestire questo utilizzatore',
      WorkInProgress: 'Work in progress',
      CreateAGrid: 'Crea un cruciverba',
      CreateYourOwnGrid: 'Crea un nuovo cruciverba',
    },
    button: {
      BackToTheList: 'Ritorno alla lista',
      all: 'Tutte',
      mine: 'Le mie',
      next: 'Prossimo',
      previous: 'Precedente',
      create: 'Crea',
      save: 'Salva',
      'delete': 'Elimina',
    },
    help: {
      space: 'Premi la barra spaziatrice per passare dagli orizzontali ai verticali. E viceversa.',
      enter: 'Il tasto Enter aggiunge una casella nera se la casella è vuota o permette di scrivere la definizione se contiene una lettera.',
    }
  },
  de: {
    content: {
      Crosswords: 'Kreuzworträtsel',
      Accross: 'Waagrecht',
      Down: 'Senkrecht',
      ManageThisUser: 'Benutzer verwalten',
      WorkInProgress: 'Work in progress',
      CreateAGrid: 'Neues Kreuzworträtsel',
      CreateYourOwnGrid: 'Erstelle ein neues Kreuzworträtsel',
    },
    button: {
      BackToTheList: 'Zurück zur Liste',
      all: 'Alle',
      mine: 'Meine',
      next: 'Nächste',
      previous: 'Zurück',
      create: 'Erstellen',
      save: 'Speichern',
      'delete': 'Entfernen',
    },
    help: {
      space: 'Leertaste drücken um zwischen Waag- und Senkrecht zu wechseln.',
      enter: 'Wenn die Zelle leer ist, setzt die Eingabetaste ein Blindkästchen; andernfalls kannst du den Hinweis schreiben.',
    }
  },
  fr: {
    content: {
      Crosswords: 'Mots croisés',
      Accross: 'Horizontalement',
      Down: 'Verticalement',
      ManageThisUser: 'Gérer l\'utilisateur',
      WorkInProgress: 'Work in progress',
      CreateAGrid: 'Créer une grille',
      CreateYourOwnGrid: 'Crée une nouvelle grille',
    },
    button: {
      BackToTheList: 'Retour à la liste',
      all: 'Tous',
      mine: 'Les miens',
      next: 'Prochains',
      previous: 'Précédents',
      create: 'Créer',
      save: 'Enregistrer',
      'delete': 'Eliminer',
    },
    help: {
      space: 'Presser la barre d\'espace pour passer de horizontalement à verticalement. Et viceversa.',
      enter: 'Lorsque la case est vide, la touche entrée place une case noire; sinon, elle permet d\'écrire la définition.',
    }
  }
}

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: 'en', // set locale
  messages, // set locale messages
})
