from gevent import monkey
monkey.patch_all()

import time
from threading import Thread
from flask import Flask, render_template, session, request
from flask.ext.socketio import SocketIO, emit

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

players = []
id = 0
print 'hi'
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
    id = id+1
    send('set_id', {'id':id})
    emit('playerAdded', {'id':id, 'pos': pinfo['pos']}, broadcast=True)

if __name__ == '__main__':
    #app.run(host="0.0.0.0",port=8000)
    socketio.run(app)
