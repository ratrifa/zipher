import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final starredProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.filesStarred);
  final items = res.data['data'] as List<dynamic>? ?? [];
  return items.map((e) {
    final map = e as Map<String, dynamic>;
    return FileItem.fromJson(map, isFolder: map['type'] == 'folder');
  }).toList();
});
