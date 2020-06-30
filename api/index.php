<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$config = include_once("config.php");
include_once("TinyRest.php");
include_once("Crossword.php");

$app = new Aoloe\TinyRest\App('action');
$request = Aoloe\TinyRest\HttpRequest::create();
$response = new Aoloe\TinyRest\HttpResponse();

$app->get('list', function() use($config, $request, $response) {
    $list = [];
    $crossword = new Crossword($config['db']);
    $author = $request->get('author');
    foreach ($crossword->get_list($author) as $item) {
        $list[] = [
            'crossword_id' => $item['hash'],
            'title' => $item['title'],
            'language' => $item['language'],
                'categores' => $item['categories'],
                'work_in_progress' => $item['work_in_progress'],
                'editable' => $item['editable']
            ];
    }
    $response->respond([
        'admin' => in_array($author, $config['admin']),
        'list' => $list
    ]);
});

$app->get('get', function() use($config, $request, $response) {
    $crossword = new Crossword($config['db']);
    $author = null;
    $raw = false;
    if ($request->has('raw') && $request->has('author')) {
        $raw = $request->get('raw') === 'true' ? true : false;
        $author = $request->get('author');
    }
    [$hash, $title, $language, $categories, $grid, $work_in_progress, $crossword_author] = $crossword->get($request->get('id'));
    // echo("<pre>grid:".print_r($grid,1)."</pre>");
    if ($author !== $crossword_author) {
        for ($i = 0; $i < strlen($grid['grid']); $i++) {
            $cell = $grid['grid'][$i];
            if ($cell !== '#' && $cell !== "\n") {
                $grid['grid'][$i] = ' ';
            }
        }
    }
    if ($raw) {
        // TODO: check that the author is authorized
        $response->respond([
            'crossword_id' => $hash,
            'title' => $title,
            'grid' => $grid,
            'language' => $language,
            'categories' => $categories,
            'work_in_progress' => $work_in_progress,
            'author' => $author
        ]);
    } else {
        $response->respond([
            'crossword_id' => $hash,
            'title' => $title,
            'language' => $language,
            'grid' => $grid
        ]);
    }
});

$app->post('create', function() use($config, $request, $response) {
    $crossword = new Crossword($config['db']);
    // TODO: add a creation date
    [$id, $hash] = $crossword->add(
        $request->get('title'),
        $request->get('language'),
        $request->get('grid'),
        $request->get('categories'),
        $request->get('work_in_progress'),
        $request->get('author')
    );
    $response->respond(['id' => $hash]);
});

$app->post('update', function() use($config, $request, $response) {
    $cipher = new Crossword($config['db']);
    [$id, $hash] = $cipher->set(
        $request->get('id'),
        $request->get('title'),
        $request->get('language'),
        $request->get('grid'),
        $request->get('categories'),
        $request->get('work_in_progress'),
        $request->get('author')
    );
    $response->respond(['id' => $hash]);
});

$app->post('delete', function() use($config, $request, $response) {
    $crossword = new Crossword($config['db']);
    [$hash] = $crossword->delete(
        $request->get('id'),
        $request->get('author')
    );
    $response->respond(['hash' => $hash]);
});

if (!$app->run($request)) {
    $response->respond($app->error_message);
}
