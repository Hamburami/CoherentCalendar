-- First drop the tables if they exist
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS event_tags;
DROP TABLE IF EXISTS user_tag_preferences;

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

-- Create the tags table
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#808080',  -- Default gray color for tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the event_tags junction table
CREATE TABLE event_tags (
    event_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (event_id, tag_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create user_tag_preferences table
CREATE TABLE user_tag_preferences (
    user_id INTEGER,
    tag_id INTEGER,
    preference INTEGER NOT NULL DEFAULT 0, -- -1 for dislike, 0 for neutral, 1 for like
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Insert sample event data
INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id)
VALUES 
    ('Boulder Winter Farmers Market', '2025-02-08', '08:00', 'Boulder County Fairgrounds', 'Indoor winter farmers market featuring local produce, baked goods, and crafts', 'https://bcfm.org', 0, 'manual', NULL),
    ('Pearl Street Art Walk', '2025-02-21', '16:00', 'Pearl Street Mall', 'Monthly art walk featuring local galleries and artists in downtown Boulder', NULL, 0, 'manual', NULL),
    ('Boulder International Film Festival', '2025-02-27', '18:00', 'Boulder Theater', 'Opening night of the annual film festival featuring independent films', 'https://biff1.com', 0, 'manual', NULL),
    ('Chautauqua Winter Trail Day', '2025-02-12', '10:00', 'Chautauqua Park', 'Guided winter hiking tour of the Flatirons with local naturalists', 'https://chautauqua.com', 0, 'manual', NULL),
    ('Community Art Exhibition', '2025-02-18', '14:00', 'Boulder Public Library', 'Local artists showcase their work - Under Review', NULL, 1, 'manual', NULL);

-- Insert sample tags with consistent capitalization
INSERT INTO tags (name, color) VALUES 
    ('Arts & Culture', '#9C27B0'),
    ('Business', '#795548'),
    ('Education', '#607D8B'),
    ('Entertainment', '#E91E63'),
    ('Food & Drink', '#FFC107'),
    ('Health & Wellness', '#00BCD4'),
    ('Holiday', '#D32F2F'),
    ('Indoor Activities', '#2196F3'),
    ('Music', '#2196F3'),
    ('Outdoor Activities', '#8BC34A'),
    ('Science & Technology', '#00ACC1'),
    ('Social', '#673AB7'),
    ('Sports', '#FF5722');

-- Tag some sample events
INSERT INTO event_tags (event_id, tag_id) VALUES
    (1, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    (1, (SELECT id FROM tags WHERE name = 'Food & Drink')),
    (1, (SELECT id FROM tags WHERE name = 'Social')),
    (2, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (2, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (2, (SELECT id FROM tags WHERE name = 'Social')),
    (3, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (3, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    (3, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (3, (SELECT id FROM tags WHERE name = 'Social')),
    (4, (SELECT id FROM tags WHERE name = 'Outdoor Activities')),
    (4, (SELECT id FROM tags WHERE name = 'Education')),
    (4, (SELECT id FROM tags WHERE name = 'Science & Technology')),
    (5, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (5, (SELECT id FROM tags WHERE name = 'Social')),
    (5, (SELECT id FROM tags WHERE name = 'Entertainment'));

-- Insert test user (password is 'TestUser123')
INSERT INTO users (email, username, password_hash, created_at) VALUES 
    ('test@example.com', 'testuser', '$2b$12$l69fNSDeoNj9rOe92qNIH.vUnI6wxHuiFM6fuWewEfJknKTDVNnom', CURRENT_TIMESTAMP);
