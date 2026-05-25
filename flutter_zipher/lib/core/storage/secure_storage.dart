import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  SecureStorage._();
  static final SecureStorage instance = SecureStorage._();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyToken = 'auth_token';
  static const _keyPrivateKey = 'private_key_pem';

  Future<void> saveToken(String token) => _storage.write(key: _keyToken, value: token);
  Future<String?> getToken() => _storage.read(key: _keyToken);
  Future<void> deleteToken() => _storage.delete(key: _keyToken);

  Future<void> savePrivateKey(String pemKey) => _storage.write(key: _keyPrivateKey, value: pemKey);
  Future<String?> getPrivateKey() => _storage.read(key: _keyPrivateKey);
  Future<void> deletePrivateKey() => _storage.delete(key: _keyPrivateKey);

  Future<void> clearAll() => _storage.deleteAll();

  Future<bool> hasToken() async => (await getToken()) != null;
}
