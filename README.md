# ShareX Server

A simple server allowing files to be uploaded via [ShareX](https://sharex.github.io/) and accessed using the returned web address.

## Build the image

```bash
docker build -t sharex-server .
```

## Start the container
The `--network` and `--ip` flags are optional here and are only be used if you are using a [docker network](https://docs.docker.com/engine/reference/commandline/network_create/).

The [/data](data/) directory within the container is mounted to the host at `$(pwd)/data` and will hold any uploaded files, in addition to the [config.json](data/config.json) file and database used for link translation.

```bash
docker run -d -v $(pwd)/data:/usr/src/app/data \
--network app_net \
--ip <networkIp> \
-e PASSWORD_HASH='<passwordHash>' \
--restart unless-stopped \
--name sharex-server sharex-server:latest
```

The `PASSWORD_HASH` variable must be created using bcrypt as can be done using the [bcrypt node module](https://www.npmjs.com/package/bcrypt).

```bash
> const bcrypt = require('bcrypt');
> await bcrypt.hash("password", 8);
'$2b$08$ZF0zv8n7zhKiBOPOSXs1g.FhDXwf4GYxEZXHVGXq7yrfUruBrijmO'
```

## Running through a reverse proxy?

If you are running through a reverse proxy such as [NGINX](https://www.nginx.com/), you must include the `client_max_body_size` option the respective virtual-host file and reflect your `maxSize` value set within the [config.json](data/config.json) file.

Here's how this would be done within an NGINX virtual-host file:

```

```conf
location /upload {
    ...
    client_max_body_size 1000M;
}
```

## ShareX Configuration

ShareX must be configured to upload files to this server, this can be done by navigating to `Destinations > Custom Uploader Settings`.

