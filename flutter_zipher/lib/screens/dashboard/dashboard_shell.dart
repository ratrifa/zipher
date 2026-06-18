import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/utils/file_download_util.dart';
import '../../providers/auth_provider.dart';
import '../../providers/files_provider.dart';

/// Circular avatar that shows the user's photo, falling back to their initials
/// while loading or if the image fails (e.g. missing/unreachable).
Widget _avatarCircle({
  required String? avatarPath,
  required String initials,
  required double size,
  required double fontSize,
}) {
  final fallback = Container(
    width: size,
    height: size,
    alignment: Alignment.center,
    color: const Color(0xFF1a1a1a),
    child: Text(initials,
        style: TextStyle(color: Colors.white, fontSize: fontSize, fontWeight: FontWeight.w700)),
  );
  return ClipOval(
    child: SizedBox(
      width: size,
      height: size,
      child: avatarPath == null
          ? fallback
          : CachedNetworkImage(
              imageUrl: Endpoints.avatarUrl(avatarPath),
              width: size,
              height: size,
              fit: BoxFit.cover,
              placeholder: (_, __) => fallback,
              errorWidget: (_, __, ___) => fallback,
            ),
    ),
  );
}

class DashboardShell extends ConsumerStatefulWidget {
  final Widget child;
  const DashboardShell({super.key, required this.child});

  @override
  ConsumerState<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends ConsumerState<DashboardShell> {
  int _currentIndex = 0;

  static const _routes = [
    '/dashboard/files',
    '/dashboard/shared',
    '/dashboard/recent',
    '/dashboard/starred',
    '/dashboard/trash',
  ];

  void _onTabChanged(int index) {
    setState(() => _currentIndex = index);
    context.go(_routes[index]);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('zipher.', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () => _showSearch(context),
          ),
          const SizedBox(width: 4),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => _showUserMenu(context),
              child: _avatarCircle(
                avatarPath: user?.avatar,
                initials: user?.initials ?? '?',
                size: 36,
                fontSize: 13,
              ),
            ),
          ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
      ),
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _onTabChanged,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.folder_outlined), selectedIcon: Icon(Icons.folder_rounded), label: 'Files'),
          NavigationDestination(icon: Icon(Icons.people_outline_rounded), selectedIcon: Icon(Icons.people_rounded), label: 'Shared'),
          NavigationDestination(icon: Icon(Icons.access_time_rounded), selectedIcon: Icon(Icons.access_time_filled_rounded), label: 'Recent'),
          NavigationDestination(icon: Icon(Icons.star_outline_rounded), selectedIcon: Icon(Icons.star_rounded), label: 'Starred'),
          NavigationDestination(icon: Icon(Icons.delete_outline_rounded), selectedIcon: Icon(Icons.delete_rounded), label: 'Trash'),
        ],
      ),
    );
  }

  void _showSearch(BuildContext context) {
    showSearch(context: context, delegate: _FileSearchDelegate());
  }

  void _showUserMenu(BuildContext context) {
    final user = ref.read(authProvider).valueOrNull;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 16),
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  _avatarCircle(
                    avatarPath: user?.avatar,
                    initials: user?.initials ?? '?',
                    size: 48,
                    fontSize: 18,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.username ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                        Text(user?.email ?? '', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.person_outline_rounded),
              title: const Text('Profil'),
              onTap: () { Navigator.pop(context); context.push('/profile'); },
            ),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Color(0xFFdc2626)),
              title: const Text('Keluar', style: TextStyle(color: Color(0xFFdc2626))),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(authProvider.notifier).logout();
                if (mounted) context.go('/login');
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _FileSearchDelegate extends SearchDelegate<String> {
  @override
  String get searchFieldLabel => 'Cari file atau folder...';

  @override
  List<Widget> buildActions(BuildContext context) => [
    IconButton(icon: const Icon(Icons.clear_rounded), onPressed: () => query = ''),
  ];

  @override
  Widget buildLeading(BuildContext context) =>
      IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => close(context, ''));

  @override
  Widget buildResults(BuildContext context) => _buildSearch(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildSearch(context);

  Widget _buildSearch(BuildContext context) {
    final q = query.trim();
    if (q.isEmpty) {
      return const Center(child: Text('Ketik untuk mencari...', style: TextStyle(color: Colors.grey)));
    }
    return Consumer(
      builder: (context, ref, _) {
        final results = ref.watch(searchProvider(q));
        return results.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(ApiClient.errorMessage(e),
                  textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF9ca3af))),
            ),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Center(
                child: Text('Tidak ada hasil', style: TextStyle(color: Color(0xFF9ca3af))),
              );
            }
            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, i) {
                final item = items[i];
                return ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(color: item.iconBackground, borderRadius: BorderRadius.circular(8)),
                    child: Icon(item.icon, color: item.iconColor, size: 20),
                  ),
                  title: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(item.isFolder ? 'Folder' : item.displayMeta,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF9ca3af))),
                  onTap: () {
                    if (item.isFolder) {
                      close(context, '');
                    } else {
                      FileDownloadUtil.downloadAndOpenFile(context, item);
                    }
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}
