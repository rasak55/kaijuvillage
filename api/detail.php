<?php
require_once __DIR__ . '/config.php';

try {
    $uuid = isset($_GET['uuid']) ? $_GET['uuid'] : null;
    if ($uuid === null) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required parameter 'uuid'"]);
        exit();
    }

    // 1. Fetch Snake and Details
    $sql = "SELECT s.*, c.name AS category_name, 
                   sd.gender, sd.age_years, sd.length_inches, sd.weight_grams, sd.market_valuation_cents, sd.tax_included, sd.description
            FROM snakes s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN snake_details sd ON s.id = sd.snake_id
            WHERE s.uuid = :uuid";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uuid' => $uuid]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(["error" => "Specimen not found"]);
        exit();
    }

    $snake_id = (int)$row['id'];

    // 2. Fetch Images
    $stmtImages = $pdo->prepare("SELECT * FROM snake_images WHERE snake_id = :snake_id ORDER BY sort_order");
    $stmtImages->execute([':snake_id' => $snake_id]);
    $images = $stmtImages->fetchAll();

    // Map default fallback image if empty
    if (empty($images)) {
        $images = [
            [
                "id" => 999,
                "snake_id" => $snake_id,
                "image_url" => $row['gallery_image_url'] ? $row['gallery_image_url'] : ($row['thumbnail_url'] ? $row['thumbnail_url'] : ''),
                "alt_text" => $row['name'],
                "sort_order" => 1,
                "is_primary" => true
            ]
        ];
    } else {
        // Cast types
        foreach ($images as &$img) {
            $img['id'] = (int)$img['id'];
            $img['snake_id'] = (int)$img['snake_id'];
            $img['sort_order'] = (int)$img['sort_order'];
            $img['is_primary'] = (bool)$img['is_primary'];
        }
    }

    // 3. Fetch History Timeline Events
    $stmtHistory = $pdo->prepare("SELECT * FROM history_events WHERE snake_id = :snake_id ORDER BY event_date DESC");
    $stmtHistory->execute([':snake_id' => $snake_id]);
    $history = $stmtHistory->fetchAll();
    foreach ($history as &$evt) {
        $evt['id'] = (int)$evt['id'];
        $evt['snake_id'] = (int)$evt['snake_id'];
    }

    // 4. Fetch Lineage Sire and Dam
    $stmtLineage = $pdo->prepare("SELECT sire_id, dam_id FROM lineage WHERE snake_id = :snake_id");
    $stmtLineage->execute([':snake_id' => $snake_id]);
    $lineageRow = $stmtLineage->fetch();

    $lineageData = null;
    if ($lineageRow) {
        $sire_id = $lineageRow['sire_id'];
        $dam_id = $lineageRow['dam_id'];
        
        $parentIds = [];
        if ($sire_id !== null) $parentIds[] = (int)$sire_id;
        if ($dam_id !== null) $parentIds[] = (int)$dam_id;

        if (!empty($parentIds)) {
            $inClause = implode(',', array_fill(0, count($parentIds), '?'));
            $parentSql = "SELECT s.*, sd.gender, sd.weight_grams, sd.age_years
                          FROM snakes s
                          LEFT JOIN snake_details sd ON s.id = sd.snake_id
                          WHERE s.id IN ($inClause)";
            
            $stmtParents = $pdo->prepare($parentSql);
            $stmtParents->execute($parentIds);
            $parents = $stmtParents->fetchAll();

            $sire = null;
            $dam = null;
            
            foreach ($parents as $p) {
                $pData = [
                    "id" => (int)$p['id'],
                    "uuid" => $p['uuid'],
                    "name" => $p['name'],
                    "species" => $p['species'],
                    "morph" => $p['morph'],
                    "price_cents" => (int)$p['price_cents'],
                    "availability" => $p['availability'],
                    "thumbnail_url" => $p['thumbnail_url'],
                    "gallery_image_url" => $p['gallery_image_url'],
                    "category_id" => $p['category_id'] !== null ? (int)$p['category_id'] : null,
                    "detail" => $p['gender'] !== null ? [
                        "gender" => $p['gender'],
                        "age_years" => $p['age_years'] !== null ? (float)$p['age_years'] : null,
                        "weight_grams" => $p['weight_grams'] !== null ? (float)$p['weight_grams'] : null
                    ] : null
                ];
                if ((int)$p['id'] === (int)$sire_id) {
                    $sire = $pData;
                }
                if ((int)$p['id'] === (int)$dam_id) {
                    $dam = $pData;
                }
            }

            $lineageData = [
                "sire" => $sire,
                "dam" => $dam
            ];
        }
    }

    // Map output to match frontend expectations
    $formattedSnake = [
        "id" => $snake_id,
        "uuid" => $row['uuid'],
        "name" => $row['name'],
        "species" => $row['species'],
        "morph" => $row['morph'],
        "price_cents" => (int)$row['price_cents'],
        "availability" => $row['availability'],
        "thumbnail_url" => $row['thumbnail_url'],
        "gallery_image_url" => $row['gallery_image_url'],
        "category_id" => $row['category_id'] !== null ? (int)$row['category_id'] : null,
        "category_name" => $row['category_name'],
        "detail" => $row['gender'] !== null ? [
            "snake_id" => $snake_id,
            "gender" => $row['gender'],
            "age_years" => $row['age_years'] !== null ? (float)$row['age_years'] : null,
            "length_inches" => $row['length_inches'] !== null ? (float)$row['length_inches'] : null,
            "weight_grams" => $row['weight_grams'] !== null ? (float)$row['weight_grams'] : null,
            "market_valuation_cents" => $row['market_valuation_cents'] !== null ? (int)$row['market_valuation_cents'] : null,
            "tax_included" => $row['tax_included'] == 1,
            "description" => $row['description']
        ] : null,
        "images" => $images,
        "history" => $history,
        "lineage" => $lineageData
    ];

    echo json_encode($formattedSnake);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed", "details" => $e->getMessage()]);
}
