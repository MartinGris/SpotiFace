#!/usr/bin/env python3
import spotify
import time
import pymysql

playlistId = '1234'

config = spotify.Config()

config.load_application_key_file('/opt/spotiface/spotify_appkey.key')

session = spotify.Session(config)

session.login('1234', 'password')

#print (session.connection.state)
session.process_events()
while session.connection.state != spotify.ConnectionState.LOGGED_IN:
    session.process_events()


playlist = session.get_playlist('spotify:user:1234:playlist:' + playlistId);

search = session.search(query="u")

search.load()

tracks = playlist.tracks

session.process_events()

playlist.remove_tracks( range( len( tracks ) ) )

session.process_events()

time.sleep(2)

conn = pymysql.connect(host='host', unix_socket='/tmp/mysql.sock', user='user', passwd="password", db='database')
cur = conn.cursor()
cur.execute("SELECT DISTINCT song_id FROM user_song")

trackList = []
for row in cur:
    trackId = row[0]
    print(trackId)

    track = session.get_track('spotify:track:' + trackId)
    trackList.append(track)

print(trackList)

playlist.add_tracks(trackList)

session.process_events()

cur.close()
conn.close()






