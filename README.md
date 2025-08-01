# Deploy CLI Tool

CLI tool để cài đặt server và tạo cấu hình Nginx một cách dễ dàng.

## Cài đặt

### Cách 1: Cài đặt từ npm (khi đã publish)
```bash
# Cài đặt global từ npm registry
npm install -g deploy-cli

# Sau khi cài, có thể gọi từ bất kỳ folder nào
deploy-cli
```

### Cách 2: Cài đặt local để phát triển
```bash
# Clone repository
git clone <your-repo-url>
cd deploy-bash

# Cài đặt dependencies
npm install

# Đăng ký lệnh vào hệ thống (cần quyền admin/sudo)
npm link

# Hoặc cài đặt global từ folder hiện tại
npm install -g .

# Kiểm tra xem đã cài thành công chưa
which deploy-cli
```

## Sử dụng

Sau khi cài đặt, chỉ cần gõ lệnh từ bất kỳ folder nào:

```bash
deploy-cli
```

Sẽ hiển thị menu với các lựa chọn:
- 🖥️  Cài đặt Server
- 🌐 Tạo Nginx
- ❌ Thoát

## Publish lên npm

Để người khác có thể cài đặt qua npm:

1. Đăng ký tài khoản npm (nếu chưa có):
   ```bash
   npm adduser
   ```

2. Đăng nhập:
   ```bash
   npm login
   ```

3. Publish package:
   ```bash
   npm publish
   ```

4. Sau khi publish, mọi người có thể cài đặt:
   ```bash
   npm install -g deploy-cli
   ```

## Cách hoạt động

Khi cài đặt global qua npm, npm sẽ:
1. Copy package vào folder global node_modules
2. Tạo symbolic link từ file `bin/deploy-cli.js` vào folder bin của hệ thống
3. Điều này cho phép gọi lệnh `deploy-cli` từ bất kỳ đâu

## Gỡ cài đặt

```bash
# Gỡ cài đặt global
npm uninstall -g deploy-cli

# Gỡ link local
npm unlink
```

## Cấu trúc dự án

```
deploy-bash/
├── package.json         # Cấu hình npm với "bin" field
├── bin/
│   └── deploy-cli.js   # File thực thi chính (có shebang #!/usr/bin/env node)
├── README.md           # File này
└── .gitignore         # Ignore node_modules
```

## Lưu ý quan trọng

- File `bin/deploy-cli.js` phải có shebang `#!/usr/bin/env node` ở dòng đầu
- Trong `package.json`, field `bin` phải trỏ đúng đến file thực thi
- Khi publish lên npm, tên package phải unique (chưa có ai dùng)

## License

ISC