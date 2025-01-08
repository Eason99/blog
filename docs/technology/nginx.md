---
sidebar:
 title: nginx
 step: 1
title: nginx
description: nginx介绍，常用配置
isTimeLine: true
date: 2025-01-08
tags:
 - nginx
categories:
 - 技术
---
## nginx常用配置
### 基础配置
```
user                            root;
worker_processes                1;

events {
  worker_connections            10240;
}

http {
  log_format                    '$remote_addr - $remote_user [$time_local] ' '"$request" $status $body_bytes_sent ' '"$http_referer" "$http_user_agent"';
  include                       mime.types;
  default_type                  application/octet-stream;
  sendfile                      on;
  #autoindex                    on;
  #autoindex_exact_size         off;
  autoindex_localtime           on;
  keepalive_timeout             65;
  gzip                          on;
  gzip_disable                  "msie6";
  gzip_min_length               100;
  gzip_buffers                  4 16k;
  gzip_comp_level               1;
  gzip_types                  text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png;
  gzip_types                    "*";
  gzip_vary                     off;
  server_tokens                 off;
  client_max_body_size          200m;

  server {
    listen                      80 default_server;
    server_name                 _;
    return                      403 /www/403/index.html;
  }

  include                       ../serve/*.conf;
}
```

### location的匹配规则
1. = 表示精确匹配。只有请求的url路径与后面的字符串完全相等时，才会命中。
2. ^~ 表示如果该符号后面的字符是最佳匹配，采用该规则，不再进行后续的查找。
3. ~ 表示该规则是使用正则定义的，区分大小写。
4. ~* 表示该规则是使用正则定义的，不区分大小写。
注意的是，nginx的匹配优先顺序按照上面的顺序进行优先匹配，而且注意的是一旦某一个匹配命中直接退出，不再进行往下的匹配
剩下的普通匹配会按照最长匹配长度优先级来匹配，就是谁匹配的越多就用谁。
```
server {
    server_name website.com;
    location /document {
        return 701;
    }
    location ~* ^/docume.*$ {
        return 702;
    }
    location ~* ^/document$ {
        return 703;
    }

}
curl -I  website.com:8080/document 702
# 匹配702 因为正则的优先级更高,而且正则是一旦匹配到就直接退出 所以不会再匹配703

复制代码
server {
    server_name website.com;
    location ~* ^/docume.*$ {
        return 701;
    }

    location ^~ /doc {
        return 702;
    }
    location ~* ^/document$ {
        return 703;
    }
}
curl http://website.com/document
HTTP/1.1 702
# 匹配702 因为 ^~精确匹配的优先级比正则高 也是匹配到之后支持退出

复制代码
server {
    server_name website.com;
    location /doc {
        return 702;
    }
    location /docu {
        return 701;
    }
}
# 701 前缀匹配匹配是按照最长匹配，跟顺序无关
```

### 一个web服务下配置多个项目（location匹配路由）
```
server {
  listen                80;
  server_name           _;
  
  # 主应用
  location / {
    root          html/main;
    index               index.html;
    try_files           $uri $uri/ /index.html;
  }
  
  # 子应用一
  location ^~ /store/ {
    proxy_pass          http://localhost:8001;
    proxy_redirect      off;
    proxy_set_header    Host $host;
    proxy_set_header    X-Real-IP $remote_addr;
    proxy_set_header    X-Forwarded-For
    proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  
  # 子应用二
  location ^~ /school/ {
    proxy_pass          http://localhost:8002;
    proxy_redirect      off;
    proxy_set_header    Host $host;
    proxy_set_header    X-Real-IP $remote_addr;
    proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  
  # 静态资源读取不到问题处理
  rewrite ^/api/profile/(.*)$ /(替换成正确路径的文件的上一层目录)/$1 last;
}

# 子应用一服务
server {
  listen                8001;
  server_name           _;
  location / {
    root          html/store;
    index               index.html;
    try_files           $uri $uri/ /index.html;
  }
  
  location ^~ /store/ {
    alias               html/store/;
    index               index.html index.htm;
    try_files           $uri /store/index.html;
  }
  
  # 接口代理
  location  /api {
    proxy_pass          http://localhost:8089;
  }
}

# 子应用二服务
server {
  listen                8002;
  server_name           _;
  location / {
    root          html/school;
    index               index.html;
    try_files           $uri $uri/ /index.html;
  }
  
  location ^~ /school/ {
    alias               html/school/;
    index               index.html index.htm;
    try_files           $uri /school/index.html;
  }
  
  # 接口代理
  location  /api {
    proxy_pass          http://localhost:10010;
  }
}
```

