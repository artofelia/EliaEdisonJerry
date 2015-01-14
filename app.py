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

player_id = []
player_pos = []

id = 0
print 'Server Has Begun'

@app.route('/test')
def index():
    print 'start'
    return render_template('index.html')
    #return 'hi'

@socketio.on('connect', namespace='/test')
def test_connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

@socketio.on('addPlayer', namespace='/test')
def addPlayer(pinfo):
    global id
    id = id+1
    player_id.append(id)
    player_pos.append(pinfo['pos'])
    print 'add player', id
    emit('set_id', {'id':id})
    emit('playerAdded', {'id':id, 'pos': pinfo['pos']}, broadcast=True)

@socketio.on('pmove', namespace='/test')
def addPlayer(pinfo):
    ind = player_id.index(pinfo['id'])
    player_pos[ind] = pinfo['pos']
    emit('playerMoved', {'id':pinfo['id'], 'pos': pinfo['pos']}, broadcast=True)


if __name__ == '__main__':
    #app.run(host="0.0.0.0",port=8000)
    socketio.run(app)
