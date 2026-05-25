import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:pointycastle/export.dart';

class CryptoService {
  // RSA-2048 key pair generation
  static Future<({String publicKeyPem, String privateKeyPem})> generateKeyPair() {
    return compute(_generateKeyPairIsolate, null);
  }

  // RSA-OAEP-SHA256 encrypt AES key with RSA public key
  static Future<Uint8List> encryptAesKeyWithRsa(Uint8List aesKey, String publicKeyPem) {
    return compute(_rsaEncrypt, {'key': aesKey, 'pem': publicKeyPem});
  }

  // RSA-OAEP-SHA256 decrypt AES key with RSA private key
  static Future<Uint8List> decryptAesKeyWithRsa(Uint8List encryptedKey, String privateKeyPem) {
    return compute(_rsaDecrypt, {'key': encryptedKey, 'pem': privateKeyPem});
  }

  // AES-GCM-256 encrypt file, returns ciphertext + random iv + random key
  static Future<({Uint8List encrypted, Uint8List iv, Uint8List aesKey})> encryptFile(Uint8List plaintext) {
    return compute(_aesEncrypt, plaintext);
  }

  // AES-GCM-256 decrypt file
  static Future<Uint8List> decryptFile(Uint8List encrypted, Uint8List iv, Uint8List aesKey) {
    return compute(_aesDecrypt, {'data': encrypted, 'iv': iv, 'key': aesKey});
  }

  // ---- Isolate functions (must be top-level or static) ----

  static ({String publicKeyPem, String privateKeyPem}) _generateKeyPairIsolate(Null _) {
    final secRandom = _buildSecureRandom();
    final keyGen = RSAKeyGenerator()
      ..init(ParametersWithRandom(
        RSAKeyGeneratorParameters(BigInt.parse('65537'), 2048, 64),
        secRandom,
      ));
    final pair = keyGen.generateKeyPair();
    final pub = pair.publicKey as RSAPublicKey;
    final priv = pair.privateKey as RSAPrivateKey;
    return (
      publicKeyPem: _encodePublicKeyPem(pub),
      privateKeyPem: _encodePrivateKeyPem(priv, pub.exponent!),
    );
  }

  static Uint8List _rsaEncrypt(Map<String, dynamic> args) {
    final publicKey = _parsePublicKey(args['pem'] as String);
    final enc = OAEPEncoding.withSHA256(RSAEngine())
      ..init(true, PublicKeyParameter<RSAPublicKey>(publicKey));
    return enc.process(args['key'] as Uint8List);
  }

  static Uint8List _rsaDecrypt(Map<String, dynamic> args) {
    final privateKey = _parsePrivateKey(args['pem'] as String);
    final dec = OAEPEncoding.withSHA256(RSAEngine())
      ..init(false, PrivateKeyParameter<RSAPrivateKey>(privateKey));
    return dec.process(args['key'] as Uint8List);
  }

  static ({Uint8List encrypted, Uint8List iv, Uint8List aesKey}) _aesEncrypt(Uint8List plaintext) {
    final rng = Random.secure();
    final aesKey = Uint8List.fromList(List.generate(32, (_) => rng.nextInt(256)));
    final iv = Uint8List.fromList(List.generate(12, (_) => rng.nextInt(256)));
    final cipher = GCMBlockCipher(AESEngine())
      ..init(true, AEADParameters(KeyParameter(aesKey), 128, iv, Uint8List(0)));
    return (encrypted: cipher.process(plaintext), iv: iv, aesKey: aesKey);
  }

  static Uint8List _aesDecrypt(Map<String, dynamic> args) {
    final cipher = GCMBlockCipher(AESEngine())
      ..init(false, AEADParameters(
        KeyParameter(args['key'] as Uint8List),
        128,
        args['iv'] as Uint8List,
        Uint8List(0),
      ));
    return cipher.process(args['data'] as Uint8List);
  }

  // ---- Secure Random ----

