import sqlite3

def init_db():
    with open('database/schema.sql', 'r') as f:
        schema = f.read()
    
    conn = sqlite3.connect('database/events.db')
    conn.executescript(schema)
    conn.close()

if __name__ == '__main__':
    init_db()
