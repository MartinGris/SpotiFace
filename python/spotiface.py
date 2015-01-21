import spotify
import time
import pymysql

playlistId = '72pl3n7OuAXXN5O0n5TU2A'

session = spotify.Session()

session.login('1183081422', '3rdf3rk3l')

#print (session.connection.state)
session.process_events()
while session.connection.state != spotify.ConnectionState.LOGGED_IN:
    session.process_events()
#time.sleep( 2 )

playlist = session.get_playlist('spotify:user:1183081422:playlist:' + playlistId);

#print (playlist.load().name)

#print(session.connection.state)

search = session.search(query="u")

#time.sleep( 2 )

search.load()

tracks = playlist.tracks

session.process_events()

#print( len( tracks ) )

playlist.remove_tracks( range( len( tracks ) ) )

session.process_events()

time.sleep(1)

conn = pymysql.connect(host='93.157.51.165', unix_socket='/tmp/mysql.sock', user='spotiUser', passwd="3rdf3rk3lSpoti", db='spotiface')
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






