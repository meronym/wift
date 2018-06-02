#! /usr/bin/env python

# TODO consider SSE https://serverfault.com/questions/801628/for-server-sent-events-sse-what-nginx-proxy-configuration-is-appropriate/801629

import datetime
import hashlib
import io
import json
import random
import time

import qrcode
import qrcode.image.svg
import mongoengine as db
from flask import Flask, request, jsonify, make_response
from redis import StrictRedis

from lib.wallets import WatchWallet


app = Flask(__name__)


with open('config.json') as f:
    config = json.loads(f.read())

wallet = WatchWallet(config['xpub'])
redis = StrictRedis()
db.connect('wiftdemo')


class Charge(db.Document):
    cid = db.StringField(required=True, unique=True)
    index = db.IntField(required=True, unique=True)
    address = db.StringField()
    amount = db.IntField()
    uri = db.StringField()
    status = db.StringField()
    created_at = db.DateTimeField(default=datetime.datetime.utcnow)
    queried_at = db.DateTimeField(default=datetime.datetime.utcnow)


@app.route('/demo/charge', methods=['POST'])
def new_charge():
    data = request.get_json()
    amount = int(data['amount'])
    wei_amount = amount * 10**16
    
    # generate a new charge id
    index = redis.incr('wift.demo.charge.counter')
    cid = 'ch_' + hashlib.sha256(index.to_bytes(32, byteorder='big')).hexdigest()[:16]

    # deterministically generate a corresponding address
    address = wallet.get_address(index)
    uri = f"ethereum:{config['token']}@{config['chain']}/transfer?address={address}&uint256={wei_amount}"

    # persist the thing
    ch = Charge(cid=cid, index=index, address=address, amount=amount, uri=uri, status='created').save()

    # send payload to UI
    resp = {
        'id': ch.cid,
        'address': ch.address,
        'amount': ch.amount,
        'uri': ch.uri
    }
    # time.sleep(3)   # FIXME artificial delay to test asynchronicity
    return jsonify(resp)


@app.route('/demo/charge/<string:cid>')
def charge_details(cid):
    ch = Charge.objects.get(cid=cid)

    now = datetime.datetime.utcnow()
    if now - ch.created_at > datetime.timedelta(seconds=5):
        ch.status = 'payed'    
    ch.queried_at = now
    ch.save()
    
    resp = {
        'id': ch.cid,
        'address': ch.address,
        'amount': ch.amount,
        'uri': ch.uri,
        'status': ch.status,
    }

    # import json
    # from web3 import Web3, HTTPProvider

    # w3 = Web3(HTTPProvider('https://kovan.infura.io/dzd63pITwjn1tg7TjkZV'))
    # dai = w3.eth.contract('0xc4375b7de8af5a38a93548eb8453a498222c4ff2', abi)
    # print(dai.call().balanceOf('0x6F2A8Ee9452ba7d336b3fba03caC27f7818AeAD6'))

    return jsonify(resp)


@app.route('/demo/qr/<string:cid>')
def qr(cid):
    ch = Charge.objects.get(cid=cid)
    stream = io.BytesIO()
    qrcode.make(
        ch.uri,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        image_factory=qrcode.image.svg.SvgPathImage
    ).save(stream)
    resp = make_response(stream.getvalue())
    resp.content_type = 'image/svg+xml'
    return resp


@app.after_request
def set_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
    return response


if __name__ == '__main__':    
    import os
    os.environ['FLASK_ENV'] = 'development'

    app.run(port=8001)
