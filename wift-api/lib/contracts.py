import json
import urllib.request

from .crypto.keccak import Keccak256


def get_method_id(func_sig):
    hashed_sig = Keccak256(func_sig.encode('ascii')).digest()
    return hex(int.from_bytes(hashed_sig[:4], 'big'))


def serialize(addr):
    return int(addr, 16).to_bytes(32, 'big').hex()

    
def call_data(fsig, arg):
    method_id = get_method_id(fsig)
    arg = serialize(arg)
    return method_id + arg


def get_erc20_balance(provider, contract, account):
    payload = {
        'jsonrpc': '2.0',
        'method': 'eth_call',
        'id': 1,
        'params': [
            {
                'to': contract,
                'data': call_data("balanceOf(address)", account)
            },
            'latest'
        ],
    }

    req = urllib.request.Request(
        provider,
        data=json.dumps(payload).encode('ascii'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req, timeout=3) as r:
        response = json.loads(r.read().decode('utf-8'))
    
    return int(response['result'], 16)
