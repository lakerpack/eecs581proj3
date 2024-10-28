"""
Name: Music Database
Description: Database that will store and allow the retrieval of music as well as relevant
metadata of the music files for use in other functions and to have a library of music needed
for the implementation of the music player. Creates a database and has functions needed for
adding songs and deleting songs.
Other Sources: ChatGPT, https://github.com/ahmedheakl/Music_Player_App_Using_Tkinter_MySQL/tree/main
Author(s): Nathan Bui, Jaret Priddy, Justin Owolabi
Creation Date: 10/23/2024
"""

'''
(N) importing packages needed for the creation of the music database
-flask is needed to establish endpoints that can be accessed by the frontend
-os is needed for getting file paths
-sqlite3 is needed for the creation of the actual database
-tinytag is used for extracting the relevant metadata from a song file when given a path
the only one included in the requirements.txt file is tinytag since os and sqlite3 are part 
of python3 by default

!!!A LOT OF THE PROGRAM WAS TAKEN FROM THE GITHUB PROJECT LISTED AS A SOURCE, WITH SOME MODIFICATIONS
MADE TO IT BY AUTHORS AND SOME ERROR CHECKING WITH CHATGPT!!!
'''
from flask import Flask, jsonify, request
import os
import sqlite3 as sql
from tinytag import TinyTag

app = Flask(__name__)

# (N) this specifies the path for the music_library.db fill that will contain the database
db_path = os.path.dirname(
    __file__) + '/music_library.db'  # (N) takes the path of the current file plus the name of the .db file

def get_db_connection():
    return sql.connect(db_path)  # (N) creates the db with that path

'''
(N) function in charge of creating the tables in the database that will store the info of artists, albums, and songs
taken from the github referenced in sources.
'''


