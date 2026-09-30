-- ABC Tech database (MySQL 8+ / MariaDB 10.4+)
-- Run:  mysql -u root -p < database/abc_tech.sql

CREATE DATABASE IF NOT EXISTS abc_tech
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE abc_tech;

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    mobile        CHAR(10)      NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    message    TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
