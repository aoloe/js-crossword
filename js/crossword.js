Crossword = function() {
}

Crossword.get_basedir = function get_basedir(url) {
  return url.slice(-1) == '/' ? url.slice(0, -1) : url.split('/').slice(0,-1).join('/');
}

// https://stackoverflow.com/a/2117523/5239250
Crossword.uuidv4 = function () {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function Cell(c, column, row) {
  this.c = c;
  this.column = column;
  this.row = row;
  this.i = null;
  // TODO: rename to clue_a
  this.clue_h = null;
  // TODO: rename to clue_d
  this.clue_v = null;
  // TODO: rename to accross
  this.h = false;
  // TODO: rename to down
  this.v = false;
}

Cell.prototype.to_id = function() {
  return Cell.coo_to_id(this.row, this.column);
}

Cell.coo_to_id = function(i, j) {
  return 'crossword-cell-'+i.toString()+'-'+j.toString();
}

Cell.prototype.is_equal = function(column_or_cell, row = null) {
  if (row === null) {
    return this.column === column_or_cell.column && this.row === column_or_cell.row;
  } else {
    return this.column === column_or_cell && this.row === row;
  }
}

function Cursor(grid) {
  this.grid = grid;
  this.column = null;
  this.row = null;
  this.direction_horizontal = true;
  this.start_selection = [null, null];
  this.end_selection = [null, null];
  this.background_color = 'lightgray';
}
Cursor.prototype.switch_direction = function() {
  this.direction_horizontal = !this.direction_horizontal;
  this.update_highlight();
}
Cursor.prototype.in_selection = function(i, j) {
  if (this.start_selection[0] === null) {
    return false;
  }
  if (this.direction_horizontal) {
    return j === this.start_selection[1] && i >= this.start_selection[0] && i <= this.end_selection[0];
  } else {
    return i === this.start_selection[0] && j >= this.start_selection[1] && j <= this.end_selection[1];
  }
}
Cursor.prototype.set_selection = function(i, j) {
  this.column = i;
  this.row = j;
  if (!this.in_selection(i, j)) {
    this.update_highlight();
  }
}
Cursor.prototype.get_position = function() {
  return [this.column, this.row];
}
Cursor.prototype.update_highlight = function() {
  if (this.direction_horizontal) {
    for (let i = this.column; i >= 0; i--) {
      if (i === 0 || this.grid.is_block(i - 1, this.row)) {
        this.start_selection = [i, this.row];
        break;
      }
    }
    for (let i = this.column; i < this.grid.cells[0].length; i++) {
      if (i === this.grid.cells[0].length - 1 || this.grid.is_block(i + 1, this.row)) {
        this.end_selection = [i, this.row];
        break;
      }
    }
  } else {
    for (let j = this.row; j >= 0; j--) {
      if (j === 0 || this.grid.is_block(this.column, j - 1)) {
        this.start_selection = [this.column, j];
        break;
      }
    }
    for (let j = this.row; j < this.grid.cells.length; j++) {
      if (j === this.grid.cells.length - 1 || this.grid.is_block(this.column, j + 1)) {
        this.end_selection = [this.column, j];
        break;
      }
    }
  }
}
Cursor.prototype.move_up = function() {
  let j = this.row - 1;
  if (this.grid.is_in_top_bounds(j) && !this.grid.is_block(this.column, j)) {
    this.row = j;
  }
}
Cursor.prototype.move_right = function() {
  let i = this.column + 1;
  if (this.grid.is_in_right_bounds(i) && !this.grid.is_block(i, this.row)) {
    this.column = i;
  }
}
Cursor.prototype.move_down = function() {
  let j = this.row + 1;
  if (this.grid.is_in_bottom_bounds(j) && !this.grid.is_block(this.column, j)) {
    this.row = j;
  }
}
Cursor.prototype.move_left = function() {
  let i = this.column - 1;
  if (this.grid.is_in_left_bounds(i) && !this.grid.is_block(i, this.row)) {
    this.column = i;
  }
}
Cursor.prototype.next = function() {
  return this.direction_horizontal ? this.move_right() : this.move_down();
}
Cursor.prototype.back = function() {
  return this.direction_horizontal ? this.move_left() : this.move_up();
}

function Grid(schema = null) {
  this.cells = [];
  if (schema !== null) {
    this.read_schema(schema);
    this.numerate_cells();
  }
}
Grid.prototype.get_as_json = function() {
  let grid = [];
  let accross = []
  let down = []
  for (let j = 0; j < this.cells.length; j++) {
    let row = '';
    for (const [i, cell] of this.cells[j].entries()) {
      // console.log('cell', cell);
      if (cell.c === null) {
        row += '#'
      } else if (cell.c === '') {
        row += ' '
      } else {
        row += cell.c;
      }
      if (cell.clue_h !== null) {
        accross.push([i, j, cell.clue_h, this.get_word_accross(i, j)]);
      }
      if (cell.clue_v !== null) {
        down.push([i, j, cell.clue_v, this.get_word_down(i, j)]);
      }
    }
    grid.push(row);
  }
  // console.log('grid', grid.join('\n'));
  // console.log('accross', accross);
  // console.log('down', down);
  return {'grid': grid.join('\n'), 'accross': accross, 'down' : down}
}
Grid.prototype.read_from_json = function(json_grid) {
  const rows = json_grid.grid.split('\n');
  this.add_rows(rows.length, rows[0].length);
  Object.values(rows).forEach((row, j)=> {
    Object.values(row).forEach((letter, i)=> {
      if (letter === '#') {
        this.cells[j][i].c = null;
      } else if (letter === ' ') {
        this.cells[j][i].c = '';
      } else {
        this.cells[j][i].c = letter;
      }
    })
  });
  for (const clue of json_grid.accross) {
    this.cells[clue[1]][clue[0]].clue_h = clue[2];
  }
  for (const clue of json_grid.down) {
    this.cells[clue[1]][clue[0]].clue_v = clue[2];
  }
}

Grid.prototype.get_word_accross = function(i, j) {
  let word = '';
  for (const cell of this.cells[j]) {
    if (cells.c === null) {
      return word;
    }
    word += cell.c;
  }
  return word;
},
Grid.prototype.get_word_down = function(i, j) {
  let word = '';
  for (const row of this.cells) {
    if (row[i].c === null) {
      return word;
    }
    word += row[i].c;
  }
  return word;
}
Grid.prototype.read_schema = function(schema) {
  lines = schema.split('\n');
  // read characters and blocks
  for (let i = 0; i < lines.length; i++) {
    line = lines[i].trim();
    if (line[0] === '|' && line[line.length -1] === '|') {
      line = line.slice(1).slice(0, -1);
    }
    if (line.length > 0) {
      row = [];
      for (let j = 0; j < line.length; j++) {
        character = line.charAt(j);
        cell = null;
        if (character === '*') {
          cell = new Cell(null);
        } else if (character === ' ') {
          cell = new Cell('');
        } else {
          cell = new Cell(character);
        }
        row.push(cell);
      }
      this.cells.push(row);
    }
  }
}

Grid.prototype.add_rows = function(rows, columns = null) {
  if (columns === null) {
    columns = this.cells[0].length; 
  }
  for (let i = 0; i < rows; i++) {
    let row = [];
    for (let j = 0; j < columns; j++) {
      row.push(new Cell('', j, this.cells.length));
    }
    this.cells.push(row);
  }
}

Grid.prototype.del_rows = function(rows) {
  this.cells.splice(this.cells.length - rows, rows);
}

Grid.prototype.add_columns = function(columns) {
  for (let i = 0; i < this.cells.length; i++) {
    this.cells[i].push(new Cell('', this.cells[i].length, i));
  }
}

Grid.prototype.del_columns = function(columns) {
  for (let i = 0; i < this.cells.length; i++) {
    this.cells[i].splice(this.cells[i].length - columns, columns);
  }
}

/// numerate the clues
Grid.prototype.numerate_cells = function(i, j) {
  i_word = 0;
  for (let j = 0; j < this.cells.length; j++) {
    for (let i = 0; i < this.cells[j].length; i++) {
      let cell = this.cells[j][i];
      cell.i = null;
      cell.h = false;
      cell.v = false;
      if (this.is_block(i, j)) {
        continue;
      }
      if ((i === 0 || this.is_block(i - 1, j)) && 
        this.is_in_right_bounds(i + 1) && !this.is_block(i + 1, j)) {
          i_word++;
          cell.i = i_word;
          cell.h = true;
      }
      if ((j === 0 || this.is_block(i, j - 1)) &&
        this.is_in_bottom_bounds(j + 1) && !this.is_block(i, j + 1)) {
          if (cell.h === false) {
            i_word++;
          }
          cell.i = i_word;
          cell.v = true;
      }
    }
  }
}
Grid.prototype.is_in_top_bounds = function(j) {
  return j >= 0;
}
Grid.prototype.is_in_bottom_bounds = function(j) {
  return j < this.cells.length;
}
Grid.prototype.is_in_left_bounds = function(i) {
  return i >= 0;
}
Grid.prototype.is_in_right_bounds = function(i) {
  return i < this.cells[0].length;
}
Grid.prototype.is_in_forward_bounds = function(i, j) {
  return this.direction_horizontal ? this.is_in_right_bounds(i) : this.is_in_bottom_bounds(j);
}
Grid.prototype.is_in_backward_bounds = function(i, j) {
  return this.direction_horizontal ? this.is_in_left_bounds(i) : this.is_in_top_bounds(j);
}
Grid.prototype.is_block = function(i, j) {
  return this.cells[j][i].c === null;
}
