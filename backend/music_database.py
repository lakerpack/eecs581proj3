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
-flask is needed to establish endpoints that can be accessed by the frontend
-os is needed for getting file paths
-sqlite3 is needed for the creation of the actual database
-tinytag is used for extracting the relevant metadata from a song file when given a path
-random is for randomly generating stuff
the only one included in the requirements.txt file are tinytag and flask since the others are part 
-random is for randomly generating stuff
the only one included in the requirements.txt file are tinytag and flask since the others are part 
of python3 by default

!!!A LOT OF THE PROGRAM WAS TAKEN FROM THE GITHUB PROJECT LISTED AS A SOURCE, WITH SOME MODIFICATIONS
MADE TO IT BY AUTHORS AND SOME ERROR CHECKING WITH CHATGPT!!!
'''
from flask import Flask, jsonify, request, send_file, abort
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC
from flask_cors import CORS
import os
import sqlite3 as sql
from tinytag import TinyTag
import random
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
import io

app = Flask(__name__)
CORS(app)

# (Ja) add key
app.config['SECRET_KEY'] = 'eecs581'

# (Ja) add configs for upload folder and allowed ext
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'profile_images')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# (Ja) helper function to check allowed ext
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


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
                cover_art TEXT,
                FOREIGN KEY (album_id)  REFERENCES albums(id)  ON DELETE SET DEFAULT,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET DEFAULT,
                UNIQUE (name, artist_id, album_id)
            );
            INSERT OR IGNORE INTO artists(id,name) VALUES (0,'UNKNOWN');
            INSERT OR IGNORE INTO albums(id,name) VALUES (0,"UNKNOWN");
            
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position INTEGER NOT NULL,
                song_id INTEGER,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
                UNIQUE(position)
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                name TEXT,
                description TEXT,
                profile_image TEXT
            );
            
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                song_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
                UNIQUE (user_id, song_id)
            );
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
        
    music_directory = os.path.abspath("Music")
    relative_path = os.path.relpath(music_file_path, start=music_directory)
    
    try:
        audio = MP3(music_file_path, ID3=ID3)
        if audio.tags and 'APIC:' in audio.tags:
            album_cover = audio.tags['APIC:'].data
            cover_art_dir = os.path.abspath("cover_art")
            cover_art_path = os.path.join(cover_art_dir, f"{album}.jpg")

            # Save cover art only if it doesn't already exist
            if not os.path.exists(cover_art_path):
                os.makedirs("cover_art", exist_ok=True)
                with open(cover_art_path, 'wb') as img:
                    img.write(album_cover)
    except Exception as e:
        print(f"No cover art found in {music_file_path}. Error: {e}")

    # (N) it will always add the song name into the database, with the relevant data for name, length, path, album_id, artist_id, and cover art for the song
    cur.execute('''INSERT OR IGNORE INTO songs(name, length, path, album_id, artist_id, cover_art)
                   SELECT ?, ?, ?,
                          (SELECT COALESCE((SELECT id FROM albums WHERE name = ?), 0)), 
                          (SELECT COALESCE((SELECT id FROM artists WHERE name = ?), 0)),
                          ?;
    ''', (name, length, relative_path, album, artist, cover_art_path))

    con.commit()  # (N) committing changes
    cur.close()

    return name, length


# (N) this is just grabbing the path of a Music directory in the current repository that will be used as the
# default for storing music to be added to the database. cwd is the function to get the current working dir
music_directory = "Music"
print(music_directory)
full_path = os.path.abspath(music_directory)
print(full_path)

current_dir = os.getcwd()
print(current_dir)

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
    for file_ in os.listdir(
            music_dir):  # (N) iterating through all of the files that are contained in the music directory that we are looking at
        if file_.split('.')[-1] in [
            "mp3"]:  # (N) right now we are only looking at .mp3 files so we are only looking for files with that extension
            n += 1
            print(f'Adding song from: {music_dir}/{file_}')
            name, _ = add_Song(
                music_dir + '/' + file_)  # (N) using the add_Song function to add the song using the path of the music file
            names.append(
                name)  # (N) adding the name of the song that was added to a list of names to keep track of songs added

    return n, names  # (N) return the number of songs and the names of the songs that were addes


def deleteSong(song_name: str):  # (N) Function that deletes a song from the database
    con = get_db_connection()
    cur = con.cursor()
    cur.executescript(
        f'DELETE FROM songs WHERE name = "{song_name}";')  # (N) simple SQL query where it matches the song name and deletes entries based on that
    con.commit()
    cur.close()


def clear_table():  # (N) clears the database by dropping all the tables in the database
    con = get_db_connection()
    cur = con.cursor()
    cur.executescript('''DROP TABLE IF EXISTS artists;
                        DROP TABLE IF EXISTS songs;
                        DROP TABLE IF EXISTS albums;
                        DROP TABLE IF EXISTS queue''')
    con.commit()
    cur.close()


def add_to_queue(song_name: str):  # (Ja) function that adds a song to the queue by its name
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("SELECT id FROM songs WHERE name = ?", (song_name,))  # (Ja) query for the song id using the song's name
    song = cur.fetchone()

    if song:
        song_id = song[0]  # (Ja) extract the song id from the fetched result
        cur.execute("SELECT MAX(position) FROM queue")
        max_position = cur.fetchone()[0] or 0
        new_position = max_position + 1
        cur.execute("INSERT INTO queue (position, song_id) VALUES (?, ?)", (new_position, song_id))
        con.commit()
        print(f"Added '{song_name}' to the queue.")
        success = True
    else:
        print(f" Song: '{song_name}', was not found in the library.")  # (Ja) print a message if the songs not found

        print(
            f"Error: Song '{song_name}' was not found in the library.")  # (Ja) print a message if the song's not found
        success = False

    cur.close()
    return success


@app.route("/api/add_to_queue", methods=["POST"])
def api_add_to_queue():
    data = request.json  # (Ja) getting the json data from the request
    song_name = data.get("song_name")  # (Ja) getting the song name from the json data
    if not song_name:
        return jsonify({"error": "Song name is required"}), 400  # (Ja) returning an error if song name is not provided
    # (Ja) calling the add_to_queue function and getting the result
    result = add_to_queue(song_name)
    if result:
        return jsonify({"message": ["success"]}), 200  # (Ja) success response
    else:
        return jsonify({"error": ["song not found"]}), 404  # (Ja) error response, if song not found


def remove_from_queue(position: int):  # (Ja) function that removes a song from the queue based on its position
    con = get_db_connection()
    cur = con.cursor()

    # (Ja) checking if there’s a song at the specified position before deleting
    cur.execute("SELECT * FROM queue WHERE position = ?", (position,))
    song_exists = cur.fetchone() is not None

    # (Ja) if the song exists at the position, delete it
    if song_exists:
        cur.execute("DELETE FROM queue WHERE position = ?",
                    (position,))  # (Ja) delete the song at the specified position in the queue
        cur.execute("""
            UPDATE queue
            SET position = position - 1
            WHERE position > ?
        """, (position,))
        con.commit()
        message = f"Removed song at position {position} from the queue."
        success = True
    else:
        message = f"No song found at position {position} in the queue."
        success = False

    cur.close()
    con.close()

    return {"success": success, "message": message}


@app.route("/api/remove_from_queue", methods=["DELETE"])
def api_remove_from_queue():
    data = request.json  # (Ja) getting the json data from the request
    position = data.get("position")  # (Ja) getting the position from the json data
    if position is None:
        return jsonify({"error": "Position is required"}), 400  # (Ja) returning an error if position is not provided
    # (Ja) calling the remove_from_queue function
    remove_from_queue(position)
    return jsonify({"message": f"Removed song at position {position} from the queue"}), 200


def get_from_queue():  # (Jo) will retrieve the current queue
    con = get_db_connection()
    cur = con.cursor()
    cur.execute(''' SELECT queue.position, songs.name FROM queue
                JOIN songs ON queue.song_id = songs.id
                ORDER BY  queue.position ASC''')
    queue = cur.fetchall()
    cur.close()
    con.close()
    return queue


@app.route('/api/queue', methods=['GET'])
def get_queue():
    queue = get_from_queue()
    queue_list = [{"position": item[0], "title": item[1]} for item in queue]
    print(queue)

    return jsonify(queue_list), 200


@app.route("/api/random_song", methods=[
    "GET"])  # (N) API endpoint for getting a random song that will be used temporarily for the forward and backward buttons
def get_random_song():  # (N) function for getting a random song
    con = get_db_connection()
    cur = con.cursor()
    cur.execute(
        "SELECT id FROM songs")  # (N) get a list of every song and then select all of the song_ids from that list
    song_ids = [row[0] for row in cur.fetchall()]

    if song_ids:
        random_song_id = random.choice(song_ids)  # (N) grab a random song id and then add that song into the queue
        # cur.execute("INSERT INTO queue (song_id) VALUES (?)", (random_song_id,))
        con.commit()

    # (N) get all the relevant metadata from that song
    cur.execute('''SELECT songs.name, artists.name AS artist, albums.name AS album, 
                                  songs.length, songs.path, songs.cover_art 
                           FROM songs
                           LEFT JOIN artists ON songs.artist_id = artists.id
                           LEFT JOIN albums ON songs.album_id = albums.id
                           WHERE songs.id = ?''', (random_song_id,))

    song_details = cur.fetchone()  # (N) add it to a variable
    cur.close()
    con.close()

    if song_details:  # (N) if those details are valid use jsonify to put it into JSON format to respond to the API call
        # (N) giving all of the information needed by the frontend
        return jsonify({
            "title": song_details[0] or "Unknown Title",
            "artist": song_details[1] or "Unknown Artist",
            "album": song_details[2] or "Unknown Album",
            "length": song_details[3] or "Unknown Length",
            "path": song_details[4],
            "cover_art": song_details[5]
        }), 200
    # (N) if there was an error getting that information return an error
    else:
        return jsonify({"error": "No songs found"}), 404


@app.route("/api/song/<song_name>", methods=["GET"])
def get_song_by_name(song_name):
    con = get_db_connection()
    cur = con.cursor()

    cur.execute('''SELECT songs.name, artists.name, albums.name, songs.length, songs.path, songs.cover_art
                   FROM songs
                   LEFT JOIN artists ON songs.artist_id = artists.id
                   LEFT JOIN albums ON songs.album_id = albums.id
                   WHERE songs.name = ?;''', (song_name,))

    song = cur.fetchone()
    cur.close()
    con.close()

    if song:
        return jsonify({
            "title": song[0] or "Unknown Title",
            "artist": song[1] or "Unknown Artist",
            "album": song[2] or "Unknown Album",
            "length": song[3] or "Unknown Length",
            "path": song[4],
            "cover_art": song[5]
        }), 200
    else:
        return jsonify({"message": "No song found"}), 404


@app.route("/api/current_song",
           methods=["GET"])  # (N) api endpoint that gets information related to the currently playing song in the queue
def get_current_song():
    con = get_db_connection()
    cur = con.cursor()
    # (Ja) execute SQL query to get the first song in the queue, joining the songs, artists and albums tables to retrieve full metadata
    cur.execute('''SELECT songs.name, artists.name, albums.name, songs.length, songs.path, songs.cover_art
                   FROM queue
                   JOIN songs ON queue.song_id = songs.id
                   LEFT JOIN artists ON songs.artist_id = artists.id
                   LEFT JOIN albums ON songs.album_id = albums.id
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
            "length": current_song[3] or "Unknown Length",
            "path": current_song[4],
            "cover_art": current_song[5]
        }), 200
    else:
        # (Ja) if there's no songs in the queue return None 
        return jsonify({"message": "No songs in the queue!"}), 404


