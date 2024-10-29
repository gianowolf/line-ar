FROM nginx:alpine 

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY index.html app css  ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

