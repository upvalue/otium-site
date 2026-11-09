// Sidebar for the 2025 operating system pages. Matches the old Starlight
// sidebar, plus the pages it published without listing.
export const legacyNav = [
  {
    items: [
      { label: 'Overview', href: '/legacy/' },
      { label: 'Interactive demo', href: '/legacy/demo/' },
      { label: 'User guide', href: '/legacy/os/user-guide/' },
      { label: 'Development guide', href: '/legacy/os/development-guide/' },
      { label: 'Architecture', href: '/legacy/os/architecture/' },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'About the OS', href: '/legacy/os/about/' },
      { label: 'Tcl shell reference', href: '/legacy/os/shell/' },
      { label: 'MessagePack and IPC', href: '/legacy/os/msgpack-ipc/' },
      { label: 'Language', href: '/legacy/lang/guide/' },
      { label: 'Language demo', href: '/legacy/demos/lang/' },
    ],
  },
];

// Old URLs from when these pages were the whole site.
export const legacyRedirects = {
  '/demo': '/legacy/demo/',
  '/demos/os': '/legacy/demo/',
  '/demos/lang': '/legacy/demos/lang/',
  '/lang/guide': '/legacy/lang/guide/',
  '/os/about': '/legacy/os/about/',
  '/os/architecture': '/legacy/os/architecture/',
  '/os/development-guide': '/legacy/os/development-guide/',
  '/os/msgpack-ipc': '/legacy/os/msgpack-ipc/',
  '/os/shell': '/legacy/os/shell/',
  '/os/user-guide': '/legacy/os/user-guide/',
};
