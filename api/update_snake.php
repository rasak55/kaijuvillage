<?php
require_once __DIR__ . '/config.php';

// Parse POST/PUT input
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['id']) || empty($data['name']) || empty($data['species'])) {
    http_response_code(400);
    echo json_encode(["error" => "ID, name, and species are required fields."]);
    exit();
}

$id = (int)$data['id'];

try {
    // Start SQL Transaction
    $pdo->beginTransaction();

    // 1. Update snakes table
    $sqlSnake = "UPDATE snakes SET 
                    name = :name, 
                    species = :species, 
                    morph = :morph, 
                    price_cents = :price_cents, 
                    availability = :availability, 
                    thumbnail_url = :thumbnail_url, 
                    gallery_image_url = :gallery_image_url, 
                    category_id = :category_id 
                 WHERE id = :id";
    
    $stmtSnake = $pdo->prepare($sqlSnake);
    $stmtSnake->execute([
        ':id' => $id,
        ':name' => trim($data['name']),
        ':species' => trim($data['species']),
        ':morph' => isset($data['morph']) ? trim($data['morph']) : null,
        ':price_cents' => isset($data['price_cents']) ? (int)$data['price_cents'] : 0,
        ':availability' => isset($data['availability']) ? $data['availability'] : 'available',
        ':thumbnail_url' => isset($data['gallery_image_url']) ? trim($data['gallery_image_url']) : null,
        ':gallery_image_url' => isset($data['gallery_image_url']) ? trim($data['gallery_image_url']) : null,
        ':category_id' => !empty($data['category_id']) ? (int)$data['category_id'] : null
    ]);

    // 2. Update snake_details table
    $sqlDetails = "UPDATE snake_details SET 
                    gender = :gender, 
                    age_years = :age_years, 
                    length_inches = :length_inches, 
                    weight_grams = :weight_grams, 
                    market_valuation_cents = :price_cents, 
                    description = :description 
                   WHERE snake_id = :id";
    
    $stmtDetails = $pdo->prepare($sqlDetails);
    $stmtDetails->execute([
        ':id' => $id,
        ':gender' => isset($data['gender']) ? $data['gender'] : 'unsexed',
        ':age_years' => isset($data['age_years']) && $data['age_years'] !== '' ? (float)$data['age_years'] : null,
        ':length_inches' => isset($data['length_inches']) && $data['length_inches'] !== '' ? (float)$data['length_inches'] : null,
        ':weight_grams' => isset($data['weight_grams']) && $data['weight_grams'] !== '' ? (float)$data['weight_grams'] : null,
        ':price_cents' => isset($data['price_cents']) ? (int)$data['price_cents'] : 0,
        ':description' => isset($data['description']) ? trim($data['description']) : null
    ]);

    // 3. Upsert lineage table (using INSERT ... ON DUPLICATE KEY UPDATE)
    $sireId = !empty($data['sire_id']) ? (int)$data['sire_id'] : null;
    $damId = !empty($data['dam_id']) ? (int)$data['dam_id'] : null;

    $sqlLineage = "INSERT INTO lineage (snake_id, sire_id, dam_id) 
                   VALUES (:id, :sire_id, :dam_id) 
                   ON DUPLICATE KEY UPDATE sire_id = :sire_id_up, dam_id = :dam_id_up";
    $stmtLineage = $pdo->prepare($sqlLineage);
    $stmtLineage->execute([
        ':id' => $id,
        ':sire_id' => $sireId,
        ':dam_id' => $damId,
        ':sire_id_up' => $sireId,
        ':dam_id_up' => $damId
    ]);

    // 4. Update primary image url in snake_images table
    if (!empty($data['gallery_image_url'])) {
        $stmtCheckImage = $pdo->prepare("SELECT id FROM snake_images WHERE snake_id = :id AND is_primary = TRUE");
        $stmtCheckImage->execute([':id' => $id]);
        $hasPrimary = $stmtCheckImage->fetch();

        if ($hasPrimary) {
            $stmtUpdateImage = $pdo->prepare("UPDATE snake_images SET image_url = :image_url WHERE snake_id = :id AND is_primary = TRUE");
            $stmtUpdateImage->execute([
                ':id' => $id,
                ':image_url' => trim($data['gallery_image_url'])
            ]);
        } else {
            $stmtInsertImage = $pdo->prepare("INSERT INTO snake_images (snake_id, image_url, alt_text, sort_order, is_primary)
                                               VALUES (:id, :image_url, :alt_text, 0, TRUE)");
            $stmtInsertImage->execute([
                ':id' => $id,
                ':image_url' => trim($data['gallery_image_url']),
                ':alt_text' => trim($data['name'])
            ]);
        }
    }

    // 5. Update additional images
    // First, delete non-primary images for this snake
    $stmtDelImages = $pdo->prepare("DELETE FROM snake_images WHERE snake_id = :id AND is_primary = FALSE");
    $stmtDelImages->execute([':id' => $id]);

    // Then, insert new additional images
    if (!empty($data['additional_images']) && is_array($data['additional_images'])) {
        $sqlAddImage = "INSERT INTO snake_images (snake_id, image_url, alt_text, sort_order, is_primary)
                        VALUES (:snake_id, :image_url, :alt_text, :sort_order, FALSE)";
        $stmtAddImage = $pdo->prepare($sqlAddImage);
        foreach ($data['additional_images'] as $idx => $imgUrl) {
            if (!empty(trim($imgUrl))) {
                $stmtAddImage->execute([
                    ':snake_id' => $id,
                    ':image_url' => trim($imgUrl),
                    ':alt_text' => trim($data['name']) . ' gallery image ' . ($idx + 1),
                    ':sort_order' => $idx + 1
                ]);
            }
        }
    }

    // Commit Transaction
    $pdo->commit();

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Failed to update specimen.", "details" => $e->getMessage()]);
}
