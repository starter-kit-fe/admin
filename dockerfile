FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY .github/nginx.conf /etc/nginx/conf.d/default.conf
