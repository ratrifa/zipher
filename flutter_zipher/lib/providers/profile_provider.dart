import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import 'auth_provider.dart';

class ProfileNotifier extends Notifier<void> {
  @override
  void build() {}

  Future<void> updateUsername(String username) async {
    await dio.patch(Endpoints.profile, data: {'username': username});
    await ref.read(authProvider.notifier).refreshUser();
  }

  Future<void> updateEmail(String email) async {
    await dio.patch(Endpoints.profile, data: {'email': email});
    await ref.read(authProvider.notifier).refreshUser();
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await dio.post(Endpoints.profilePassword, data: {
      'current_password': currentPassword,
      'password': newPassword,
      'password_confirmation': newPassword,
    });
  }

  Future<void> uploadAvatar(File imageFile) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(imageFile.path),
    });
    await dio.post(Endpoints.profileAvatar, data: formData);
    await ref.read(authProvider.notifier).refreshUser();
  }
}

final profileProvider = NotifierProvider<ProfileNotifier, void>(() => ProfileNotifier());
