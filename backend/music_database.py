import os
import sqlite3 as sql
from tinytag import TinyTag

db_path = os.path.dirname(__file__) + '/music_library.db'
con = sql.connect(db_path)


def create_table():
    cur = con.cursor()
    cur.executescript('''
            CREATE TABLE IF NOT EXISTS artists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL DEFAULT "UNKNOWN",
                artist_id INTEGER DEFAULT 0,
                UNIQUE (name,artist_id),
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET DEFAULT
            ); 
            CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL DEFAULT "UNKNOWN",
                album_id INTEGER DEFAULT 0,
                artist_id INTEGER DEFAULT 0,
                length INTEGER DEFAULT 0,
                added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                path TEXT,
                FOREIGN KEY (album_id)  REFERENCES albums(id)  ON DELETE SET DEFAULT,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET DEFAULT,
                UNIQUE (name, artist_id, album_id)
            );
            INSERT OR IGNORE INTO artists(id,name) VALUES (0,'UNKNOWN');
            INSERT OR IGNORE INTO albums(id,name) VALUES (0,"UNKNOWN");
            ''')

    con.commit()
    cur.close()


def add_Song(music_file_path: str):
    cur = con.cursor()

    # Check if file exists
    if not os.path.exists(music_file_path):
        print(f"File does not exist: {music_file_path}")
        return None, None  # Or handle this case appropriately

    # Get metadata
    music_file = TinyTag.get(music_file_path)
    print(
        f"Title: {music_file.title}, Album: {music_file.album}, Artist: {music_file.artist}, Length: {music_file.duration}")

    name = music_file.title
    album = music_file.album
    artist = music_file.artist
    length = music_file.duration

    if album:
        album = album.replace('"', "'")

    if artist:
        cur.execute('INSERT OR IGNORE INTO artists(name) VALUES (?);', (artist,))

    if album and artist:
        cur.execute('''INSERT OR IGNORE INTO albums(name, artist_id) 
                       SELECT ?, (SELECT id FROM artists WHERE name = ?);''', (album, artist))

    if not name:
        name = os.path.basename(music_file_path).split(".")[0]  # Get name from file path

    # Use parameterized query
    cur.execute('''INSERT OR IGNORE INTO songs(name, length, path, album_id, artist_id)
                   SELECT ?, ?, ?,
                          (SELECT COALESCE((SELECT id FROM albums WHERE name = ?), 0)), 
                          (SELECT COALESCE((SELECT id FROM artists WHERE name = ?), 0));
    ''', (name, length, music_file_path, album, artist))

    con.commit()  # Make sure to commit changes
    cur.close()

    return name, length


current_directory = os.getcwd()
music_directory = os.path.join(current_directory, "Music")
print(music_directory)

def add_Dir(music_dir: str = music_directory):
    if not os.path.isdir(music_dir):
        raise ValueError("Not a valid directory")

    n = 0
    names = []
    for file_ in os.listdir(music_dir):
        if file_.split('.')[-1] in ["mp3"]:
            n += 1
            print(f'Adding song from: {music_dir}/{file_}')
            name, _ = add_Song(music_dir + '/' + file_)
            names.append(name)

    return n, names


def deleteSong(song_name: str):

    cur = con.cursor()
    cur.executescript(f'DELETE FROM songs WHERE name = "{song_name}";')
    con.commit()
    cur.close()


def clear_table():

    cur = con.cursor()
    cur.executescript('''DROP TABLE IF EXISTS artists;
                        DROP TABLE IF EXISTS songs;
                        DROP TABLE IF EXISTS albums;''')
    con.commit()
    cur.close()


def main():
    print("adding songs to database")
    create_table()
    add_Dir()

main()
