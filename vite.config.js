import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const resolveDevServerUrl = (env) => {
    if (!env.VITE_DEV_SERVER_URL) {
        return null;
    }
    try {
        return new URL(env.VITE_DEV_SERVER_URL);
    } catch {
        return null;
    }
};

const resolveAppUrl = (env) => {
    if (!env.APP_URL) {
        return null;
    }
    try {
        return new URL(env.APP_URL);
    } catch {
        return null;
    }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devServerUrl = resolveDevServerUrl(env);
    const appUrl = resolveAppUrl(env);

    const input = [
        'resources/js/main.tsx',
        'resources/css/app.css',
        'resources/css/filament/admin/theme.css',
    ];

    return {
        plugins: [
            laravel({
                input,
                refresh: true,
            }),
            react(),
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'resources/js'),
            },
        },
        build: {
            rollupOptions: {
                input,
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            origin: devServerUrl ? devServerUrl.origin : undefined,
            hmr: devServerUrl
                ? {
                      host: devServerUrl.hostname,
                      port: devServerUrl.port ? Number(devServerUrl.port) : 5173,
                  }
                : undefined,
            cors: appUrl
                ? {
                      origin: appUrl.origin,
                      credentials: true,
                  }
                : true,
        },
    };
});