  static SecureRandom _buildSecureRandom() {
    final seed = Uint8List.fromList(List.generate(32, (_) => Random.secure().nextInt(256)));
    return FortunaRandom()..seed(KeyParameter(seed));
  }

  // ---- PEM Encoding ----

  static String _encodePublicKeyPem(RSAPublicKey key) {
    final der = _encodeSpki(key);
    return _wrapPem('PUBLIC KEY', der);
  }

  static String _encodePrivateKeyPem(RSAPrivateKey key, BigInt e) {
    final der = _encodePkcs8(key, e);
    return _wrapPem('PRIVATE KEY', der);
  }

  static String _wrapPem(String label, Uint8List der) {
    final b64 = base64.encode(der);
    final buf = StringBuffer('-----BEGIN $label-----\n');
    for (var i = 0; i < b64.length; i += 64) {
      buf.writeln(b64.substring(i, (i + 64).clamp(0, b64.length)));
    }
    buf.write('-----END $label-----');
    return buf.toString();
  }

  // SubjectPublicKeyInfo (SPKI) DER encoding
  static Uint8List _encodeSpki(RSAPublicKey key) {
    final rsaPub = _seq([_int(key.modulus!), _int(key.exponent!)]);
    final algId = _seq([_rsaAlgorithmIdentifierBytes]);
    return _seq([algId, _bitStr(rsaPub)]);
  }

  // PKCS#8 PrivateKeyInfo DER encoding
  static Uint8List _encodePkcs8(RSAPrivateKey key, BigInt e) {
    final n = key.modulus!;
    final d = key.exponent!;
    final p = key.p!;
    final q = key.q!;
    final dp = d % (p - BigInt.one);
    final dq = d % (q - BigInt.one);
    final qInv = q.modInverse(p);

    final rsaPriv = _seq([
      _int(BigInt.zero), _int(n), _int(e), _int(d),
      _int(p), _int(q), _int(dp), _int(dq), _int(qInv),
    ]);
    final algId = _seq([_rsaAlgorithmIdentifierBytes]);
    return _seq([_int(BigInt.zero), algId, _oct(rsaPriv)]);
  }

  // RSA OID (1.2.840.113549.1.1.1) + NULL as raw bytes
  static final _rsaAlgorithmIdentifierBytes = Uint8List.fromList(
    [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00],
  );

  // ---- PEM Parsing ----

  static RSAPublicKey _parsePublicKey(String pem) {
    final der = _derFromPem(pem);
    var off = 0;
    off += _skipTag(der, off, 0x30); off += _skipLen(der, off); // outer SEQUENCE
    off += _skipTag(der, off, 0x30); final algL = _readLen(der, off); off += algL.bytes + algL.val; // skip AlgorithmIdentifier
    off += _skipTag(der, off, 0x03); off += _skipLen(der, off); off++; // BIT STRING + unused bits
    off += _skipTag(der, off, 0x30); off += _skipLen(der, off); // RSAPublicKey SEQUENCE
    final mod = _readBigInt(der, off); off += mod.bytes;
    final exp = _readBigInt(der, off);
    return RSAPublicKey(mod.val, exp.val);
  }

