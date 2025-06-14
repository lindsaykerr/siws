import { defineConfig } from 'vite'
import myconfig from './project.config';


export default defineConfig({

    server: {
        allowedHosts: myconfig.server.allowedHosts,
   
        hmr: {
            host: myconfig.server.hmr.host,
            port: myconfig.server.hmr.port,
            protocol: myconfig.server.hmr.protocol,
            clientPort: myconfig.server.hmr.clientPort,
        },
      },
      base: myconfig.base,

    
});
