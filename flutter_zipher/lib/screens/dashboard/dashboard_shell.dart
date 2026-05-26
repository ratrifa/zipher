import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/endpoints.dart';
import '../../providers/auth_provider.dart';

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
              child: CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF1a1a1a),
                backgroundImage: user?.avatar != null
                    ? CachedNetworkImageProvider(Endpoints.avatarUrl(user!.avatar!))
                    : null,
                child: user?.avatar == null
                    ? Text(
                        user?.initials ?? '?',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                      )
                    : null,
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
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFF1a1a1a),
                    child: Text(user?.initials ?? '?',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
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
  Widget buildResults(BuildContext context) => const Center(child: Text('Gunakan panel pencarian'));

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return const Center(child: Text('Ketik untuk mencari...', style: TextStyle(color: Colors.grey)));
    }
    return const Center(child: CircularProgressIndicator());
  }
}
