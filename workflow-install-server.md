## Khi chọn lựa chọn install-server sẽ hiện tiếp 2 lựa chọn
1. Gói tổng hợp
2. Tự chọn

### Nếu chọn gói tổng hợp sẽ download script này về chạy (nhớ show log đầy đủ)
echo "You selected: Setup server"
echo "Downloading and running install_package.sh..."
curl -L https://gist.githubusercontent.com/haidang1810/ded9c840548571a954c3947074630420/raw/67ef21bb71254fc34b74bacc2774e95973a06075/install_package.sh -o install_package.sh
chmod +x install_package.sh
./install_package.sh
### nếu lựa chọn tự  chọn sẽ hiện lên các tùy chọn sau và cách cài tương ứng
1. Cài đặt port tường lửa
sudo ufw allow 22
sudo ufw allow 21
sudo ufw allow 20
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

2. Cài đặt Nginx
sudo apt update
sudo apt install nginx
sudo ufw allow 'Nginx HTTP'

3.  Cài đặt MongoDB
sudo apt install curl
curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb
sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb
sudo apt install mongodb-org
sudo systemctl start mongod.service
sudo systemctl enable mongod
4. Cài đặt NVM

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile

5. Cài đặt Node.js LTS
nvm install 18
nvm use 18
npm install yarn -g

6. Cài đặt PM2
yarn global add pm2@latest

7. Cài đặt Redis
sudo apt install redis

8. Cài đặt Certbot
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot