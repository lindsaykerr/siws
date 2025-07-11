import { defineConfig } from 'vite'
import myconfig from './project.config';


export default defineConfig(({command, mode}) => {

    if (command === 'serve') {
        return {
            server: {
                allowedHosts: myconfig.dev.server.allowedHosts,
        
                hmr: {
                    host: myconfig.dev.server.hmr.host,
                    port: myconfig.dev.server.hmr.port,
                    protocol: myconfig.dev.server.hmr.protocol,
                    clientPort: myconfig.dev.server.hmr.clientPort,
                },
            },
            base: myconfig.dev.base,
        };
    }
    else {
        return{
            base: myconfig.build.base || '/',
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