def create_table():
    con = get_db_connection()
    cur = con.cursor()  # (N) create a cursor object that allows you to execute SQL commands

    '''(N) this sql command will create the tables for artists, albums, and songs. 
    -artists table stores the name of an artist with an arbitrary id number in the order that it is added 
    
    -albums table stores the name and  artists_id (which is a foreign key referencing the id attribute from 
    the artists table) as well as its own album id that is arbitrarily assigned according to order that it 
    was added into the database. The album name and artist id must be unique so there are no duplicates.
    
    -songs stores all of the relevant metadata related to an actual music file: name, album_id(referenced from album table),
    artist_id(referenced from artists table), length of the song, time added, path to the music file, and an arbitrary song id
    based on order that it was added to the database
    
    By default an entry is made for an unknown artist and unknown album 
    '''
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
            
            CREATE TABLE IF NOT EXISTS queue (
                position INTEGER PRIMARY KEY AUTOINCREMENT,
                song_id INTEGER,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE);
            ''')

    con.commit()
    cur.close()


# (N) Function in charge of adding a single song to the database
def add_Song(music_file_path: str):
    con = get_db_connection()
    cur = con.cursor()

    # (N) check if the actual music file exists and if it does not then return nothing and print out an error
    if not os.path.exists(music_file_path):
        print(f"File does not exist: {music_file_path}")
        return None, None

    # (N) use tinytag to get information from the music file with the parameters being the path of the music file
    music_file = TinyTag.get(music_file_path)

    # (N) NOT NEEDED JUST FOR DEBUGGING
    print(
        f"Title: {music_file.title}, Album: {music_file.album}, Artist: {music_file.artist}, Length: {music_file.duration}")

    # (N) taking the name, album, artist, and length from the music file
    name = music_file.title
    album = music_file.album
    artist = music_file.artist
    length = music_file.duration

    # (N) changing the double quotes to single quotes on album names to avoid issues when doing SQL queries in the future
    if album:
        album = album.replace('"', "'")

    # (N) if there is an artist insert the artist name from the music file into the database
    # (N) will ignore it if the artist is already in the database
    if artist:
        cur.execute('INSERT OR IGNORE INTO artists(name) VALUES (?);', (artist,))

    # (N) if there is both an artist and an album name, add that into the albums directory
    # (N) will ignore if there is already an album with the same name and artists
    if album and artist:
        cur.execute('''INSERT OR IGNORE INTO albums(name, artist_id) 
                       SELECT ?, (SELECT id FROM artists WHERE name = ?);''', (album, artist))

    # (N) this if statement checks to see if the name is a value like None or one that can't be used
    if not name:
        # (N) if that is the case then it will try to extract the name from the path instead
        name = os.path.basename(music_file_path).split(".")[0]

    # (N) it will always add the song name into the database, with the relevant data for name, length, path, album_id, and artist_id
    cur.execute('''INSERT OR IGNORE INTO songs(name, length, path, album_id, artist_id)
                   SELECT ?, ?, ?,
                          (SELECT COALESCE((SELECT id FROM albums WHERE name = ?), 0)), 
                          (SELECT COALESCE((SELECT id FROM artists WHERE name = ?), 0));
    ''', (name, length, music_file_path, album, artist))

    con.commit()  # (N) committing changes
    cur.close()

    return name, length


# (N) this is just grabbing the path of a Music directory in the current repository that will be used as the
# default for storing music to be added to the database. cwd is the function to get the current working dir
current_directory = os.getcwd()
music_directory = os.path.join(current_directory, "Music")
print(music_directory)

'''
(N) function in charge of adding music_files from an entire directory into the database. 
Referenced from the github repository in references
'''
def add_Dir(music_dir: str = music_directory):
    # (N) making sure the path to the directory with music stored is a valid path
    if not os.path.isdir(music_dir):
        raise ValueError("Not a valid directory")

    # (N) initializing a counter for the number of files that will be added
    n = 0
    names = []
    for file_ in os.listdir(music_dir):  # (N) iterating through all of the files that are contained in the music directory that we are looking at
        if file_.split('.')[-1] in ["mp3"]:  # (N) right now we are only looking at .mp3 files so we are only looking for files with that extension
            n += 1
            print(f'Adding song from: {music_dir}/{file_}')
            name, _ = add_Song(music_dir + '/' + file_)  # (N) using the add_Song function to add the song using the path of the music file
            names.append(name)  # (N) adding the name of the song that was added to a list of names to keep track of songs added

    return n, names  # (N) return the number of songs and the names of the songs that were addes


def deleteSong(song_name: str):  # (N) Function that deletes a song from the database
    con = get_db_connection()
    cur = con.cursor()
    cur.executescript(f'DELETE FROM songs WHERE name = "{song_name}";')  # (N) simple SQL query where it matches the song name and deletes entries based on that
    con.commit()
    cur.close()


def clear_table():  # (N) clears the database by dropping all the tables in the database
    con = get_db_connection()
    cur = con.cursor()
    cur.executescript('''DROP TABLE IF EXISTS artists;
                        DROP TABLE IF EXISTS songs;
                        DROP TABLE IF EXISTS albums;''')
    con.commit()
    cur.close()

def add_to_queue(song_name: str): # (Ja) function that adds a song to the queue by its name
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("SELECT id FROM songs WHERE name = ?", (song_name,)) # (Ja) query for the song id using the song's name
    song = cur.fetchone()

    if song:
        song_id = song[0] # (Ja) extract the song id from the fetched result
        cur.execute("INSERT INTO queue (song_id) VALUES (?)", (song_id,)) # (Ja) insert the song id into the queue table
        con.commit()
    else:
        print(f" Song: '{song_name}', was not found in the library.") # (Ja) print a message if the songs not found

    cur.close()

def remove_from_queue(position: int): # (Ja) function tha removes a song from the queue based on its position
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("DELETE FROM queue WHERE position =?", (position,)) # (Ja) delete the song at the specified position in the queue
    con.commit()
    cur.close()

def get_from_queue(): #(Jo) will retrieve the current queue
    con = get_db_connection()
    cur = con.cursor()
    cur.execute(''' SELECT queue.position, songs.name FROM queue
                JOIN songs ON queue.song_id = songs.id
                ORDER BY  queue.position ASC''')
    queue = cur.fetchall()
    cur.close()
    return queue
@app.route("/api/current_song",methods=["GET"]) # (N) api endpoint that gets information related to the currently playing song in the queue
def get_current_song():
    con = get_db_connection()
    cur = con.cursor()
    # (Ja) execute SQL query to get the first song in the queue, joining the songs, artists and albums tables to retrieve full metadata
    cur.execute('''SELECT songs.name, artists.name, albums.name, songs.length, songs.path
                   FROM queue
                   JOIN songs ON queue.song_id = songs.id
                   LEFT JOIN artists ON songs.artist_id = artists.id
                   LEFT JOIN albums ON songs.album_id = album.id
                   ORDER BY queue.position ASC LIMIT 1;''')
    # (Ja) fetches first song in queue, if it exists
    current_song = cur.fetchone()
    cur.close()
    con.close()

    # (Ja) if the song is retrieved from the query, return its details
    if current_song:  # (N) use jsonify to give all of the information in JSON response format so that it can be accessed by the frontend
        return jsonify({
            "title": current_song[0] or "Unknown Title",
            "artist": current_song[1] or "Unknown Artist",
            "album": current_song[2] or "Unknown Album",
            "length": current_song[3] or "Unknow Length",
            "path": current_song[4]
        })
    else:
        # (Ja) if there's no songs in the queue return None
        return jsonify({"message": "No songs in the queue!"})

def main():  # (N) simple function that is creating the database and adding the songs from the default path (Music directory contained in the repository)
    print("adding songs to database")
    create_table()
    add_Dir()

    con = get_db_connection()
    cur = con.cursor()
    cur.execute("SELECT name FROM songs")
    song_names = [row[0] for row in cur.fetchall()]
    cur.close()
    print(f"Added {len(song_names)} songs to the database.")
    if song_names: # (Jo) Adds songs to the queue
        add_to_queue(song_names[0])
        add_to_queue(song_names[1] if len(song_names) > 1 else song_names[0])
        print("Current Queue after adding songs:", get_from_queue())
        remove_from_queue(1)
        print("Updated Queue after removal:", get_from_queue())
    else:
        print("No songs were found in the specified directory.")

    con.close()

main()