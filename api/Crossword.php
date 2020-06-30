<?php

class Crossword
{
    static $db_version = 1;
    var $db = null;

    function __construct($db_file = 'db/crossword.db') {
        $install = !file_exists($db_file);

        $this->db = new SQLite3($db_file);

        $db_version = $this->db->querySingle('PRAGMA user_version');
        if ($db_version === 0) {
            $this->install_db();
        } elseif ($db_version < self::$db_version) {
                $this->update_db($db_file);
        }
    }

    function get_list($author = null) {
        $db_result = $this->db->query('SELECT
            crossword_hash, title, language, categories, work_in_progress, author
            FROM crossword');
        $list = [];
        while ($row = $db_result->fetchArray(SQLITE3_NUM)) {
            $list[] = [
                'hash' => $row[0],
                'title' => $row[1],
                'language' => $row[2],
                'categories' => json_decode($row[3], true),
                'work_in_progress' => $row[4],
                'editable' => $row[5] === $author
            ];
        }
        return $list;
    }

    function get($hash) {
        $stmt = $this->db->prepare('SELECT
            crossword_hash, title, language, categories, grid, work_in_progress, author
            FROM crossword
            WHERE crossword_hash = :hash');
        $stmt->bindValue(':hash', $hash);
        $db_result = $stmt->execute();
        $row = $db_result->fetchArray(SQLITE3_NUM);
        return $row ?
            [$row[0], $row[1], $row[2], json_decode($row[3], true),
                json_decode($row[4], true), $row[5], $row[6]]:
            array_fill(0, 7, null);
    }

    public function add($title, $language, $grid, $categories, $work_in_progress, $author) {
        $crossword_hash = Crossword::uuidv4();
        $stmt = $this->db->prepare('INSERT INTO crossword
            (crossword_hash, title, language, grid, categories, work_in_progress, author)
            VALUES (:crossword_hash, :title, :language, :grid, :categories, :work_in_progress, :author)');
        $stmt->bindValue(':crossword_hash', $crossword_hash, SQLITE3_TEXT);
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':language', $language, SQLITE3_TEXT);
        $stmt->bindValue(':grid', json_encode($grid), SQLITE3_TEXT);
        $stmt->bindValue(':categories', json_encode($categories), SQLITE3_TEXT);
        $stmt->bindValue(':work_in_progress', $work_in_progress, SQLITE3_INTEGER);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $stmt->execute();
        return [$this->db->lastInsertRowid(), $crossword_hash];
    }

    public function set($crossword_hash, $title, $language, $grid, $categories, $work_in_progress, $author) {
        $stmt = $this->db->prepare('UPDATE crossword SET
            (title, language, grid, categories, work_in_progress) =
                (:title, :language, :grid, :categories, :work_in_progress)
            WHERE crossword_hash = :crossword_hash AND
                author = :author');
        $stmt->bindValue(':title', $title, SQLITE3_TEXT);
        $stmt->bindValue(':language', $language, SQLITE3_TEXT);
        $stmt->bindValue(':grid', json_encode($grid), SQLITE3_TEXT);
        $stmt->bindValue(':categories', json_encode($categories), SQLITE3_TEXT);
        $stmt->bindValue(':work_in_progress', $work_in_progress, SQLITE3_INTEGER);
        $stmt->bindValue(':crossword_hash', $crossword_hash, SQLITE3_TEXT);
        $stmt->bindValue(':author', $author, SQLITE3_TEXT);
        $result = $stmt->execute();
        return [$this->db->lastInsertRowid(), $crossword_hash];
    }

    // https://stackoverflow.com/a/2117523/5239250
    // (it would be good to use random_bytes(),
    // see https://stackoverflow.com/questions/2040240
    public static function uuidv4() {
        $result = preg_replace_callback('/[018]/',
            function($matches) {
                $c = $matches[0];
                return base_convert($c ^ random_int(0, 255) & 15 >> $c / 4, 10, 16);
                },
                '10000000-1000-4000-8000-100000000000');
        print_r($result, 1);
        return $result;
    }

    function install_db() {
        // $this->db->query("DROP TABLE schema");
        // $this->db->query("DROP TABLE player");
        $this->db->query("CREATE TABLE IF NOT EXISTS crossword (
                crossword_id INTEGER PRIMARY KEY,
                crossword_hash TEXT,
                title TEXT,
                language TEXT,
                grid TEXT,
                categories TEXT DEFAULT \"{}\",
                work_in_progress BOOLEAN,
                author TEXT
            );
        ");
    }

    function update_db($db_file) {
        $backup = $db_file.'~'.date('Ymd-His');
        exec("sqlite3 '$db_file' '.backup '".$backup."''");

        // $db_version = $db->exec('PRAGMA user_version=0');
        $db_version = $this->db->querySingle('PRAGMA user_version');

        if ($db_version < 2) {
            // $this->db->exec('
            //     ALTER TABLE crossword
            //         ADD categories TEXT DEFAULT "{}"
            // ');
        }
        $this->db->exec('PRAGMA user_version='.self::$db_version);
    }
}
