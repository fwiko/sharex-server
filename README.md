# ShareX Server

A simple server allowing files to be uploaded via [ShareX](https://sharex.github.io/) and accessed using the returned web address.

```
docker build -t sharex-server .
```

```
docker run -d -v $(pwd)/config.json:/usr/src/app/config.json \
--network app_net \
--ip <networkIp> \
-e PASSWORD_HASH='<passwordHash>' \
--name sharex-server sharex-server:latest
```