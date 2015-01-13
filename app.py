from flask import Flask, render_template
from flask.ext.socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

players = []
id = 0

@app.route('/')
def index():
    return render_template('index.html')

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
    socketio.run(app)
