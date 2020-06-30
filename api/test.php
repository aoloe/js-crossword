<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once("Crossword.php");


$test_db = 'db/test-crossword.db';
unlink($test_db);

(function() use ($test_db) {
    $crossword = new Crossword($test_db);
    $list = $crossword->get_list();
    echo('<pre>list: '.print_r($list, 1).'</pre>');
})();

(function() use ($test_db){
    $crossword = new Crossword($test_db);
    $crossword->add(
        'test',
        'en',
        [
          "grid" => "abc\nsui\naga",
          "accross" =>  [[0, 0, "alpha", "abc"]],
          "down" => [[2, 0, "secret", "cia"]]
        ],
        [],
        false,
        Crossword::uuidv4()

    );
    $list = $crossword->get_list();
    echo('<pre>list: '.print_r($list, 1).'</pre>');
})();

(function() use ($test_db){
    $crossword = new Crossword($test_db);
    $list = $crossword->get_list();
    $game = $crossword->get(
        $list[0]['hash']
    );
    echo('<pre>game: '.print_r($game, 1).'</pre>');
})();

(function() use ($test_db){
    $crossword = new Crossword($test_db);
    $list = $crossword->get_list();
    $game = $crossword->get(
        $list[0]['hash']
    );
    $crossword->set(
        $game[0],
        'testa',
        'en',
        [
          "grid" => "abc\nsui\nada",
          "accross" =>  [[0, 0, "alpha", "abc"]],
          "down" => [[2, 0, "secret", "cia"]]
        ],
        [],
        false,
        $game[6],

    );
    $game = $crossword->get(
        $list[0]['hash']
    );
    echo('<pre>game updated: '.print_r($game, 1).'</pre>');
})();
