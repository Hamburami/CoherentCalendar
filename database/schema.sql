-- First drop the table if it exists
DROP TABLE IF EXISTS events;

-- Create the table
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT,
    url TEXT,
    needs_review BOOLEAN DEFAULT 0
);

-- Insert sample data
INSERT INTO events (title, date, time, location, description, url, needs_review)
VALUES 
    ('Boulder Winter Farmers Market', '2025-02-08', '08:00', 'Boulder County Fairgrounds', 'Indoor winter farmers market featuring local produce, baked goods, and crafts', 'https://bcfm.org', 0),
    ('CU Buffaloes Basketball Game', '2025-02-15', '19:30', 'CU Events Center', 'University of Colorado Boulder home basketball game', 'https://cubuffs.com', 0),
    ('Pearl Street Art Walk', '2025-02-21', '16:00', 'Pearl Street Mall', 'Monthly art walk featuring local galleries and artists in downtown Boulder', NULL, 0),
    ('Boulder International Film Festival', '2025-02-27', '18:00', 'Boulder Theater', 'Opening night of the annual film festival featuring independent films', 'https://biff1.com', 0),
    ('Chautauqua Winter Trail Day', '2025-02-12', '10:00', 'Chautauqua Park', 'Guided winter hiking tour of the Flatirons with local naturalists', 'https://chautauqua.com', 0),
    ('Community Art Exhibition', '2025-02-18', '14:00', 'Boulder Public Library', 'Local artists showcase their work - Under Review', NULL, 1);
