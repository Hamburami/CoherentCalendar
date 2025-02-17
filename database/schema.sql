-- First drop the tables if they exist
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Create the events table
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT,
    url TEXT,
    needs_review BOOLEAN DEFAULT 0,
    source TEXT,
    source_id TEXT
);

-- Create the users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample event data
INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id)
VALUES 
    ('Boulder Winter Farmers Market', '2025-02-08', '08:00', 'Boulder County Fairgrounds', 'Indoor winter farmers market featuring local produce, baked goods, and crafts', 'https://bcfm.org', 0, 'manual', NULL),
    ('Pearl Street Art Walk', '2025-02-21', '16:00', 'Pearl Street Mall', 'Monthly art walk featuring local galleries and artists in downtown Boulder', NULL, 0, 'manual', NULL),
    ('Boulder International Film Festival', '2025-02-27', '18:00', 'Boulder Theater', 'Opening night of the annual film festival featuring independent films', 'https://biff1.com', 0, 'manual', NULL),
    ('Chautauqua Winter Trail Day', '2025-02-12', '10:00', 'Chautauqua Park', 'Guided winter hiking tour of the Flatirons with local naturalists', 'https://chautauqua.com', 0, 'manual', NULL),
    ('Community Art Exhibition', '2025-02-18', '14:00', 'Boulder Public Library', 'Local artists showcase their work - Under Review', NULL, 1, 'manual', NULL);
