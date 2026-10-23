<?php
require_once __DIR__ . '/config.php';

// Parse POST JSON input
$data = json_decode(file_get_contents('php://input'), true);
$username = isset($data['username']) ? trim($data['username']) : null;
$password = isset($data['password']) ? $data['password'] : null;

if ($username === null || $password === null) {
    http_response_code(400);
    echo json_encode(["error" => "Username and password required"]);
    exit();
}

try {
    // If the users table is completely empty, auto-seed a default admin account
    $countStmt = $pdo->query("SELECT COUNT(*) as cnt FROM users");
    $userCount = $countStmt->fetch()['cnt'];
    
    if ($userCount == 0) {
        $defaultPassword = 'adminpassword';
        $hashed = password_hash($defaultPassword, PASSWORD_BCRYPT);
        $insertSeed = $pdo->prepare("INSERT INTO users (username, email, password_hash, display_name, role) VALUES ('admin', 'admin@kaijuvillage.com', :hash, 'Default Admin', 'admin')");
        $insertSeed->execute([':hash' => $hashed]);
    }

    // Query admin user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username AND role = 'admin'");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => (int)$user['id'],
                "username" => $user['username'],
                "display_name" => $user['display_name'],
                "role" => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid admin username or password"]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Login query failed", "details" => $e->getMessage()]);
}
