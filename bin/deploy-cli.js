#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Hiển thị banner
function showBanner() {
  console.log(chalk.cyan('╔════════════════════════════════════╗'));
  console.log(chalk.cyan('║        DEPLOY CLI TOOL             ║'));
  console.log(chalk.cyan('╚════════════════════════════════════╝'));
  console.log('');
}

// Tạo nội dung file nginx config cho proxy pass
function generateProxyPassConfig(domain, port, folderCode) {
  return `server {

        server_name ${domain};

        access_log off;

        root ${folderCode};

        location / {
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header Host $http_host;
                proxy_pass http://localhost:${port}/;
                proxy_redirect off;
        }
}`;
}

// Tạo nội dung file nginx config cho static file
function generateStaticFileConfig(domain, folderCode) {
  return `server {

        server_name ${domain};

        access_log off;

        root ${folderCode};

        index index.html index.htm;
        location / { try_files $uri $uri/ /index.html; }

}`;
}

// Validate domain
function validateDomain(domain) {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain) || 'Domain không hợp lệ. Ví dụ: example.com';
}

// Validate port
function validatePort(port) {
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return 'Port phải là số từ 1 đến 65535';
  }
  return true;
}

// Validate folder name
function validateFolderName(folder) {
  if(!folder) return 'Không được bỏ trống'
  return true
}

// Xử lý tạo nginx proxy pass
async function createProxyPassNginx() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'port',
        message: 'Nhập port ứng dụng (ví dụ: 3000):',
        validate: validatePort
      },
      {
        type: 'input',
        name: 'folderCode',
        message: 'Nhập tên đường dẫn chứa source code (ví dụ: /var/www/my-app):',
        validate: validateFolderName
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Nhập domain (ví dụ: example.com):',
        validate: validateDomain
      }
    ]);

    const config = generateProxyPassConfig(answers.domain, answers.port, answers.folderCode);
    await createNginxConfig(answers.domain, config);
    
  } catch (error) {
    console.error(chalk.red('Lỗi khi tạo nginx proxy pass:'), error);
  }
}

// Xử lý tạo nginx static file
async function createStaticFileNginx() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'folderCode',
        message: 'Nhập tên đường dẫn chứa source code (ví dụ: /var/www/my-website):',
        validate: validateFolderName
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Nhập domain (ví dụ: example.com):',
        validate: validateDomain
      }
    ]);

    const config = generateStaticFileConfig(answers.domain, answers.folderCode);
    await createNginxConfig(answers.domain, config);
    
  } catch (error) {
    console.error(chalk.red('Lỗi khi tạo nginx static file:'), error);
  }
}

