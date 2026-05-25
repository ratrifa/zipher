import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/dashboard/dashboard_shell.dart';
import 'screens/dashboard/my_files_screen.dart';
import 'screens/dashboard/shared_screen.dart';
import 'screens/dashboard/starred_screen.dart';
import 'screens/dashboard/recent_screen.dart';
import 'screens/dashboard/trash_screen.dart';
import 'screens/profile/profile_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

// Router dibuat sekali dan di-cache oleh Riverpod
final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthChangeNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);

      // Jangan redirect saat masih loading auth awal
      if (authState.isLoading) return null;

      final isLoggedIn = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/dashboard/files';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (_, state) => _fadePage(state, const LoginScreen()),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (_, state) => _fadePage(state, const RegisterScreen()),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        pageBuilder: (_, state, child) => _noTransitionPage(state, DashboardShell(child: child)),
        routes: [
          GoRoute(
            path: '/dashboard/files',
            pageBuilder: (_, state) => _noTransitionPage(state, const MyFilesScreen()),
          ),
          GoRoute(
            path: '/dashboard/shared',
            pageBuilder: (_, state) => _noTransitionPage(state, const SharedScreen()),
          ),
          GoRoute(
            path: '/dashboard/recent',
            pageBuilder: (_, state) => _noTransitionPage(state, const RecentScreen()),
          ),
          GoRoute(
            path: '/dashboard/starred',
            pageBuilder: (_, state) => _noTransitionPage(state, const StarredScreen()),
          ),
          GoRoute(
            path: '/dashboard/trash',
            pageBuilder: (_, state) => _noTransitionPage(state, const TrashScreen()),
          ),
        ],
      ),
      GoRoute(
        path: '/profile',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (_, state) => _slidePage(state, const ProfileScreen()),
      ),
    ],
  );
});

// Hanya berfungsi memicu refresh router saat auth state berubah
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

// Shell wrapper: tanpa animasi
NoTransitionPage<void> _noTransitionPage(GoRouterState state, Widget child) =>
    NoTransitionPage<void>(key: state.pageKey, child: child);

// Tab dashboard: fade + sedikit naik dari bawah
CustomTransitionPage<void> _tabPage(GoRouterState state, Widget child) =>
    CustomTransitionPage<void>(
      key: state.pageKey,
      child: child,
      transitionDuration: const Duration(milliseconds: 220),
      reverseTransitionDuration: const Duration(milliseconds: 180),
      transitionsBuilder: (_, animation, __, child) {
        final fade = CurvedAnimation(parent: animation, curve: Curves.easeOut);
        final slide = Tween(begin: const Offset(0, 0.04), end: Offset.zero)
            .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
        return FadeTransition(
          opacity: fade,
          child: SlideTransition(position: slide, child: child),
        );
      },
    );

// Auth screens: fade in/out
CustomTransitionPage<void> _fadePage(GoRouterState state, Widget child) =>
    CustomTransitionPage<void>(
      key: state.pageKey,
      child: child,
      transitionDuration: const Duration(milliseconds: 200),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
    );

// Profile & modal screens: slide dari bawah
CustomTransitionPage<void> _slidePage(GoRouterState state, Widget child) =>
    CustomTransitionPage<void>(
      key: state.pageKey,
      child: child,
      transitionDuration: const Duration(milliseconds: 280),
      transitionsBuilder: (_, animation, __, child) {
        final tween = Tween(
          begin: const Offset(0, 0.06),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic));
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(position: animation.drive(tween), child: child),
        );
      },
    );

class ZipherApp extends ConsumerWidget {
  const ZipherApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ref.watch agar router di-create ulang hanya jika provider berubah (tidak terjadi)
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Zipher',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