  static RSAPrivateKey _parsePrivateKey(String pem) {
    final der = _derFromPem(pem);
    var off = 0;
    off += _skipTag(der, off, 0x30); off += _skipLen(der, off); // PrivateKeyInfo SEQUENCE
    final verL = _readLen(der, off + 1); off += 1 + verL.bytes + verL.val + 1; // skip version (02 01 00) + extra byte correction
    // Actually let's do it properly:
    // Reset and re-parse carefully
    off = 0;
    _expectTag(der, off, 0x30); off++; final tLen = _readLen(der, off); off += tLen.bytes;
    // version INTEGER
    _expectTag(der, off, 0x02); off++; final vLen = _readLen(der, off); off += vLen.bytes + vLen.val;
    // AlgorithmIdentifier SEQUENCE
    _expectTag(der, off, 0x30); off++; final aLen = _readLen(der, off); off += aLen.bytes + aLen.val;
    // OCTET STRING
    _expectTag(der, off, 0x04); off++; off += _readLen(der, off).bytes;
    // RSAPrivateKey SEQUENCE
    _expectTag(der, off, 0x30); off++; off += _readLen(der, off).bytes;
    // version
    _expectTag(der, off, 0x02); off++; final rv = _readLen(der, off); off += rv.bytes + rv.val;

    final n = _readBigInt(der, off); off += n.bytes;
    final e = _readBigInt(der, off); off += e.bytes; // public exp (skip)
    final d = _readBigInt(der, off); off += d.bytes;
    final p = _readBigInt(der, off); off += p.bytes;
    final q = _readBigInt(der, off);

    return RSAPrivateKey(n.val, d.val, p.val, q.val);
  }

  static Uint8List _derFromPem(String pem) {
    final lines = pem.split('\n').where((l) => !l.startsWith('-----')).join();
    return base64.decode(lines);
  }

  // ---- DER Primitives ----

  static Uint8List _seq(List<Uint8List> elements) {
    final content = Uint8List.fromList(elements.expand((e) => e).toList());
    return Uint8List.fromList([0x30, ..._len(content.length), ...content]);
  }

  static Uint8List _int(BigInt value) {
    var bytes = _bigIntToBytes(value);
    if (bytes.isEmpty || bytes[0] & 0x80 != 0) bytes = Uint8List.fromList([0x00, ...bytes]);
    return Uint8List.fromList([0x02, ..._len(bytes.length), ...bytes]);
  }

  static Uint8List _bitStr(Uint8List data) {
    final content = Uint8List.fromList([0x00, ...data]);
    return Uint8List.fromList([0x03, ..._len(content.length), ...content]);
  }

  static Uint8List _oct(Uint8List data) =>
      Uint8List.fromList([0x04, ..._len(data.length), ...data]);

  static List<int> _len(int length) {
    if (length < 128) return [length];
    if (length < 256) return [0x81, length];
    return [0x82, length >> 8, length & 0xff];
  }

  static Uint8List _bigIntToBytes(BigInt v) {
    if (v == BigInt.zero) return Uint8List(1);
    final hex = v.toRadixString(16);
    final padded = hex.length.isOdd ? '0$hex' : hex;
    return Uint8List.fromList([
      for (var i = 0; i < padded.length; i += 2)
        int.parse(padded.substring(i, i + 2), radix: 16),
    ]);
  }

  // ---- DER Parsing Helpers ----

  static void _expectTag(Uint8List der, int off, int tag) {
    if (der[off] != tag) {
      throw FormatException(
          'Expected 0x${tag.toRadixString(16)} at $off, got 0x${der[off].toRadixString(16)}');
    }
  }

  static int _skipTag(Uint8List der, int off, int tag) {
    _expectTag(der, off, tag);
    return 1;
  }

  static int _skipLen(Uint8List der, int off) => _readLen(der, off).bytes;

  static ({int val, int bytes}) _readLen(Uint8List der, int off) {
    if (der[off] < 128) return (val: der[off], bytes: 1);
    final n = der[off] & 0x7f;
    int length = 0;
    for (var i = 1; i <= n; i++) length = (length << 8) | der[off + i];
    return (val: length, bytes: n + 1);
  }

  static ({BigInt val, int bytes}) _readBigInt(Uint8List der, int start) {
    var off = start;
    _expectTag(der, off, 0x02); off++;
    final lenInfo = _readLen(der, off); off += lenInfo.bytes;
    var bytes = der.sublist(off, off + lenInfo.val);
    if (bytes.isNotEmpty && bytes[0] == 0x00) bytes = bytes.sublist(1);
    var value = BigInt.zero;
    for (final b in bytes) value = (value << 8) | BigInt.from(b);
    return (val: value, bytes: 1 + lenInfo.bytes + lenInfo.val);
  }
}
