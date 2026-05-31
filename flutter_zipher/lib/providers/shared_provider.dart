import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/share.dart';

final sharedWithMeProvider = FutureProvider.autoDispose<List<ShareItem>>((ref) async {
  final res = await dio.get(Endpoints.sharedWithMe);
  return (res.data['data'] as List<dynamic>? ?? [])
      .map((e) => ShareItem.fromJson(e as Map<String, dynamic>, isReceived: true))
      .toList();
});

final sharedByMeProvider = FutureProvider.autoDispose<List<ShareItem>>((ref) async {
  final res = await dio.get(Endpoints.sharedByMe);
  return (res.data['data'] as List<dynamic>? ?? [])
      .map((e) => ShareItem.fromJson(e as Map<String, dynamic>, isReceived: false))
      .toList();
});
