#! /usr/bin/env python

from flask import Flask, jsonify


app = Flask(__name__)


@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Magical Mystery Tour!"})


@app.after_request
def set_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == '__main__':
    import os
    os.environ['FLASK_ENV'] = 'development'
    app.run(port=8001)
