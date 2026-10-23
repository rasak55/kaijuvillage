<?php
require_once __DIR__ . '/config.php';

try {
    $category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $max_price = isset($_GET['max_price']) ? (int)$_GET['max_price'] : null;
    $availability = isset($_GET['availability']) ? $_GET['availability'] : null;
    $gender = isset($_GET['gender']) ? $_GET['gender'] : null;

    $sql = "SELECT s.*, c.name AS category_name, sd.gender, sd.weight_grams, sd.age_years,
                   l.sire_id, l.dam_id
            FROM snakes s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN snake_details sd ON s.id = sd.snake_id
            LEFT JOIN lineage l ON s.id = l.snake_id
            WHERE 1=1";
    
    $params = [];

    // Filter by category
    if ($category_id !== null) {
        $sql .= " AND s.category_id = :category_id";
        $params[':category_id'] = $category_id;
    }

    // Filter by search text
    if ($search !== null) {
        $sql .= " AND (s.name LIKE :search OR s.species LIKE :search2 OR s.morph LIKE :search3)";
        $searchWildcard = '%' . $search . '%';
        $params[':search'] = $searchWildcard;
        $params[':search2'] = $searchWildcard;
        $params[':search3'] = $searchWildcard;
    }

    // Filter by maximum price (in cents)
    if ($max_price !== null) {
        $sql .= " AND s.price_cents <= :max_price";
        $params[':max_price'] = $max_price;
    }

    // Filter by availability array (comma-separated query parameter)
    if ($availability !== null && trim($availability) !== '') {
        $availabilities = explode(',', $availability);
        $inParts = [];
        foreach ($availabilities as $idx => $val) {
            $key = ":avail_" . $idx;
            $inParts[] = $key;
            $params[$key] = trim($val);
        }
        if (!empty($inParts)) {
            $sql .= " AND s.availability IN (" . implode(',', $inParts) . ")";
        }
    }

    // Filter by gender array (comma-separated query parameter)
    if ($gender !== null && trim($gender) !== '') {
        $genders = explode(',', $gender);
        $inParts = [];
        foreach ($genders as $idx => $val) {
            $key = ":gender_" . $idx;
            $inParts[] = $key;
            $params[$key] = trim($val);
        }
        if (!empty($inParts)) {
            $sql .= " AND sd.gender IN (" . implode(',', $inParts) . ")";
        }
    }

    $sql .= " ORDER BY s.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $formattedRows = [];
    foreach ($rows as $row) {
        $detail = null;
        if ($row['gender'] !== null) {
            $detail = [
                "snake_id" => (int)$row['id'],
                "gender" => $row['gender'],
                "age_years" => $row['age_years'] !== null ? (float)$row['age_years'] : null,
                "weight_grams" => $row['weight_grams'] !== null ? (float)$row['weight_grams'] : null,
                "length_inches" => null,
                "market_valuation_cents" => (int)$row['price_cents'],
                "tax_included" => true,
                "description" => null
            ];
        }

        $formattedRows[] = [
            "id" => (int)$row['id'],
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
            "detail" => $detail,
            "sire_id" => $row['sire_id'] !== null ? (int)$row['sire_id'] : null,
            "dam_id" => $row['dam_id'] !== null ? (int)$row['dam_id'] : null
        ];
    }

    echo json_encode($formattedRows);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed", "details" => $e->getMessage()]);
}
