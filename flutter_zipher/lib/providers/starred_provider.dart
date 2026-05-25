import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final starredProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.filesStarred);
  final data = res.data as Map<String, dynamic>;
  final files = (data['files'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>))
      .toList();
  final folders = (data['folders'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
      .toList();
  return [...folders, ...files];
});
