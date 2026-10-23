<?php
require_once __DIR__ . '/config.php';

// Parse POST/DELETE input
$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? (int)$data['id'] : null;

if ($id === null) {
    http_response_code(400);
    echo json_encode(["error" => "ID is required."]);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM snakes WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Specimen not found."]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to delete specimen.", "details" => $e->getMessage()]);
}