// Tạo file nginx config và thực thi các lệnh
async function createNginxConfig(domain, configContent) {
  try {
    console.log(chalk.blue('\n📝 Đang tạo file nginx config...'));
    
    // Tạo file config
    const configPath = `/etc/nginx/sites-available/${domain}`;
    const tempPath = `/tmp/${domain}`;
    
    // Ghi vào file tạm trước
    await fs.writeFile(tempPath, configContent);
    console.log(chalk.green('✅ Đã tạo file config tạm thời'));
    
    // Copy file với sudo
    console.log(chalk.blue('📋 Đang copy file vào sites-available...'));
    await execPromise(`sudo cp ${tempPath} ${configPath}`);
    console.log(chalk.green('✅ Đã copy file config'));
    
    // Xóa file tạm
    await fs.unlink(tempPath);
    
    // Tạo symbolic link
    console.log(chalk.blue('🔗 Đang tạo symbolic link...'));
    const enabledPath = `/etc/nginx/sites-enabled/${domain}`;
    
    // Kiểm tra và xóa link cũ nếu tồn tại
    try {
      await execPromise(`sudo rm -f ${enabledPath}`);
    } catch (error) {
      // Bỏ qua lỗi nếu file không tồn tại
    }
    
    await execPromise(`sudo ln -s ${configPath} ${enabledPath}`);
    console.log(chalk.green('✅ Đã tạo symbolic link'));
    
    // Test nginx config
    console.log(chalk.blue('🧪 Đang kiểm tra cấu hình nginx...'));
    const { stdout: testOutput } = await execPromise('sudo nginx -t');
    console.log(chalk.green('✅ Cấu hình nginx hợp lệ'));
    
    // Reload nginx
    console.log(chalk.blue('🔄 Đang reload nginx...'));
    await execPromise('sudo systemctl reload nginx');
    console.log(chalk.green('✅ Đã reload nginx thành công'));
    
    console.log(chalk.green.bold(`\n🎉 Tạo nginx config cho ${domain} thành công!`));
    console.log(chalk.yellow(`\n💡 Lưu ý:`));
    console.log(chalk.yellow(`- File config được lưu tại: ${configPath}`));
    console.log(chalk.yellow(`- Đảm bảo folder source code tồn tại tại: /var/www/`));
    console.log(chalk.yellow(`- Nếu sử dụng HTTPS, hãy cài đặt SSL certificate`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Lỗi khi tạo nginx config:'), error.message);
    console.log(chalk.yellow('\n💡 Gợi ý:'));
    console.log(chalk.yellow('- Đảm bảo bạn có quyền sudo'));
    console.log(chalk.yellow('- Kiểm tra nginx đã được cài đặt chưa'));
    console.log(chalk.yellow('- Kiểm tra domain đã được sử dụng chưa'));
  }
}

// Xử lý menu create nginx
async function handleCreateNginx() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'nginxType',
        message: 'Chọn loại nginx bạn muốn tạo:',
        choices: [
          {
            name: '🔄 Nginx Proxy Pass (cho ứng dụng Node.js, Python, etc.)',
            value: 'proxy_pass'
          },
          {
            name: '📁 Nginx Static File (cho website tĩnh)',
            value: 'static_file'
          },
          {
            name: '⬅️  Quay lại menu chính',
            value: 'back'
          }
        ]
      }
    ]);

    switch (answers.nginxType) {
      case 'proxy_pass':
        await createProxyPassNginx();
        break;
      
      case 'static_file':
        await createStaticFileNginx();
        break;
      
      case 'back':
        await mainMenu();
        return;
    }
    
    // Hỏi người dùng có muốn tiếp tục không
    const continueAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Bạn có muốn tạo thêm nginx config khác không?',
        default: false
      }
    ]);
    
    if (continueAnswer.continue) {
      await handleCreateNginx();
    } else {
      await mainMenu();
    }
    
  } catch (error) {
    console.error(chalk.red('Lỗi trong handleCreateNginx:'), error);
    await mainMenu();
  }
}

