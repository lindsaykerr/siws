import { defineConfig,loadEnv } from 'vite'
//import myconfig from './project.config';


export default defineConfig(({command, mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    if (command === 'serve') {
        return {
            server: {
                allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',') : [],
        
                hmr: {
                    host: env.VITE_HMR_HOST,
                    port: parseInt(env.VITE_HMR_PORT || '24678', 10),
                    protocol: env.VITE_HMR_PROTOCOL,
                    clientPort: parseInt(env.VITE_HMR_CLIENT_PORT || '24678', 10),
                },
            },
            base: env.VITE_APP_BASE_PATH || '/',
        };
    }
    else {
        return{
            base: '/wayfinding/app/',
            outDir: 'dist',
            build: {
                minify: 'esbuild',
                sourcemap: true,
                rollupOptions: {
                    output: {
                        manualChunks: {
                            'three': ['three'],
                            //'three-examples': ['three/examples/jsm/'],
                            'jsqr': ['jsqr'],
                        },
                    },
                },
            },
        }
    }


    
});
