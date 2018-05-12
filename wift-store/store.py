#! /usr/bin/env python

from flask import Flask


app = Flask(__name__)


@app.route('/')
def index():
    return 'This is the magic Wift store'


if __name__ == '__main__':
    import os
    os.environ['FLASK_ENV'] = 'development'
    app.run(port=8002)
