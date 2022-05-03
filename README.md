# ShareX Server

A simple server allowing files to be uploaded via [ShareX](https://sharex.github.io/) and accessed using the returned web address.

## Build the image

```bash
docker build -t sharex-server .
```

## Start the container
the `--network` and `--ip` flags are optional here and are only be used if you are connecting this container to an internal docker network.
```bash
docker run -d -v $(pwd)/config.json:/usr/src/app/config.json \
--network app_net \
--ip <networkIp> \
-e PASSWORD_HASH='<passwordHash>' \
--name sharex-server sharex-server:latest
```

## Running through a reverse proxy?

If you are running through a reverse proxy using NGINX, you must include the `client_max_body_size` option the respective virtual-host file and reflect your maxSize value set within the `config.json` file.

```conf
location /upload {
    ...
    client_max_body_size 1000M;
}
```

## ShareX Configuration

### ...