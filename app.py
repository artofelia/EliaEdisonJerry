from gevent import monkey
monkey.patch_all()

import time
from threading import Thread
from flask import Flask, render_template, session, request
from flask.ext.socketio import SocketIO, emit, send

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

players = {}

id = 0
print 'Server Has Begun'

@app.route('/test')
def index():
    return render_template('index.html')

@socketio.on('connect', namespace='/test')
def connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/test')
def disconnect():
    print('Client disconnected')

@socketio.on('addPlayer', namespace='/test')
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


@socketio.on('removePlayer', namespace='/test')
def removePlayer(pinfo):
    global id
    global players
    ky = chr(pinfo['id'])
    del players[ky]
    print pinfo['id'], 'left'
    emit('playerLeft', {'key': ky, 'data': pinfo['id']}, broadcast=True)
    
    
@socketio.on('playerMoved', namespace='/test')
def playerMoved(pinfo):
    global players
    ky = chr(pinfo['id'])
    players[ky]['pos'] = pinfo['pos']
    #print 'player ', id, ' moved to', players[ky]['pos']
    emit('playerMoved', {'key': ky, 'data': {'id':pinfo['id'], 'pos': pinfo['pos']}}, broadcast=True)
    
@socketio.on('playerTurned', namespace='/test')
def playerTurned(pinfo):
    global players
    ky = chr(pinfo['id'])
    #print 'turn',players[ky], pinfo
    players[ky]['heading'] = pinfo['heading']
    emit('playerTurned', {'key': ky, 'data': {'id':pinfo['id'], 'heading': pinfo['heading']}}, broadcast=True)


if __name__ == '__main__':
    socketio.run(app)