### history模式、跨域、缓存、反向代理
```
# html设置history模式
location / {
    index index.html index.htm;
    proxy_set_header Host $host;
    # history模式最重要就是这里
    try_files $uri $uri/ /index.html;
    # index.html文件不可以设置强缓存 设置协商缓存即可
    add_header Cache-Control 'no-cache, must-revalidate, proxy-revalidate, max-age=0';
}

# 接口反向代理
location ^~ /api/ {
    # 跨域处理 设置头部域名
    add_header Access-Control-Allow-Origin *;
    # 跨域处理 设置头部方法
    add_header Access-Control-Allow-Methods 'GET,POST,DELETE,OPTIONS,HEAD';
    # 改写路径
    rewrite ^/api/(.*)$ /$1 break;
    # 反向代理
    proxy_pass http://static_env;
    proxy_set_header Host $http_host;
}

location ~* \.(?:css(\.map)?|js(\.map)?|gif|svg|jfif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$ {
    # 静态资源设置七天强缓存
    expires 7d;
    access_log off;
}
```

### 以目录去区分多个history单文件
因为不可能每一个项目开启一个域名，仅仅指向通过增加路径来划分多个网站，比如：
1. www.taobao.com/tmall/login
访问天猫的登录页面
2. www.taobao.com/alipay/login
访问支付宝的登录页面
```
#server {
    listen 80;
    server_name taobao.com;
    index index.html index.htm;
    # 通过正则来匹配捕获 [tmall|alipay]中间的这个路径
    location ~ ^/([^\/]+)/(.*)$ {
        try_files $uri $uri/ /$1/dist/index.html =404;
    }
}
```
### 负载均衡
基于upstream做负载均衡,中间会涉及一些相关的策略比如ip_hash、weight
```
upstream backserver{ 
    # 哈希算法，自动定位到该服务器 保证唯一ip定位到同一部机器 用于解决session登录态的问题
    ip_hash; 
    server 127.0.0.1:9090 down; (down 表示单前的server暂时不参与负载) 
    server 127.0.0.1:8080 weight=2; (weight 默认为1.weight越大，负载的权重就越大) 
    server 127.0.0.1:6060; 
    server 127.0.0.1:7070 backup; (其它所有的非backup机器down或者忙的时候，请求backup机器) 
} 
```

### 灰度部署
如何根据headers头部来进行灰度，下面的例子是用cookie来设置
如何获取头部值在nginx中可以通过$http_xxx来获取变量
```
upstream stable {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
 }
upstream canara {
   server xxx max_fails=1 fail_timeout=60;
}

server {
    listen 80;
    server_name  xxx;
    # 设置默认
    set $group "stable";

    # 根据cookie头部设置接入的服务
    if ($http_cookie ~* "tts_version_id=canara"){
        set $group canara;
    }
    if ($http_cookie ~* "tts_version_id=stable"){
        set $group stable;
    }
    location / {
        proxy_pass http://$group;
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        index  index.html index.htm;
    }
}
```

### 优雅降级
常用于ssr的node服务挂了返回500错误码然后降级到csr的cos桶或者nginx中
优雅降级主要用error_page参数来进行降级指向备用地址。
```
upstream ssr {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
 }
upstream csr {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
}

location ^~ /ssr/ {
    proxy_pass http://ssr;
    # 开启自定义错误捕获 如果这里不设置为on的话 会走向nginx处理的默认错误页面
    proxy_intercept_errors on;
    # 捕获500系列错误 如果500错误的话降级为下面的csr渲染
    error_page 500 501 502 503 504 = @csr_location

    # error_page 500 501 502 503 504 = 200 @csr_location
    # 注意这上面的区别 等号前面没有200 表示 最终返回的状态码已 @csr_location为准 加了200的话表示不管@csr_location返回啥都返回200状态码
}

location @csr_location {
    # 这时候地址还是带着/ssr/的要去除
    rewrite ^/ssr/(.*)$ /$1 break;
    proxy_pass http://csr;
    rewrite_log on;
}
```

### SSL配置HTTPS
```
server {
  listen                      80;
  server_name                 www.xxx.com;
  # 将 http 重定向转移到 https
  return 301 https://$server_name$request_uri;
}

server {
  listen                      443 ssl;
  server_name                 www.xxx.com;
  ssl_certificate             /etc/nginx/ssl/www.xxx.com.pem;
  ssl_certificate_key         /etc/nginx/ssl/www.xxx.com.key;
  ssl_session_timeout         10m;
  ssl_ciphers                 ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
  ssl_protocols               TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers   on;
  
  location / {
    root                    /project/xxx;
    index                   index.html index.htm index.md;
    try_files               $uri $uri/ /index.html;
  }
}
```