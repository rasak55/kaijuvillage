<?php
require_once __DIR__ . '/config.php';

// Parse POST input
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['name']) || empty($data['species'])) {
    http_response_code(400);
    echo json_encode(["error" => "Name and species are required fields."]);
    exit();
}

try {
    // Start SQL Transaction
    $pdo->beginTransaction();

    // 1. Generate SEO-friendly public identifier UUID
    $uuid = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($data['name']))) . '-' . bin2hex(random_bytes(3));

    // 2. Insert into snakes table
    $sqlSnake = "INSERT INTO snakes (uuid, name, species, morph, price_cents, availability, thumbnail_url, gallery_image_url, category_id)
                 VALUES (:uuid, :name, :species, :morph, :price_cents, :availability, :thumbnail_url, :gallery_image_url, :category_id)";
    
    $stmtSnake = $pdo->prepare($sqlSnake);
    $stmtSnake->execute([
        ':uuid' => $uuid,
        ':name' => trim($data['name']),
        ':species' => trim($data['species']),
        ':morph' => isset($data['morph']) ? trim($data['morph']) : null,
        ':price_cents' => isset($data['price_cents']) ? (int)$data['price_cents'] : 0,
        ':availability' => isset($data['availability']) ? $data['availability'] : 'available',
        ':thumbnail_url' => isset($data['gallery_image_url']) ? trim($data['gallery_image_url']) : null,
        ':gallery_image_url' => isset($data['gallery_image_url']) ? trim($data['gallery_image_url']) : null,
        ':category_id' => !empty($data['category_id']) ? (int)$data['category_id'] : null
    ]);

    $snakeId = $pdo->lastInsertId();

    // 3. Insert into snake_details table
    $sqlDetails = "INSERT INTO snake_details (snake_id, gender, age_years, length_inches, weight_grams, market_valuation_cents, tax_included, description)
                   VALUES (:snake_id, :gender, :age_years, :length_inches, :weight_grams, :market_valuation_cents, :tax_included, :description)";
    
    $stmtDetails = $pdo->prepare($sqlDetails);
    $stmtDetails->execute([
        ':snake_id' => $snakeId,
        ':gender' => isset($data['gender']) ? $data['gender'] : 'unsexed',
        ':age_years' => isset($data['age_years']) && $data['age_years'] !== '' ? (float)$data['age_years'] : null,
        ':length_inches' => isset($data['length_inches']) && $data['length_inches'] !== '' ? (float)$data['length_inches'] : null,
        ':weight_grams' => isset($data['weight_grams']) && $data['weight_grams'] !== '' ? (float)$data['weight_grams'] : null,
        ':market_valuation_cents' => isset($data['price_cents']) ? (int)$data['price_cents'] : 0,
        ':tax_included' => 1,
        ':description' => isset($data['description']) ? trim($data['description']) : null
    ]);

    // 4. Insert into lineage table
    $sireId = !empty($data['sire_id']) ? (int)$data['sire_id'] : null;
    $damId = !empty($data['dam_id']) ? (int)$data['dam_id'] : null;

    if ($sireId !== null || $damId !== null) {
        $sqlLineage = "INSERT INTO lineage (snake_id, sire_id, dam_id) VALUES (:snake_id, :sire_id, :dam_id)";
        $stmtLineage = $pdo->prepare($sqlLineage);
        $stmtLineage->execute([
            ':snake_id' => $snakeId,
            ':sire_id' => $sireId,
            ':dam_id' => $damId
        ]);
    }

    // 5. Insert into snake_images table (Primary image)
    if (!empty($data['gallery_image_url'])) {
        $sqlImage = "INSERT INTO snake_images (snake_id, image_url, alt_text, sort_order, is_primary)
                     VALUES (:snake_id, :image_url, :alt_text, 0, TRUE)";
        $stmtImage = $pdo->prepare($sqlImage);
        $stmtImage->execute([
            ':snake_id' => $snakeId,
            ':image_url' => trim($data['gallery_image_url']),
            ':alt_text' => trim($data['name'])
        ]);
    }

    // 6. Insert additional images
    if (!empty($data['additional_images']) && is_array($data['additional_images'])) {
        $sqlAddImage = "INSERT INTO snake_images (snake_id, image_url, alt_text, sort_order, is_primary)
                        VALUES (:snake_id, :image_url, :alt_text, :sort_order, FALSE)";
        $stmtAddImage = $pdo->prepare($sqlAddImage);
        foreach ($data['additional_images'] as $idx => $imgUrl) {
            if (!empty(trim($imgUrl))) {
                $stmtAddImage->execute([
                    ':snake_id' => $snakeId,
                    ':image_url' => trim($imgUrl),
                    ':alt_text' => trim($data['name']) . ' gallery image ' . ($idx + 1),
                    ':sort_order' => $idx + 1
                ]);
            }
        }
    }

    // Commit Transaction
    $pdo->commit();

    echo json_encode(["success" => true, "id" => $snakeId, "uuid" => $uuid]);
} catch (Exception $e) {
    // Rollback Transaction if any query fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Failed to create specimen.", "details" => $e->getMessage()]);
}
