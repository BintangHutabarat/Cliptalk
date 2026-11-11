// shortcut: path ditulis manual mengikuti nama route di routes/web.php; ganti dengan Wayfinder atau Ziggy (RULE.md §6) begitu dipasang.
export const routes = {
    upload: () => '/',
    projects: {
        store: () => '/projects',
        processing: (project: string) => `/projects/${project}/processing`,
        status: (project: string) => `/projects/${project}/status`,
        segments: (project: string) => `/projects/${project}/segments`,
    },
    clips: {
        store: (project: string) => `/projects/${project}/clips`,
        preview: (clip: string) => `/clips/${clip}/preview`,
        render: (clip: string) => `/clips/${clip}/render`,
        status: (clip: string) => `/clips/${clip}/status`,
        show: (clip: string) => `/clips/${clip}`,
    },
} as const;
