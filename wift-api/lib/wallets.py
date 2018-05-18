import codecs
import hashlib
import hmac

from .crypto.ecdsa import Point, ECPointAffine, secp256k1
from .crypto.base58 import b58encode_check, b58decode_check, b58encode
from .crypto.keccak import Keccak256


class WatchWallet:
    def __init__(self, xpub, testnet=True):
        self.xpub = xpub
        self.testnet = testnet

    @staticmethod
    def ripesha(data):
        """Returns the RIPEMD160 hash of the SHA256 hash of sent data."""
        r = hashlib.new('ripemd160')
        r.update(hashlib.sha256(data).digest())
        return r.digest()

    @classmethod
    def deserialize_xpub(cls, xpub):
        # Decode from base58
        b = b58decode_check(xpub)

        # Unpack the main components
        version = int.from_bytes(b[:4], 'big')
        depth = b[4]
        parent_fingerprint = b[5:9]
        index = int.from_bytes(b[9:13], 'big')
        chain_code = b[13:45]
        
        # Assume the public key is serialized in compressed form
        key_bytes = b[45:78]
        key_type = key_bytes[0]
        if key_type != 0x02 and key_type != 0x03:
            raise ValueError("First byte of public key must be 0x02 or 0x03!")

        # Recover the x coordinate from the serialized data
        x = int.from_bytes(key_bytes[1:33], 'big')

        # Compute the 2 possible y values and pick the one indicated by key_type
        ys = secp256k1.y_from_x(x)
        last_bit = key_type - 0x2
        for y in ys:
            if y & 0x1 == last_bit:
                break

        # Compute the fingerprint: the first 4 bytes of RIPE160(SHA256(key))
        fingerprint = cls.ripesha(key_bytes)[:4]
        
        return dict(x=x,
                    y=y,
                    chain_code=chain_code,
                    index=index,
                    depth=depth,
                    fingerprint=fingerprint,
                    parent_fingerprint=parent_fingerprint)

    def serialize_xpub(self, x, y, chain_code, index, depth, parent_fingerprint):
        TESTNET_VERSION = 0x043587CF
        MAINNET_VERSION = 0x0488B21E
        version = TESTNET_VERSION if self.testnet else MAINNET_VERSION
        
        point = ECPointAffine(secp256k1, x, y)
        raw = (version.to_bytes(4, 'big') +
              bytes([depth]) +
              parent_fingerprint +
              index.to_bytes(4, 'big') +
              chain_code +
              point.compressed_bytes)
        return b58encode_check(raw)

    def ckd_pub(self, parent_xpub, i):
        """Derives the (non-hardened) i-th child xpub from a parent xpub."""
        parent = self.deserialize_xpub(parent_xpub)
        point = ECPointAffine(secp256k1, parent['x'], parent['y'])

        I = hmac.new(parent['chain_code'],
                     point.compressed_bytes + i.to_bytes(length=4, byteorder='big'),
                     hashlib.sha512).digest()
        Il, Ir = I[:32], I[32:]
        parse_Il = int.from_bytes(Il, 'big')
        if parse_Il >= secp256k1.n:
            return None

        Ki = secp256k1.public_key(parse_Il) + point
        if Ki.infinity:
            return None

        return self.serialize_xpub(
            x=Ki.x,
            y=Ki.y,
            chain_code=Ir,
            index=i,
            depth=parent['depth'] + 1,
            parent_fingerprint=parent['fingerprint'])

    def eth_checksum_encode(self, addr):
        o = ''
        v = int.from_bytes(Keccak256(addr.encode('ascii')).digest(), 'big')
        for i, c in enumerate(addr):
            if c in '0123456789':
                o += c
            else:
                o += c.upper() if (v & (2**(255 - 4*i))) else c.lower()
        return o

    def xpub_to_eth(self, xpub):
        data = self.deserialize_xpub(xpub)
        point = ECPointAffine(secp256k1, data['x'], data['y'])
        keccak = Keccak256(bytes(point)[1:]).digest()
        return '0x' + self.eth_checksum_encode(keccak[12:].hex())

    def get_address(self, account, index=0):
        account_xpub = self.ckd_pub(self.xpub, account)
        address_xpub = self.ckd_pub(account_xpub, index)        
        return self.xpub_to_eth(address_xpub)
