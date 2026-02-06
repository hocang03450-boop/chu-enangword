
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const buildDir = 'build';
  
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  console.log('🚀 Đang bắt đầu quá trình build cho Vercel...');

  // Lấy API_KEY từ môi trường build của Vercel
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn('⚠️ CẢNH BÁO: Biến môi trường API_KEY đang TRỐNG!');
  } else {
    // Chỉ in ra độ dài để bảo mật nhưng giúp xác nhận Key đã tồn tại
    console.log(`✅ Đã tìm thấy API_KEY (Độ dài: ${apiKey.length} ký tự).`);
  }

  try {
    // 1. Bundle code và nhúng API_KEY vào mã máy khách
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: 'build/index.js',
      format: 'esm',
      minify: true,
      sourcemap: false,
      define: {
        // esbuild sẽ thay thế mọi chỗ ghi 'process.env.API_KEY' bằng giá trị chuỗi này
        'process.env.API_KEY': JSON.stringify(apiKey || '')
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

    console.log('✅ Tạo JS Bundle thành công.');

    // 2. Vá file index.html để trỏ đúng vào file js đã bundle
    let html = fs.readFileSync('index.html', 'utf8');
    html = html.replace('src="index.tsx"', 'src="index.js"');
    html = html.replace('src="/index.tsx"', 'src="index.js"');
    
    fs.writeFileSync('build/index.html', html);
    console.log('✅ Đã vá file HTML.');

    // 3. Sao chép các file bổ trợ
    if (fs.existsSync('metadata.json')) {
      fs.copyFileSync('metadata.json', 'build/metadata.json');
    }

    console.log('✨ Quá trình build hoàn tất thành công!');
  } catch (e) {
    console.error('❌ Build thất bại:', e);
    process.exit(1);
  }
}

build();