@app.route('/api/audio/<path:filename>')
def serve_audio(filename):
    # (Ja) dynamically get the music dir
    music_folder = os.path.abspath("Music")
    # (Ja) construct the full file path
    file_path = os.path.join(music_folder, filename)
    print(f"Requested file path: {file_path}")
    if not os.path.isfile(file_path):
        print(f"File not found: {file_path}")
        abort(404, description="File not found")
    return send_file(file_path)

def clean_up_paths():
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("UPDATE songs SET path = REPLACE(path, 'Music/', '') WHERE path LIKE 'Music/%';")
    con.commit()
    cur.close()
    con.close()
    print("Database paths cleaned up.")


@app.route('/api/all_songs',
           methods=['GET'])
def get_all_songs():
    con = get_db_connection()
    cur = con.cursor()
    cur.execute('''SELECT songs.name, artists.name AS artist, albums.name AS album, 
                          songs.length, songs.path, songs.cover_art 
                   FROM songs
                   LEFT JOIN artists ON songs.artist_id = artists.id
                   LEFT JOIN albums ON songs.album_id = albums.id
                   ORDER BY songs.name ASC''')
    get_all_songs = cur.fetchall()
    cur.close()
    con.close()

    # (N) Format the result as a list of dictionaries for JSON serialization
    if get_all_songs:
        songs = []
        for song in get_all_songs:
            song_obj = {
                "title": song[0] or "Unknown Title",
                "artist": song[1] or "Unknown Artist",
                "album": song[2] or "Unknown Album",
                "length": song[3] or "Unknown Length",
                "path": song[4],
                "cover_art": song[5]
            }
            songs.append(song_obj)

        return jsonify(songs), 200
    else:
        return jsonify({"message": "No songs in library!"}), 404


