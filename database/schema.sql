-- First drop the tables if they exist
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS event_tags;
DROP TABLE IF EXISTS user_tag_preferences;
DROP TABLE IF EXISTS tag_categories;
DROP TABLE IF EXISTS tag_relationships;
DROP TABLE IF EXISTS tag_constraints;

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
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id)
);

-- Create the tag categories table
CREATE TABLE tag_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
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

-- Create tag relationships table for related tags
CREATE TABLE tag_relationships (
    tag1_id INTEGER,
    tag2_id INTEGER,
    relationship_type TEXT NOT NULL, -- 'parent_child', 'related', 'mutually_exclusive'
    PRIMARY KEY (tag1_id, tag2_id),
    FOREIGN KEY (tag1_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (tag2_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create constraints table for tag validation
CREATE TABLE tag_constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    min_tags INTEGER DEFAULT 0,
    max_tags INTEGER DEFAULT NULL,
    required BOOLEAN DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id)
);

-- Insert sample events
INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id) VALUES 
    ('Boulder Winter Farmers Market', '2025-02-08', '08:00', 'Boulder County Fairgrounds', 'Indoor winter farmers market featuring local produce, baked goods, and crafts', 'https://bcfm.org', 0, 'manual', NULL),
    ('Pearl Street Art Walk', '2025-02-21', '16:00', 'Pearl Street Mall', 'Monthly art walk featuring local galleries and artists in downtown Boulder', NULL, 0, 'manual', NULL),
    ('Boulder International Film Festival', '2025-02-27', '18:00', 'Boulder Theater', 'Opening night of the annual film festival featuring independent films', 'https://biff1.com', 0, 'manual', NULL),
    ('Chautauqua Winter Trail Day', '2025-02-12', '10:00', 'Chautauqua Park', 'Guided winter hiking tour of the Flatirons with local naturalists', 'https://chautauqua.com', 0, 'manual', NULL),
    ('Community Art Exhibition', '2025-02-18', '14:00', 'Boulder Public Library', 'Local artists showcase their work - Under Review', NULL, 1, 'manual', NULL),
    ('Boulder Food Festival', '2025-02-08', '11:00', 'Pearl Street Mall', 'Annual food festival featuring local restaurants and food trucks', 'https://boulderfoodfest.com', 0, 'manual', NULL),
    ('Local Theater Performance', '2025-02-10', '19:30', 'Boulder Theater', 'Evening of one-act plays by local playwrights', 'https://bouldertheater.com', 0, 'manual', NULL),
    ('Science Fair', '2025-02-11', '09:00', 'CU Boulder Campus', 'Annual science fair showcasing student projects', 'https://cuboulder.edu/sciencefair', 0, 'manual', NULL),
    ('Tech Startup Networking', '2025-02-21', '18:00', 'Boulder Digital Arts', 'Network with local tech entrepreneurs', 'https://bouldertech.org', 0, 'manual', NULL),
    ('Yoga in the Park', '2025-02-22', '09:00', 'Central Park', 'Morning yoga session for all skill levels', NULL, 0, 'manual', NULL),
    ('Jazz Night', '2025-02-22', '20:00', 'The Post Brewing Co.', 'Live jazz performance with local musicians', 'https://postbrewing.com', 0, 'manual', NULL),
    ('Farmers Market', '2025-02-23', '08:00', 'Boulder County Fairgrounds', 'Winter farmers market with local produce and crafts', NULL, 0, 'manual', NULL),
    ('Coding Workshop', '2025-02-24', '14:00', 'Boulder Library Makerspace', 'Introduction to Python programming', NULL, 0, 'manual', NULL),
    ('Basketball Tournament', '2025-02-25', '15:00', 'East Boulder Community Center', 'Local amateur basketball tournament', NULL, 0, 'manual', NULL),
    ('Business Leadership Summit', '2025-02-26', '09:00', 'St Julien Hotel', 'Annual leadership conference for business professionals', 'https://boulderbusiness.org', 0, 'manual', NULL),
    ('Valentine''s Dance', '2025-02-14', '19:00', 'Boulder Country Club', 'Annual Valentine''s Day celebration with live music', NULL, 0, 'manual', NULL),
    ('Mountain Film Festival', '2025-02-28', '18:00', 'Boulder Theater', 'Showcase of outdoor and adventure films', 'https://bouldertheater.com', 0, 'manual', NULL),
    ('Cooking Class: Italian Cuisine', '2025-02-15', '17:00', 'Food Lab Boulder', 'Learn to make authentic Italian dishes', 'https://foodlabboulder.com', 0, 'manual', NULL);

