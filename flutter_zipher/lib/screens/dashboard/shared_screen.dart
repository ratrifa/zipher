import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/utils/file_download_util.dart';
import '../../models/share.dart';
import '../../providers/shared_provider.dart';
import '../widgets/confirm_dialog.dart';

class SharedScreen extends ConsumerStatefulWidget {
  const SharedScreen({super.key});

  @override
  ConsumerState<SharedScreen> createState() => _SharedScreenState();
}

class _SharedScreenState extends ConsumerState<SharedScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _deleteReceived(ShareItem share) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus Share',
      content: 'Hapus "${share.file.name}" dari daftar shared?',
    );
    if (!ok) return;
    try {
      await dio.delete(Endpoints.sharedReceivedDelete(share.id));
      ref.invalidate(sharedWithMeProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _revokeShare(ShareItem share) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Cabut Akses',
      content: 'Cabut akses "${share.sharedWithUsername}" ke "${share.file.name}"?',
      confirmLabel: 'Cabut',
    );
    if (!ok) return;
    try {
      await dio.delete(Endpoints.shareRevoke(share.id));
      ref.invalidate(sharedByMeProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _reportFile(ShareItem share) async {
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Laporkan File', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Laporkan "${share.file.name}" karena konten tidak pantas?',
                style: const TextStyle(fontSize: 14, color: Color(0xFF6b7280))),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Alasan laporan...'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFdc2626)),
            child: const Text('Laporkan', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await dio.post(Endpoints.reports, data: {
        'share_id': share.id,
        'reason': reasonCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Laporan berhasil dikirim')),
      );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Diterima'),
              Tab(text: 'Dibagikan'),
            ],
            labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            unselectedLabelStyle: const TextStyle(fontSize: 14),
            indicatorColor: const Color(0xFF1a1a1a),
            labelColor: const Color(0xFF1a1a1a),
            unselectedLabelColor: const Color(0xFF9ca3af),
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildReceivedTab(),
              _buildSentTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReceivedTab() {
    final shares = ref.watch(sharedWithMeProvider);
    return shares.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
      data: (items) => items.isEmpty
          ? _buildEmpty('Belum ada file yang diterima')
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(sharedWithMeProvider),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (_, i) => _buildShareTile(items[i], isReceived: true),
              ),
            ),
    );
  }

  Widget _buildSentTab() {
    final shares = ref.watch(sharedByMeProvider);
    return shares.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
      data: (items) => items.isEmpty
          ? _buildEmpty('Belum ada file yang dibagikan')
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(sharedByMeProvider),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (_, i) => _buildShareTile(items[i], isReceived: false),
              ),
            ),
    );
  }

  Widget _buildShareTile(ShareItem share, {required bool isReceived}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: share.file.isFolder ? null : () => FileDownloadUtil.downloadAndOpenFile(context, share.file),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: share.file.iconBackground,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(share.file.icon, color: share.file.iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    share.file.name,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    isReceived
                        ? 'Dari ${share.ownerUsername}'
                        : 'Ke ${share.sharedWithUsername}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF6b7280)),
                  ),
                  Text(
                    DateFormat('d MMM yyyy').format(share.createdAt),
                    style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af)),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, size: 18, color: Color(0xFF9ca3af)),
              onSelected: (v) {
                if (v == 'delete') {
                  isReceived ? _deleteReceived(share) : _revokeShare(share);
                } else if (v == 'report') {
                  _reportFile(share);
                } else if (v == 'download') {
                  FileDownloadUtil.downloadToDevice(context, share.file);
                }
              },
              itemBuilder: (_) => [
                if (!isReceived)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(children: [
                      Icon(Icons.link_off_rounded, size: 18, color: Color(0xFFdc2626)),
                      SizedBox(width: 12),
                      Text('Cabut Akses', style: TextStyle(color: Color(0xFFdc2626))),
                    ]),
                  ),
                if (isReceived) ...[
                  const PopupMenuItem(
                    value: 'download',
                    child: Row(children: [
                      Icon(Icons.download_rounded, size: 18, color: Color(0xFF6b7280)),
                      SizedBox(width: 12),
                      Text('Unduh'),
                    ]),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(children: [
                      Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFF6b7280)),
                      SizedBox(width: 12),
                      Text('Hapus dari Daftar'),
                    ]),
                  ),
                  const PopupMenuItem(
                    value: 'report',
                    child: Row(children: [
                      Icon(Icons.flag_outlined, size: 18, color: Color(0xFFdc2626)),
                      SizedBox(width: 12),
                      Text('Laporkan', style: TextStyle(color: Color(0xFFdc2626))),
                    ]),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildEmpty(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.people_outline_rounded, size: 64, color: Color(0xFFe5e7eb)),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Color(0xFF9ca3af), fontSize: 15)),
        ],
      ),
    );
  }
}
