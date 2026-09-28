import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['**/zen.spec.ts','**/zen-device.spec.ts','**/notifications.spec.ts'],workers:1,webServer:[{command:'npm run preview -- --host 127.0.0.1 --port 4174',url:'http://127.0.0.1:4174',reuseExistingServer:true,timeout:60000},{command:'npm run dev -- --strictPort',url:'http://127.0.0.1:3000',reuseExistingServer:true,timeout:60000}]});
