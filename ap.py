from flask import Flask, render_template, session, request


app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'

@app.route('/')
def index():
    print 'start'
    return render_template('index.html')
    #return 'hi'

if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5000)

