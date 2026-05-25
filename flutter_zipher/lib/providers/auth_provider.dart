import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../core/crypto/crypto_service.dart';
import '../core/storage/secure_storage.dart';
import '../models/user.dart';

class AuthNotifier extends AsyncNotifier<User?> {
  @override
  Future<User?> build() async {
    if (!await SecureStorage.instance.hasToken()) return null;
    return _fetchMe();
  }

  Future<User?> _fetchMe() async {
    try {
      final res = await dio.get(Endpoints.me);
      // Response: { "success": true, "data": { ...user fields... } }
      return User.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException {
      await SecureStorage.instance.clearAll();
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final res = await dio.post(Endpoints.login, data: {
        'email': email,
        'password': password,
      });
      // Response: { "success": true, "data": { "user": {...}, "token": "..." } }
      final data = res.data['data'] as Map<String, dynamic>;
      final token = data['token'] as String;
      await SecureStorage.instance.saveToken(token);
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      await _cacheUser(user);
      state = AsyncData(user);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<({String publicKeyPem, String privateKeyPem})> register({
    required String email,
    required String username,
    required String password,
  }) async {
    state = const AsyncLoading();
    final keyPair = await CryptoService.generateKeyPair();
    try {
      final res = await dio.post(Endpoints.register, data: {
        'email': email,
        'username': username,
        'password': password,
        'password_confirmation': password,
        'public_key': keyPair.publicKeyPem,
      });
      // Response: { "success": true, "data": { "user": {...}, "token": "..." } }
      final data = res.data['data'] as Map<String, dynamic>;
      final token = data['token'] as String;
      await SecureStorage.instance.saveToken(token);
      await SecureStorage.instance.savePrivateKey(keyPair.privateKeyPem);
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      await _cacheUser(user);
      state = AsyncData(user);
      return keyPair;
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await dio.post(Endpoints.logout);
    } catch (_) {}
    await SecureStorage.instance.clearAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    state = const AsyncData(null);
  }

  Future<void> forgotPassword(String email) async {
    await dio.post(Endpoints.forgotPassword, data: {'email': email});
  }

  Future<void> verifyResetKey(String email, String privateKey) async {
    await dio.post(Endpoints.verifyResetKey, data: {
      'email': email,
      'private_key': privateKey,
    });
  }

  Future<void> resetPassword({
    required String email,
    required String privateKey,
    required String newPassword,
  }) async {
    await dio.post(Endpoints.resetPassword, data: {
      'email': email,
      'private_key': privateKey,
      'password': newPassword,
      'password_confirmation': newPassword,
    });
  }

  Future<void> refreshUser() async {
    final user = await _fetchMe();
    state = AsyncData(user);
    if (user != null) await _cacheUser(user);
  }

  Future<void> _cacheUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('username', user.username);
    await prefs.setString('email', user.email);
    if (user.avatar != null) await prefs.setString('avatar', user.avatar!);
    await prefs.setBool('is_admin', user.isAdmin);
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, User?>(() => AuthNotifier());
