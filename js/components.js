Vue.component('crossword-list', {
  template: `<div>
    <!--
		<p>
    <select v-model="filter" required>
      <option value="all">{{ $t('button.all') }}</option>
      <option value="mine">{{ $t('button.mine') }}</option>
      <option v-for="(value, key) in data_store.languages" v-bind:value="key">
        {{value}}
      </option>
    </select>
		</p>
    -->
    <ul class="crossword-list">
      <li v-for="item in paginated_list">
        <a-link href="play" :params="{crossword_id: item.crossword_id}" class = "label">
        {{item.title}}</a-link>
        ({{item.language}})
        <span v-if="item.work_in_progress" v-bind:title="$t('content.WorkInProgress')">🚧</span>
        <span v-for="(value, key) in active_categories(item.categories, item.title)" v-bind:title="value.legend">{{ value.symbol }}</span>
        <a-link v-if="item.editable" href="edit" :params="{crossword_id: item.crossword_id}">✎</a-link>
        <a v-else-if="admin" v-on:click="impersonate(item.crossword_id)" v-bind:title="$t('content.ManageThisUser')">👤</a>
      </li>
    </ul>
    <button type="button" class="page-link" v-if="page > 0" v-on:click="page--"> {{ $t('button.previous') }} </button>
    <button type="button" class="page-link" v-if="page < page_n" v-on:click="page++"> {{ $t('button.next') }} </button>
  </div>`,
  props: {
  },
  data: function() {
    return {
      list: [],
      admin: false,
      page: 0,
      page_n: 0,
      per_page: 10,
      filter: 'all',
      data_store: Data_store
    }
  },
  mounted() {
    if (localStorage.crossword_filter) {
      this.filter = localStorage.crossword_filter;
    }
    this.get_list();
  },
  watch: {
    filter: function(new_value) {
      if (this.filter === 'all') {
        localStorage.removeItem('crossword_filter');
      } else {
        localStorage.setItem('crossword_filter', this.filter);
      }
    }
  },
  computed: {
    paginated_list() {
      if (this.list === null) {
        return [];
      }
      if (this.filter === 'all') {
        list = this.list.slice();
      } else if (this.filter === 'mine') {
        list = this.list.filter(f => f.editable === true);
      } else {
        list = this.list.filter(f => f.language === this.filter);
      }
      start = this.page * this.per_page;
      this.page_n = Math.floor(list.length / this.per_page);
      list = list.slice(start, start + this.per_page);
      return list;
    }
  },
  methods: {
    get_list: function() {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'list',
            author: this.data_store.player_id
          }
        })
        .then(response => {
          this.admin = response.data.admin;
          this.list = response.data.list;
        });
    },
    active_categories(item_categories, title) {
      result = {};
      for (let [key, value] of Object.entries(this.data_store.categories)) {
        if (item_categories && key in item_categories && item_categories[key]) {
          result[key] = value;
        }
      }
      return result;
    },
    impersonate: function(crossword_id) {
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'user_by_crossword',
            id: crossword_id,
            admin: this.data_store.player_id
          }
        })
        .then(response => {
          // TODO: not sure it's a good itea to write it directly...
          this.data_store.player_id = response.data.user_id
          this.get_list();
        });
    },
  }
});

Vue.component('player', {
  template: `<div class="player">
    <h2>{{title}}</h2>
    <p v-if="!show_help" v-on:click="show_help = !show_help" class="help">🛈 </p>
    <p v-else v-on:click="show_help = !show_help" class="help">🛈<br>{{ $t('help.space') }}</p>
    <crossword-grid v-if="grid !== null" :cells="grid.cells"></crossword-grid>
    <crossword-current-clue v-if="grid !== null" :cells="grid.cells"></crossword-current-clue>
    <crossword-clues v-if="grid !== null" :cells="grid.cells"></crossword-clues>
  </div>`,
  props: {
    crossword_id: {
      required: true,
      validator: p => typeof p === 'string' || p === null
    }
  },
  data: function() {
    return {
      grid: null,
      title: null,
      data_store: Data_store,
      show_help: false
    }
  },
  mounted() {
    localStorage.setItem('crossword_id', this.crossword_id);
    axios
      .get(basedir+'/api/', {
        params: {
          action: 'get',
          id: this.crossword_id,
          author: this.data_store.player_id
        }
      })
      .then(response => {
        event_hub.$emit('set_locale', response.data.language);
        this.title = response.data.title;
        this.grid = new Grid();
        this.grid.read_from_json(response.data.grid)
        this.grid.numerate_cells();
        this.data_store.cursor = new Cursor(this.grid);
      });
  },
  destroyed() {
    localStorage.removeItem('crossword_id');
  },
});

