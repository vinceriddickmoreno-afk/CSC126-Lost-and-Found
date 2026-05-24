DROP DATABASE IF EXISTS lostandfound;
CREATE DATABASE lostandfound;
USE lostandfound;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    profile_pic VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location VARCHAR(100),
    date_reported DATETIME,
    status ENUM('lost','found','claimed','returned') DEFAULT 'lost',
    image_url VARCHAR(255) DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE claims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    claimant_id INT NOT NULL,
    message TEXT,
    contact_number VARCHAR(20),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (claimant_id) REFERENCES users(id)
);

INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@csu.edu.ph', '$2b$10$4VJ2gC9qQ.ZwqH/6QX16TOsYHxVW9zKXxv5JqKZ8xXJcFqCbGX2S2', 'admin'),
('John Dela Cruz', 'john@student.csu.edu.ph', '$2b$10$4VJ2gC9qQ.ZwqH/6QX16TOsYHxVW9zKXxv5JqKZ8xXJcFqCbGX2S2', 'user'),
('Maria Santos', 'maria@student.csu.edu.ph', '$2b$10$4VJ2gC9qQ.ZwqH/6QX16TOsYHxVW9zKXxv5JqKZ8xXJcFqCbGX2S2', 'user'),
('Carlos Lopez', 'carlos@csu.edu.ph', '$2b$10$4VJ2gC9qQ.ZwqH/6QX16TOsYHxVW9zKXxv5JqKZ8xXJcFqCbGX2S2', 'user');

INSERT INTO items (title, description, category, location, date_reported, status, user_id) VALUES
('Black Leather Wallet', 'Contains student ID, 2 credit cards, and ₱500 cash', 'Wallet', 'Library 2nd Floor', NOW(), 'lost', 1),
('iPhone 13 Pro Max', 'Graphite color, cracked screen protector, black silicone case', 'Electronics', 'Cafeteria near the juice bar', NOW(), 'found', 1),
('Blue Jansport Backpack', 'Has a laptop, notebooks, and a water bottle', 'Bag', 'Gym locker room', NOW(), 'lost', 2),
('Hydro Flask Water Bottle', 'White 32oz, stickers of CSU logo', 'Bottle', 'Science Building Room 201', NOW(), 'found', 2),
('Student ID Card', 'Name: John Dela Cruz, ID: 2024-12345, course: BSIT', 'ID Card', 'Parking Lot A', NOW(), 'lost', 2),
('Dell XPS 13 Laptop', 'Silver, sticker of "CSU IT Society", Windows 11', 'Electronics', 'Computer Lab 3', NOW(), 'claimed', 1),
('Car Keys', 'Toyota Vios key with a blue rubber cover', 'Keys', 'Quadrangle near the flagpole', NOW(), 'found', 3),
('Prescription Glasses', 'Black frame, rectangular lens', 'Other', 'Auditorium', NOW(), 'lost', 3);

INSERT INTO claims (item_id, claimant_id, message, contact_number, status) VALUES
(1, 2, 'I lost my black wallet at the library yesterday.', '09123456789', 'pending'),
(2, 3, 'This is my iPhone, I can describe the exact wallpaper.', '09234567890', 'approved'),
(5, 1, 'I lost my student ID last week. Please contact me.', '09345678901', 'rejected'),
(3, 4, 'My blue Jansport backpack with laptop inside.', '09456789012', 'pending'),
(7, 2, 'Those are my car keys, I lost them near the quadrangle.', '09567890123', 'approved');
