<?php
require_once __DIR__ . '/config.php';

try {
    $stmt = $pdo->query('SELECT * FROM categories ORDER BY name');
    $categories = $stmt->fetchAll();
    echo json_encode($categories);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed", "details" => $e->getMessage()]);
}