Vue.component('editor', {
  template: `<div class="editor">
    <input type="text" v-model="title" placeholder="Title" required>
    <select v-model="language" required>
      <option v-for="(value, key) in data_store.languages" v-bind:value="key">
        {{value}}
      </option>
    </select>
    <template v-for="(value, key) in valid_categories">
      <input type="checkbox" :id="key" v-model="categories[key]">
      <label :for="key" :title="value.legend">{{ value.symbol }}</label>
    </template><br>
    <input type="number" min="3" max="100" size="3" v-model.number="columns" v-on:keydown.prevent /> x <input type="number" min="3" max="100" size="3" v-model.number="rows" v-on:keydown.prevent/>
    <span v-if="!show_help" v-on:click="show_help = !show_help" class="help">🛈 </span>
    <p v-else v-on:click="show_help = !show_help" class="help">🛈<br>{{ $t('help.space') }}<br>{{ $t('help.enter') }}</p>


    <crossword-grid :cells="grid.cells"></crossword-grid>
    <crossword-clue-input></crossword-clue-input>
    <crossword-current-clue v-if="grid_ready" :cells="grid.cells"></crossword-current-clue>

    <template v-if="crossword_id">
      <button :disabled="title === '' || language === null" v-on:click="save">{{ $t('button.save') }}</button>
      <button v-on:click="remove">{{ $t('button.delete') }}</button>
    </template>
    <button v-else :disabled="title === '' || language === null" v-on:click="create">Create</button>
    <input type="checkbox" id="wip" v-model="work_in_progress"><label for="wip" title="Work in progress">🚧</label>

    <crossword-clues :cells="grid.cells"></crossword-clues>
    
  </div>`,
  props: {
    crossword_id: String
  },
  data: function() {
    return {
      show_help: false,
      grid_ready: false,
      title: null,
      language: null,
      categories: {hard: false, personal: false, kids: false},
      work_in_progress: null,
      data_store: Data_store,
      rows: null,
      columns: null,
      grid: []
    }
  },
  computed: {
    valid_categories() {
      categories = {};
      for (let [key, value] of Object.entries(this.data_store.categories)) {
        if (key in this.categories) {
          categories[key] = value;
          categories[key].active = this.categories[key];
        }
      }
      return categories;
    }
  },
  watch: {
    rows: function(new_value, old_value) {
      if (!this.grid_ready) {
        return;
      }
      if (old_value === null) {
        this.grid.add_rows(this.rows, this.columns);
      } else if (old_value < new_value) {
        this.grid.add_rows(new_value - old_value);
      } else if (old_value > new_value) {
        this.grid.del_rows(old_value - new_value);
      }
      this.grid.numerate_cells();
    },
    columns: function(new_value, old_value) {
      if (!this.grid_ready) {
        return;
      }
      if (old_value === null) {
        // ignore during setup
      } else if (old_value < new_value) {
        this.grid.add_columns(new_value - old_value);
      } else if (old_value > new_value) {
        this.grid.del_columns(old_value - new_value);
      }
      this.grid.numerate_cells();
    },
  },
  mounted() {
    if (this.crossword_id !== null) {
      localStorage.setItem('crossword_id', this.crossword_id);
      axios
        .get(basedir+'/api/', {
          params: {
            action: 'get',
            id: this.crossword_id,
            raw: true,
            author: this.data_store.player_id
          }
        })
        .then(response => {
          this.language = response.data.language;
          event_hub.$emit('set_locale', this.language);
          this.title = response.data.title;
          for (k in response.data.categories) {
            this.categories[k] = response.data.categories[k];
          }
          this.work_in_progress = response.data.work_in_progress;
          this.grid = new Grid();
          this.grid.read_from_json(response.data.grid);
          this.numerate_cells();
          this.columns = this.grid.cells[0].length;
          this.rows = this.grid.cells.length;
          this.$nextTick(() => {
            this.grid_ready = true;
          })
          this.data_store.cursor = new Cursor(this.grid);
        });
    } else {
      this.grid = new Grid();
      this.grid.add_rows(3, 3);
      this.numerate_cells();
      this.columns = 3;
      this.rows = 3;
      this.$nextTick(() => {
        this.grid_ready = true;
      })
      this.data_store.cursor = new Cursor(this.grid);
    }
    event_hub.$on('numerate_cells', this.numerate_cells);
    event_hub.$on('set_clue', this.set_clue);
    event_hub.$on('read_clue', this.read_clue);
  },
  destroyed() {
    localStorage.removeItem('crossword_id');
  },
  methods: {
    create: function() {
      let grid = this.grid.get_as_json();
      axios
        .post(basedir+'/api/', {
          action: 'create',
          title: this.title,
          language: this.language,
          grid: grid,
          categories: this.categories,
          work_in_progress: this.work_in_progress,
          author: this.data_store.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
    },
    save: function() {
      // localStorage.removeItem('crossword_editor_words');
      grid = this.grid.get_as_json();
      axios
        .post(basedir+'/api/', {
          action: 'update',
          id: this.crossword_id,
          title: this.title,
          language: this.language,
          grid: grid,
          categories: this.categories,
          work_in_progress: this.work_in_progress,
          author: this.data_store.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
    },
    remove: function() {
      // localStorage.removeItem('crossword_editor_words');
      axios
        .post(basedir+'/api/', {
          action: 'delete',
          id: this.crossword_id,
          author: this.data_store.player_id
        })
        .then(response => {
            this.$root.go('list');
        });
    },
    numerate_cells: function() {
      this.grid.numerate_cells();
    },
    read_clue: function(column, row, direction_horizontal, callback) {
      if (this.grid.cells[row][column].i === null) {
        return;
      }
      if (direction_horizontal) {
        callback(this.grid.cells[row][column].clue_h)
      } else {
        callback(this.grid.cells[row][column].clue_v)
      }
    },
    set_clue: function(column, row, direction_horizontal, clue) {
      if (direction_horizontal) {
        this.grid.cells[row][column].clue_h = clue
      } else {
        this.grid.cells[row][column].clue_v = clue
      }
    },
  }
});

Vue.component('crossword-cell', {
  template: `<td class="cell" v-on:click="click_on_cell" v-bind:class="[{black: cell.c === null}, {active: data_store.cursor.in_selection(cell.column, cell.row)}]" ref="cell">
            <sup v-if="cell.i !== null">{{cell.i}}</sup>
            <input type="text" v-model="cell.c" v-if="cell.c !== null" size="1" minlength="1" maxlength="1" ref="input" v-on:keyup="keymonitor" v-on:keydown="keyfilter" v-on:dblclick="dblclickmonitor" v-on:focus="activate">
  </td>`,
  props: {
    cell: Object
  },
  data: function() {
    return {
      data_store: Data_store
    }
  },
  mounted() {
    event_hub.$on('focus_to_cursor', this.focus_to_cursor);
    event_hub.$on('edit_clue', this.edit_clue);
  },
  methods: {
    edit_clue: function() {
      if (this.cell.is_equal(this.data_store.cursor)) {
        let box = this.$refs.cell.getBoundingClientRect();
        let cursor = this.data_store.cursor;
        let rows_n = cursor.grid.cells.length;
        let columns_n = cursor.grid.cells[this.cell.row].length;
        box.x -= (this.cell.column - cursor.start_selection[0]) * box.width;
        box.y -= (this.cell.row - cursor.start_selection[1]) * box.height;
        if (cursor.direction_horizontal) {
          if (this.cell.row + 1 < rows_n) {
            box.y += box.height;
          } else {
            box.y -= box.height;
          }
          box.width = box.width * (rows_n - this.cell.row - 1);
        } else {
          if (this.cell.row > 0) {
            box.y -= box.height;
          // TODO: if there is enough place on the left, we should align the input field to the right side
          // else if (this.cell.column > 4 && cursor.grid.cells[cursor.row].length - this.cell.column < 4 + 1)
          } else {
            box.x += box.width;
          }
        }
        event_hub.$emit('edit_clue_input', box);
      }
    },
    click_on_cell: function() {
      if (this.cell.c === null) {
        this.cell.c = '';
        event_hub.$emit('numerate_cells');
      }
    },
    keyfilter: function(e) {
      // space is used for switching between h and v direction
      if (e.code == "Space") {
        e.preventDefault();
      }
    },
    keymonitor: function(e) {
      cursor = this.data_store.cursor;
      let position = cursor.get_position();
      if (e.key == 'ArrowUp') {
        cursor.move_up();
      } else if (e.key == 'ArrowRight') {
        cursor.move_right();
      } else if (e.key == 'ArrowDown') {
        cursor.move_down();
      } else if (e.key == 'ArrowLeft') {
        cursor.move_left();
      } else if (e.key === 'Backspace') {
        cursor.back();
      } else if (e.key === 'Enter' && this.data_store.mode === 'edit') {
        if (this.cell.c === null) {
          this.cell.c = '';
          event_hub.$emit('numerate_cells');
        } else if (this.cell.c === '') {
          this.cell.c = null;
          cursor.next();
          event_hub.$emit('numerate_cells');
        } else {
            event_hub.$emit('edit_clue');
        }
      } else if (e.key === ' ') {
        cursor.switch_direction();
      } else {
        if (e.key.length == 1) {
          if (this.cell.c !== e.key) {
            this.cell.c = e.key;
          }
          cursor.next();
        }
      }
      if (!this.cell.is_equal(cursor)) {
        event_hub.$emit('focus_to_cursor');
      }
    },
    dblclickmonitor: function(e) {
      this.data_store.cursor.switch_direction();
    },
    focus_to_cursor: function() {
      if (this.cell.is_equal(this.data_store.cursor)) {
        if (typeof this.$refs.input !== 'undefined') {
          this.$refs.input.focus()
        }
      }
    },
    activate: function() {
      // cursor to the end of the text
      this.data_store.cursor.set_selection(this.cell.column, this.cell.row);
    }
  }
});

Vue.component('crossword-row', {
  template: `<tr class="row">
      <crossword-cell v-for="(cell, i) in row" v-bind:cell="cell" v-bind:key="i"></crossword-cell>
    </tr>`,
  props: {
    row: Array
  },
  data: function() {
    return {
    }
  },
  mounted() {
  },
  methods: {
  }
});

Vue.component('crossword-grid', {
  template: `<table class="grid">
      <crossword-row v-for="(row, i) in cells" v-bind:row="row" v-bind:key="i"></crossword-row>
    </table>`,
  props: {
    cells: Array
  },
  data: function() {
    return {
    }
  },
  watch: {
  },
  mounted() {
  },
  methods: {
  }
});

Vue.component('crossword-current-clue', {
  template: `<div class="current-clue">
      {{clue}}
    </div>`,
  props: {
    cells: Array
  },
  data: function() {
    return {
      data_store: Data_store,
    }
  },
  computed: {
    clue() {
      if (this.data_store.cursor === null) {
        return '';
      }
      const cursor = this.data_store.cursor;
      if (cursor .column === null) {
        return '';
      }
      const [i, j] = cursor.start_selection;
      const cell = this.cells[j][i];
      const clue =cursor.direction_horizontal === true ? cell.clue_h : cell.clue_v;
      return cell.i+'. '+(clue === null ? '...' : clue);
    }
  }
});

Vue.component('crossword-clues', {
  template: `<div class="clues">
      <h2>{{ $t('content.Accross') }}</h2>
      <div v-if="cells">
        <crossword-clue v-for="(cell, i) in clue_cells_horizontal" :cell="cell" :direction="'h'" v-bind:key="i"></crossword-clue>
      </div>
      <h2>{{ $t('content.Down') }}</h2>
      <div v-if="cells">
        <crossword-clue v-for="(cell, i) in clue_cells_vertical" :cell="cell" :direction="'v'" v-bind:key="i"></crossword-clue>
      </div>
    </div>`,
  props: {
    cells: Array
  },
  data: function() {
    return {
    }
  },
  computed: {
    clue_cells_horizontal() {
      cells = [];
      for (let j = 0; j < this.cells.length; j++) {
        for (let i = 0; i < this.cells[j].length; i++) {
          let cell = this.cells[j][i];
          if ((cell.h && cell.i != null) || cell.clue_h !== null) {
            cells.push(cell);
          }
        }
      }
      return cells;
    },
    clue_cells_vertical() {
      cells = [];
      for (let j = 0; j < this.cells.length; j++) {
        for (let i = 0; i < this.cells[j].length; i++) {
          let cell = this.cells[j][i];
          if ((cell.v && cell.i != null) || cell.clue_v !== null) {
            cells.push(cell);
          }
        }
      }
      return cells;
    }
  },
  watch: {
  },
  mounted() {
  },
  methods: {
  }
});

Vue.component('crossword-clue', {
  template: `<dl>
      <dt>{{cell.i}}</dt>
      <dd class="clue">
        <input v-if="edit" v-model="clue" v-on:keyup="keymonitor" v-on:blur="focusmonitor" ref="input">
        <span v-else-if="direction === 'h'" v-bind:class="{ active: isActive }">
        
        {{cell.clue_h}}
        </span>
        <span v-else v-bind:class="{ active: isActive }">
        {{cell.clue_v}}
        </span>
      </dd>
    </dl>`,
  props: {
    cell: Object,
    direction: String
  },
  data: function() {
    return {
      edit: false,
      data_store: Data_store,
      clue: null
    }
  },
  mounted() {
    // TODO: add an edit mode in the list
    // event_hub.$on('edit_clue', this.edit_clue);
  },
  computed: {
    isActive () {
      if ((this.direction === 'h') !== this.data_store.cursor.direction_horizontal) {
      return false;
      }
      if (this.cell.column !== this.data_store.cursor.start_selection[0]) {
        return false;
      }
      if (this.cell.row !== this.data_store.cursor.start_selection[1]) {
        return false;
      }
      return true;
    }
  },
  methods: {
    // edit_clue: function() {
    //   if ((this.direction === 'h') === this.data_store.cursor.direction_horizontal &&
    //     this.cell.is_equal(this.data_store.cursor.start_selection[0], this.data_store.cursor.start_selection[1])) {
    //     this.clue = this.data_store.cursor.direction_horizontal ? this.cell.clue_h : this.cell.clue_v;
    //     this.edit = true;
    //     this.$nextTick(() => {
    //       this.$refs.input.focus()
    //     })
    //   }
    // },
    focusmonitor: function(e) {
      this.edit = false;
    },
    keymonitor: function(e) {
      if (e.key == 'Enter' || e.key == 'Esc') {
        event_hub.$emit('set_clue', this.cell.column, this.cell.row, this.clue);
        this.edit = false;
        event_hub.$emit('focus_to_cursor');
      }
    },
  }
});

Vue.component('crossword-clue-input', {
  template: `<input v-if="edit" v-model="clue" v-on:keyup="keymonitor" v-on:blur="blurmonitor" ref="input">`,
  props: {
  },
  data: function() {
    return {
      edit: false,
      data_store: Data_store,
      clue: null
    }
  },
  mounted() {
    event_hub.$on('edit_clue_input', this.edit_clue);
  },
  methods: {
    edit_clue: function(position) {
      cursor = this.data_store.cursor;
      event_hub.$emit('read_clue', cursor.start_selection[0], cursor.start_selection[1], cursor.direction_horizontal, (clue) => {
        this.clue = clue
        this.edit = true;
        this.$nextTick(() => {
          let el = this.$refs.input;
          // console.log(el);
          el.style.position = "absolute";
          el.style.left = position.x+'px';
          el.style.height = position.height+'px';
          el.style.top = position.y+'px';
          el.focus()
        })
      });
    //   if ((this.direction === 'h') === this.data_store.cursor.direction_horizontal &&
    //     this.cell.is_equal(this.data_store.cursor.start_selection[0], this.data_store.cursor.start_selection[1])) {
    //     this.clue = this.data_store.cursor.direction_horizontal ? this.cell.clue_h : this.cell.clue_v;
    //     this.edit = true;
    //     this.$nextTick(() => {
    //       this.$refs.input.focus()
    //     })
    //   }
    },
    blurmonitor: function(e) {
      this.edit = false;
    },
    keymonitor: function(e) {
      if (e.key == 'Enter' || e.key == 'Esc') {
        cursor = this.data_store.cursor;
        event_hub.$emit('set_clue', cursor.start_selection[0], cursor.start_selection[1], cursor.direction_horizontal, this.clue);
        this.edit = false;
        event_hub.$emit('focus_to_cursor');
      }
    },
  }
});

// based on https://github.com/chrisvfritz/vue-2.0-simple-routing-example/blob/master/src/components/VLink.vue
// this version does not push the state to the history
Vue.component('a-link', {
  template: `<a
        v-bind:href="href"
        v-bind:class="{ active: isActive }"
        v-on:click="go"
      >
        <slot></slot>
      </a>`,
  props: {
    href: {
      type:String,
      required: true
    },
    params: {
      validator: p => typeof p === 'object' || p === null
    }
  },
  computed: {
    isActive () {
      // TODO: can we have a use for this?
      // return this.href === this.$root.a_link_target
      return false;
    }
  },
  methods: {
    go(event) {
      event.preventDefault()
      let vm = this.$parent;
      while (vm) {
        vm.$emit('a_link_event', this.href, this.params);
        vm = vm.$parent;
      }
    }
  }
});
