from gevent import monkey
monkey.patch_all()

import time
from threading import Thread
from flask import Flask, render_template, session, request
from flask.ext.socketio import SocketIO, emit, send
import amaze

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
ttmz = [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,1,1,1,1,1,1,0,0,0,1],
        [1,0,0,1,1,1,1,1,1,1,1,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,1,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,1,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]

def convMaze(arr):
    #print len(arr)
    #print len(arr[0])
    out = []
    ct1 = 0
    for i in arr:
        ct2 = 0
        for j in arr[ct1]:
            if arr[ct1][ct2]==1:
                out.append(len(arr[0])*(ct1)+ct2)
            ct2 = ct2+1
        ct1 = ct1+1
    return out
    
#tmzsz = len(ttmz[0])
#tmz = convMaze(ttmz);

rawmz = amaze.make_maze(4);
tmzsz = rawmz['size']
tmz = rawmz['data']
tst = rawmz['start']
ted = rawmz['end']

players = {}
id = 0
print 'Server Has Begun'
#print tmz

@app.route('/')
def cover():
    #return 'hello'
    return render_template('Cover.html')

@app.route('/maze')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@socketio.on('connect', namespace='/maze')
def connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/maze')
def disconnect():
    print('Client disconnected')

@socketio.on('addPlayer', namespace='/maze')
def addPlayer(pinfo):
    global id
    global players
    emit('set_players', players)
    id = id+1
    ky = chr(id)
    players[ky] = {'id': id, 'pos': pinfo['pos'], 'heading': pinfo['heading']}
    print 'add player', id
    emit('set_id', {'id':id})
    emit('playerAdded', {'key': ky, 'data': players[ky]}, broadcast=True)

@socketio.on('removePlayer', namespace='/maze')
def removePlayer(pinfo):
    global id
    global players
    ky = chr(pinfo['id'])
    del players[ky]
    print pinfo['id'], 'left'
    emit('playerLeft', {'key': ky, 'data': pinfo['id']}, broadcast=True)
    
    
@socketio.on('playerMoved', namespace='/maze')
def playerMoved(pinfo):
    global players
    ky = chr(pinfo['id'])
    players[ky]['pos'] = pinfo['pos']
    #print 'player ', id, ' moved to', players[ky]['pos']
    emit('playerMoved', {'key': ky, 'data': {'id':pinfo['id'], 'pos': pinfo['pos']}}, broadcast=True)
    
@socketio.on('playerTurned', namespace='/maze')
def playerTurned(pinfo):
    global players
    ky = chr(pinfo['id'])
    #print 'turn',players[ky], pinfo
    players[ky]['heading'] = pinfo['heading']
    emit('playerTurned', {'key': ky, 'data': {'id':pinfo['id'], 'heading': pinfo['heading']}}, broadcast=True)

@socketio.on('getMazeCoor', namespace='/maze')
def getMazeCoor(pinfo):
    global tmz
    ky = chr(pinfo['id'])
    pos = pinfo['pos']
    print 'sending maze cor to', pinfo['id']
    
    emit('mazeUpdate', {'key': ky, 'data': {'sz':tmzsz, 'coor': tmz, 'st': tst, 'ed': ted}})
    
@socketio.on('my broadcast event', namespace='/maze')
def test_broadcast_message(message):
    emit('my response',
        {'data': message['data']},
        broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
