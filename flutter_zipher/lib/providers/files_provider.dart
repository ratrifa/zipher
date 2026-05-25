import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final currentFolderIdProvider = StateProvider<int?>((ref) => null);

final contentsProvider = FutureProvider.autoDispose.family<List<FileItem>, int?>(
  (ref, folderId) async {
    final queryParams = <String, dynamic>{};
    if (folderId != null) queryParams['folder_id'] = folderId;

    final res = await dio.get(Endpoints.contents, queryParameters: queryParams);
    final data = res.data as Map<String, dynamic>;

    final files = (data['files'] as List<dynamic>? ?? [])
        .map((e) => FileItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final folders = (data['folders'] as List<dynamic>? ?? [])
        .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
        .toList();

    return [...folders, ...files];
  },
);

final searchProvider = FutureProvider.autoDispose.family<List<FileItem>, String>(
  (ref, query) async {
    if (query.isEmpty) return [];
    final res = await dio.get(Endpoints.search, queryParameters: {'q': query});
    final data = res.data as Map<String, dynamic>;
    final files = (data['files'] as List<dynamic>? ?? [])
        .map((e) => FileItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final folders = (data['folders'] as List<dynamic>? ?? [])
        .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
        .toList();
    return [...folders, ...files];
  },
);

final allFoldersProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.folders);
  return (res.data['folders'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
      .toList();
});
