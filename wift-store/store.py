#! /usr/bin/env python

import datetime

import mongoengine as db
from flask import Flask, render_template, redirect, request, abort


app = Flask(__name__)


class Purchase(db.Document):
    charge_id = db.StringField(required=True, unique=True)
    user_id = db.StringField()
    item = db.StringField()
    created_at = db.DateTimeField(default=datetime.datetime.utcnow)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/charge', methods=['POST'])
def charge():
    charge_id = request.form['wiftCharge']
    user_id = request.form['userid']
    
    # TODO verify the charge through the wift api!

    # register a new purchase
    Purchase(charge_id=charge_id, user_id=user_id, item='Weefy').save()

    # redirect to the     
    return redirect(f'/opened/{user_id}')


@app.route('/opened/<string:user_id>')
def opened(user_id):
    purchases = Purchase.objects(user_id=user_id)
    if not purchases:
        return abort(404)
    return render_template('opened.html', count=len(purchases))


if __name__ == '__main__':
    import os
    os.environ['FLASK_ENV'] = 'development'
    
    db.connect('wiftstore')
    
    app.run(port=8002)
