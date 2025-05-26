from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'GitHub is connected'

@app.route('/about')
def about():
    return 'About'