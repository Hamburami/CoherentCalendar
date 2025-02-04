-- First drop the table if it exists
DROP TABLE IF EXISTS events;

-- Create the table
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location TEXT,
    description TEXT,
    url TEXT
);

-- Insert sample data
INSERT INTO events (title, date, time, location, description, url)
VALUES 
    ('Boulder Winter Farmers Market', '2025-02-08', '08:00', 'Boulder County Fairgrounds', 'Indoor winter farmers market featuring local produce, baked goods, and crafts', 'https://bcfm.org'),
    ('CU Buffaloes Basketball Game', '2025-02-15', '19:30', 'CU Events Center', 'University of Colorado Boulder home basketball game', 'https://cubuffs.com'),
    ('Pearl Street Art Walk', '2025-02-21', '16:00', 'Pearl Street Mall', 'Monthly art walk featuring local galleries and artists in downtown Boulder', NULL),
    ('Boulder International Film Festival', '2025-02-27', '18:00', 'Boulder Theater', 'Opening night of the annual film festival featuring independent films', 'https://biff1.com'),
    ('Chautauqua Winter Trail Day', '2025-02-12', '10:00', 'Chautauqua Park', 'Guided winter hiking tour of the Flatirons with local naturalists', 'https://chautauqua.com');
