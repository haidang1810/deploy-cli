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

### 🖥️ Cài đặt Server
Cài đặt các gói phần mềm cần thiết cho server. Có 2 phương thức:

#### 📦 Gói tổng hợp (Cài đặt tất cả)
- Tự động tải và chạy script cài đặt hoàn chỉnh
- Bao gồm tất cả các gói: Nginx, MongoDB, PM2, Redis, Certbot, cấu hình tường lửa
- Phù hợp cho việc setup server mới từ đầu
- Script được tải từ: `https://gist.githubusercontent.com/haidang1810/ded9c840548571a954c3947074630420/raw/67ef21bb71254fc34b74bacc2774e95973a06075/install_package.sh`

#### 🎯 Tự chọn (Chọn gói cần cài)
Cho phép chọn từng gói cụ thể để cài đặt:

- **🔥 Cài đặt port tường lửa**: Mở các port cần thiết (22, 21, 20, 80, 443) và kích hoạt UFW
- **🌐 Cài đặt Nginx**: Web server và reverse proxy, tự động cấu hình tường lửa
- **🍃 Cài đặt MongoDB**: Database NoSQL phiên bản 4.4, tự động start và enable service
- **📦 Cài đặt NVM**: Node Version Manager để quản lý nhiều phiên bản Node.js
- **🚀 Cài đặt PM2**: Process manager cho ứng dụng Node.js, quản lý và monitor app
- **🔴 Cài đặt Redis**: In-memory database cho caching và session storage
- **🔒 Cài đặt Certbot**: Tool tự động tạo và gia hạn SSL certificate từ Let's Encrypt

### 🌐 Tạo Nginx
Tạo cấu hình Nginx cho website/ứng dụng. Có 2 loại:

#### 🔄 Nginx Proxy Pass (cho ứng dụng Node.js, Python, etc.)
- Dành cho ứng dụng chạy trên port cụ thể (ví dụ: Node.js app chạy port 3000)
- Nginx sẽ forward request đến ứng dụng backend
- Cần nhập: **Port ứng dụng**, **Đường dẫn source code**, **Domain**
- Tự động cấu hình proxy headers và redirect

#### 📁 Nginx Static File (cho website tĩnh)
- Dành cho website tĩnh (HTML, CSS, JS) hoặc SPA (React, Vue, Angular)
- Nginx serve trực tiếp các file tĩnh
- Cần nhập: **Đường dẫn source code**, **Domain**
- Tự động cấu hình fallback cho SPA routing

**Quy trình tạo Nginx config:**
1. Tạo file config tại `/etc/nginx/sites-available/[domain]`
2. Tạo symbolic link tới `/etc/nginx/sites-enabled/`
3. Test cấu hình với `nginx -t`
4. Reload Nginx để áp dụng thay đổi
5. **Tự động hỏi cấp SSL certificate** (HTTPS) với Certbot

#### 🔒 Tính năng SSL Certificate tự động
Sau khi tạo nginx config thành công, tool sẽ tự động hỏi bạn có muốn cấp SSL certificate không:
- **Chọn "Yes"**: Tự động chạy `certbot --nginx -d [domain]`
- **Tương tác trực tiếp** với Certbot để:
  - Nhập email (lần đầu tiên sử dụng)
  - Đồng ý Terms of Service (Y/N)
  - Chọn có chia sẻ email với EFF không (Y/N)
  - Chọn domain cần cấp SSL (nếu có nhiều domain)
- **Chọn "No"**: Hiển thị lệnh để cấp SSL sau này

**Lưu ý về SSL:**
- Domain phải được trỏ về IP server trước khi cấp SSL
- Certificate sẽ tự động gia hạn
- Website sẽ có thể truy cập qua HTTPS sau khi cấp thành công

### ❌ Thoát
Thoát khỏi chương trình


## Cấu trúc dự án

```
deploy-bash/
├── package.json         # Cấu hình npm với "bin" field
├── bin/
│   └── deploy-cli.js   # File thực thi chính (có shebang #!/usr/bin/env node)
├── README.md           # File này
└── .gitignore         # Ignore node_modules
```

## Yêu cầu hệ thống

- **Hệ điều hành**: Ubuntu/Debian Linux
- **Quyền truy cập**: Sudo privileges (để cài đặt packages và cấu hình system)
- **Node.js**: Phiên bản 14+ (để chạy CLI tool)
- **Internet**: Kết nối ổn định để tải packages

## Lưu ý quan trọng

### Về CLI Tool
- File [`bin/deploy-cli.js`](bin/deploy-cli.js:1) phải có shebang `#!/usr/bin/env node` ở dòng đầu
- Trong [`package.json`](package.json), field `bin` phải trỏ đúng đến file thực thi
- Khi publish lên npm, tên package phải unique (chưa có ai dùng)

### Về Server Setup
- **Backup dữ liệu** trước khi chạy script cài đặt
- Đảm bảo có **quyền sudo** trước khi bắt đầu
- **Kiểm tra port** không bị conflict với services khác
- **Domain** phải được trỏ về IP server trước khi tạo Nginx config

### Về Nginx Config
- Folder source code phải tồn tại trước khi tạo config
- Với **Proxy Pass**: Ứng dụng phải chạy trên port đã chỉ định
- Với **Static File**: Folder phải chứa file `index.html`
- Sau khi tạo config, cần **restart ứng dụng** nếu có thay đổi

## Troubleshooting

### Lỗi thường gặp
- **Permission denied**: Chạy với `sudo` hoặc kiểm tra quyền file
- **Port already in use**: Kiểm tra service nào đang sử dụng port
- **Domain not found**: Đảm bảo DNS đã được cấu hình đúng
- **Nginx test failed**: Kiểm tra syntax trong file config

### Commands hữu ích
```bash
# Kiểm tra status các service
sudo systemctl status nginx
sudo systemctl status mongod
sudo systemctl status redis

# Kiểm tra port đang sử dụng
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Kiểm tra log nginx
sudo tail -f /var/log/nginx/error.log

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## License

ISC