-- Insert tag categories
INSERT INTO tag_categories (name, description) VALUES
    ('Activity Type', 'The primary type of activity (Indoor, Outdoor, Mixed)'),
    ('Interest Area', 'Main topic or field (Arts, Science, Business)'),
    ('Social Aspect', 'Social nature of the event (Social, Entertainment)'),
    ('Special Type', 'Special event types (Holiday)');

-- Insert sample tags with consistent capitalization
INSERT INTO tags (name, color, category_id) VALUES 
    ('Arts & Culture', '#9C27B0', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Business', '#795548', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Education', '#607D8B', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Entertainment', '#E91E63', (SELECT id FROM tag_categories WHERE name = 'Social Aspect')),
    ('Food & Drink', '#FFC107', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Health & Wellness', '#00BCD4', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Holiday', '#D32F2F', (SELECT id FROM tag_categories WHERE name = 'Special Type')),
    ('Indoor Activities', '#2196F3', (SELECT id FROM tag_categories WHERE name = 'Activity Type')),
    ('Mixed Activities', '#4CAF50', (SELECT id FROM tag_categories WHERE name = 'Activity Type')),
    ('Music', '#2196F3', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Outdoor Activities', '#8BC34A', (SELECT id FROM tag_categories WHERE name = 'Activity Type')),
    ('Science & Technology', '#00ACC1', (SELECT id FROM tag_categories WHERE name = 'Interest Area')),
    ('Social', '#673AB7', (SELECT id FROM tag_categories WHERE name = 'Social Aspect')),
    ('Sports', '#FF5722', (SELECT id FROM tag_categories WHERE name = 'Interest Area'));

-- Tag sample events with more logical associations
INSERT INTO event_tags (event_id, tag_id) VALUES
    -- Boulder Winter Farmers Market
    (1, (SELECT id FROM tags WHERE name = 'Food & Drink')),
    (1, (SELECT id FROM tags WHERE name = 'Mixed Activities')),
    (1, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Pearl Street Art Walk
    (2, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (2, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (2, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Boulder International Film Festival
    (3, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (3, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (3, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Chautauqua Winter Trail Day
    (4, (SELECT id FROM tags WHERE name = 'Outdoor Activities')),
    (4, (SELECT id FROM tags WHERE name = 'Education')),
    (4, (SELECT id FROM tags WHERE name = 'Health & Wellness')),
    
    -- Community Art Exhibition
    (5, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (5, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    (5, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Boulder Food Festival
    (6, (SELECT id FROM tags WHERE name = 'Food & Drink')),
    (6, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (6, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Local Theater Performance
    (7, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (7, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (7, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Science Fair
    (8, (SELECT id FROM tags WHERE name = 'Science & Technology')),
    (8, (SELECT id FROM tags WHERE name = 'Education')),
    (8, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Tech Startup Networking
    (9, (SELECT id FROM tags WHERE name = 'Business')),
    (9, (SELECT id FROM tags WHERE name = 'Science & Technology')),
    (9, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Yoga in the Park
    (10, (SELECT id FROM tags WHERE name = 'Health & Wellness')),
    (10, (SELECT id FROM tags WHERE name = 'Outdoor Activities')),
    (10, (SELECT id FROM tags WHERE name = 'Sports')),
    
    -- Jazz Night
    (11, (SELECT id FROM tags WHERE name = 'Music')),
    (11, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (11, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Farmers Market
    (12, (SELECT id FROM tags WHERE name = 'Food & Drink')),
    (12, (SELECT id FROM tags WHERE name = 'Mixed Activities')),
    (12, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Coding Workshop
    (13, (SELECT id FROM tags WHERE name = 'Science & Technology')),
    (13, (SELECT id FROM tags WHERE name = 'Education')),
    (13, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Basketball Tournament
    (14, (SELECT id FROM tags WHERE name = 'Sports')),
    (14, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (14, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Business Leadership Summit
    (15, (SELECT id FROM tags WHERE name = 'Business')),
    (15, (SELECT id FROM tags WHERE name = 'Education')),
    (15, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Valentine's Dance
    (16, (SELECT id FROM tags WHERE name = 'Holiday')),
    (16, (SELECT id FROM tags WHERE name = 'Music')),
    (16, (SELECT id FROM tags WHERE name = 'Social')),
    
    -- Mountain Film Festival
    (17, (SELECT id FROM tags WHERE name = 'Entertainment')),
    (17, (SELECT id FROM tags WHERE name = 'Arts & Culture')),
    (17, (SELECT id FROM tags WHERE name = 'Indoor Activities')),
    
    -- Cooking Class
    (18, (SELECT id FROM tags WHERE name = 'Food & Drink')),
    (18, (SELECT id FROM tags WHERE name = 'Education')),
    (18, (SELECT id FROM tags WHERE name = 'Indoor Activities'));

-- Add tag relationships
INSERT INTO tag_relationships (tag1_id, tag2_id, relationship_type) VALUES
    -- Indoor and Outdoor and Mixed are mutually exclusive
    ((SELECT id FROM tags WHERE name = 'Indoor Activities'),
     (SELECT id FROM tags WHERE name = 'Outdoor Activities'),
     'mutually_exclusive'),
    ((SELECT id FROM tags WHERE name = 'Indoor Activities'),
     (SELECT id FROM tags WHERE name = 'Mixed Activities'),
     'mutually_exclusive'),
    ((SELECT id FROM tags WHERE name = 'Outdoor Activities'),
     (SELECT id FROM tags WHERE name = 'Mixed Activities'),
     'mutually_exclusive'),
    
    -- Related tags
    ((SELECT id FROM tags WHERE name = 'Arts & Culture'),
     (SELECT id FROM tags WHERE name = 'Entertainment'),
     'related'),
    ((SELECT id FROM tags WHERE name = 'Music'),
     (SELECT id FROM tags WHERE name = 'Entertainment'),
     'related'),
    ((SELECT id FROM tags WHERE name = 'Sports'),
     (SELECT id FROM tags WHERE name = 'Health & Wellness'),
     'related');

-- Add constraints
INSERT INTO tag_constraints (category_id, min_tags, max_tags, required) VALUES
    ((SELECT id FROM tag_categories WHERE name = 'Activity Type'), 1, 1, 1),  -- Exactly one activity type required
    ((SELECT id FROM tag_categories WHERE name = 'Interest Area'), 1, 2, 1),  -- 1-2 interest areas required
    ((SELECT id FROM tag_categories WHERE name = 'Social Aspect'), 0, 1, 0),  -- At most one social aspect
    ((SELECT id FROM tag_categories WHERE name = 'Special Type'), 0, 1, 0);   -- At most one special type

-- Insert test user (password is 'TestUser123')
INSERT INTO users (email, username, password_hash, created_at) VALUES 
    ('test@example.com', 'testuser', '$2b$12$l69fNSDeoNj9rOe92qNIH.vUnI6wxHuiFM6fuWewEfJknKTDVNnom', CURRENT_TIMESTAMP);