@app.route('/api/cover_art/<path:filename>')
def serve_cover_art(filename):
    # (Ja) define the base directory for cover art dynamically
    base_cover_art_folder = os.path.abspath("cover_art")
    # (Ja) construct the full path to the requested cover art
    file_path = os.path.join(base_cover_art_folder, filename)
    # (Ja) log the requested file path for debugging
    print(f"Requested cover art path - {file_path}")
    # (Ja) check if the file exists
    if not os.path.isfile(file_path):
        print(f"Cover art not found: {file_path}")
        abort(404, description="Cover art not found")
    # (Ja) serve the cover art file
    return send_file(file_path)


@app.route('/api/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request available"})

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file.save(os.path.join("Music", file.filename))
    add_Dir()
    return jsonify({"message": f"File {file.filename} has been uploaded successfully"}), 200


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # (Ja) JWT is expected in the authorization header
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            # (Ja) token should follow "Bearer <token>" format
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        # (Ja) return error if token is missing
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user_id = data['user_id']
            con = get_db_connection()
            cur = con.cursor()
            # (Ja) retrieve full user information
            cur.execute("""
                SELECT username, name, description, profile_image
                FROM users WHERE id = ?
            """, (user_id,))
            user = cur.fetchone()
            cur.close()
            con.close()
            if not user:
                return jsonify({'error': 'User not found!'}), 401
            current_user = {
                'id': user_id,
                'username': user[0],
                'name': user[1],
                'description': user[2],
                'profile_image': user[3]
            }
        except jwt.ExpiredSignatureError:
            # (Ja) return error if token has expired
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            # (Ja) return error if token is invalid
            return jsonify({'error': 'Invalid token!'}), 401

        # (Ja) call the decorated function with current_user
        return f(current_user, *args, **kwargs)

    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # (Ja) check if username and password are provided
    if not data or not 'username' in data or not 'password' in data:
        return jsonify({"error": "Username and password required"}), 400
    
    # (Ja) contributed new fields
    username = data['username']
    password = data['password']
    name = data.get('name', '')
    description = data.get('description', '')
    profile_image = data.get('profile_image', '')

    # (Ja) hash the password
    password_hash = generate_password_hash(password)

    try:
        con = get_db_connection()
        cur = con.cursor()
        # (Ja) insert new user into the database, updated fields
        cur.execute("""
            INSERT INTO users (username, password_hash, name, description, profile_image)
            VALUES (?, ?, ?, ?, ?)
        """, (username, password_hash, name, description, profile_image))
        con.commit()
        cur.close()
        return jsonify({"message": "User registered successfully"}), 201
    except sql.IntegrityError:
        # (Ja) return error if username already exists
        return jsonify({"error": "Username already exists"}), 409
    finally:
        con.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    # (Ja) check if username and password are provided
    if not data or not 'username' in data or not 'password' in data:
        return jsonify({"error": "Username and password required"}), 400

    username = data['username']
    password = data['password']

    con = get_db_connection()
    cur = con.cursor()
    # (Ja) retrieve password hash for the provided username
    cur.execute("""
        SELECT id, password_hash, name, description, profile_image
        FROM users WHERE username = ?
    """, (username,))
    user = cur.fetchone()
    cur.close()
    con.close()

    # (Ja) check if password matches hash in database
    if user and check_password_hash(user[1], password):
        # (Ja) generate JWT token valid for 24 hours, update fields
        token = jwt.encode({
            'user_id': user[0],
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({
            'token': token,
            'user': {
                'username': username,
                'name': user[2],
                'description': user[3],
                'profile_image': user[4]
            }
        }), 200
    else:
        # (Ja) return error if username or password is invalid
        return jsonify({"error": "Invalid username or password"}), 401


@app.route("/api/test_entry", methods=["GET"])
@token_required
def test_entry(current_user):
    # (Ja) generate response with custom message for authenticated user
    test_data = {
        "message": f"Hello, {current_user['name'] or current_user['username']}! This is a test entry.",
        "user": current_user
    }
    return jsonify(test_data), 200
    
    
@app.route('/api/upload_profile_image', methods=['POST'])
@token_required
def upload_profile_image(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # (Ja) create user specific filename to avoid collisions
        filename = f"user_{current_user['id']}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # (Ja) ensure the upload folder exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file.save(file_path)

        # (Ja) update user's profile_image in the database
        con = get_db_connection()
        cur = con.cursor()
        cur.execute("UPDATE users SET profile_image = ? WHERE id = ?", (file_path, current_user['id']))
        con.commit()
        cur.close()
        con.close()

        return jsonify({"message": "Profile image uploaded successfully", "profile_image": file_path}), 200
    else:
        return jsonify({"error": "Invalid file type"}), 400
        

@app.route('/profile_images/<filename>')
def serve_profile_image(filename):
    # (Ja) serve a profile image from the upload folder
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    # (Ja) fetch and return the current user's profile details
    return jsonify({
        'username': current_user['username'],
        'name': current_user['name'],
        'description': current_user['description'],
        'profile_image': current_user['profile_image']
    }), 200


@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    # (Ja) update the user's name and description in the database
    data = request.get_json()
    name = data.get('name', current_user['name'])
    description = data.get('description', current_user['description'])

    con = get_db_connection()
    cur = con.cursor()
    cur.execute("""
        UPDATE users SET name = ?, description = ?
        WHERE id = ?
    """, (name, description, current_user['id']))
    con.commit()
    cur.close()
    con.close()

    current_user['name'] = name
    current_user['description'] = description

    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user
    }), 200
    
    
def add_new_user_columns():
    con = get_db_connection()
    cur = con.cursor()
    try:
        cur.execute("ALTER TABLE users ADD COLUMN name TEXT;")
    except sql.OperationalError:
        pass  # (Ja) column already exists

    try:
        cur.execute("ALTER TABLE users ADD COLUMN description TEXT;")
    except sql.OperationalError:
        pass  # (Ja) column already exists

    try:
        cur.execute("ALTER TABLE users ADD COLUMN profile_image TEXT;")
    except sql.OperationalError:
        pass  # (Ja) column already exists

    con.commit()
    cur.close()
    
@app.route('/api/favorites', methods=['GET'])
@token_required
def get_favorites(current_user):
    con = get_db_connection()
    cur = con.cursor()

    # (Ja) get favorite songs for the current user
    cur.execute('''
        SELECT songs.id, songs.name, artists.name AS artist, albums.name AS album, 
               songs.length, songs.path, songs.cover_art 
        FROM favorites
        JOIN songs ON favorites.song_id = songs.id
        LEFT JOIN artists ON songs.artist_id = artists.id
        LEFT JOIN albums ON songs.album_id = albums.id
        WHERE favorites.user_id = ?
        ORDER BY songs.name ASC
    ''', (current_user['id'],))
    favorites = cur.fetchall()
    cur.close()
    con.close()

    if favorites:
        songs = []
        for song in favorites:
            song_obj = {
                "id": song[0],
                "title": song[1] or "Unknown Title",
                "artist": song[2] or "Unknown Artist",
                "album": song[3] or "Unknown Album",
                "length": song[4] or "Unknown Length",
                "path": song[5],
                "cover_art": song[6]
            }
            songs.append(song_obj)

        return jsonify(songs), 200
    else:
        return jsonify({"message": "No favorite songs"}), 200

# (Ja) endpoint for searching songs
@app.route('/api/search', methods=['GET'])
def search_songs():
    query = request.args.get('q', '')

    con = get_db_connection()
    cur = con.cursor()

    # (Ja) search in songs.name, artists.name, albums.name
    search_query = f"%{query}%"
    cur.execute('''
        SELECT songs.id, songs.name, artists.name AS artist, albums.name AS album, 
               songs.length, songs.path, songs.cover_art 
        FROM songs
        LEFT JOIN artists ON songs.artist_id = artists.id
        LEFT JOIN albums ON songs.album_id = albums.id
        WHERE songs.name LIKE ? OR artists.name LIKE ? OR albums.name LIKE ?
        ORDER BY songs.name ASC
    ''', (search_query, search_query, search_query))
    results = cur.fetchall()
    cur.close()
    con.close()

    if results:
        songs = []
        for song in results:
            song_obj = {
                "id": song[0],
                "title": song[1] or "Unknown Title",
                "artist": song[2] or "Unknown Artist",
                "album": song[3] or "Unknown Album",
                "length": song[4] or "Unknown Length",
                "path": song[5],
                "cover_art": song[6]
            }
            songs.append(song_obj)

        return jsonify(songs), 200
    else:
        return jsonify({"message": "No matching songs found"}), 200

# (Ja) endpoint to move songs in the queue
@app.route('/api/queue/move', methods=['PUT'])
def move_song_in_queue():
    data = request.get_json()
    from_position = data.get('from_position')
    to_position = data.get('to_position')

    if from_position is None or to_position is None:
        return jsonify({"error": "Both 'from_position' and 'to_position' are required"}), 400

    con = get_db_connection()
    cur = con.cursor()

    # (Ja) check if the positions are valid
    cur.execute("SELECT song_id FROM queue WHERE position = ?", (from_position,))
    row = cur.fetchone()
    if not row:
        cur.close()
        con.close()
        return jsonify({"error": f"No song found at position {from_position}"}), 404

    song_id = row[0]

    # (Ja) begin a transaction
    con.execute("BEGIN")

    try:
        # (Ja) if moving down the queue (to higher position number)
        if from_position < to_position:
            # (Ja) decrease the positions of songs between from_position +1 and to_position inclusive
            cur.execute("""
                UPDATE queue
                SET position = position -1
                WHERE position > ? AND position <= ?
            """, (from_position, to_position))
        elif from_position > to_position:
            # (Ja) increase the positions of songs between to_position and from_position -1 inclusive
            cur.execute("""
                UPDATE queue
                SET position = position +1
                WHERE position >= ? AND position < ?
            """, (to_position, from_position))
        else:
            # (Ja) from_position == to_position, nothing to do
            return jsonify({"message": "Song is already at the desired position"}), 200

        # (Ja) update the position of the song
        cur.execute("""
            UPDATE queue
            SET position = ?
            WHERE song_id = ?
        """, (to_position, song_id))

        con.commit()
    except Exception as e:
        con.rollback()
        cur.close()
        con.close()
        return jsonify({"error": f"An error occurred: {e}"}), 500

    cur.close()
    con.close()
    return jsonify({"message": f"Moved song from position {from_position} to {to_position}"}), 200

def main(): # (N) simple function that is creating the database and adding the songs from the default path (Music directory contained in the repository)
    try:
        print("Setting up the database and adding songs")
        clear_table()
        create_table()
        add_new_user_columns()
        add_Dir()

        # (Ja) initialize flask test client
        with app.test_client() as client:
            # (Ja) test user registration
            print("\nTesting user registration...")
            register_response = client.post('/api/register', json={
                "username": "johndoe",
                "password": "mypass",
                "name": "John Doe",
                "description": "I just be listening to music.",
                "profile_image": ""  # (Ja) initial registration without image
            })
            print("Registration response:", register_response.json)

            # (Ja) check for registration errors
            if register_response.status_code != 201:
                print("Registration failed!")
                return

            # (Ja) test user login
            print("\nTesting user login...")
            login_response = client.post('/api/login', json={
                "username": "johndoe",
                "password": "mypass"
            })
            print("Login response:", login_response.json)
            if login_response.status_code != 200:
                print("Login failed, can't proceed w/ further tests")
                return

            # (Ja) extract the token from login response
            token = login_response.json['token']
            headers = {
                'Authorization': f'Bearer {token}'
            }

            # (Ja) test accessing a protected route
            print("\nTesting access to a protected route...")
            test_entry_response = client.get('/api/test_entry', headers=headers)
            print("Test entry response:", test_entry_response.json)

            # (Ja) test updating user profile
            print("\nTesting updating user profile...")
            update_profile_response = client.put('/api/user/profile', headers=headers, json={
                "name": "Johnny Doe",
                "description": "Heres an updated description."
            })
            print("Update profile response:", update_profile_response.json)

            # (Ja) optionally test uploading a profile image
            print("\nTesting profile image upload...")
            data = {
                'file': (io.BytesIO(b'This is test image data'), 'profile.jpg')
            }
            upload_image_response = client.post('/api/upload_profile_image', headers=headers, content_type='multipart/form-data', data=data)
            print("Upload image response:", upload_image_response.json)

            # (Ja) test retrieving user profile
            print("\nTesting retrieving user profile...")
            get_profile_response = client.get('/api/user/profile', headers=headers)
            print("Get profile response:", get_profile_response.json)

        con = get_db_connection()
        cur = con.cursor()
        cur.execute("SELECT name FROM songs")
        song_names = [row[0] for row in cur.fetchall()]
        cur.close()
        print(f"\nAdded {len(song_names)} songs to the database.")
        for song in song_names[:5]:  # (Jo) Adds songs to the queue
            add_to_queue(song)
            # print("Current Queue after adding songs:", get_from_queue())
            # remove_from_queue(1)
            # print("Updated Queue after removal:", get_from_queue())
        if not song_names:
            print("No songs were found in the specified directory.")
        print("Current queue:", get_from_queue())
        con.close()

    except Exception as e:
        print(f"An error occurred during execution: {e}")
        
main()
app.run(debug=True)
