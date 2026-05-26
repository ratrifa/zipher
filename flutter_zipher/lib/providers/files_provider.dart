import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final currentFolderIdProvider = StateProvider<String?>((ref) => null);

final contentsProvider = FutureProvider.autoDispose.family<List<FileItem>, String?>(
  (ref, folderId) async {
    final queryParams = <String, dynamic>{};
    if (folderId != null) queryParams['folder_id'] = folderId;

    final res = await dio.get(Endpoints.contents, queryParameters: queryParams);
    final items = res.data['data'] as List<dynamic>? ?? [];

    return items.map((e) {
      final map = e as Map<String, dynamic>;
      return FileItem.fromJson(map, isFolder: map['type'] == 'folder');
    }).toList();
  },
);

final searchProvider = FutureProvider.autoDispose.family<List<FileItem>, String>(
  (ref, query) async {
    if (query.isEmpty) return [];
    final res = await dio.get(Endpoints.search, queryParameters: {'q': query});
    final items = res.data['data'] as List<dynamic>? ?? [];
    return items.map((e) {
      final map = e as Map<String, dynamic>;
      return FileItem.fromJson(map, isFolder: map['type'] == 'folder');
    }).toList();
  },
);

final allFoldersProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.folders);
  return (res.data['data'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
      .toList();
});
