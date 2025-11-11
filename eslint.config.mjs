import { defineConfig, globalIgnores } from "eslint/config";
// インポート名を変更し、配列として展開できるようにする
import nextVitalsConfig from "eslint-config-next/core-web-vitals.js"; 
import nextTsConfig from "eslint-config-next/typescript.js";        

const eslintConfig = defineConfig([
  // 配列として受け取った設定を展開
  ...nextVitalsConfig, 
  ...nextTsConfig,     
  
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;