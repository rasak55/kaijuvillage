-- ------------------------------------------------------------
-- Database: `kaijuvillage`
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS kaijuvillage;
USE kaijuvillage;

-- ------------------------------------------------------------
-- Table `pages`
-- Stores static page metadata (title, slug, description, timestamps)
-- ------------------------------------------------------------
CREATE TABLE pages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(255) NOT NULL UNIQUE COMMENT 'home, gallery, detail',
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `categories`
-- Optional grouping for gallery items (e.g., Pythons, Boas, Vipers)
-- ------------------------------------------------------------
CREATE TABLE categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `snakes`
-- Core gallery entity representing a specimen
-- ------------------------------------------------------------
CREATE TABLE snakes (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid               CHAR(36) NOT NULL UNIQUE COMMENT 'public identifier',
    name               VARCHAR(255) NOT NULL,
    species            VARCHAR(255) NOT NULL,
    morph              VARCHAR(255),
    price_cents        INT UNSIGNED NOT NULL COMMENT 'price stored in cents',
    availability       ENUM('available','reserved','sold') NOT NULL DEFAULT 'available',
    thumbnail_url      VARCHAR(511),
    gallery_image_url  VARCHAR(511),
    category_id        BIGINT,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_snake_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `snake_images`
-- Stores multiple gallery images for each snake
-- ------------------------------------------------------------
CREATE TABLE snake_images (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    snake_id    BIGINT NOT NULL,
    image_url   VARCHAR(511) NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  INT UNSIGNED DEFAULT 0,
    is_primary  BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_image_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `snake_details`
-- One‑to‑one extension of `snakes` for the detail page
-- ------------------------------------------------------------
CREATE TABLE snake_details (
    snake_id            BIGINT PRIMARY KEY,
    gender              ENUM('male','female','unsexed') NOT NULL,
    age_years           DECIMAL(4,2),
    length_inches       DECIMAL(5,2),
    weight_grams        DECIMAL(6,2),
    market_valuation_cents INT UNSIGNED,
    tax_included        BOOLEAN DEFAULT FALSE,
    description         TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_detail_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `lineage`
-- Stores parent relationships (self‑referencing)
-- ------------------------------------------------------------
CREATE TABLE lineage (
    snake_id   BIGINT PRIMARY KEY,
    sire_id    BIGINT NULL,
    dam_id     BIGINT NULL,
    CONSTRAINT fk_lineage_snake   FOREIGN KEY (snake_id)   REFERENCES snakes(id) ON DELETE CASCADE,
    CONSTRAINT fk_lineage_sire    FOREIGN KEY (sire_id)    REFERENCES snakes(id) ON DELETE SET NULL,
    CONSTRAINT fk_lineage_dam     FOREIGN KEY (dam_id)     REFERENCES snakes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `history_events`
-- Timeline events for a specimen (shed, transfer, etc.)
-- ------------------------------------------------------------
CREATE TABLE history_events (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    snake_id    BIGINT NOT NULL,
    event_date  DATE NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Indexes for fast search / filter on the gallery page
-- ------------------------------------------------------------
CREATE INDEX idx_snake_price        ON snakes(price_cents);
CREATE INDEX idx_snake_species      ON snakes(species);
CREATE INDEX idx_snake_morph        ON snakes(morph);
CREATE INDEX idx_snake_availability ON snakes(availability);

-- ------------------------------------------------------------
-- Table `users`
-- Stores member accounts for reviewing and purchasing snakes
-- ------------------------------------------------------------
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(255),
    avatar_url    VARCHAR(511),
    address       TEXT,
    phone_number  VARCHAR(30),
    role          ENUM('admin','member') NOT NULL DEFAULT 'member',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `reviews`
-- User reviews of snakes
-- ------------------------------------------------------------
CREATE TABLE reviews (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    snake_id    BIGINT NOT NULL,
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    title       VARCHAR(255),
    status      ENUM('approved','pending') NOT NULL DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `orders`
-- Purchase orders for snakes
-- ------------------------------------------------------------
CREATE TABLE orders (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT NOT NULL,
    snake_id           BIGINT NULL,
    quantity           INT UNSIGNED NOT NULL DEFAULT 1,
    total_price_cents  INT UNSIGNED NOT NULL,
    status             ENUM('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
    shipping_address   TEXT,
    payment_method     VARCHAR(100),
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `order_items`
-- Individual items within an order (supports multiple snakes per order)
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT NOT NULL,
    snake_id    BIGINT NOT NULL,
    quantity    INT UNSIGNED NOT NULL DEFAULT 1,
    price_cents INT UNSIGNED NOT NULL COMMENT 'price per item at time of purchase',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_snake FOREIGN KEY (snake_id) REFERENCES snakes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table `payments`
-- Records payment information for orders
-- ------------------------------------------------------------
CREATE TABLE payments (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    amount_cents INT UNSIGNED NOT NULL,
    payment_method VARCHAR(100),
    status       ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
    paid_at      DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
