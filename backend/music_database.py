import sqlite3 as sql
import os
from tinytag import TinyTag

db_path = os.path.dirname(__file__) + '/music_library.db'
con = sql.connect(db_path)


def create_table():
    cur = con.cursor()
    cur.executescript('''CREATE TABLE IF NOT EXISTS artists (
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


def add_Song(music_file: str):
    cur = con.cursor()
    music_file = TinyTag.get(music_file)
    name = music_file.title
    album = music_file.album
    artist = music_file.artist
    length = music_file.duration

    if album:
        album = album.replace('"', "'")

    if artist:
        cur.execute(
            f'INSERT OR IGNORE INTO artists(name) VALUES ("{artist}");')

    if album and artist:
        cur.execute(f'''INSERT OR IGNORE INTO albums(name,artist_id) 
                                SELECT "{album}", 
                                        (SELECT id FROM artists WHERE name = "{artist}");''')

    if not name:
        name = music_file.split('/')[-1].split(".")[0]
    cur.execute(f'''INSERT OR IGNORE INTO songs(name, length, path, album_id, artist_id)
                                SELECT "{name}",{length}, "{music_file}",
                                        (SELECT COALESCE( (SELECT id FROM albums WHERE name = "{album}") ,0) ), 
                                        (SELECT COALESCE( (SELECT id FROM artists WHERE name = "{artist}"),0) );
                        ''')
    cur.close()
    return name, length

current_directory = os.getcwd()
music_directory = os.path.join(current_directory, "Music")

def add_Dir(music_dir: str = music_directory):
    if not os.path.isdir(music_dir):
        raise ValueError("Not a valid directory")

    n = 0
    names = []
    for file_ in os.listdir(music_dir):
        if file_.split('.')[-1] in ["mp3", "wav", "ogg"]:
            n += 1
            name, _ = add_Song(music_dir + '/' + file_)
            names.append(name)

    return n, names
