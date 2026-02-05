
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const buildDir = 'build';
  
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  console.log('🚀 Starting production build for Vercel...');

  // Lấy API_KEY từ biến môi trường của hệ thống build
  const apiKey = process.env.API_KEY || '';
  console.log(`🔑 API_KEY status: ${apiKey ? 'Found' : 'NOT FOUND'}`);

  try {
    // 1. Bundle code
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: 'build/index.js',
      format: 'esm',
      minify: true,
      sourcemap: false,
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey)
      },
      external: [
        'react', 
        'react-dom', 
        'react-dom/client',
        'lucide-react', 
        'react-markdown', 
        '@google/genai', 
        'pdfjs-dist'
      ],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
    });

    console.log('✅ JS Bundle created.');

    // 2. Patch index.html
    let html = fs.readFileSync('index.html', 'utf8');
    // Thay thế index.tsx bằng index.js và xóa dấu / ở đầu để tránh lỗi đường dẫn tuyệt đối
    html = html.replace('src="index.tsx"', 'src="index.js"');
    html = html.replace('src="/index.tsx"', 'src="index.js"');
    
    fs.writeFileSync('build/index.html', html);
    console.log('✅ HTML patched.');

    // 3. Copy metadata
    if (fs.existsSync('metadata.json')) {
      fs.copyFileSync('metadata.json', 'build/metadata.json');
    }

    console.log('✨ Build finished successfully.');
  } catch (e) {
    console.error('❌ Build failed:', e);
    process.exit(1);
  }
}

build();