// Thực thi lệnh với hiển thị output realtime
async function executeWithOutput(command, description) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n📦 ${description}...`));
    
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Hiển thị output realtime
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(chalk.yellow(data));
    });
  });
}

// Cài đặt gói tổng hợp
async function installCompletePackage() {
  try {
    console.log(chalk.green('\n✅ Bạn đã chọn: Gói tổng hợp'));
    console.log(chalk.blue('📥 Đang tải và chạy script cài đặt...'));
    
    // Download và chạy script
    const commands = [
      'curl -L https://gist.githubusercontent.com/haidang1810/ded9c840548571a954c3947074630420/raw/67ef21bb71254fc34b74bacc2774e95973a06075/install_package.sh -o install_package.sh',
      'chmod +x install_package.sh',
      './install_package.sh'
    ];
    
    for (const cmd of commands) {
      await executeWithOutput(cmd, 'Đang thực thi');
    }
    
    console.log(chalk.green.bold('\n🎉 Cài đặt gói tổng hợp thành công!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Lỗi khi cài đặt gói tổng hợp:'), error.message);
  }
}

// Cài đặt port tường lửa
async function installFirewallPorts() {
  try {
    console.log(chalk.blue('\n🔥 Cài đặt port tường lửa...'));
    
    const ports = ['22', '21', '20', '80', '443'];
    for (const port of ports) {
      await executeWithOutput(`sudo ufw allow ${port}`, `Mở port ${port}`);
    }
    
    await executeWithOutput('sudo ufw --force enable', 'Kích hoạt tường lửa');
    console.log(chalk.green('✅ Đã cài đặt port tường lửa thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt port tường lửa:'), error.message);
  }
}

// Cài đặt Nginx
async function installNginx() {
  try {
    console.log(chalk.blue('\n🌐 Cài đặt Nginx...'));
    
    await executeWithOutput('sudo apt update', 'Cập nhật package list');
    await executeWithOutput('sudo apt install -y nginx', 'Cài đặt Nginx');
    await executeWithOutput('sudo ufw allow "Nginx HTTP"', 'Cho phép Nginx qua tường lửa');
    
    console.log(chalk.green('✅ Đã cài đặt Nginx thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt Nginx:'), error.message);
  }
}

// Cài đặt MongoDB
async function installMongoDB() {
  try {
    console.log(chalk.blue('\n🍃 Cài đặt MongoDB...'));
    
    const commands = [
      'sudo apt install -y curl',
      'curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -',
      'echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list',
      'sudo apt update',
      'sudo wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb',
      'sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb',
      'sudo apt install -y mongodb-org',
      'sudo systemctl start mongod.service',
      'sudo systemctl enable mongod'
    ];
    
    for (let i = 0; i < commands.length; i++) {
      await executeWithOutput(commands[i], `Bước ${i + 1}/${commands.length}`);
    }
    
    console.log(chalk.green('✅ Đã cài đặt MongoDB thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt MongoDB:'), error.message);
  }
}

// Cài đặt NVM
async function installNVM() {
  try {
    console.log(chalk.blue('\n📦 Cài đặt NVM...'));
    
    await executeWithOutput('curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash', 'Tải và cài đặt NVM');
    await executeWithOutput('source ~/.profile', 'Load NVM');
    
    console.log(chalk.green('✅ Đã cài đặt NVM thành công'));
    console.log(chalk.yellow('💡 Lưu ý: Bạn cần restart terminal hoặc chạy "source ~/.profile" để sử dụng NVM'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt NVM:'), error.message);
  }
}

// Cài đặt Node.js LTS
async function installNodeJS() {
  try {
    console.log(chalk.blue('\n🟢 Cài đặt Node.js LTS...'));
    
    // Kiểm tra nvm đã được cài chưa
    try {
      await execPromise('command -v nvm');
    } catch (error) {
      console.log(chalk.yellow('⚠️  NVM chưa được cài đặt. Đang thử cài đặt qua bash...'));
      await executeWithOutput('bash -c "source ~/.nvm/nvm.sh && nvm install 18 && nvm use 18"', 'Cài đặt Node.js 18');
      await executeWithOutput('bash -c "source ~/.nvm/nvm.sh && npm install -g yarn"', 'Cài đặt Yarn');
      console.log(chalk.green('✅ Đã cài đặt Node.js LTS và Yarn thành công'));
      return;
    }
    
    await executeWithOutput('nvm install 18', 'Cài đặt Node.js 18');
    await executeWithOutput('nvm use 18', 'Sử dụng Node.js 18');
    await executeWithOutput('npm install -g yarn', 'Cài đặt Yarn');
    
    console.log(chalk.green('✅ Đã cài đặt Node.js LTS và Yarn thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt Node.js:'), error.message);
  }
}

// Cài đặt PM2
async function installPM2() {
  try {
    console.log(chalk.blue('\n🚀 Cài đặt PM2...'));
    
    await executeWithOutput('yarn global add pm2@latest', 'Cài đặt PM2');
    console.log(chalk.green('✅ Đã cài đặt PM2 thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt PM2:'), error.message);
  }
}

// Cài đặt Redis
async function installRedis() {
  try {
    console.log(chalk.blue('\n🔴 Cài đặt Redis...'));
    
    await executeWithOutput('sudo apt install -y redis', 'Cài đặt Redis');
    console.log(chalk.green('✅ Đã cài đặt Redis thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt Redis:'), error.message);
  }
}

// Cài đặt Certbot
async function installCertbot() {
  try {
    console.log(chalk.blue('\n🔒 Cài đặt Certbot...'));
    
    await executeWithOutput('sudo snap install core; sudo snap refresh core', 'Cài đặt snap core');
    await executeWithOutput('sudo snap install --classic certbot', 'Cài đặt Certbot');
    await executeWithOutput('sudo ln -s /snap/bin/certbot /usr/bin/certbot', 'Tạo symbolic link');
    
    console.log(chalk.green('✅ Đã cài đặt Certbot thành công'));
    
  } catch (error) {
    console.error(chalk.red('❌ Lỗi khi cài đặt Certbot:'), error.message);
  }
}

// Xử lý cài đặt tự chọn
async function handleCustomInstall() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'packages',
        message: 'Chọn các gói bạn muốn cài đặt:',
        choices: [
          { name: '🔥 Cài đặt port tường lửa', value: 'firewall' },
          { name: '🌐 Cài đặt Nginx', value: 'nginx' },
          { name: '🍃 Cài đặt MongoDB', value: 'mongodb' },
          { name: '📦 Cài đặt NVM', value: 'nvm' },
          { name: '🟢 Cài đặt Node.js LTS', value: 'nodejs' },
          { name: '🚀 Cài đặt PM2', value: 'pm2' },
          { name: '🔴 Cài đặt Redis', value: 'redis' },
          { name: '🔒 Cài đặt Certbot', value: 'certbot' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'Bạn phải chọn ít nhất một gói để cài đặt!';
          }
          return true;
        }
      }
    ]);

    // Cài đặt từng gói đã chọn
    for (const pkg of answers.packages) {
      switch (pkg) {
        case 'firewall':
          await installFirewallPorts();
          break;
        case 'nginx':
          await installNginx();
          break;
        case 'mongodb':
          await installMongoDB();
          break;
        case 'pm2':
          await installPM2();
          break;
        case 'redis':
          await installRedis();
          break;
        case 'certbot':
          await installCertbot();
          break;
      }
    }
    
    console.log(chalk.green.bold('\n🎉 Hoàn thành cài đặt các gói đã chọn!'));
    
  } catch (error) {
    console.error(chalk.red('Lỗi trong handleCustomInstall:'), error);
  }
}

// Xử lý menu install server
async function handleInstallServer() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'installType',
        message: 'Chọn phương thức cài đặt:',
        choices: [
          {
            name: '📦 Gói tổng hợp (Cài đặt tất cả)',
            value: 'complete'
          },
          {
            name: '🎯 Tự chọn (Chọn gói cần cài)',
            value: 'custom'
          },
          {
            name: '⬅️  Quay lại menu chính',
            value: 'back'
          }
        ]
      }
    ]);

    switch (answers.installType) {
      case 'complete':
        await installCompletePackage();
        break;
      
      case 'custom':
        await handleCustomInstall();
        break;
      
      case 'back':
        await mainMenu();
        return;
    }
    
    // Hỏi người dùng có muốn tiếp tục không
    const continueAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Bạn có muốn cài đặt thêm không?',
        default: false
      }
    ]);
    
    if (continueAnswer.continue) {
      await handleInstallServer();
    } else {
      await mainMenu();
    }
    
  } catch (error) {
    console.error(chalk.red('Lỗi trong handleInstallServer:'), error);
    await mainMenu();
  }
}

// Menu chính
async function mainMenu() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Chọn chức năng bạn muốn thực hiện:',
        choices: [
          {
            name: '🖥️  Cài đặt Server',
            value: 'install-server'
          },
          {
            name: '🌐 Tạo Nginx',
            value: 'create-nginx'
          },
          {
            name: '❌ Thoát',
            value: 'exit'
          }
        ]
      }
    ]);

    // Xử lý lựa chọn
    switch (answers.action) {
      case 'install-server':
        await handleInstallServer();
        break;
      
      case 'create-nginx':
        await handleCreateNginx();
        break;
      
      case 'exit':
        console.log(chalk.blue('\n👋 Tạm biệt!'));
        process.exit(0);
        break;
    }
  } catch (error) {
    console.error(chalk.red('Đã xảy ra lỗi:'), error);
    process.exit(1);
  }
}

// Khởi động ứng dụng
async function start() {
  showBanner();
  await mainMenu();
}

// Chạy ứng dụng
start();