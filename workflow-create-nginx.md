## Khi chọn lựa chọn create-nginx sẽ hiện tiếp 2 lựa chọn
1. nginx proxy_pass
2. nginx static file
### nếu lựa chọn nginx proxy_pass 
lần lượt hỏi người dùng port, folder chứa source và domain
### nếu lựa chọn  nginx static file
lần lượt hỏi người dùng folder chứa source và domain

## Dưới đây là mẫu 2 file nginx của 2 loại
### 1.proxy_pass
server {

        server_name domain.com;

        access_log off;

        root /var/www/folder_code;

        location / {
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header Host $http_host;
                proxy_pass http://localhost:4444/;
                proxy_redirect off;
        }
}
### 2.static file
server {

        server_name domain.com;

        access_log off;

        root /var/www/folder_code;

        index index.html index.htm;
        location / { try_files $uri $uri/ /index.html; }

}
## Dựa vào các thông tin user điền vào để tạo file nginx tương ứng ở cd /etc/nginx/sites-available/ tên file là tên domain
## sau đó chạy lệnh sudo ln -s /etc/nginx/sites-available/domain.com /etc/nginx/sites-enabled/
## sau đó chạy tiếp lệnh sudo nginx -t && sudo systemctl reload nginx
