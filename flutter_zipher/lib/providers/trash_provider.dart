import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final trashProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final fileRes = await dio.get(Endpoints.filesTrash);
  final folderRes = await dio.get(Endpoints.foldersTrash);

  final files = (fileRes.data['files'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>))
      .toList();
  final folders = (folderRes.data['folders'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
      .toList();

  return [...folders, ...files];
});
